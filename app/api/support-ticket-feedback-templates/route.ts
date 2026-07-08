import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  CreateSupportTicketFeedbackTemplatePayload,
} from "@/types/support-ticket/feedback/support-ticket-feedback-template"

const SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE ??
  "support_ticket_feedback_templates"

type TemplateCreatePayload =
  CreateSupportTicketFeedbackTemplatePayload

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readNullableString(value: unknown) {
  const trimmed = readString(value)

  return trimmed || null
}

function getAccessToken(request: Request) {
  const authHeader =
    request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim()
}

async function requireAuthenticatedRequest(
  request: Request
) {
  const accessToken = getAccessToken(request)

  if (!accessToken) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing access token." },
        { status: 401 }
      ),
      supabase: null,
      userId: null,
    }
  }

  const supabase =
    getSupabaseServerClient(accessToken)

  const { data, error } =
    await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      ),
      supabase: null,
      userId: null,
    }
  }

  return {
    errorResponse: null,
    supabase,
    userId: data.user.id,
  }
}

function normalizeCreatePayload(
  payload: TemplateCreatePayload
) {
  const name = readString(payload.name)

  if (!name) {
    throw new Error("name is required.")
  }

  return {
    name,

    description: readNullableString(
      payload.description
    ),

    is_active:
      payload.is_active !== undefined
        ? payload.is_active === true
        : true,
  }
}

/**
 * GET /api/support-ticket-feedback-templates
 */
export async function GET(request: Request) {
  try {
    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch feedback templates.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      feedbackTemplates: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch feedback templates.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/support-ticket-feedback-templates
 */
export async function POST(request: Request) {
  try {
    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase ||
      !authContext.userId
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as TemplateCreatePayload

    const payload = normalizeCreatePayload(body)

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create feedback template.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { feedbackTemplate: data },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid payload.",
      },
      { status: 400 }
    )
  }
}

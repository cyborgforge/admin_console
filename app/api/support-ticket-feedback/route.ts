import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  CreateSupportTicketFeedbackPayload,
} from "@/types/support-ticket/feedback/support-ticket-feedback"

const SUPPORT_TICKET_FEEDBACK_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_FEEDBACK_TABLE ??
  "support_ticket_feedback"

type FeedbackCreatePayload =
  CreateSupportTicketFeedbackPayload

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
  payload: FeedbackCreatePayload
) {
  const ticket_id = readString(payload.ticket_id)

  if (!ticket_id) {
    throw new Error("ticket_id is required.")
  }

  const submitted_by = readString(
    payload.submitted_by
  )

  if (!submitted_by) {
    throw new Error("submitted_by is required.")
  }

  if (
    payload.feedback_content === null ||
    payload.feedback_content === undefined ||
    typeof payload.feedback_content !== "object" ||
    Array.isArray(payload.feedback_content)
  ) {
    throw new Error(
      "feedback_content must be a non-null object."
    )
  }

  return {
    ticket_id,

    feedback_template_id: readNullableString(
      payload.feedback_template_id
    ),

    feedback_content: payload.feedback_content,

    submitted_by,

    submitted_at: new Date().toISOString(),
  }
}

/**
 * GET /api/support-ticket-feedback
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

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticket_id")

    const query = authContext.supabase
      .from(SUPPORT_TICKET_FEEDBACK_TABLE)
      .select("*")
      .order("submitted_at", {
        ascending: false,
      })

    if (ticketId) {
      query.eq("ticket_id", ticketId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch support ticket feedback.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      feedback: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch support ticket feedback.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/support-ticket-feedback
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
      (await request.json()) as FeedbackCreatePayload

    const payload = normalizeCreatePayload(body)

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_FEEDBACK_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create support ticket feedback.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { feedback: data },
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

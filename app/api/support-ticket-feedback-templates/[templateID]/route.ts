import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  UpdateSupportTicketFeedbackTemplatePayload,
} from "@/types/support-ticket/feedback/support-ticket-feedback-template"

const SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE ??
  "support_ticket_feedback_templates"

type TemplateUpdatePayload =
  UpdateSupportTicketFeedbackTemplatePayload

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
    }
  }

  return {
    errorResponse: null,
    supabase,
  }
}

function buildUpdateData(
  payload: TemplateUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    const name = readString(payload.name)

    if (!name) {
      throw new Error(
        "name cannot be empty."
      )
    }

    updateData.name = name
  }

  if (payload.description !== undefined) {
    updateData.description =
      readNullableString(payload.description)
  }

  if (payload.is_active !== undefined) {
    updateData.is_active =
      payload.is_active === true
  }

  return updateData
}

/**
 * GET /api/support-ticket-feedback-templates/:templateID
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      templateID: string
    }>
  }
) {
  const { templateID } = await params

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
      .eq("id", templateID)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Feedback template not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    feedbackTemplate: data,
  })
}

/**
 * PUT /api/support-ticket-feedback-templates/:templateID
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      templateID: string
    }>
  }
) {
  try {
    const { templateID } = await params

    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as TemplateUpdatePayload

    const updateData = buildUpdateData(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error:
            "No fields provided for update.",
        },
        { status: 400 }
      )
    }

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE)
        .update(updateData)
        .eq("id", templateID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update feedback template.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      feedbackTemplate: data,
    })
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

/**
 * DELETE /api/support-ticket-feedback-templates/:templateID
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      templateID: string
    }>
  }
) {
  const { templateID } = await params

  const authContext =
    await requireAuthenticatedRequest(request)

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const { error } =
    await authContext.supabase
      .from(SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE)
      .delete()
      .eq("id", templateID)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete feedback template.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

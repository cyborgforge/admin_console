import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  UpdateSupportTicketFeedbackPayload,
} from "@/types/support-ticket/feedback/support-ticket-feedback"

const SUPPORT_TICKET_FEEDBACK_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_FEEDBACK_TABLE ??
  "support_ticket_feedback"

type FeedbackUpdatePayload =
  UpdateSupportTicketFeedbackPayload

function readNullableString(value: unknown) {
  return typeof value === "string"
    ? value.trim() || null
    : null
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
  payload: FeedbackUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.feedback_template_id !== undefined) {
    updateData.feedback_template_id =
      readNullableString(
        payload.feedback_template_id
      )
  }

  if (payload.feedback_content !== undefined) {
    if (
      payload.feedback_content === null ||
      typeof payload.feedback_content !== "object" ||
      Array.isArray(payload.feedback_content)
    ) {
      throw new Error(
        "feedback_content must be a non-null object."
      )
    }

    updateData.feedback_content =
      payload.feedback_content
  }

  return updateData
}

/**
 * GET /api/support-ticket-feedback/:feedbackID
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      feedbackID: string
    }>
  }
) {
  const { feedbackID } = await params

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
      .from(SUPPORT_TICKET_FEEDBACK_TABLE)
      .select("*")
      .eq("id", feedbackID)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Support ticket feedback not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    feedback: data,
  })
}

/**
 * PUT /api/support-ticket-feedback/:feedbackID
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      feedbackID: string
    }>
  }
) {
  try {
    const { feedbackID } = await params

    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as FeedbackUpdatePayload

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
        .from(SUPPORT_TICKET_FEEDBACK_TABLE)
        .update(updateData)
        .eq("id", feedbackID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update support ticket feedback.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      feedback: data,
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
 * DELETE /api/support-ticket-feedback/:feedbackID
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      feedbackID: string
    }>
  }
) {
  const { feedbackID } = await params

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
      .from(SUPPORT_TICKET_FEEDBACK_TABLE)
      .delete()
      .eq("id", feedbackID)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete support ticket feedback.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

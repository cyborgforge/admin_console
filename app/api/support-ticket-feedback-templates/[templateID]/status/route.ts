import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE ??
  "support_ticket_feedback_templates"

type StatusPayload = {
  is_active?: unknown
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

/**
 * PUT /api/support-ticket-feedback-templates/:templateID/status
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
      (await request.json()) as StatusPayload

    if (body.is_active === undefined) {
      return NextResponse.json(
        {
          error: "is_active is required.",
        },
        { status: 400 }
      )
    }

    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        {
          error:
            "is_active must be a boolean.",
        },
        { status: 400 }
      )
    }

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_FEEDBACK_TEMPLATES_TABLE)
        .update({ is_active: body.is_active })
        .eq("id", templateID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update feedback template status.",
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

import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  UpdateSupportTicketPayload,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from "@/types/support-ticket/support-ticket"

const SUPPORT_TICKETS_TABLE =
  process.env.SUPABASE_SUPPORT_TICKETS_TABLE ??
  "support_tickets"

type SupportTicketUpdatePayload =
  UpdateSupportTicketPayload

function isSupportTicketPriority(
  value: unknown
): value is SupportTicketPriority {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  )
}

function isSupportTicketCategory(
  value: unknown
): value is SupportTicketCategory {
  return (
    value === "technical" ||
    value === "bug" ||
    value === "feature_request" ||
    value === "billing" ||
    value === "account" ||
    value === "onboarding" ||
    value === "other"
  )
}

function isSupportTicketStatus(
  value: unknown
): value is SupportTicketStatus {
  return (
    value === "open" ||
    value === "in_progress" ||
    value === "waiting_for_user" ||
    value === "resolved" ||
    value === "closed" ||
    value === "rejected"
  )
}

function isSupportTicketSource(
  value: unknown
): value is SupportTicketSource {
  return (
    value === "portal" ||
    value === "email" ||
    value === "phone" ||
    value === "chat" ||
    value === "system" ||
    value === "other"
  )
}

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
        {
          error: "Missing access token.",
        },
        {
          status: 401,
        }
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
        {
          error:
            "Invalid or expired session.",
        },
        {
          status: 401,
        }
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
  payload: SupportTicketUpdatePayload
) {
  const updateData: Record<
    string,
    unknown
  > = {}

  if (payload.subject !== undefined) {
    const subject = readString(
      payload.subject
    )

    if (!subject) {
      throw new Error(
        "subject cannot be empty."
      )
    }

    updateData.subject = subject
  }

  if (
    payload.problem_statement !==
    undefined
  ) {
    const problemStatement =
      readString(
        payload.problem_statement
      )

    if (!problemStatement) {
      throw new Error(
        "problem_statement cannot be empty."
      )
    }

    updateData.problem_statement =
      problemStatement
  }

  if (payload.priority !== undefined) {
    if (
      !isSupportTicketPriority(
        payload.priority
      )
    ) {
      throw new Error(
        "Invalid priority."
      )
    }

    updateData.priority =
      payload.priority
  }
    if (payload.category !== undefined) {
    if (
      !isSupportTicketCategory(
        payload.category
      )
    ) {
      throw new Error(
        "Invalid category."
      )
    }

    updateData.category =
      payload.category
  }

  if (payload.status !== undefined) {
    if (
      !isSupportTicketStatus(
        payload.status
      )
    ) {
      throw new Error(
        "Invalid status."
      )
    }

    updateData.status =
      payload.status
  }

  if (
    payload.assigned_to !==
    undefined
  ) {
    updateData.assigned_to =
      readNullableString(
        payload.assigned_to
      )
  }

  if (payload.source !== undefined) {
    if (
      !isSupportTicketSource(
        payload.source
      )
    ) {
      throw new Error(
        "Invalid source."
      )
    }

    updateData.source =
      payload.source
  }

  if (
    payload.resolved_at !==
    undefined
  ) {
    updateData.resolved_at =
      payload.resolved_at
  }

  if (
    payload.closed_at !==
    undefined
  ) {
    updateData.closed_at =
      payload.closed_at
  }

  if (payload.note !== undefined) {
    updateData.note =
      readNullableString(
        payload.note
      )
  }

  if (
    payload.attachments_json_array !==
    undefined
  ) {
    updateData.attachments_json_array =
      payload.attachments_json_array
  }

  return updateData
}

/**
 * GET /api/support-tickets/:ticketID
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      ticketID: string
    }>
  }
) {
  const { ticketID } =
    await params

  const authContext =
    await requireAuthenticatedRequest(
      request
    )

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const {
    data,
    error,
  } =
    await authContext.supabase
      .from(
        SUPPORT_TICKETS_TABLE
      )
      .select("*")
      .eq("id", ticketID)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          "Support ticket not found.",
      },
      {
        status: 404,
      }
    )
  }

  return NextResponse.json({
    supportTicket: data,
  })
}
/**
 * PUT /api/support-tickets/:ticketID
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      ticketID: string
    }>
  }
) {
  try {
    const { ticketID } =
      await params

    const authContext =
      await requireAuthenticatedRequest(
        request
      )

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as SupportTicketUpdatePayload

    const updateData =
      buildUpdateData(body)

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No fields provided for update.",
        },
        {
          status: 400,
        }
      )
    }

    const {
      data,
      error,
    } =
      await authContext.supabase
        .from(
          SUPPORT_TICKETS_TABLE
        )
        .update(updateData)
        .eq("id", ticketID)
        .select()
        .single()

    if (
      error ||
      !data
    ) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update support ticket.",
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json({
      supportTicket: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid payload.",
      },
      {
        status: 400,
      }
    )
  }
}

/**
 * DELETE /api/support-tickets/:ticketID
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      ticketID: string
    }>
  }
) {
  const { ticketID } =
    await params

  const authContext =
    await requireAuthenticatedRequest(
      request
    )

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const { error } =
    await authContext.supabase
      .from(
        SUPPORT_TICKETS_TABLE
      )
      .delete()
      .eq("id", ticketID)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete support ticket.",
      },
      {
        status: 400,
      }
    )
  }

  return NextResponse.json({
    success: true,
  })
}
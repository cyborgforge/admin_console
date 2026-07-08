import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type { SupportTicketStatus } from "@/types/support-ticket/support-ticket"

const SUPPORT_TICKETS_TABLE =
  process.env.SUPABASE_SUPPORT_TICKETS_TABLE ??
  "support_tickets"

type StatusPayload = {
  status?: unknown
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
          error: "Invalid or expired session.",
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

/**
 * PUT /api/support-tickets/:ticketID/status
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
      (await request.json()) as StatusPayload

    if (
      !isSupportTicketStatus(body.status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status.",
        },
        {
          status: 400,
        }
      )
    }

    const updateData: Record<
      string,
      unknown
    > = {
      status: body.status,
    }

    if (body.status === "resolved") {
      updateData.resolved_at =
        new Date().toISOString()
    }

    if (
      body.status === "closed" ||
      body.status === "rejected"
    ) {
      updateData.closed_at =
        new Date().toISOString()
    }

    const { data, error } =
      await authContext.supabase
        .from(
          SUPPORT_TICKETS_TABLE
        )
        .update(updateData)
        .eq("id", ticketID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update ticket status.",
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
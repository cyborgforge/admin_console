import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const SUPPORT_TICKETS_TABLE =
  process.env.SUPABASE_SUPPORT_TICKETS_TABLE ??
  "support_tickets"

type AssigneePayload = {
  assigned_to?: unknown
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

/**
 * PUT /api/support-tickets/:ticketID/assignee
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
      (await request.json()) as AssigneePayload

    const assignedTo =
      readNullableString(
        body.assigned_to
      )

    const { data, error } =
      await authContext.supabase
        .from(
          SUPPORT_TICKETS_TABLE
        )
        .update({
          assigned_to:
            assignedTo,
        })
        .eq("id", ticketID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update assignee.",
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
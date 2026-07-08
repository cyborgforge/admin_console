import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  UpdateTicketMessagePayload,
  TicketMessageAttachment,
} from "@/types/support-ticket/ticket-message"

const TICKET_MESSAGES_TABLE =
  process.env.SUPABASE_TICKET_MESSAGES_TABLE ??
  "ticket_messages"

type MessageUpdatePayload = UpdateTicketMessagePayload

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readAttachments(
  value: unknown
): TicketMessageAttachment[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is TicketMessageAttachment =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).name ===
        "string" &&
      typeof (item as Record<string, unknown>).link ===
        "string"
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
  payload: MessageUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.content !== undefined) {
    const content = readString(payload.content)

    if (!content) {
      throw new Error(
        "content cannot be empty."
      )
    }

    updateData.content = content
    updateData.is_edited = true
  }

  if (payload.is_edited !== undefined) {
    updateData.is_edited =
      payload.is_edited === true
  }

  if (
    payload.attachments_json_array !== undefined
  ) {
    updateData.attachments_json_array =
      readAttachments(
        payload.attachments_json_array
      )
  }

  return updateData
}

/**
 * GET /api/support-ticket-messages/:messageID
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      messageID: string
    }>
  }
) {
  const { messageID } = await params

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
      .from(TICKET_MESSAGES_TABLE)
      .select("*")
      .eq("id", messageID)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Ticket message not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ticketMessage: data,
  })
}

/**
 * PUT /api/support-ticket-messages/:messageID
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      messageID: string
    }>
  }
) {
  try {
    const { messageID } = await params

    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as MessageUpdatePayload

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
        .from(TICKET_MESSAGES_TABLE)
        .update(updateData)
        .eq("id", messageID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update ticket message.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ticketMessage: data,
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
 * DELETE /api/support-ticket-messages/:messageID
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      messageID: string
    }>
  }
) {
  const { messageID } = await params

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
      .from(TICKET_MESSAGES_TABLE)
      .delete()
      .eq("id", messageID)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete ticket message.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

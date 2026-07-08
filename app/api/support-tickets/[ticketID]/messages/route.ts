import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  CreateTicketMessagePayload,
  UpdateTicketMessagePayload,
  TicketMessageSenderType,
  TicketMessageAttachment,
} from "@/types/support-ticket/ticket-message"

const TICKET_MESSAGES_TABLE =
  process.env.SUPABASE_TICKET_MESSAGES_TABLE ??
  "ticket_messages"

type CreateMessagePayload = CreateTicketMessagePayload
type UpdateMessagePayload = UpdateTicketMessagePayload

function isTicketMessageSenderType(
  value: unknown
): value is TicketMessageSenderType {
  return (
    value === "user" ||
    value === "support_staff" ||
    value === "system"
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
  payload: CreateMessagePayload,
  ticketID: string
) {
  if (
    !isTicketMessageSenderType(payload.sender_type)
  ) {
    throw new Error("Invalid sender_type.")
  }

  const content = readString(payload.content)

  if (!content) {
    throw new Error("content is required.")
  }

  return {
    ticket_id: ticketID,

    sender_type: payload.sender_type,

    sender_id: readNullableString(payload.sender_id),

    content,

    attachments_json_array:
      readAttachments(
        payload.attachments_json_array
      ),
  }
}

function buildUpdateData(
  payload: UpdateMessagePayload
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
 * GET /api/support-tickets/:ticketID/messages
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
  const { ticketID } = await params

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
      .eq("ticket_id", ticketID)
      .order("created_at", {
        ascending: true,
      })

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to fetch ticket messages.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ticketMessages: data ?? [],
  })
}

/**
 * POST /api/support-tickets/:ticketID/messages
 */
export async function POST(
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
    const { ticketID } = await params

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
      (await request.json()) as CreateMessagePayload

    const payload = normalizeCreatePayload(
      body,
      ticketID
    )

    const { data, error } =
      await authContext.supabase
        .from(TICKET_MESSAGES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create ticket message.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ticketMessage: data },
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

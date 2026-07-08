import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  CreateSupportTicketInternalNotePayload,
} from "@/types/support-ticket/notes/support-ticket-internal-note"

const SUPPORT_TICKET_INTERNAL_NOTES_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_INTERNAL_NOTES_TABLE ??
  "support_ticket_internal_notes"

type CreateNotePayload =
  CreateSupportTicketInternalNotePayload

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
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
  payload: CreateNotePayload,
  ticketID: string
) {
  const content = readString(payload.content)

  if (!content) {
    throw new Error("content is required.")
  }

  const created_by = readString(payload.created_by)

  if (!created_by) {
    throw new Error("created_by is required.")
  }

  return {
    ticket_id: ticketID,
    content,
    created_by,
  }
}

/**
 * GET /api/support-tickets/:ticketID/internal-notes
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
      .from(SUPPORT_TICKET_INTERNAL_NOTES_TABLE)
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
          "Failed to fetch internal notes.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    internalNotes: data ?? [],
  })
}

/**
 * POST /api/support-tickets/:ticketID/internal-notes
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
      (await request.json()) as CreateNotePayload

    const payload = normalizeCreatePayload(
      body,
      ticketID
    )

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKET_INTERNAL_NOTES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create internal note.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { internalNote: data },
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

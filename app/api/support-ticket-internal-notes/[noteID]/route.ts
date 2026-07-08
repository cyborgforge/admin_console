import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  UpdateSupportTicketInternalNotePayload,
} from "@/types/support-ticket/notes/support-ticket-internal-note"

const SUPPORT_TICKET_INTERNAL_NOTES_TABLE =
  process.env.SUPABASE_SUPPORT_TICKET_INTERNAL_NOTES_TABLE ??
  "support_ticket_internal_notes"

type NoteUpdatePayload =
  UpdateSupportTicketInternalNotePayload

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
  payload: NoteUpdatePayload
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
  }

  return updateData
}

/**
 * GET /api/support-ticket-internal-notes/:noteID
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      noteID: string
    }>
  }
) {
  const { noteID } = await params

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
      .eq("id", noteID)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Internal note not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    internalNote: data,
  })
}

/**
 * PUT /api/support-ticket-internal-notes/:noteID
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      noteID: string
    }>
  }
) {
  try {
    const { noteID } = await params

    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as NoteUpdatePayload

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
        .from(SUPPORT_TICKET_INTERNAL_NOTES_TABLE)
        .update(updateData)
        .eq("id", noteID)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update internal note.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      internalNote: data,
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
 * DELETE /api/support-ticket-internal-notes/:noteID
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      noteID: string
    }>
  }
) {
  const { noteID } = await params

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
      .from(SUPPORT_TICKET_INTERNAL_NOTES_TABLE)
      .delete()
      .eq("id", noteID)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete internal note.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

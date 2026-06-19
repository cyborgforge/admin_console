import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const CONTACTS_TABLE =
  process.env.SUPABASE_CONTACTS_TABLE ?? "contacts"

type ContactUpdatePayload = {
  name?: unknown
  designation?: unknown
  department?: unknown
  email?: unknown
  mobile?: unknown
  phone?: unknown
  linkedin?: unknown
  client_id?: unknown
  branch_id?: unknown
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
  payload: ContactUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    const name = readString(payload.name)

    if (!name) {
      throw new Error("name cannot be empty.")
    }

    updateData.name = name
  }

  if (payload.designation !== undefined) {
    updateData.designation =
      readNullableString(payload.designation)
  }

  if (payload.department !== undefined) {
    updateData.department =
      readNullableString(payload.department)
  }

  if (payload.email !== undefined) {
    updateData.email =
      readNullableString(payload.email)
  }

  if (payload.mobile !== undefined) {
    updateData.mobile =
      readNullableString(payload.mobile)
  }

  if (payload.phone !== undefined) {
    updateData.phone =
      readNullableString(payload.phone)
  }

  if (payload.linkedin !== undefined) {
    updateData.linkedin =
      readNullableString(payload.linkedin)
  }

  if (payload.client_id !== undefined) {
    const client_id = readString(
      payload.client_id
    )

    if (!client_id) {
      throw new Error(
        "client_id cannot be empty."
      )
    }

    updateData.client_id = client_id
  }

  if (payload.branch_id !== undefined) {
    const branch_id = readString(
      payload.branch_id
    )

    if (!branch_id) {
      throw new Error(
        "branch_id cannot be empty."
      )
    }

    updateData.branch_id = branch_id
  }

  return updateData
}

/**
 * GET /api/contacts/:id
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

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
      .from(CONTACTS_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Contact not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    contact: data,
  })
}

/**
 * PUT /api/contacts/:id
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const { id } = await params

    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as ContactUpdatePayload

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
        .from(CONTACTS_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update contact.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      contact: data,
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
 * DELETE /api/contacts/:id
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

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
      .from(CONTACTS_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete contact.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

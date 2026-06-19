import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const BRANCHES_TABLE =
  process.env.SUPABASE_BRANCHES_TABLE ?? "branches"

type BranchUpdatePayload = {
  client_id?: unknown
  branch_name?: unknown
  email?: unknown
  phone?: unknown
  address_line_1?: unknown
  city?: unknown
  state?: unknown
  country?: unknown
  postal_code?: unknown
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
  payload: BranchUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

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

  if (payload.branch_name !== undefined) {
    const branch_name = readString(
      payload.branch_name
    )

    if (!branch_name) {
      throw new Error(
        "branch_name cannot be empty."
      )
    }

    updateData.branch_name = branch_name
  }

  if (payload.email !== undefined) {
    updateData.email =
      readNullableString(payload.email)
  }

  if (payload.phone !== undefined) {
    updateData.phone =
      readNullableString(payload.phone)
  }

  if (payload.address_line_1 !== undefined) {
    updateData.address_line_1 =
      readNullableString(
        payload.address_line_1
      )
  }

  if (payload.city !== undefined) {
    updateData.city =
      readNullableString(payload.city)
  }

  if (payload.state !== undefined) {
    updateData.state =
      readNullableString(payload.state)
  }

  if (payload.country !== undefined) {
    updateData.country =
      readNullableString(payload.country)
  }

  if (payload.postal_code !== undefined) {
    updateData.postal_code =
      readNullableString(payload.postal_code)
  }

  return updateData
}

/**
 * GET /api/branches/:id
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
      .from(BRANCHES_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Branch not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    branch: data,
  })
}

/**
 * PUT /api/branches/:id
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
      (await request.json()) as BranchUpdatePayload

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
        .from(BRANCHES_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update branch.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      branch: data,
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
 * DELETE /api/branches/:id
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
      .from(BRANCHES_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete branch.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

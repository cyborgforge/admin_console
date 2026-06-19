import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const BRANCHES_TABLE =
  process.env.SUPABASE_BRANCHES_TABLE ?? "branches"

type BranchPayload = {
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
  payload: BranchPayload,
  userId: string
) {
  const client_id = readString(payload.client_id)
  const branch_name = readString(
    payload.branch_name
  )

  if (!client_id) {
    throw new Error("client_id is required.")
  }

  if (!branch_name) {
    throw new Error("branch_name is required.")
  }

  return {
    client_id,
    branch_name,
    email: readNullableString(payload.email),
    phone: readNullableString(payload.phone),
    address_line_1: readNullableString(
      payload.address_line_1
    ),
    city: readNullableString(payload.city),
    state: readNullableString(payload.state),
    country: readNullableString(
      payload.country
    ),
    postal_code: readNullableString(
      payload.postal_code
    ),
    created_by: userId,
  }
}

/**
 * GET /api/branches
 */
export async function GET(request: Request) {
  try {
    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const url = new URL(request.url)
    const client_id =
      url.searchParams.get("client_id")

    let query = authContext.supabase
      .from(BRANCHES_TABLE)
      .select("*")

    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    const { data, error } = await query.order(
      "created_at",
      { ascending: false }
    )

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch branches.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      branches: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch branches.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/branches
 */
export async function POST(request: Request) {
  try {
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
      (await request.json()) as BranchPayload

    const payload = normalizeCreatePayload(
      body,
      authContext.userId
    )

    const { data, error } =
      await authContext.supabase
        .from(BRANCHES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create branch.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { branch: data },
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

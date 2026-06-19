import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const CLIENTS_TABLE =
  process.env.SUPABASE_CLIENTS_TABLE ?? "clients"

type ClientStatus =
  | "active"
  | "inactive"
  | "prospect"

type ClientPayload = {
  company_name?: unknown
  industry?: unknown
  website?: unknown
  gst_number?: unknown
  company_size?: unknown
  email?: unknown
  phone?: unknown
  address_line_1?: unknown
  city?: unknown
  state?: unknown
  country?: unknown
  postal_code?: unknown
  status?: unknown
}

function isClientStatus(
  value: unknown
): value is ClientStatus {
  return (
    value === "active" ||
    value === "inactive" ||
    value === "prospect"
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
  payload: ClientPayload,
  userId: string
) {
  const company_name = readString(
    payload.company_name
  )

  if (!company_name) {
    throw new Error("company_name is required.")
  }

  if (
    payload.status !== undefined &&
    !isClientStatus(payload.status)
  ) {
    throw new Error(
      "status must be active, inactive, or prospect."
    )
  }

  return {
    company_name,
    industry: readNullableString(
      payload.industry
    ),
    website: readNullableString(
      payload.website
    ),
    gst_number: readNullableString(
      payload.gst_number
    ),
    company_size: readNullableString(
      payload.company_size
    ),
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
    status: isClientStatus(payload.status)
      ? payload.status
      : "active",
    created_by: userId,
  }
}

/**
 * GET /api/clients
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

    const { data, error } =
      await authContext.supabase
        .from(CLIENTS_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch clients.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      clients: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch clients.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
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
      (await request.json()) as ClientPayload

    const payload = normalizeCreatePayload(
      body,
      authContext.userId
    )

    const { data, error } =
      await authContext.supabase
        .from(CLIENTS_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create client.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { client: data },
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

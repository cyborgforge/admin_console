import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const CLIENTS_TABLE =
  process.env.SUPABASE_CLIENTS_TABLE ?? "clients"

type ClientStatus =
  | "active"
  | "inactive"
  | "prospect"

type ClientUpdatePayload = {
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

function buildUpdateData(
  payload: ClientUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.company_name !== undefined) {
    const companyName = readString(
      payload.company_name
    )

    if (!companyName) {
      throw new Error(
        "company_name cannot be empty."
      )
    }

    updateData.company_name = companyName
  }

  if (payload.industry !== undefined) {
    updateData.industry =
      readNullableString(payload.industry)
  }

  if (payload.website !== undefined) {
    updateData.website =
      readNullableString(payload.website)
  }

  if (payload.gst_number !== undefined) {
    updateData.gst_number =
      readNullableString(payload.gst_number)
  }

  if (payload.company_size !== undefined) {
    updateData.company_size =
      readNullableString(payload.company_size)
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

  if (payload.status !== undefined) {
    if (!isClientStatus(payload.status)) {
      throw new Error(
        "status must be active, inactive, or prospect."
      )
    }

    updateData.status = payload.status
  }

  return updateData
}

/**
 * GET /api/clients/:id
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
      .from(CLIENTS_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Client not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    client: data,
  })
}

/**
 * PUT /api/clients/:id
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
      (await request.json()) as ClientUpdatePayload

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
        .from(CLIENTS_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update client.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      client: data,
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
 * DELETE /api/clients/:id
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
      .from(CLIENTS_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete client.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

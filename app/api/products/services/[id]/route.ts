import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

const PRODUCT_SERVICES_TABLE =
  process.env.SUPABASE_PRODUCT_SERVICES_TABLE ??
  "product_services"

function readNumber(
  value: unknown,
  fallback = 0
) {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : fallback
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
  const accessToken =
    getAccessToken(request)

  if (!accessToken) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Missing access token.",
        },
        { status: 401 }
      ),
      supabase: null,
    }
  }

  const supabase =
    getSupabaseServerClient(accessToken)

  const { data, error } =
    await supabase.auth.getUser(
      accessToken
    )

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            "Invalid or expired session.",
        },
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
  payload: Record<string, unknown>
) {
  const updateData: Record<
    string,
    unknown
  > = {}

  if (
    typeof payload.service_code ===
    "string"
  ) {
    updateData.service_code =
      payload.service_code.trim()
  }

  if (
    typeof payload.service_name ===
    "string"
  ) {
    updateData.service_name =
      payload.service_name.trim()
  }

  if (
    typeof payload.description ===
    "string"
  ) {
    updateData.description =
      payload.description.trim()
  }

  if (
    typeof payload.category ===
    "string"
  ) {
    updateData.category =
      payload.category.trim()
  }

  if (typeof payload.type === "string") {
    updateData.type =
      payload.type.trim()
  }

  if (payload.price !== undefined) {
    updateData.price = readNumber(
      payload.price
    )
  }

  if (
    payload.tax_percentage !==
    undefined
  ) {
    updateData.tax_percentage =
      readNumber(
        payload.tax_percentage
      )
  }

  if (
    typeof payload.status ===
    "string"
  ) {
    updateData.status =
      payload.status.trim()
  }

  if (
    typeof payload.notes === "string"
  ) {
    updateData.notes =
      payload.notes.trim()
  }

  return updateData
}

/**
 * GET /api/products/services/:id
 * Get specific service record
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
    await requireAuthenticatedRequest(
      request
    )

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const { data, error } =
    await authContext.supabase
      .from(PRODUCT_SERVICES_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Service not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    service: data,
  })
}

/**
 * PUT /api/products/services/:id
 * Update service record
 */
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

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
    (await request.json()) as Record<
      string,
      unknown
    >

  const updateData =
    buildUpdateData(body)

  if (
    Object.keys(updateData).length ===
    0
  ) {
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
      .from(PRODUCT_SERVICES_TABLE)
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Failed to update service.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    service: data,
  })
}

/**
 * DELETE /api/products/services/:id
 * Delete service record
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
    await requireAuthenticatedRequest(
      request
    )

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const { error } =
    await authContext.supabase
      .from(PRODUCT_SERVICES_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete service.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}
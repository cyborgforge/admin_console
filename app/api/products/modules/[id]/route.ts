import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

const PRODUCT_MODULES_TABLE =
  process.env.SUPABASE_PRODUCT_MODULES_TABLE ??
  "product_modules"

function readString(
  value: unknown,
  fallback = ""
) {
  return typeof value === "string"
    ? value.trim()
    : fallback
}

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
    typeof payload.product_code ===
    "string"
  ) {
    updateData.product_code =
      payload.product_code.trim()
  }

  if (
    typeof payload.product_name ===
    "string"
  ) {
    updateData.product_name =
      payload.product_name.trim()
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
 * GET /api/products/modules/:id
 * Get specific module
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
      .from(PRODUCT_MODULES_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Module not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    module: data,
  })
}

/**
 * PUT /api/products/modules/:id
 * Update module
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
      .from(PRODUCT_MODULES_TABLE)
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Failed to update module.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    module: data,
  })
}

/**
 * DELETE /api/products/modules/:id
 * Delete module
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
      .from(PRODUCT_MODULES_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete module.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}
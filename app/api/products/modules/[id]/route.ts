import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

const PRODUCT_MODULES_TABLE =
  process.env.SUPABASE_PRODUCT_MODULES_TABLE ??
  "product_modules"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getAccessToken(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim()
}

async function requireAuthenticatedRequest(request: Request) {
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

  const supabase = getSupabaseServerClient(accessToken)

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

function buildUpdatePayload(
  body: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = {}

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "product_code"
    ) ||
    Object.prototype.hasOwnProperty.call(
      body,
      "code"
    )
  ) {
    const code =
      readString(body.product_code) ||
      readString(body.code)

    if (!code) {
      throw new Error(
        "Product code cannot be empty."
      )
    }

    updateData.code = code
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "product_name"
    ) ||
    Object.prototype.hasOwnProperty.call(
      body,
      "name"
    )
  ) {
    const name =
      readString(body.product_name) ||
      readString(body.name)

    if (!name) {
      throw new Error(
        "Product name cannot be empty."
      )
    }

    updateData.name = name
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "description"
    )
  ) {
    updateData.description =
      readString(body.description)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "category"
    )
  ) {
    updateData.category =
      readString(body.category)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "type"
    )
  ) {
    updateData.type =
      readString(body.type)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "price"
    )
  ) {
    updateData.price =
      readNumber(body.price)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "tax_percentage"
    )
  ) {
    updateData.tax_percentage =
      readNumber(body.tax_percentage)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "status"
    )
  ) {
    updateData.status =
      readString(body.status)
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "notes"
    )
  ) {
    updateData.notes =
      readString(body.notes)
  }

  return updateData
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const { id } = await context.params

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
        .from(PRODUCT_MODULES_TABLE)
        .select("*")
        .eq("id", id)
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Product module not found.",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      module: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch module.",
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const { id } = await context.params

    const authContext =
      await requireAuthenticatedRequest(request)

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
      buildUpdatePayload(body)

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No valid fields were provided for update.",
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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid update payload.",
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const { id } = await context.params

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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete module.",
      },
      { status: 500 }
    )
  }
}
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

function normalizePayload(
  payload: Record<string, unknown>
) {
  const productCode = readString(
    payload.product_code
  )

  const productName = readString(
    payload.product_name
  )

  if (!productCode || !productName) {
    throw new Error(
      "product_code and product_name are required."
    )
  }

  return {
    product_code: productCode,
    product_name: productName,
    description: readString(
      payload.description
    ),
    category: readString(
      payload.category
    ),
    type: readString(payload.type),
    price: readNumber(payload.price),
    tax_percentage: readNumber(
      payload.tax_percentage
    ),
    status:
      readString(payload.status) ||
      "active",
    notes: readString(payload.notes),
  }
}

/**
 * GET /api/products/modules
 * Get all product modules
 */
export async function GET(
  request: Request
) {
  try {
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
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch modules.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      modules: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch modules.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/modules
 * Create new product module
 */
export async function POST(
  request: Request
) {
  try {
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

    const payload =
      normalizePayload(body)

    const { data, error } =
      await authContext.supabase
        .from(PRODUCT_MODULES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create module.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        module: data,
      },
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
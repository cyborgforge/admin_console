import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

const PRODUCT_SERVICES_TABLE =
  process.env.SUPABASE_PRODUCT_SERVICES_TABLE ??
  "product_services"

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
  const serviceCode = readString(
    payload.service_code
  )

  const serviceName = readString(
    payload.service_name
  )

  if (!serviceCode || !serviceName) {
    throw new Error(
      "service_code and service_name are required."
    )
  }

  return {
    service_code: serviceCode,
    service_name: serviceName,
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
 * GET /api/products/services
 * Get all service records
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
        .from(PRODUCT_SERVICES_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch services.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      services: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch services.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/services
 * Create new service
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
        .from(PRODUCT_SERVICES_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create service.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        service: data,
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
import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const SUBSCRIPTIONS_TABLE =
  process.env.SUPABASE_SUBSCRIPTIONS_TABLE ??
  "subscriptions"

type SubscriptionStatus =
  | "active"
  | "expiring"
  | "churned"
  | "cancelled"
  | "paused"

type BillingCycle =
  | "monthly"
  | "quarterly"
  | "annual"

type Plan =
  | "starter"
  | "growth"
  | "enterprise"

type SubscriptionPayload = {
  client_id?: unknown
  deal_id?: unknown
  quotation_id?: unknown
  product_module_id?: unknown
  product_service_id?: unknown
  plan?: unknown
  billing_cycle?: unknown
  mrr?: unknown
  start_date?: unknown
  renewal_date?: unknown
  status?: unknown
  notes?: unknown
}

function isSubscriptionStatus(
  value: unknown
): value is SubscriptionStatus {
  return (
    value === "active" ||
    value === "expiring" ||
    value === "churned" ||
    value === "cancelled" ||
    value === "paused"
  )
}

function isBillingCycle(
  value: unknown
): value is BillingCycle {
  return (
    value === "monthly" ||
    value === "quarterly" ||
    value === "annual"
  )
}

function isPlan(value: unknown): value is Plan {
  return (
    value === "starter" ||
    value === "growth" ||
    value === "enterprise"
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

function readRequiredUuid(
  value: unknown,
  fieldName: string
) {
  const trimmed = readString(value)

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`)
  }

  return trimmed
}

function readNullableNumber(
  value: unknown,
  fieldName: string
) {
  if (value === undefined || value === null) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${fieldName} must be a valid number.`
    )
  }

  return parsed
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

async function requireRecordExists(
  supabase: NonNullable<
    Awaited<
      ReturnType<typeof requireAuthenticatedRequest>
    >["supabase"]
  >,
  table: string,
  id: string,
  fieldName: string
) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`${fieldName} does not exist.`)
  }
}

async function validateSubscriptionReferences(
  supabase: NonNullable<
    Awaited<
      ReturnType<typeof requireAuthenticatedRequest>
    >["supabase"]
  >,
  payload: Record<string, unknown>
) {
  if (typeof payload.client_id === "string") {
    await requireRecordExists(
      supabase,
      "clients",
      payload.client_id,
      "client_id"
    )
  }

  if (typeof payload.deal_id === "string") {
    await requireRecordExists(
      supabase,
      "deals",
      payload.deal_id,
      "deal_id"
    )
  }

  if (typeof payload.quotation_id === "string") {
    await requireRecordExists(
      supabase,
      "quotations",
      payload.quotation_id,
      "quotation_id"
    )
  }

  if (
    typeof payload.product_module_id === "string"
  ) {
    await requireRecordExists(
      supabase,
      "product_modules",
      payload.product_module_id,
      "product_module_id"
    )
  }

  if (
    typeof payload.product_service_id === "string"
  ) {
    await requireRecordExists(
      supabase,
      "product_services",
      payload.product_service_id,
      "product_service_id"
    )
  }
}

function validateSearchParams(
  searchParams: URLSearchParams
) {
  const allowedParams = new Set([
    "client_id",
    "deal_id",
    "quotation_id",
    "product_module_id",
    "product_service_id",
    "plan",
    "billing_cycle",
    "status",
  ])

  for (const key of searchParams.keys()) {
    if (!allowedParams.has(key)) {
      throw new Error(
        `Unsupported query parameter: ${key}.`
      )
    }
  }

  const status = searchParams.get("status")
  const billing_cycle =
    searchParams.get("billing_cycle")
  const plan = searchParams.get("plan")

  if (status && !isSubscriptionStatus(status)) {
    throw new Error(
      "status must be active, expiring, churned, cancelled, or paused."
    )
  }

  if (
    billing_cycle &&
    !isBillingCycle(billing_cycle)
  ) {
    throw new Error(
      "billing_cycle must be monthly, quarterly, or annual."
    )
  }

  if (plan && !isPlan(plan)) {
    throw new Error(
      "plan must be starter, growth, or enterprise."
    )
  }
}

function normalizeCreatePayload(
  payload: SubscriptionPayload,
  userId: string
) {
  const client_id = readRequiredUuid(
    payload.client_id,
    "client_id"
  )

  if (
    payload.status !== undefined &&
    !isSubscriptionStatus(payload.status)
  ) {
    throw new Error(
      "status must be active, expiring, churned, cancelled, or paused."
    )
  }

  if (
    payload.billing_cycle !== undefined &&
    !isBillingCycle(payload.billing_cycle)
  ) {
    throw new Error(
      "billing_cycle must be monthly, quarterly, or annual."
    )
  }

  if (
    payload.plan !== undefined &&
    !isPlan(payload.plan)
  ) {
    throw new Error(
      "plan must be starter, growth, or enterprise."
    )
  }

  return {
    client_id,
    deal_id: readNullableString(
      payload.deal_id
    ),
    quotation_id: readNullableString(
      payload.quotation_id
    ),
    product_module_id: readNullableString(
      payload.product_module_id
    ),
    product_service_id: readNullableString(
      payload.product_service_id
    ),
    plan: isPlan(payload.plan)
      ? payload.plan
      : null,
    billing_cycle: isBillingCycle(
      payload.billing_cycle
    )
      ? payload.billing_cycle
      : null,
    mrr: readNullableNumber(payload.mrr, "mrr"),
    start_date: readNullableString(
      payload.start_date
    ),
    renewal_date: readNullableString(
      payload.renewal_date
    ),
    status: isSubscriptionStatus(payload.status)
      ? payload.status
      : "active",
    notes: readNullableString(payload.notes),
    created_by: userId,
  }
}

/**
 * GET /api/subscriptions
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
    validateSearchParams(url.searchParams)

    let query = authContext.supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")

    for (const key of url.searchParams.keys()) {
      const value = url.searchParams.get(key)

      if (value) {
        query = query.eq(key, value)
      }
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
            "Failed to fetch subscriptions.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      subscriptions: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch subscriptions.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
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
      (await request.json()) as SubscriptionPayload

    const payload = normalizeCreatePayload(
      body,
      authContext.userId
    )

    await validateSubscriptionReferences(
      authContext.supabase,
      payload
    )

    const { data, error } =
      await authContext.supabase
        .from(SUBSCRIPTIONS_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create subscription.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { subscription: data },
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

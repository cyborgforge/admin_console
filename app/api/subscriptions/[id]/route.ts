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

type SubscriptionUpdatePayload = {
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

function readRequiredString(
  value: unknown,
  fieldName: string
) {
  const trimmed = readString(value)

  if (!trimmed) {
    throw new Error(`${fieldName} cannot be empty.`)
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

function buildUpdateData(
  payload: SubscriptionUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.client_id !== undefined) {
    updateData.client_id = readRequiredString(
      payload.client_id,
      "client_id"
    )
  }

  if (payload.deal_id !== undefined) {
    updateData.deal_id =
      readNullableString(payload.deal_id)
  }

  if (payload.quotation_id !== undefined) {
    updateData.quotation_id =
      readNullableString(payload.quotation_id)
  }

  if (payload.product_module_id !== undefined) {
    updateData.product_module_id =
      readNullableString(
        payload.product_module_id
      )
  }

  if (payload.product_service_id !== undefined) {
    updateData.product_service_id =
      readNullableString(
        payload.product_service_id
      )
  }

  if (payload.plan !== undefined) {
    if (!isPlan(payload.plan)) {
      throw new Error(
        "plan must be starter, growth, or enterprise."
      )
    }

    updateData.plan = payload.plan
  }

  if (payload.billing_cycle !== undefined) {
    if (!isBillingCycle(payload.billing_cycle)) {
      throw new Error(
        "billing_cycle must be monthly, quarterly, or annual."
      )
    }

    updateData.billing_cycle =
      payload.billing_cycle
  }

  if (payload.mrr !== undefined) {
    updateData.mrr = readNullableNumber(
      payload.mrr,
      "mrr"
    )
  }

  if (payload.start_date !== undefined) {
    updateData.start_date =
      readNullableString(payload.start_date)
  }

  if (payload.renewal_date !== undefined) {
    updateData.renewal_date =
      readNullableString(payload.renewal_date)
  }

  if (payload.status !== undefined) {
    if (!isSubscriptionStatus(payload.status)) {
      throw new Error(
        "status must be active, expiring, churned, cancelled, or paused."
      )
    }

    updateData.status = payload.status
  }

  if (payload.notes !== undefined) {
    updateData.notes =
      readNullableString(payload.notes)
  }

  return updateData
}

/**
 * GET /api/subscriptions/:id
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
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Subscription not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    subscription: data,
  })
}

/**
 * PUT /api/subscriptions/:id
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
      (await request.json()) as SubscriptionUpdatePayload

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

    await validateSubscriptionReferences(
      authContext.supabase,
      updateData
    )

    const { data, error } =
      await authContext.supabase
        .from(SUBSCRIPTIONS_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update subscription.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      subscription: data,
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
 * DELETE /api/subscriptions/:id
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
      .from(SUBSCRIPTIONS_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete subscription.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

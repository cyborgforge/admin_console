import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const QUOTATIONS_TABLE =
  process.env.SUPABASE_QUOTATIONS_TABLE ??
  "quotations"

type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"

type QuotationUpdatePayload = {
  quotation_number?: unknown
  deal_id?: unknown
  client_id?: unknown
  branch_id?: unknown
  contact_id?: unknown
  product_module_id?: unknown
  product_service_id?: unknown
  quotation_date?: unknown
  valid_until?: unknown
  status?: unknown
  subtotal_amount?: unknown
  discount_amount?: unknown
  tax_amount?: unknown
  total_amount?: unknown
  currency?: unknown
  notes?: unknown
}

function isQuotationStatus(
  value: unknown
): value is QuotationStatus {
  return (
    value === "draft" ||
    value === "sent" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "expired"
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

async function validateQuotationReferences(
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

  if (typeof payload.branch_id === "string") {
    await requireRecordExists(
      supabase,
      "branches",
      payload.branch_id,
      "branch_id"
    )
  }

  if (typeof payload.contact_id === "string") {
    await requireRecordExists(
      supabase,
      "contacts",
      payload.contact_id,
      "contact_id"
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
  payload: QuotationUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.quotation_number !== undefined) {
    updateData.quotation_number =
      readRequiredString(
        payload.quotation_number,
        "quotation_number"
      )
  }

  if (payload.deal_id !== undefined) {
    updateData.deal_id =
      readNullableString(payload.deal_id)
  }

  if (payload.client_id !== undefined) {
    updateData.client_id =
      readRequiredString(
        payload.client_id,
        "client_id"
      )
  }

  if (payload.branch_id !== undefined) {
    updateData.branch_id =
      readNullableString(payload.branch_id)
  }

  if (payload.contact_id !== undefined) {
    updateData.contact_id =
      readNullableString(payload.contact_id)
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

  if (payload.quotation_date !== undefined) {
    updateData.quotation_date =
      readNullableString(
        payload.quotation_date
      )
  }

  if (payload.valid_until !== undefined) {
    updateData.valid_until =
      readNullableString(payload.valid_until)
  }

  if (payload.status !== undefined) {
    if (!isQuotationStatus(payload.status)) {
      throw new Error(
        "status must be draft, sent, accepted, rejected, or expired."
      )
    }

    updateData.status = payload.status
  }

  if (payload.subtotal_amount !== undefined) {
    updateData.subtotal_amount =
      readNullableNumber(
        payload.subtotal_amount,
        "subtotal_amount"
      )
  }

  if (payload.discount_amount !== undefined) {
    updateData.discount_amount =
      readNullableNumber(
        payload.discount_amount,
        "discount_amount"
      )
  }

  if (payload.tax_amount !== undefined) {
    updateData.tax_amount =
      readNullableNumber(
        payload.tax_amount,
        "tax_amount"
      )
  }

  if (payload.total_amount !== undefined) {
    updateData.total_amount =
      readNullableNumber(
        payload.total_amount,
        "total_amount"
      )
  }

  if (payload.currency !== undefined) {
    updateData.currency =
      readRequiredString(
        payload.currency,
        "currency"
      )
  }

  if (payload.notes !== undefined) {
    updateData.notes =
      readNullableString(payload.notes)
  }

  return updateData
}

/**
 * GET /api/quotations/:id
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
      .from(QUOTATIONS_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Quotation not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    quotation: data,
  })
}

/**
 * PUT /api/quotations/:id
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
      (await request.json()) as QuotationUpdatePayload

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

    await validateQuotationReferences(
      authContext.supabase,
      updateData
    )

    const { data, error } =
      await authContext.supabase
        .from(QUOTATIONS_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update quotation.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      quotation: data,
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
 * DELETE /api/quotations/:id
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
      .from(QUOTATIONS_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete quotation.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const DEALS_TABLE =
  process.env.SUPABASE_DEALS_TABLE ?? "deals"

type DealStage =
  | "new"
  | "quote sent"
  | "negotiation"
  | "reviewing"
  | "hold"
  | "won"
  | "lost"

type DealUpdatePayload = {
  deal_name?: unknown
  client_id?: unknown
  branch_id?: unknown
  primary_contact_id?: unknown
  stage?: unknown
  expected_value?: unknown
  source_lead_id?: unknown
  assigned_to?: unknown
  description?: unknown
  current_quotation_id?: unknown
  lost_reason?: unknown
  won_date?: unknown
}

function isDealStage(
  value: unknown
): value is DealStage {
  return (
    value === "new" ||
    value === "quote sent" ||
    value === "negotiation" ||
    value === "reviewing" ||
    value === "hold" ||
    value === "won" ||
    value === "lost"
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
    throw new Error(`${fieldName} cannot be empty.`)
  }

  return trimmed
}

function readNullableNumber(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(
      "expected_value must be a valid number."
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

function buildUpdateData(
  payload: DealUpdatePayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.deal_name !== undefined) {
    const deal_name = readString(
      payload.deal_name
    )

    if (!deal_name) {
      throw new Error(
        "deal_name cannot be empty."
      )
    }

    updateData.deal_name = deal_name
  }

  if (payload.client_id !== undefined) {
    const client_id = readRequiredUuid(
      payload.client_id,
      "client_id"
    )

    updateData.client_id = client_id
  }

  if (payload.branch_id !== undefined) {
    const branch_id = readRequiredUuid(
      payload.branch_id,
      "branch_id"
    )

    updateData.branch_id = branch_id
  }

  if (payload.primary_contact_id !== undefined) {
    updateData.primary_contact_id =
      readNullableString(
        payload.primary_contact_id
      )
  }

  if (payload.stage !== undefined) {
    if (!isDealStage(payload.stage)) {
      throw new Error(
        "stage must be new, quote sent, negotiation, reviewing, hold, won, or lost."
      )
    }

    updateData.stage = payload.stage
  }

  if (payload.expected_value !== undefined) {
    updateData.expected_value =
      readNullableNumber(
        payload.expected_value
      )
  }

  if (payload.source_lead_id !== undefined) {
    updateData.source_lead_id =
      readNullableString(
        payload.source_lead_id
      )
  }

  if (payload.assigned_to !== undefined) {
    updateData.assigned_to =
      readNullableString(payload.assigned_to)
  }

  if (payload.description !== undefined) {
    updateData.description =
      readNullableString(payload.description)
  }

  if (
    payload.current_quotation_id !== undefined
  ) {
    updateData.current_quotation_id =
      readNullableString(
        payload.current_quotation_id
      )
  }

  if (payload.lost_reason !== undefined) {
    updateData.lost_reason =
      readNullableString(payload.lost_reason)
  }

  if (payload.won_date !== undefined) {
    updateData.won_date =
      readNullableString(payload.won_date)
  }

  return updateData
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

async function validateDealReferences(
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

  if (typeof payload.branch_id === "string") {
    await requireRecordExists(
      supabase,
      "branches",
      payload.branch_id,
      "branch_id"
    )
  }

  if (
    typeof payload.primary_contact_id ===
    "string"
  ) {
    await requireRecordExists(
      supabase,
      "contacts",
      payload.primary_contact_id,
      "primary_contact_id"
    )
  }

  if (typeof payload.source_lead_id === "string") {
    await requireRecordExists(
      supabase,
      "leads",
      payload.source_lead_id,
      "source_lead_id"
    )
  }

  if (
    typeof payload.current_quotation_id ===
    "string"
  ) {
    await requireRecordExists(
      supabase,
      "quotations",
      payload.current_quotation_id,
      "current_quotation_id"
    )
  }
}

/**
 * GET /api/deals/:id
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
      .from(DEALS_TABLE)
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Deal not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    deal: data,
  })
}

/**
 * PUT /api/deals/:id
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
      (await request.json()) as DealUpdatePayload

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

    await validateDealReferences(
      authContext.supabase,
      updateData
    )

    const { data, error } =
      await authContext.supabase
        .from(DEALS_TABLE)
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update deal.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      deal: data,
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
 * DELETE /api/deals/:id
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
      .from(DEALS_TABLE)
      .delete()
      .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete deal.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}

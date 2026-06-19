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

type DealPayload = {
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
    throw new Error(`${fieldName} is required.`)
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

function normalizeCreatePayload(
  payload: DealPayload,
  userId: string
) {
  const deal_name = readString(payload.deal_name)
  const client_id = readRequiredUuid(
    payload.client_id,
    "client_id"
  )
  const branch_id = readRequiredUuid(
    payload.branch_id,
    "branch_id"
  )

  if (!deal_name) {
    throw new Error("deal_name is required.")
  }

  if (
    payload.stage !== undefined &&
    !isDealStage(payload.stage)
  ) {
    throw new Error(
      "stage must be new, quote sent, negotiation, reviewing, hold, won, or lost."
    )
  }

  return {
    deal_name,
    client_id,
    branch_id,
    primary_contact_id: readNullableString(
      payload.primary_contact_id
    ),
    stage: isDealStage(payload.stage)
      ? payload.stage
      : "new",
    expected_value: readNullableNumber(
      payload.expected_value
    ),
    source_lead_id: readNullableString(
      payload.source_lead_id
    ),
    assigned_to: readNullableString(
      payload.assigned_to
    ),
    description: readNullableString(
      payload.description
    ),
    current_quotation_id: readNullableString(
      payload.current_quotation_id
    ),
    lost_reason: readNullableString(
      payload.lost_reason
    ),
    won_date: readNullableString(
      payload.won_date
    ),
    created_by: userId,
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
 * GET /api/deals
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
    const client_id =
      url.searchParams.get("client_id")
    const branch_id =
      url.searchParams.get("branch_id")
    const primary_contact_id =
      url.searchParams.get("primary_contact_id")
    const source_lead_id =
      url.searchParams.get("source_lead_id")
    const assigned_to =
      url.searchParams.get("assigned_to")
    const stage = url.searchParams.get("stage")

    let query = authContext.supabase
      .from(DEALS_TABLE)
      .select("*")

    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    if (branch_id) {
      query = query.eq("branch_id", branch_id)
    }

    if (primary_contact_id) {
      query = query.eq(
        "primary_contact_id",
        primary_contact_id
      )
    }

    if (source_lead_id) {
      query = query.eq(
        "source_lead_id",
        source_lead_id
      )
    }

    if (assigned_to) {
      query = query.eq("assigned_to", assigned_to)
    }

    if (stage && isDealStage(stage)) {
      query = query.eq("stage", stage)
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
            "Failed to fetch deals.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      deals: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch deals.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/deals
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
      (await request.json()) as DealPayload

    const payload = normalizeCreatePayload(
      body,
      authContext.userId
    )

    await validateDealReferences(
      authContext.supabase,
      payload
    )

    const { data, error } =
      await authContext.supabase
        .from(DEALS_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create deal.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { deal: data },
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

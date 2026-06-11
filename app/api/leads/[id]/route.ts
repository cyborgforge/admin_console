import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type {
  Lead,
  LeadProductInterest,
  LeadStatus,
  UpdateLeadPayload,
} from "@/types/lead"

const LEADS_TABLE = process.env.SUPABASE_LEADS_TABLE ?? "leads"

function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    value === "discovery" ||
    value === "contacted" ||
    value === "reviewing" ||
    value === "closed-won" ||
    value === "closed-lost"
  )
}

function isLeadProductInterest(
  value: unknown
): value is LeadProductInterest {
  return (
    value === "Pharmacy" ||
    value === "Hospital" ||
    value === "Others"
  )
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const parsed = new Date(trimmed)

  if (Number.isNaN(parsed.getTime())) {
    return trimmed
  }

  return parsed.toISOString()
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: readString(row.id),
    leadName: readString(row.lead_name),
    company: readString(row.company),
    jobTitle: readString(row.job_title),
    email: readString(row.email),
    phone: readString(row.phone),
    source: readString(row.source),
    status: isLeadStatus(row.status)
      ? row.status
      : "discovery",
    assignedTo: readString(row.assigned_to),
    createdDate: readString(row.created_date),
    lastActivityDate:
      readString(row.last_activity_date) || undefined,
    lastActivityName: readString(row.last_activity_name),
    nextFollowUp:
      readString(row.next_follow_up) || undefined,
    state: readString(row.location_state),
    city: readString(row.location_city),
    tags: readString(row.tags),
    productInterest: isLeadProductInterest(
      row.product_interest
    )
      ? row.product_interest
      : "Pharmacy",
    createdAt: readString(row.created_at) || undefined,
    updatedAt: readString(row.updated_at) || undefined,
    createdBy: readString(row.created_by) || undefined,
  }
}

function getAccessToken(request: Request) {
  const authHeader = request.headers.get("authorization")

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

function buildUpdateData(payload: UpdateLeadPayload) {
  const updateData: Record<string, unknown> = {}

  if (typeof payload.leadName === "string") {
    updateData.lead_name = payload.leadName.trim()
  }

  if (typeof payload.company === "string") {
    updateData.company = payload.company.trim()
  }

  if (typeof payload.jobTitle === "string") {
    updateData.job_title = payload.jobTitle.trim()
  }

  if (typeof payload.email === "string") {
    updateData.email = payload.email.trim()
  }

  if (typeof payload.phone === "string") {
    updateData.phone = payload.phone.trim()
  }

  if (typeof payload.source === "string") {
    updateData.source = payload.source.trim()
  }

  if (payload.status && isLeadStatus(payload.status)) {
    updateData.status = payload.status
  }

  if (typeof payload.assignedTo === "string") {
    updateData.assigned_to = payload.assignedTo.trim()
  }

  if (typeof payload.createdDate === "string") {
    updateData.created_date = normalizeDate(
      payload.createdDate
    )
  }

  if (typeof payload.lastActivityDate === "string") {
    updateData.last_activity_date = normalizeDate(
      payload.lastActivityDate
    )
  }

  if (typeof payload.lastActivityName === "string") {
    updateData.last_activity_name =
      payload.lastActivityName.trim()
  }

  if (typeof payload.nextFollowUp === "string") {
    updateData.next_follow_up = normalizeDate(
      payload.nextFollowUp
    )
  }

  if (typeof payload.state === "string") {
    updateData.location_state = payload.state.trim()
  }

  if (typeof payload.city === "string") {
    updateData.location_city = payload.city.trim()
  }

  if (typeof payload.tags === "string") {
    updateData.tags = payload.tags.trim()
  }

  if (
    payload.productInterest &&
    isLeadProductInterest(payload.productInterest)
  ) {
    updateData.product_interest =
      payload.productInterest
  }

  return updateData
}

/**
 * GET /api/leads/:id
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authContext =
    await requireAuthenticatedRequest(request)

  if (
    authContext.errorResponse ||
    !authContext.supabase ||
    !authContext.userId
  ) {
    return authContext.errorResponse!
  }

  const { data, error } =
    await authContext.supabase
      .from(LEADS_TABLE)
      .select("*")
      .eq("id", id)
      // .eq("created_by", authContext.userId)
      .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Lead not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    lead: mapLead(data as Record<string, unknown>),
  })
}

/**
 * PUT /api/leads/:id
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    (await request.json()) as UpdateLeadPayload

  const updateData = buildUpdateData(body)

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields provided for update." },
      { status: 400 }
    )
  }

  const { data, error } =
    await authContext.supabase
      .from(LEADS_TABLE)
      .update(updateData)
      .eq("id", id)
      // .eq("created_by", authContext.userId)
      .select()
      .single()

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Failed to update lead.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    lead: mapLead(data as Record<string, unknown>),
  })
}

/**
 * DELETE /api/leads/:id
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authContext =
    await requireAuthenticatedRequest(request)

  if (
    authContext.errorResponse ||
    !authContext.supabase ||
    !authContext.userId
  ) {
    return authContext.errorResponse!
  }

  const { error } =
    await authContext.supabase
      .from(LEADS_TABLE)
      .delete()
      .eq("id", id)
      // .eq("created_by", authContext.userId)

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Failed to delete lead.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}
import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type {
  CreateLeadPayload,
  DeleteLeadPayload,
  Lead,
  LeadProductInterest,
  LeadStatus,
  UpdateLeadPayload,
} from "@/types/lead"

const LEADS_TABLE = process.env.SUPABASE_LEADS_TABLE ?? "leads"

function isLeadStatus(value: unknown): value is LeadStatus {
  return value === "discovery" || value === "contacted" || value === "reviewing" || value === "closed-won" || value === "closed-lost"
}

function isLeadProductInterest(value: unknown): value is LeadProductInterest {
  return value === "Pharmacy" || value === "Hospital" || value === "Others"
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

  return parsed.toISOString().slice(0, 10)
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: readString(row.id, `LD-${Date.now()}`),
    leadName: readString(row.lead_name, "New Lead"),
    company: readString(row.company, "New Company"),
    jobTitle: readString(row.job_title),
    email: readString(row.email),
    phone: readString(row.phone),
    source: readString(row.source),
    status: isLeadStatus(row.status) ? row.status : "discovery",
    assignedTo: readString(row.assigned_to),
    createdDate: readString(row.created_date, readString(row.created_at).slice(0, 10)),
    lastActivityDate: readString(row.last_activity_date) || undefined,
    lastActivityName: readString(row.last_activity_name),
    nextFollowUp: readString(row.next_follow_up) || undefined,
    state: readString(row.location_state),
    city: readString(row.location_city),
    tags: readString(row.tags),
    productInterest: isLeadProductInterest(row.product_interest) ? row.product_interest : "Pharmacy",
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

  return authHeader.slice(7).trim() || null
}

async function requireAuthenticatedRequest(request: Request) {
  const accessToken = getAccessToken(request)

  if (!accessToken) {
    return {
      errorResponse: NextResponse.json({ error: "Missing access token." }, { status: 401 }),
      supabase: null,
      userId: null,
    }
  }

  const supabase = getSupabaseServerClient(accessToken)
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }),
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

function normalizeCreatePayload(payload: Partial<CreateLeadPayload>) {
  const leadName = readString(payload.leadName)
  const company = readString(payload.company)

  if (!leadName || !company) {
    throw new Error("leadName and company are required.")
  }

  return {
    leadName,
    company,
    jobTitle: readString(payload.jobTitle),
    email: readString(payload.email),
    phone: readString(payload.phone),
    source: readString(payload.source),
    status: isLeadStatus(payload.status) ? payload.status : "discovery",
    assignedTo: readString(payload.assignedTo),
    createdDate: normalizeDate(payload.createdDate) ?? new Date().toISOString().slice(0, 10),
    lastActivityDate: normalizeDate(payload.lastActivityDate),
    lastActivityName: readString(payload.lastActivityName),
    nextFollowUp: normalizeDate(payload.nextFollowUp),
    state: readString(payload.state),
    city: readString(payload.city),
    tags: readString(payload.tags),
    productInterest: isLeadProductInterest(payload.productInterest) ? payload.productInterest : "Pharmacy",
  }
}

function buildUpdateData(payload: UpdateLeadPayload) {
  const updateData: Record<string, unknown> = {}

  if (typeof payload.leadName === "string") {
    const value = payload.leadName.trim()
    if (value) {
      updateData.lead_name = value
    }
  }

  if (typeof payload.company === "string") {
    const value = payload.company.trim()
    if (value) {
      updateData.company = value
    }
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
    const value = normalizeDate(payload.createdDate)
    if (value) {
      updateData.created_date = value
    }
  }

  if (typeof payload.lastActivityDate === "string") {
    updateData.last_activity_date = normalizeDate(payload.lastActivityDate)
  }

  if (typeof payload.lastActivityName === "string") {
    updateData.last_activity_name = payload.lastActivityName.trim()
  }

  if (typeof payload.nextFollowUp === "string") {
    updateData.next_follow_up = normalizeDate(payload.nextFollowUp)
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

  if (payload.productInterest && isLeadProductInterest(payload.productInterest)) {
    updateData.product_interest = payload.productInterest
  }

  return updateData
}

function isDeletePayload(payload: Record<string, unknown>): payload is DeleteLeadPayload {
  return readString(payload.operation) === "delete" || payload.delete === true
}

export async function GET(request: Request) {
  try {
    const authContext = await requireAuthenticatedRequest(request)
    if (authContext.errorResponse || !authContext.supabase || !authContext.userId) {
      return authContext.errorResponse!
    }

    const url = new URL(request.url)
    const liveOnly =
      url.searchParams.get("live") === "true" ||
      url.searchParams.get("scope") === "live" ||
      url.searchParams.get("view") === "live"

    let query = authContext.supabase
      .from(LEADS_TABLE)
      .select("*")
      .eq("id", authContext.userId)
      .order("created_at", { ascending: false })

    if (liveOnly) {
      query = query.not("status", "in", "(closed-won,closed-lost)")
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message ?? "Failed to read leads." }, { status: 400 })
    }

    const leads = (data ?? []).map((row) => mapLead(row as Record<string, unknown>))
    return NextResponse.json({ leads, source: liveOnly ? "supabase-live" : "supabase" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read leads."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthenticatedRequest(request)
    if (authContext.errorResponse || !authContext.supabase || !authContext.userId) {
      return authContext.errorResponse!
    }

    const body = (await request.json()) as Record<string, unknown>

    if (isDeletePayload(body)) {
      const leadId = readString(body.id)

      if (!leadId) {
        return NextResponse.json({ error: "id is required." }, { status: 400 })
      }

      const { error } = await authContext.supabase
        .from(LEADS_TABLE)
        .delete()
        .eq("id", leadId)
        .eq("id", authContext.userId)

      if (error) {
        return NextResponse.json({ error: error.message ?? "Failed to delete lead." }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    const leadId = readString(body.id)

    if (leadId) {
      const updateData = buildUpdateData(body as UpdateLeadPayload)

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No updatable fields were provided." }, { status: 400 })
      }

      const { data, error } = await authContext.supabase
        .from(LEADS_TABLE)
        .update(updateData)
        .eq("id", leadId)
        .eq("id", authContext.userId)
        .select("*")
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to update lead." },
          { status: 400 },
        )
      }

      return NextResponse.json({ lead: mapLead(data as Record<string, unknown>) })
    }

    const normalized = normalizeCreatePayload(body as Partial<CreateLeadPayload>)

    const { data, error } = await authContext.supabase
      .from(LEADS_TABLE)
      .insert({
        id: authContext.userId,
        created_by: authContext.userId,
        lead_name: normalized.leadName,
        company: normalized.company,
        job_title: normalized.jobTitle,
        email: normalized.email,
        phone: normalized.phone,
        source: normalized.source,
        status: normalized.status,
        assigned_to: normalized.assignedTo,
        created_date: normalized.createdDate,
        last_activity_date: normalized.lastActivityDate,
        last_activity_name: normalized.lastActivityName,
        next_follow_up: normalized.nextFollowUp,
        location_state: normalized.state,
        location_city: normalized.city,
        tags: normalized.tags,
        product_interest: normalized.productInterest,
      })
      .select("*")
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create lead." },
        { status: 400 },
      )
    }

    return NextResponse.json({ lead: mapLead(data as Record<string, unknown>) }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid lead payload."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

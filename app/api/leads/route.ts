import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type {
  CreateLeadPayload,
  Lead,
  LeadProductInterest,
  LeadStatus,
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

function normalizeCreatePayload(
  payload: Partial<CreateLeadPayload>
) {
  const leadName = readString(payload.leadName)
  const company = readString(payload.company)

  if (!leadName || !company) {
    throw new Error(
      "leadName and company are required."
    )
  }

  return {
    leadName,
    company,
    jobTitle: readString(payload.jobTitle),
    email: readString(payload.email),
    phone: readString(payload.phone),
    source: readString(payload.source),
    status: isLeadStatus(payload.status)
      ? payload.status
      : "discovery",
    assignedTo: readString(payload.assignedTo),
    createdDate:
      normalizeDate(payload.createdDate) ??
      new Date().toISOString(),
    lastActivityDate: normalizeDate(
      payload.lastActivityDate
    ),
    lastActivityName: readString(
      payload.lastActivityName
    ),
    nextFollowUp: normalizeDate(
      payload.nextFollowUp
    ),
    state: readString(payload.state),
    city: readString(payload.city),
    tags: readString(payload.tags),
    productInterest: isLeadProductInterest(
      payload.productInterest
    )
      ? payload.productInterest
      : "Pharmacy",
  }
}

/**
 * GET /api/leads
 */
export async function GET(request: Request) {
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

    const { data, error } =
      await authContext.supabase
        .from(LEADS_TABLE)
        .select("*")
        .eq("created_by", authContext.userId)
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch leads.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      leads: (data ?? []).map((row) =>
        mapLead(row as Record<string, unknown>)
      ),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch leads.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leads
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
      (await request.json()) as Partial<CreateLeadPayload>

    const normalized =
      normalizeCreatePayload(body)

    const { data, error } =
      await authContext.supabase
        .from(LEADS_TABLE)
        .insert({
          lead_name: normalized.leadName,
          company: normalized.company,
          job_title: normalized.jobTitle,
          email: normalized.email,
          phone: normalized.phone,
          source: normalized.source,
          status: normalized.status,
          assigned_to: normalized.assignedTo || null,
          created_date: normalized.createdDate,
          last_activity_date:
            normalized.lastActivityDate,
          last_activity_name:
            normalized.lastActivityName,
          next_follow_up:
            normalized.nextFollowUp,
          location_state: normalized.state,
          location_city: normalized.city,
          tags: normalized.tags,
          product_interest:
            normalized.productInterest,
          created_by: authContext.userId,
        })
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create lead.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        lead: mapLead(
          data as Record<string, unknown>
        ),
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
import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type { Client, ClientStatus, CreateClientPayload } from "@/types/client"

const CLIENTS_TABLE = process.env.SUPABASE_CLIENTS_TABLE ?? "clients"

function isClientStatus(value: unknown): value is ClientStatus {
  return value === "active" || value === "prospect" || value === "churned"
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function mapClient(row: Record<string, unknown>): Client {
  const rawStatus = row.status
  const status = isClientStatus(rawStatus) ? rawStatus : "prospect"

  const totalBilledSource =
    row.total_billed ??
    row.totalBilled ??
    row.totalbilled

  const quotesSource =
    row.quotes_count ??
    row.quotes ??
    row.quotesCount

  const sinceSource =
    row.since_label ??
    row.since ??
    row.sinceLabel

  return {
    id: readString(row.id) || `CL-${Date.now()}`,
    name: readString(row.name, "New Client"),
    role: readString(row.role, "Owner"),
    organization: readString(row.organization, "New Organization"),
    industry: readString(row.industry, "Pharmacy"),
    city: readString(row.city, "Chennai"),
    email: readString(row.email, "client@example.com"),
    phone: readString(row.phone, "+91 90000 00000"),
    status,
    product: readString(row.product, "Pharmacy Suite"),
    totalBilled: readNumber(totalBilledSource, 0),
    quotes: readNumber(quotesSource, 0),
    since: readString(sinceSource, "Mar 2026"),
    color: readString(row.color, "#3b82f6"),
    gst: readString(row.gst, "-"),
    notes: readString(row.notes),
  }
}

function getAccessToken(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim() || null
}

async function getSupabaseForWrite(request: Request) {
  const accessToken = getAccessToken(request)
  if (!accessToken) {
    return {
      error: NextResponse.json({ error: "Missing access token." }, { status: 401 }),
      supabase: null,
      userId: null,
    }
  }

  const supabase = getSupabaseServerClient(accessToken)

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }),
      supabase: null,
      userId: null,
    }
  }

  return { error: null, supabase, userId: data.user.id }
}

function normalizeCreatePayload(payload: Partial<CreateClientPayload>) {
  const name = readString(payload.name)
  const organization = readString(payload.organization)
  const product = readString(payload.product)
  const email = readString(payload.email)

  if (!name || !organization || !product || !email) {
    throw new Error("name, organization, product and email are required.")
  }

  return {
    name,
    role: readString(payload.role, "Owner"),
    organization,
    industry: readString(payload.industry, "Pharmacy"),
    city: readString(payload.city, "Chennai"),
    email,
    phone: readString(payload.phone, "+91 90000 00000"),
    status: isClientStatus(payload.status) ? payload.status : "prospect",
    product,
    color: readString(payload.color, "#3b82f6"),
    gst: readString(payload.gst, "-"),
    notes: readString(payload.notes),
  }
}

export async function GET(request: Request) {
  try {
    const authContext = await getSupabaseForWrite(request)
    if (authContext.error || !authContext.supabase) {
      return authContext.error!
    }

    const { data, error } = await authContext.supabase
      .from(CLIENTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message ?? "Failed to read clients." }, { status: 400 })
    }

    const clients = (data ?? []).map((row) => mapClient(row as Record<string, unknown>))
    return NextResponse.json({ clients, source: "supabase" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read clients."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const writeContext = await getSupabaseForWrite(request)
    if (writeContext.error || !writeContext.supabase || !writeContext.userId) {
      return writeContext.error!
    }

    const body = (await request.json()) as Partial<CreateClientPayload>
    const normalized = normalizeCreatePayload(body)

    const insertData = {
      user_id: writeContext.userId,
      name: normalized.name,
      role: normalized.role,
      organization: normalized.organization,
      industry: normalized.industry,
      city: normalized.city,
      email: normalized.email,
      phone: normalized.phone,
      status: normalized.status,
      product: normalized.product,
      color: normalized.color,
      gst: normalized.gst,
      notes: normalized.notes,
    }

    const { data, error } = await writeContext.supabase
      .from(CLIENTS_TABLE)
      .insert(insertData)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message ?? "Failed to create client." }, { status: 400 })
    }

    return NextResponse.json({ client: mapClient(data as Record<string, unknown>) }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type {
  CreateQuotationPayload,
  Quotation,
  QuotationLineItem,
  QuotationStatus,
  UpdateQuotationPayload,
} from "@/types/quotation"

const quotationsStore: Quotation[] = [
  { id: "QT-2025-048", client: "Apollo Pharmacy", organization: "Apollo Health", product: "Pharmacy Suite", amount: 58200, status: "sent", expiry: "Apr 10, 2025", color: "#3b82f6" },
  { id: "QT-2025-047", client: "Green Cross Clinic", organization: "GCC Healthcare", product: "Clinic Suite", amount: 34500, status: "accepted", expiry: "Apr 5, 2025", color: "#10b981" },
  { id: "QT-2025-046", client: "MedPlus Pharma", organization: "MedPlus Pvt Ltd", product: "Pharmacy Suite", amount: 51920, status: "accepted", expiry: "Apr 19, 2025", color: "#8b5cf6" },
  { id: "QT-2025-045", client: "City Hospital", organization: "City Health Group", product: "Clinic Suite", amount: 29000, status: "draft", expiry: "-", color: "#f59e0b" },
  { id: "QT-2025-044", client: "Reliance Retail", organization: "Reliance Industries", product: "Retail Suite", amount: 82000, status: "review", expiry: "Mar 28, 2025", color: "#ef4444" },
  { id: "QT-2025-043", client: "Wellness First", organization: "WF Pharma", product: "Pharmacy Suite", amount: 41600, status: "expired", expiry: "Mar 1, 2025", color: "#6b7280" },
  { id: "QT-2025-042", client: "Lifeline Hospital", organization: "Lifeline Trust", product: "Clinic Suite", amount: 55000, status: "accepted", expiry: "Apr 22, 2025", color: "#10b981" },
  { id: "QT-2025-041", client: "Quick Mart", organization: "Quick Retail Chain", product: "Retail Suite", amount: 38750, status: "sent", expiry: "Apr 8, 2025", color: "#f59e0b" },
]

const QUOTATIONS_TABLE = process.env.SUPABASE_QUOTATIONS_TABLE ?? "quotations"

function isQuotationStatus(value: unknown): value is QuotationStatus {
  return value === "draft" || value === "sent" || value === "accepted" || value === "expired" || value === "review"
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

function mapQuotation(row: Record<string, unknown>): Quotation {
  const rawStatus = row.status
  const status = isQuotationStatus(rawStatus) ? rawStatus : "draft"
  const lineItems = sanitizeLineItems(row.line_items)

  return {
    id: readString(row.id) || `QT-${Date.now()}`,
    client: readString(row.client, "New Client"),
    organization: readString(row.organization, "New Organization"),
    email: readString(row.email),
    phone: readString(row.phone),
    product: readString(row.product, "Pharmacy Suite"),
    amount: readNumber(row.amount, 0),
    status,
    expiry: readString(row.expiry, "-"),
    color: readString(row.color, "#3b82f6"),
    createdAt: readString(row.created_at),
    discount: readNumber(row.discount, 0),
    notes: readString(row.notes),
    lineItems,
  }
}

function sanitizeLineItems(lineItems: unknown): QuotationLineItem[] {
  if (!Array.isArray(lineItems)) {
    return []
  }

  return lineItems
    .map((line) => {
      const lineRecord = line as Record<string, unknown>
      const name = readString(lineRecord.name)
      const quantity = Math.max(0, Math.round(readNumber(lineRecord.quantity, 0)))
      const unitPrice = Math.max(0, readNumber(lineRecord.unitPrice, 0))

      return {
        name,
        quantity,
        unitPrice,
      }
    })
    .filter((line) => line.name.length > 0 && line.quantity > 0)
}

function calculateAmount(lineItems: QuotationLineItem[], fallbackAmount: number, discountInput: number) {
  const subtotal =
    lineItems.length > 0
      ? lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
      : Math.max(0, fallbackAmount)

  const discount = Math.min(Math.max(0, discountInput), subtotal)
  return Math.max(0, subtotal - discount)
}

function ensureCreatePayload(payload: Partial<CreateQuotationPayload>) {
  const client = readString(payload.client)
  const organization = readString(payload.organization)
  const product = readString(payload.product)

  if (!client || !organization || !product) {
    throw new Error("client, organization and product are required.")
  }

  const lineItems = sanitizeLineItems(payload.lineItems)
  const amount = calculateAmount(
    lineItems,
    readNumber(payload.amount, 0),
    readNumber(payload.discount, 0),
  )

  return {
    client,
    organization,
    email: readString(payload.email),
    phone: readString(payload.phone),
    product,
    lineItems,
    amount,
    discount: readNumber(payload.discount, 0),
    status: isQuotationStatus(payload.status) ? payload.status : "draft",
    expiry: readString(payload.expiry, "-"),
    color: readString(payload.color, "#3b82f6"),
    notes: readString(payload.notes),
  }
}

function buildUpdateData(payload: UpdateQuotationPayload) {
  const updateData: Record<string, unknown> = {}

  if (typeof payload.client === "string") {
    const client = payload.client.trim()
    if (client) {
      updateData.client = client
    }
  }

  if (typeof payload.organization === "string") {
    const organization = payload.organization.trim()
    if (organization) {
      updateData.organization = organization
    }
  }

  if (typeof payload.email === "string") {
    updateData.email = payload.email.trim()
  }

  if (typeof payload.phone === "string") {
    updateData.phone = payload.phone.trim()
  }

  if (typeof payload.product === "string") {
    const product = payload.product.trim()
    if (product) {
      updateData.product = product
    }
  }

  if (typeof payload.color === "string") {
    const color = payload.color.trim()
    if (color) {
      updateData.color = color
    }
  }

  if (payload.status && isQuotationStatus(payload.status)) {
    updateData.status = payload.status
  }

  if (typeof payload.expiry === "string") {
    updateData.expiry = payload.expiry.trim() || "-"
  }

  const hasPricingInputs = Array.isArray(payload.lineItems) || typeof payload.amount === "number"

  if (hasPricingInputs) {
    const lineItems = sanitizeLineItems(payload.lineItems)
    updateData.amount = calculateAmount(
      lineItems,
      readNumber(payload.amount, 0),
      readNumber(payload.discount, 0),
    )
    if (typeof payload.discount === "number") {
      updateData.discount = readNumber(payload.discount, 0)
    }
    updateData.line_items = lineItems
  }

  if (typeof payload.notes === "string") {
    updateData.notes = payload.notes.trim()
  }

  return updateData
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
    }
  }

  const supabase = getSupabaseServerClient(accessToken)
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }),
      supabase: null,
    }
  }

  return {
    errorResponse: null,
    supabase,
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from(QUOTATIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ quotations: quotationsStore, source: "fallback" })
    }

    const quotations = (data ?? []).map((row) => mapQuotation(row as Record<string, unknown>))
    return NextResponse.json({ quotations, source: "supabase" })
  } catch {
    return NextResponse.json({ quotations: quotationsStore, source: "fallback" })
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedRequest(request)
  if (authResult.errorResponse || !authResult.supabase) {
    return authResult.errorResponse!
  }

  try {
    const body = (await request.json()) as Partial<CreateQuotationPayload>
    const normalized = ensureCreatePayload(body)

    const insertData = {
      client: normalized.client,
      organization: normalized.organization,
      email: normalized.email,
      phone: normalized.phone,
      product: normalized.product,
      amount: normalized.amount,
      status: normalized.status,
      expiry: normalized.expiry,
      color: normalized.color,
      discount: normalized.discount,
      line_items: normalized.lineItems,
      notes: normalized.notes,
    }

    const { data, error } = await authResult.supabase
      .from(QUOTATIONS_TABLE)
      .insert(insertData)
      .select("*")
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create quotation." },
        { status: 400 },
      )
    }

    const quotation = mapQuotation(data as Record<string, unknown>)
    return NextResponse.json({ quotation }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid quotation payload."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAuthenticatedRequest(request)
  if (authResult.errorResponse || !authResult.supabase) {
    return authResult.errorResponse!
  }

  try {
    const body = (await request.json()) as UpdateQuotationPayload
    const quotationId = readString(body.id)

    if (!quotationId) {
      return NextResponse.json({ error: "id is required." }, { status: 400 })
    }

    const updateData = buildUpdateData(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updatable fields were provided." }, { status: 400 })
    }

    const { data, error } = await authResult.supabase
      .from(QUOTATIONS_TABLE)
      .update(updateData)
      .eq("id", quotationId)
      .select("*")
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update quotation." },
        { status: 400 },
      )
    }

    const quotation = mapQuotation(data as Record<string, unknown>)
    return NextResponse.json({ quotation })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid update payload."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

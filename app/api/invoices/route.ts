import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type {
  CreateInvoicePayload,
  Invoice,
  InvoiceLineItem,
  InvoiceProduct,
  InvoiceStatus,
  UpdateInvoicePayload,
} from "@/types/invoice"

const INVOICES_TABLE = process.env.SUPABASE_INVOICES_TABLE ?? "invoices"

const invoicesStore: Invoice[] = [
  { id: "INV-2025-024", client: "Apollo Pharmacy", org: "Apollo Health", quoteRef: "QT-2025-048", product: "pharmacy", amount: 49322, gst: 8878, total: 58200, status: "sent", due: "Apr 15, 2025", color: "#3b82f6" },
  { id: "INV-2025-023", client: "Green Cross Clinic", org: "GCC Healthcare", quoteRef: "QT-2025-047", product: "clinic", amount: 29237, gst: 5263, total: 34500, status: "paid", due: "Apr 5, 2025", color: "#10b981" },
  { id: "INV-2025-022", client: "MedPlus Pharma", org: "MedPlus Pvt Ltd", quoteRef: "QT-2025-046", product: "pharmacy", amount: 44000, gst: 7920, total: 51920, status: "paid", due: "Mar 30, 2025", color: "#8b5cf6" },
  { id: "INV-2025-021", client: "City Hospital", org: "City Health Group", quoteRef: "QT-2025-045", product: "clinic", amount: 24576, gst: 4424, total: 29000, status: "draft", due: "-", color: "#f59e0b" },
  { id: "INV-2025-020", client: "Reliance Retail", org: "Reliance Industries", quoteRef: "QT-2025-044", product: "retail", amount: 69492, gst: 12508, total: 82000, status: "overdue", due: "Mar 10, 2025", color: "#ef4444" },
  { id: "INV-2025-019", client: "Wellness First", org: "WF Pharma", quoteRef: "QT-2025-043", product: "pharmacy", amount: 35254, gst: 6346, total: 41600, status: "overdue", due: "Mar 1, 2025", color: "#6b7280" },
  { id: "INV-2025-018", client: "Lifeline Hospital", org: "Lifeline Trust", quoteRef: "QT-2025-042", product: "clinic", amount: 46610, gst: 8390, total: 55000, status: "paid", due: "Apr 10, 2025", color: "#10b981" },
  { id: "INV-2025-017", client: "Quick Mart", org: "Quick Retail Chain", quoteRef: "QT-2025-041", product: "retail", amount: 32839, gst: 5911, total: 38750, status: "sent", due: "Apr 20, 2025", color: "#f59e0b" },
  { id: "INV-2025-016", client: "Apollo Pharmacy", org: "Apollo Health", quoteRef: "QT-2025-036", product: "pharmacy", amount: 22034, gst: 3966, total: 26000, status: "partial", due: "Apr 18, 2025", color: "#3b82f6" },
  { id: "INV-2025-015", client: "MedPlus Pharma", org: "MedPlus Pvt Ltd", quoteRef: "QT-2025-032", product: "pharmacy", amount: 38136, gst: 6864, total: 45000, status: "overdue", due: "Feb 28, 2025", color: "#8b5cf6" },
]

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return value === "draft" || value === "sent" || value === "paid" || value === "overdue" || value === "partial"
}

function isInvoiceProduct(value: unknown): value is InvoiceProduct {
  return value === "pharmacy" || value === "clinic" || value === "retail"
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

function sanitizeLineItems(lineItems: unknown): InvoiceLineItem[] {
  if (!Array.isArray(lineItems)) {
    return []
  }

  return lineItems
    .map((line) => {
      const lineRecord = line as Record<string, unknown>
      const description = readString(lineRecord.description)
      const quantity = Math.max(0, Math.round(readNumber(lineRecord.quantity, 0)))
      const rate = Math.max(0, readNumber(lineRecord.rate, 0))

      return { description, quantity, rate }
    })
    .filter((line) => line.description.length > 0 && line.quantity > 0)
}

function normalizeDueLabel(dueInput: string) {
  if (!dueInput || dueInput === "-") {
    return "-"
  }

  const parsedDate = new Date(dueInput)
  if (Number.isNaN(parsedDate.getTime())) {
    return dueInput
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function deriveColor(product: InvoiceProduct) {
  if (product === "clinic") {
    return "#10b981"
  }

  if (product === "retail") {
    return "#f59e0b"
  }

  return "#3b82f6"
}

function calculateTotals(lineItems: InvoiceLineItem[], discountInput: number, gstRateInput: number) {
  const subtotal = lineItems.reduce((sum, line) => sum + line.quantity * line.rate, 0)
  const discount = Math.min(Math.max(0, discountInput), subtotal)
  const taxableAmount = Math.max(0, subtotal - discount)
  const gst = Math.round(taxableAmount * (Math.max(0, gstRateInput) / 100))

  return {
    amount: taxableAmount,
    gst,
    total: taxableAmount + gst,
  }
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  const rawStatus = row.status
  const rawProduct = row.product

  return {
    id: readString(row.id, `INV-${Date.now()}`),
    client: readString(row.client, "New Client"),
    org: readString(row.org, "New Organization"),
    quoteRef: readString(row.quote_ref, "-") || "-",
    product: isInvoiceProduct(rawProduct) ? rawProduct : "pharmacy",
    amount: readNumber(row.amount, 0),
    gst: readNumber(row.gst, 0),
    total: readNumber(row.total, 0),
    status: isInvoiceStatus(rawStatus) ? rawStatus : "draft",
    due: readString(row.due, "-"),
    color: readString(row.color, "#3b82f6"),
  }
}

function normalizeCreatePayload(payload: Partial<CreateInvoicePayload>) {
  const client = readString(payload.client)
  if (!client) {
    throw new Error("client is required.")
  }

  const lineItems = sanitizeLineItems(payload.lineItems)
  if (lineItems.length === 0) {
    throw new Error("At least one valid line item is required.")
  }

  const product = isInvoiceProduct(payload.product) ? payload.product : "pharmacy"
  const due = normalizeDueLabel(readString(payload.due, "-"))
  const gstRate = Math.max(0, readNumber(payload.gstRate, 18))
  const discount = Math.max(0, readNumber(payload.discount, 0))
  const totals = calculateTotals(lineItems, discount, gstRate)

  return {
    client,
    org: readString(payload.org, client),
    quoteRef: readString(payload.quoteRef, "-") || "-",
    product,
    status: isInvoiceStatus(payload.status) ? payload.status : "draft",
    due,
    color: readString(payload.color, deriveColor(product)),
    gstin: readString(payload.gstin),
    email: readString(payload.email),
    gstRate,
    taxType: payload.taxType === "cgst_sgst" ? "cgst_sgst" : "igst",
    discount,
    paymentTerms: readString(payload.paymentTerms),
    lineItems,
    ...totals,
  }
}

function buildUpdateData(payload: UpdateInvoicePayload) {
  const updateData: Record<string, unknown> = {}

  if (typeof payload.client === "string") {
    const client = payload.client.trim()
    if (client) {
      updateData.client = client
    }
  }

  if (typeof payload.org === "string") {
    const org = payload.org.trim()
    if (org) {
      updateData.org = org
    }
  }

  if (typeof payload.quoteRef === "string") {
    updateData.quote_ref = payload.quoteRef.trim() || "-"
  }

  if (payload.product && isInvoiceProduct(payload.product)) {
    updateData.product = payload.product
  }

  if (payload.status && isInvoiceStatus(payload.status)) {
    updateData.status = payload.status
  }

  if (typeof payload.due === "string") {
    updateData.due = normalizeDueLabel(payload.due.trim())
  }

  if (typeof payload.color === "string") {
    const color = payload.color.trim()
    if (color) {
      updateData.color = color
    }
  }

  if (typeof payload.gstin === "string") {
    updateData.gstin = payload.gstin.trim()
  }

  if (typeof payload.email === "string") {
    updateData.email = payload.email.trim()
  }

  if (typeof payload.paymentTerms === "string") {
    updateData.payment_terms = payload.paymentTerms.trim()
  }

  const lineItems = sanitizeLineItems(payload.lineItems)
  const gstRate = readNumber(payload.gstRate, 18)
  const discount = readNumber(payload.discount, 0)
  const hasPricingInputs = lineItems.length > 0 || typeof payload.gstRate === "number" || typeof payload.discount === "number"

  if (hasPricingInputs) {
    if (lineItems.length === 0) {
      throw new Error("lineItems are required when updating invoice pricing.")
    }

    const totals = calculateTotals(lineItems, discount, gstRate)
    updateData.line_items = lineItems
    updateData.gst_rate = Math.max(0, gstRate)
    updateData.discount = Math.max(0, discount)
    updateData.amount = totals.amount
    updateData.gst = totals.gst
    updateData.total = totals.total
  }

  if (payload.taxType === "igst" || payload.taxType === "cgst_sgst") {
    updateData.tax_type = payload.taxType
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

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from(INVOICES_TABLE)
      .select("id, client, org, quote_ref, product, amount, gst, total, status, due, color")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ invoices: invoicesStore, source: "fallback" })
    }

    const invoices = (data ?? []).map((row) => mapInvoice(row as Record<string, unknown>))
    return NextResponse.json({ invoices, source: "supabase" })
  } catch {
    return NextResponse.json({ invoices: invoicesStore, source: "fallback" })
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedRequest(request)
  if (authResult.errorResponse || !authResult.supabase || !authResult.userId) {
    return authResult.errorResponse!
  }

  try {
    const body = (await request.json()) as Partial<CreateInvoicePayload>
    const normalized = normalizeCreatePayload(body)

    const { data, error } = await authResult.supabase
      .from(INVOICES_TABLE)
      .insert({
        user_id: authResult.userId,
        client: normalized.client,
        org: normalized.org,
        quote_ref: normalized.quoteRef,
        product: normalized.product,
        amount: normalized.amount,
        gst: normalized.gst,
        total: normalized.total,
        status: normalized.status,
        due: normalized.due,
        color: normalized.color,
        gstin: normalized.gstin,
        email: normalized.email,
        gst_rate: normalized.gstRate,
        tax_type: normalized.taxType,
        discount: normalized.discount,
        payment_terms: normalized.paymentTerms,
        line_items: normalized.lineItems,
      })
      .select("id, client, org, quote_ref, product, amount, gst, total, status, due, color")
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create invoice." },
        { status: 400 },
      )
    }

    const invoice = mapInvoice(data as Record<string, unknown>)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid invoice payload."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAuthenticatedRequest(request)
  if (authResult.errorResponse || !authResult.supabase) {
    return authResult.errorResponse!
  }

  try {
    const body = (await request.json()) as UpdateInvoicePayload
    const invoiceId = readString(body.id)

    if (!invoiceId) {
      return NextResponse.json({ error: "id is required." }, { status: 400 })
    }

    const updateData = buildUpdateData(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updatable fields were provided." }, { status: 400 })
    }

    const { data, error } = await authResult.supabase
      .from(INVOICES_TABLE)
      .update(updateData)
      .eq("id", invoiceId)
      .select("id, client, org, quote_ref, product, amount, gst, total, status, due, color")
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update invoice." },
        { status: 400 },
      )
    }

    const invoice = mapInvoice(data as Record<string, unknown>)
    return NextResponse.json({ invoice })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid update payload."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

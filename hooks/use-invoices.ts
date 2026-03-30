"use client"

import { useCallback, useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabaseClient"
import type { Invoice, UpdateInvoicePayload } from "@/types/invoice"

const INVOICES_TABLE = process.env.NEXT_PUBLIC_SUPABASE_INVOICES_TABLE ?? "invoices"

function isInvoiceStatus(value: unknown): value is Invoice["status"] {
  return value === "draft" || value === "sent" || value === "paid" || value === "overdue" || value === "partial"
}

function isInvoiceProduct(value: unknown): value is Invoice["product"] {
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

function parseLineItems(value: unknown): Invoice["lineItems"] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>
      const description = readString(record.description)
      const quantity = readNumber(record.quantity, 0)
      const rate = readNumber(record.rate, 0)

      return {
        description,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        rate: Number.isFinite(rate) ? rate : 0,
      }
    })
    .filter((line) => line.description.length > 0 && line.quantity > 0)
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  const rawStatus = row.status
  const rawProduct = row.product
  const rawTaxType = row.tax_type

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
    gstin: readString(row.gstin),
    email: readString(row.email),
    gstRate: readNumber(row.gst_rate, 18),
    taxType: rawTaxType === "cgst_sgst" ? "cgst_sgst" : "igst",
    discount: readNumber(row.discount, 0),
    paymentTerms: readString(row.payment_terms),
    lineItems: parseLineItems(row.line_items),
  }
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { data, error: supabaseError } = await supabase
        .from(INVOICES_TABLE)
        .select("id, client, org, quote_ref, product, amount, gst, total, status, due, color, gstin, email, gst_rate, tax_type, discount, payment_terms, line_items")
        .order("created_at", { ascending: false })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setInvoices((data ?? []).map((row) => mapInvoice(row as Record<string, unknown>)))
    } catch {
      const response = await fetch("/api/invoices", { cache: "no-store" })
      const data = (await response.json()) as { invoices: Invoice[] }
      setInvoices(data.invoices ?? [])
      setError("Using fallback API data. Configure Supabase table access for live reads.")
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInvoice = useCallback(async (payload: UpdateInvoicePayload) => {
    const supabase = getSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token
    if (!token) {
      throw new Error("You must be logged in to update invoices.")
    }

    const response = await fetch("/api/invoices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const responseData = (await response.json()) as { error?: string }
      throw new Error(responseData.error ?? "Failed to update invoice.")
    }

    const responseData = (await response.json()) as { invoice: Invoice }
    setInvoices((current) =>
      current.map((invoice) => (invoice.id === responseData.invoice.id ? responseData.invoice : invoice)),
    )
  }, [])

  useEffect(() => {
    void loadInvoices()

    const handleInvoicesChanged = () => {
      void loadInvoices()
    }

    window.addEventListener("invoice:changed", handleInvoicesChanged)

    return () => {
      window.removeEventListener("invoice:changed", handleInvoicesChanged)
    }
  }, [loadInvoices])

  return {
    invoices,
    loading,
    error,
    setInvoices,
    refreshInvoices: loadInvoices,
    updateInvoice,
  }
}

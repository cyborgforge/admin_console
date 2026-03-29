"use client"

import { useCallback, useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabaseClient"
import type { Quotation, UpdateQuotationPayload } from "@/types/quotation"

const QUOTATIONS_TABLE = process.env.NEXT_PUBLIC_SUPABASE_QUOTATIONS_TABLE ?? "quotations"

function parseLineItems(value: unknown): Quotation["lineItems"] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      const quantity = typeof record.quantity === "number" ? record.quantity : Number(record.quantity ?? 0)
      const unitPrice = typeof record.unitPrice === "number" ? record.unitPrice : Number(record.unitPrice ?? 0)

      return {
        name,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      }
    })
    .filter((line) => line.name.length > 0 && line.quantity > 0)
}

function mapQuotation(row: Record<string, unknown>): Quotation {
  const rawStatus = row.status
  const status: Quotation["status"] =
    rawStatus === "draft" ||
    rawStatus === "sent" ||
    rawStatus === "accepted" ||
    rawStatus === "expired" ||
    rawStatus === "review"
      ? rawStatus
      : "draft"

  const parsedAmount = typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0)
  const parsedDiscount = typeof row.discount === "number" ? row.discount : Number(row.discount ?? 0)
  const lineItems = parseLineItems(row.line_items)

  return {
    id: typeof row.id === "string" && row.id ? row.id : `QT-${Date.now()}`,
    client: typeof row.client === "string" ? row.client : "New Client",
    organization: typeof row.organization === "string" ? row.organization : "New Organization",
    email: typeof row.email === "string" ? row.email : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    product: typeof row.product === "string" ? row.product : "Pharmacy Suite",
    amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    status,
    expiry: typeof row.expiry === "string" ? row.expiry : "-",
    color: typeof row.color === "string" ? row.color : "#3b82f6",
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    discount: Number.isFinite(parsedDiscount) ? parsedDiscount : 0,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    lineItems,
  }
}

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuotations = useCallback(async () => {
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { data, error: supabaseError } = await supabase
        .from(QUOTATIONS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setQuotations((data ?? []).map((row) => mapQuotation(row as Record<string, unknown>)))
    } catch {
      // Fallback keeps the page functional before the Supabase table is wired.
      const response = await fetch("/api/quotations", { cache: "no-store" })
      const data = (await response.json()) as { quotations: Quotation[] }
      setQuotations(data.quotations ?? [])
      setError("Using fallback API data. Configure Supabase table access for live reads.")
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuotation = useCallback(
    async (payload: UpdateQuotationPayload) => {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) {
        throw new Error("You must be logged in to update quotations.")
      }

      const response = await fetch("/api/quotations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to update quotation.")
      }

      const responseData = (await response.json()) as { quotation: Quotation }
      setQuotations((current) =>
        current.map((quote) => (quote.id === responseData.quotation.id ? responseData.quotation : quote)),
      )
    },
    [],
  )

  const updateQuotationStatus = useCallback(
    async (id: string, status: Quotation["status"]) => {
      await updateQuotation({ id, status })
    },
    [updateQuotation],
  )

  useEffect(() => {
    async function load() {
      await loadQuotations()
    }

    void load()

    const handleQuotationsChanged = () => {
      void load()
    }

    window.addEventListener("quotation:changed", handleQuotationsChanged)

    return () => {
      window.removeEventListener("quotation:changed", handleQuotationsChanged)
    }
  }, [loadQuotations])

  return {
    quotations,
    loading,
    error,
    setQuotations,
    refreshQuotations: loadQuotations,
    updateQuotation,
    updateQuotationStatus,
  }
}

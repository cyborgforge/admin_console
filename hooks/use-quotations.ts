"use client"

import { useCallback, useEffect, useState } from "react"

import { getSupabaseClient } from "@/lib/supabaseClient"
import type { Quotation, UpdateQuotationPayload } from "@/types/quotation"

const QUOTATIONS_TABLE = process.env.NEXT_PUBLIC_SUPABASE_QUOTATIONS_TABLE ?? "quotations"

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

  return {
    id: typeof row.id === "string" && row.id ? row.id : `QT-${Date.now()}`,
    client: typeof row.client === "string" ? row.client : "New Client",
    organization: typeof row.organization === "string" ? row.organization : "New Organization",
    product: typeof row.product === "string" ? row.product : "Pharmacy Suite",
    amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    status,
    expiry: typeof row.expiry === "string" ? row.expiry : "-",
    color: typeof row.color === "string" ? row.color : "#3b82f6",
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
        .select("id, client, organization, product, amount, status, expiry, color")
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

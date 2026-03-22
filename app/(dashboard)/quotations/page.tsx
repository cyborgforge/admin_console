"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { QuoteCard } from "@/components/quotations/quote-card"
import { QuoteFilters, type QuoteFilterStatus } from "@/components/quotations/quote-filters"
import { QuotesTable } from "@/components/quotations/quotes-table"
import { useQuotations } from "@/hooks/use-quotations"

export default function QuotationsPage() {
  const { quotations, loading, error, updateQuotation, updateQuotationStatus } = useQuotations()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<QuoteFilterStatus>("all")

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      const matchesQuery =
        quote.client.toLowerCase().includes(query.toLowerCase()) ||
        quote.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : quote.status === status
      return matchesQuery && matchesStatus
    })
  }, [quotations, query, status])

  const counts = useMemo(() => {
    return {
      all: quotations.length,
      draft: quotations.filter((quote) => quote.status === "draft").length,
      sent: quotations.filter((quote) => quote.status === "sent").length,
      accepted: quotations.filter((quote) => quote.status === "accepted").length,
      review: quotations.filter((quote) => quote.status === "review").length,
    }
  }, [quotations])

  const totalValueLabel = useMemo(() => {
    const total = quotations.reduce((sum, quote) => sum + quote.amount, 0)
    return `Rs ${total.toLocaleString("en-IN")}`
  }, [quotations])

  const handleSendToClient = async (quotationId: string) => {
    try {
      await updateQuotationStatus(quotationId, "sent")
      toast.success("Quotation sent to client.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update quotation status."
      toast.error(message)
    }
  }

  const handleSaveEdit = async (
    quotationId: string,
    payload: {
      client?: string
      organization?: string
      product?: string
      expiry?: string
      status?: "draft" | "sent" | "accepted" | "expired" | "review"
    },
  ) => {
    try {
      await updateQuotation({ id: quotationId, ...payload })
      toast.success("Quotation updated successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update quotation."
      toast.error(message)
      throw error
    }
  }

  return (
    <div className="content" id="section-quotations">
      <div className="stats">
        <QuoteCard label="Total Quotes" value={String(counts.all)} change="Live from Supabase" trend="up" />
        <QuoteCard label="Accepted" value={String(counts.accepted)} valueClassName="text-[var(--accent2)]" change="Won quotations" trend="up" />
        <QuoteCard label="Pending" value={String(counts.sent + counts.review)} valueClassName="text-[var(--warn)]" change="Awaiting response" trend="neutral" />
        <QuoteCard label="Total Value" value={totalValueLabel} valueClassName="text-[var(--accent)]" change="Computed from records" trend="up" />
      </div>

      <div className="tabs">
        <button className={`tab ${status === "all" ? "active" : ""}`} onClick={() => setStatus("all")}>All <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.all}</span></button>
        <button className={`tab ${status === "draft" ? "active" : ""}`} onClick={() => setStatus("draft")}>Draft <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.draft}</span></button>
        <button className={`tab ${status === "sent" ? "active" : ""}`} onClick={() => setStatus("sent")}>Sent <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.sent}</span></button>
        <button className={`tab ${status === "accepted" ? "active" : ""}`} onClick={() => setStatus("accepted")}>Accepted <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.accepted}</span></button>
      </div>

      <QuoteFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />

      {loading ? <div style={{ color: "var(--text3)", marginBottom: "10px" }}>Loading quotations...</div> : null}
      {error ? <div style={{ color: "var(--warn)", marginBottom: "10px" }}>{error}</div> : null}

      <div className="table-wrap">
        <QuotesTable
          quotations={filteredQuotations}
          onSendToClient={(quotationId) => handleSendToClient(quotationId)}
          onSaveEdit={(quotationId, payload) => handleSaveEdit(quotationId, payload)}
        />
      </div>
    </div>
  )
}

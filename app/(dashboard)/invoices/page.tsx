"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useInvoices } from "@/hooks/use-invoices"
import type { Invoice, InvoiceStatus } from "@/types/invoice"

const statusClassName: Record<InvoiceStatus, string> = {
  draft: "badge-draft",
  sent: "badge-sent",
  paid: "badge-accepted",
  overdue: "badge-expired",
  partial: "badge-review",
}

const statusLabel: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  partial: "Partial",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

const formatLakh = (value: number) => `₹${(value / 100000).toFixed(1)}L`

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

export default function InvoicesPage() {
  const { invoices, loading, error } = useInvoices()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all")
  const [product, setProduct] = useState<"all" | Invoice["product"]>("all")
  const [period, setPeriod] = useState("all")

  const counts = useMemo(() => {
    return {
      all: invoices.length,
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      sent: invoices.filter((invoice) => invoice.status === "sent").length,
      paid: invoices.filter((invoice) => invoice.status === "paid").length,
      overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
    }
  }, [invoices])

  const totals = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const paid = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.total, 0)
    const overdue = invoices
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.total, 0)
    const pending = invoices
      .filter((invoice) => invoice.status === "draft" || invoice.status === "sent" || invoice.status === "partial")
      .reduce((sum, invoice) => sum + invoice.total, 0)

    return { totalInvoiced, paid, overdue, pending }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchText = `${invoice.id} ${invoice.client} ${invoice.org} ${invoice.quoteRef}`.toLowerCase()
      const matchesQuery = searchText.includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : invoice.status === status
      const matchesProduct = product === "all" ? true : invoice.product === product

      return matchesQuery && matchesStatus && matchesProduct
    })
  }, [invoices, product, query, status])

  return (
    <div className="content" id="section-invoices">
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total Invoiced</div>
          <div className="stat-val" style={{ color: "var(--accent)" }}>{formatLakh(totals.totalInvoiced)}</div>
          <div className="stat-change up">↑ 18% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-val" style={{ color: "var(--accent2)" }}>{formatLakh(totals.paid)}</div>
          <div className="stat-change up">72.6% collection rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-val" style={{ color: "var(--danger)" }}>{formatLakh(totals.overdue)}</div>
          <div className="stat-change" style={{ color: "var(--danger)" }}>{counts.overdue} invoices overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-val" style={{ color: "var(--warn)" }}>{formatLakh(totals.pending)}</div>
          <div className="stat-change" style={{ color: "var(--text2)" }}>Awaiting payment</div>
        </div>
      </div>

      {loading ? <div style={{ color: "var(--text3)", marginBottom: "10px" }}>Loading invoices...</div> : null}
      {error ? <div style={{ color: "var(--warn)", marginBottom: "10px" }}>{error}</div> : null}

      <div className="tabs">
        <button className={`tab ${status === "all" ? "active" : ""}`} onClick={() => setStatus("all")}>All <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.all}</span></button>
        <button className={`tab ${status === "draft" ? "active" : ""}`} onClick={() => setStatus("draft")}>Draft <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.draft}</span></button>
        <button className={`tab ${status === "sent" ? "active" : ""}`} onClick={() => setStatus("sent")}>Sent <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.sent}</span></button>
        <button className={`tab ${status === "paid" ? "active" : ""}`} onClick={() => setStatus("paid")}>Paid <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.paid}</span></button>
        <button className={`tab ${status === "overdue" ? "active" : ""}`} onClick={() => setStatus("overdue")}>Overdue <span style={{ color: "var(--danger)", marginLeft: "4px", fontSize: "11px" }}>{counts.overdue}</span></button>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={14} color="var(--text3)" />
          <input
            placeholder="Search invoice ID, client..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className="filter-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="all">All time</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        <select className="filter-select" value={product} onChange={(event) => setProduct(event.target.value as "all" | Invoice["product"])}>
          <option value="all">All products</option>
          <option value="pharmacy">Pharmacy Suite</option>
          <option value="clinic">Clinic Suite</option>
          <option value="retail">Retail Suite</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Client</th>
              <th>Quote Ref.</th>
              <th>Amount</th>
              <th>GST</th>
              <th>Total</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  <div className="empty-icon">🧾</div>
                  <div className="empty-text">No invoices found</div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="quote-id">{invoice.id}</td>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar" style={{ backgroundColor: `${invoice.color}22`, color: invoice.color }}>
                        {getInitials(invoice.client)}
                      </div>
                      <div>
                        <div className="client-name">{invoice.client}</div>
                        <div className="client-org">{invoice.org}</div>
                      </div>
                    </div>
                  </td>
                  <td className="amount" style={{ color: "var(--accent)" }}>{invoice.quoteRef}</td>
                  <td className="amount">{formatCurrency(invoice.amount)}</td>
                  <td className="amount" style={{ color: "var(--text2)" }}>{formatCurrency(invoice.gst)}</td>
                  <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(invoice.total)}</td>
                  <td>
                    <span className={`badge ${statusClassName[invoice.status]}`}>{statusLabel[invoice.status]}</span>
                  </td>
                  <td className="quote-id">{invoice.due}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

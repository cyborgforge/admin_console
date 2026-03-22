"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial"

type Invoice = {
  id: string
  client: string
  org: string
  quoteRef: string
  product: "pharmacy" | "clinic" | "retail"
  amount: number
  gst: number
  total: number
  status: InvoiceStatus
  due: string
  color: string
}

const invoices: Invoice[] = [
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
  }, [])

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
  }, [])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchText = `${invoice.id} ${invoice.client} ${invoice.org} ${invoice.quoteRef}`.toLowerCase()
      const matchesQuery = searchText.includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : invoice.status === status
      const matchesProduct = product === "all" ? true : invoice.product === product

      return matchesQuery && matchesStatus && matchesProduct
    })
  }, [product, query, status])

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

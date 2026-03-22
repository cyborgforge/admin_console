"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Search } from "lucide-react"

type SubscriptionStatus = "active" | "expiring" | "churned"
type Plan = "starter" | "growth" | "enterprise"
type Suite = "pharmacy" | "clinic" | "retail"

type Subscription = {
  id: string
  client: string
  org: string
  suiteLabel: string
  suite: Suite
  plan: Plan
  modules: string[]
  cycle: "Monthly" | "Quarterly" | "Annual"
  mrr: number
  start: string
  renewal: string
  status: SubscriptionStatus
  color: string
}

const subscriptions: Subscription[] = [
  { id: "SUB-001", client: "Apollo Pharmacy", org: "Apollo Health", suiteLabel: "Pharmacy Suite", suite: "pharmacy", plan: "growth", modules: ["Outlet Mgmt", "POS & Billing", "Inventory", "Online Ordering", "HRMS"], cycle: "Annual", mrr: 9667, start: "Jan 1, 2024", renewal: "Dec 31, 2025", status: "active", color: "#3b82f6" },
  { id: "SUB-002", client: "Green Cross Clinic", org: "GCC Healthcare", suiteLabel: "Clinic Suite", suite: "clinic", plan: "starter", modules: ["EMR", "Appointments", "Billing"], cycle: "Monthly", mrr: 3500, start: "Feb 15, 2024", renewal: "Apr 25, 2025", status: "expiring", color: "#10b981" },
  { id: "SUB-003", client: "MedPlus Pharma", org: "MedPlus Pvt Ltd", suiteLabel: "Pharmacy Suite", suite: "pharmacy", plan: "growth", modules: ["POS & Billing", "Inventory", "Online Ordering", "Delivery App"], cycle: "Annual", mrr: 7250, start: "Mar 1, 2024", renewal: "Feb 28, 2026", status: "active", color: "#8b5cf6" },
  { id: "SUB-004", client: "City Hospital", org: "City Health Group", suiteLabel: "Clinic Suite", suite: "clinic", plan: "enterprise", modules: ["EMR", "Appointments", "Billing", "Digital Prescription", "Lab Integration"], cycle: "Annual", mrr: 14500, start: "Apr 10, 2024", renewal: "Apr 9, 2026", status: "active", color: "#f59e0b" },
  { id: "SUB-005", client: "Wellness First", org: "WF Pharma", suiteLabel: "Pharmacy Suite", suite: "pharmacy", plan: "starter", modules: ["POS & Billing", "Inventory"], cycle: "Monthly", mrr: 2800, start: "Sep 1, 2023", renewal: "Apr 1, 2025", status: "expiring", color: "#6b7280" },
  { id: "SUB-006", client: "Lifeline Hospital", org: "Lifeline Trust", suiteLabel: "Clinic Suite", suite: "clinic", plan: "growth", modules: ["EMR", "Appointments", "Billing", "Teleconsultation"], cycle: "Quarterly", mrr: 6100, start: "Feb 1, 2024", renewal: "Apr 30, 2025", status: "expiring", color: "#10b981" },
  { id: "SUB-007", client: "Quick Mart", org: "Quick Retail Chain", suiteLabel: "Retail Suite", suite: "retail", plan: "growth", modules: ["POS & Billing", "Inventory", "Online Ordering"], cycle: "Annual", mrr: 5400, start: "Jan 15, 2025", renewal: "Jan 14, 2026", status: "active", color: "#f59e0b" },
  { id: "SUB-008", client: "Apollo Pharmacy", org: "Apollo Health", suiteLabel: "Pharmacy Suite", suite: "pharmacy", plan: "growth", modules: ["Analytics Dashboard", "Loyalty Program"], cycle: "Monthly", mrr: 1500, start: "Mar 1, 2024", renewal: "Apr 1, 2025", status: "expiring", color: "#3b82f6" },
  { id: "SUB-009", client: "MedPlus Pharma", org: "MedPlus Pvt Ltd", suiteLabel: "Pharmacy Suite", suite: "pharmacy", plan: "starter", modules: ["Vendor Management", "Modern Website"], cycle: "Annual", mrr: 1800, start: "Jun 1, 2023", renewal: "Feb 1, 2025", status: "churned", color: "#8b5cf6" },
  { id: "SUB-010", client: "City Hospital", org: "City Health Group", suiteLabel: "Clinic Suite", suite: "clinic", plan: "growth", modules: ["In-house Pharmacy", "Billing"], cycle: "Annual", mrr: 3200, start: "Jan 1, 2023", renewal: "Dec 31, 2023", status: "churned", color: "#f59e0b" },
]

const statusBadgeClass: Record<SubscriptionStatus, string> = {
  active: "badge-accepted",
  expiring: "badge-expiring",
  churned: "badge-churned",
}

const statusLabel: Record<SubscriptionStatus, string> = {
  active: "Active",
  expiring: "Expiring",
  churned: "Churned",
}

const planClass: Record<Plan, string> = {
  starter: "plan-starter",
  growth: "plan-growth",
  enterprise: "plan-enterprise",
}

const planLabel: Record<Plan, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

export default function SubscriptionsPage() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | SubscriptionStatus>("all")
  const [suite, setSuite] = useState<"all" | Suite>("all")
  const [plan, setPlan] = useState<"all" | Plan>("all")

  const counts = useMemo(() => {
    return {
      all: subscriptions.length,
      active: subscriptions.filter((item) => item.status === "active").length,
      expiring: subscriptions.filter((item) => item.status === "expiring").length,
      churned: subscriptions.filter((item) => item.status === "churned").length,
    }
  }, [])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((item) => {
      const searchText = `${item.client} ${item.org} ${item.id} ${item.modules.join(" ")}`.toLowerCase()
      const matchesQuery = searchText.includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : item.status === status
      const matchesSuite = suite === "all" ? true : item.suite === suite
      const matchesPlan = plan === "all" ? true : item.plan === plan
      return matchesQuery && matchesStatus && matchesSuite && matchesPlan
    })
  }, [plan, query, status, suite])

  return (
    <div className="content" id="section-subscriptions">
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Active Subs</div>
          <div className="stat-val" style={{ color: "var(--accent2)" }}>18</div>
          <div className="stat-change up">Across 14 clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MRR</div>
          <div className="stat-val" style={{ color: "var(--accent)" }}>₹2.4L</div>
          <div className="stat-change up">↑ 8% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-val" style={{ color: "var(--warn)" }}>{counts.expiring}</div>
          <div className="stat-change" style={{ color: "var(--text2)" }}>Within 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Churned</div>
          <div className="stat-val" style={{ color: "var(--danger)" }}>{counts.churned}</div>
          <div className="stat-change" style={{ color: "var(--danger)" }}>This quarter</div>
        </div>
      </div>

      <div
        style={{
          marginBottom: "16px",
          padding: "10px 14px",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "10px",
          background: "rgba(245, 158, 11, 0.12)",
          color: "var(--warn)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500 }}>
          <AlertCircle size={14} />
          {counts.expiring} subscriptions expire within 30 days - send renewal quotes now
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{
            borderColor: "#8f5f08",
            borderWidth: "1px",
            borderStyle: "solid",
            color: "#f59e0b",
            borderRadius: "var(--radius-sm)",
            background: "#2b200c",
            padding: "7px 14px",
            fontSize: "13px",
            fontWeight: 600,
            lineHeight: 1,
          }}
          onClick={() => {
            setStatus("expiring")
            setSuite("all")
            setPlan("all")
            setQuery("")
          }}
        >
          View expiring
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${status === "all" ? "active" : ""}`} onClick={() => setStatus("all")}>All <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.all}</span></button>
        <button className={`tab ${status === "active" ? "active" : ""}`} onClick={() => setStatus("active")}>Active <span style={{ color: "var(--text3)", marginLeft: "4px", fontSize: "11px" }}>{counts.active}</span></button>
        <button className={`tab ${status === "expiring" ? "active" : ""}`} onClick={() => setStatus("expiring")}>Expiring <span style={{ color: "var(--warn)", marginLeft: "4px", fontSize: "11px" }}>{counts.expiring}</span></button>
        <button className={`tab ${status === "churned" ? "active" : ""}`} onClick={() => setStatus("churned")}>Churned <span style={{ color: "var(--danger)", marginLeft: "4px", fontSize: "11px" }}>{counts.churned}</span></button>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={14} color="var(--text3)" />
          <input
            placeholder="Search client or module..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className="filter-select" value={suite} onChange={(event) => setSuite(event.target.value as "all" | Suite)}>
          <option value="all">All suites</option>
          <option value="pharmacy">Pharmacy Suite</option>
          <option value="clinic">Clinic Suite</option>
          <option value="retail">Retail Suite</option>
        </select>
        <select className="filter-select" value={plan} onChange={(event) => setPlan(event.target.value as "all" | Plan)}>
          <option value="all">All plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Suite &amp; Plan</th>
              <th>Active Modules</th>
              <th>Billing Cycle</th>
              <th>MRR</th>
              <th>Start Date</th>
              <th>Renewal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  <div className="empty-icon">🔁</div>
                  <div className="empty-text">No subscriptions found</div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar" style={{ backgroundColor: `${item.color}22`, color: item.color }}>
                        {getInitials(item.client)}
                      </div>
                      <div>
                        <div className="client-name">{item.client}</div>
                        <div className="client-org">{item.org}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="client-name">{item.suiteLabel}</div>
                    <div style={{ marginTop: "4px" }}>
                      <span className={planClass[item.plan]}>{planLabel[item.plan]}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "220px" }}>
                      {item.modules.map((module) => (
                        <span
                          key={`${item.id}-${module}`}
                          style={{
                            fontSize: "11px",
                            color: "var(--text2)",
                            border: "1px solid var(--border2)",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontFamily: "var(--mono)",
                            background: "var(--surface2)",
                          }}
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="quote-id">{item.cycle}</td>
                  <td className="amount" style={{ color: "var(--accent2)" }}>{formatCurrency(item.mrr)}<span style={{ fontSize: "11px", color: "var(--text3)", marginLeft: "2px" }}>/mo</span></td>
                  <td className="quote-id">{item.start}</td>
                  <td className="quote-id" style={item.status === "expiring" ? { color: "var(--warn)", fontWeight: 600 } : undefined}>{item.renewal}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass[item.status]}`}>{statusLabel[item.status]}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

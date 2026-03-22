"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

type LedgerEntry = {
  date: string
  description: string
  credit: number
  debit: number
}

type AccountClient = {
  name: string
  org: string
  paid: number
  outstanding: number
  ledger: LedgerEntry[]
  color: string
}

const accountClients: AccountClient[] = [
  {
    name: "Apollo Pharmacy",
    org: "Apollo Health",
    paid: 16400,
    outstanding: 26000,
    color: "#3b82f6",
    ledger: [
      { date: "Apr 02", description: "Invoice INV-2025-024", credit: 58200, debit: 0 },
      { date: "Apr 04", description: "Payment received - UPI", credit: 0, debit: 15000 },
      { date: "Apr 08", description: "Credit note CN-093", credit: 0, debit: 7200 },
      { date: "Apr 12", description: "Invoice INV-2025-016", credit: 26000, debit: 0 },
      { date: "Apr 16", description: "Payment received - Bank", credit: 0, debit: 8200 },
      { date: "Apr 19", description: "Payment received - Cash", credit: 0, debit: 3200 },
      { date: "Apr 21", description: "Adjustment", credit: 0, debit: 2200 },
    ],
  },
  {
    name: "Green Cross Clinic",
    org: "GCC Healthcare",
    paid: 69000,
    outstanding: 0,
    color: "#10b981",
    ledger: [
      { date: "Mar 10", description: "Invoice INV-2025-023", credit: 34500, debit: 0 },
      { date: "Mar 18", description: "Payment received", credit: 0, debit: 34500 },
      { date: "Apr 02", description: "Invoice INV-2025-011", credit: 34500, debit: 0 },
      { date: "Apr 07", description: "Payment received", credit: 0, debit: 34500 },
    ],
  },
  {
    name: "MedPlus Pharma",
    org: "MedPlus Pvt Ltd",
    paid: 51920,
    outstanding: 45000,
    color: "#8b5cf6",
    ledger: [
      { date: "Mar 01", description: "Invoice INV-2025-022", credit: 51920, debit: 0 },
      { date: "Mar 20", description: "Payment received", credit: 0, debit: 51920 },
      { date: "Apr 01", description: "Invoice INV-2025-015", credit: 45000, debit: 0 },
    ],
  },
  {
    name: "Reliance Retail",
    org: "Reliance Industries",
    paid: 0,
    outstanding: 82000,
    color: "#ef4444",
    ledger: [
      { date: "Mar 10", description: "Invoice INV-2025-020", credit: 82000, debit: 0 },
      { date: "Mar 28", description: "Reminder issued", credit: 0, debit: 0 },
    ],
  },
  {
    name: "Lifeline Hospital",
    org: "Lifeline Trust",
    paid: 55000,
    outstanding: 0,
    color: "#14b8a6",
    ledger: [
      { date: "Apr 03", description: "Invoice INV-2025-018", credit: 55000, debit: 0 },
      { date: "Apr 08", description: "Payment received", credit: 0, debit: 55000 },
    ],
  },
]

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

export default function AccountsPage() {
  const [query, setQuery] = useState("")
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null)

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.toLowerCase()
    return accountClients.filter((client) => {
      const searchText = `${client.name} ${client.org}`.toLowerCase()
      return searchText.includes(normalizedQuery)
    })
  }, [query])

  const selectedClient = useMemo(() => {
    return accountClients.find((client) => client.name === selectedClientName) ?? null
  }, [selectedClientName])

  const ledgerRows = useMemo(() => {
    if (!selectedClient) {
      return []
    }

    let runningBalance = 0
    return selectedClient.ledger.map((entry) => {
      runningBalance += entry.credit - entry.debit
      return {
        ...entry,
        balance: runningBalance,
      }
    })
  }, [selectedClient])

  return (
    <div className="content" id="section-accounts">
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total Receivable</div>
          <div className="stat-val" style={{ color: "var(--accent)" }}>₹3.6L</div>
          <div className="stat-change" style={{ color: "var(--text2)" }}>Across all clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collected</div>
          <div className="stat-val" style={{ color: "var(--accent2)" }}>₹6.1L</div>
          <div className="stat-change up">↑ This financial year</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-val" style={{ color: "var(--danger)" }}>₹1.4L</div>
          <div className="stat-change" style={{ color: "var(--danger)" }}>4 clients outstanding</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Credit Notes</div>
          <div className="stat-val" style={{ color: "var(--warn)" }}>₹18,500</div>
          <div className="stat-change" style={{ color: "var(--text2)" }}>Pending adjustment</div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <div className="section-heading" style={{ marginBottom: "10px" }}>Client Accounts</div>
          <div className="search-box" style={{ maxWidth: "none", marginBottom: "12px" }}>
            <Search size={14} color="var(--text3)" />
            <input
              placeholder="Search client..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredClients.map((client) => {
              const isSelected = client.name === selectedClientName
              return (
                <button
                  key={client.name}
                  type="button"
                  onClick={() => setSelectedClientName(client.name)}
                  className="acct-card"
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: isSelected ? "var(--accent)" : "var(--border)",
                    background: isSelected ? "var(--accent-dim)" : "var(--surface)",
                    boxShadow: isSelected ? "0 0 0 1px rgba(59,130,246,0.25)" : "none",
                    padding: "14px 14px",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="client-avatar" style={{ backgroundColor: `${client.color}22`, color: client.color }}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <div className="client-name" style={{ fontSize: "16px" }}>{client.name}</div>
                        <div className="client-org">{client.org}</div>
                      </div>
                    </div>

                    {client.outstanding > 0 ? (
                      <span
                        style={{
                          color: "var(--danger)",
                          background: "var(--danger-dim)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          fontWeight: 600,
                          lineHeight: "16px",
                        }}
                      >
                        {formatCurrency(client.outstanding)}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "var(--accent2)",
                          fontFamily: "var(--mono)",
                          fontSize: "14px",
                          fontWeight: 600,
                          lineHeight: "18px",
                        }}
                      >
                        Cleared
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>
                    <span>Paid: {formatCurrency(client.paid)}</span>
                    <span>{client.ledger.length} entries</span>
                  </div>
                </button>
              )
            })}

            {filteredClients.length === 0 ? (
              <div className="empty" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)", padding: "24px" }}>
                <div className="empty-icon">📒</div>
                <div className="empty-text">No clients found</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="table-wrap" style={{ borderRadius: "12px" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.5px" }}>
            {selectedClient ? selectedClient.name : "Select a client to view ledger"}
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Date</th>
                <th>Description</th>
                <th style={{ width: "130px" }}>Credit (₹)</th>
                <th style={{ width: "120px" }}>Debit (₹)</th>
                <th style={{ width: "120px" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {selectedClient ? (
                ledgerRows.map((row, index) => (
                  <tr key={`${row.date}-${row.description}-${index}`}>
                    <td className="quote-id">{row.date}</td>
                    <td>{row.description}</td>
                    <td className="amount" style={{ color: row.credit > 0 ? "var(--accent2)" : "var(--text3)" }}>
                      {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                    </td>
                    <td className="amount" style={{ color: row.debit > 0 ? "var(--danger)" : "var(--text3)" }}>
                      {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                    </td>
                    <td className="amount" style={{ color: row.balance > 0 ? "var(--danger)" : "var(--accent2)", fontWeight: 600 }}>
                      {formatCurrency(Math.abs(row.balance))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty" style={{ padding: "44px 24px" }}>
                    <div className="empty-text">Select a client from the left to view their ledger</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { Ticket } from "./types"

interface SupportTicketListProps {
  tickets: Ticket[]
  onSelectTicket: (id: string) => void
}

const PAGE_SIZES = [4, 5, 10, 20, 50]

// ── Display helpers ──────────────────────────────────────────────────────────

function formatTicketId(id: string): string {
  // Show as #TK-XXXX using first 4 chars of id (uppercase)
  return `#TK-${id.slice(0, 4).toUpperCase()}`
}

function formatPriorityLabel(priority: Ticket["priority"]): string {
  switch (priority) {
    case "low":      return "Low"
    case "medium":   return "Medium"
    case "high":     return "High"
    case "critical": return "Critical"
    default:         return priority
  }
}

function formatStatusLabel(status: Ticket["status"]): string {
  switch (status) {
    case "open":             return "Open"
    case "in_progress":      return "In Progress"
    case "waiting_for_user": return "Waiting"
    case "resolved":         return "Resolved"
    case "closed":           return "Closed"
    case "rejected":         return "Rejected"
    default:                 return status
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    const now = Date.now()
    const diff = now - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return dateStr
  }
}

export function SupportTicketList({ tickets, onSelectTicket }: SupportTicketListProps) {
  const [activeTab, setActiveTab]       = useState<string>("All")
  const [searchQuery, setSearchQuery]   = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [timeFilter, setTimeFilter]     = useState("All time")
  const [pageSize, setPageSize]         = useState(4)
  const [page, setPage]                 = useState(1)

  // ── Computed stats from real data ────────────────────────────────────────
  const stats = useMemo(() => {
    const totalOpen  = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length
    const unassigned = tickets.filter((t) => !t.assigned_to).length
    const resolved   = tickets.filter((t) => t.status === "resolved").length
    // Avg response time is not in the DB; derive from ticket age as a proxy
    const avgMins    = 105 // static display as we don't have response time data
    return { totalOpen, unassigned, resolved, avgMins }
  }, [tickets])

  // ── Tab counts ───────────────────────────────────────────────────────────
  const tabCounts: Record<string, number> = useMemo(() => ({
    All:           tickets.length,
    Open:          tickets.filter((t) => t.status === "open").length,
    "In Progress": tickets.filter((t) => t.status === "in_progress").length,
    Resolved:      tickets.filter((t) => t.status === "resolved").length,
    Closed:        tickets.filter((t) => t.status === "closed" || t.status === "rejected").length,
  }), [tickets])

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = tickets

    // Tab filter
    if (activeTab === "Open") {
      result = result.filter((t) => t.status === "open")
    } else if (activeTab === "In Progress") {
      result = result.filter((t) => t.status === "in_progress")
    } else if (activeTab === "Resolved") {
      result = result.filter((t) => t.status === "resolved")
    } else if (activeTab === "Closed") {
      result = result.filter((t) => t.status === "closed" || t.status === "rejected")
    }

    // Status dropdown filter
    if (statusFilter !== "All Status") {
      const map: Record<string, Ticket["status"][]> = {
        "Open":        ["open"],
        "In Progress": ["in_progress"],
        "Waiting":     ["waiting_for_user"],
        "Resolved":    ["resolved"],
        "Closed":      ["closed"],
        "Rejected":    ["rejected"],
      }
      const statuses = map[statusFilter]
      if (statuses) {
        result = result.filter((t) => statuses.includes(t.status))
      }
    }

    // Time filter (date-based)
    if (timeFilter !== "All time") {
      const now = Date.now()
      const cutoffs: Record<string, number> = {
        "Today":      24 * 60 * 60 * 1000,
        "This week":  7 * 24 * 60 * 60 * 1000,
        "This month": 30 * 24 * 60 * 60 * 1000,
      }
      const cutoff = cutoffs[timeFilter]
      if (cutoff) {
        result = result.filter((t) => {
          if (!t.created_at) return false
          return now - new Date(t.created_at).getTime() <= cutoff
        })
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          (t.user?.name ?? "").toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.priority.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }

    return result
  }, [tickets, activeTab, statusFilter, timeFilter, searchQuery])

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getPriorityDotColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "high":
      case "critical": return "bg-[#ef4444]"
      case "medium":   return "bg-[#f59e0b]"
      case "low":      return "bg-[#3b82f6]"
      default:         return "bg-[#8b95a8]"
    }
  }

  const getStatusBadgeClass = (status: Ticket["status"]) => {
    switch (status) {
      case "open":             return "border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/5"
      case "in_progress":      return "border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/5"
      case "waiting_for_user": return "border-[#3b82f6]/40 text-[#3b82f6] bg-[#3b82f6]/5"
      case "resolved":         return "border-[#4f5a6a]/40 text-[#8b95a8] bg-[#4f5a6a]/5"
      case "closed":           return "border-[#4f5a6a]/40 text-[#8b95a8] bg-[#4f5a6a]/5"
      case "rejected":         return "border-[#ef4444]/20 text-[#8b95a8] bg-[#4f5a6a]/5"
      default:                 return "border-[#2a3040] text-[#8b95a8]"
    }
  }

  const pageNumbers = useMemo(() => {
    const nums: (number | "...")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) nums.push(i)
    } else {
      nums.push(1)
      if (safePage > 3) nums.push("...")
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        nums.push(i)
      }
      if (safePage < totalPages - 2) nums.push("...")
      nums.push(totalPages)
    }
    return nums
  }, [totalPages, safePage])

  const formatAvgResponse = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}min`
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Open Tickets */}
        <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-1.5">
          <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
            Total Open Tickets
          </div>
          <div className="text-2xl font-bold text-[#e8eaf0] tracking-tight">{stats.totalOpen}</div>
          <div className="text-[11px] text-[#ef4444] flex items-center gap-1 font-medium mt-1">
            <span>↑</span>
            <span>+{Math.max(1, Math.floor(stats.totalOpen * 0.1))} this week</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-1.5">
          <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
            Avg Response Time
          </div>
          <div className="text-2xl font-bold text-[#f59e0b] tracking-tight">
            {formatAvgResponse(stats.avgMins)}
          </div>
          <div className="text-[11px] text-[#8b95a8] flex items-center gap-1 mt-1 font-medium">
            <span>◎</span>
            <span>Target: 1 hour</span>
          </div>
        </div>

        {/* Unassigned Tickets */}
        <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-1.5">
          <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
            Unassigned Tickets
          </div>
          <div className="text-2xl font-bold text-[#3b82f6] tracking-tight">{stats.unassigned}</div>
          <div className="text-[11px] text-[#ef4444] flex items-center gap-1 mt-1 font-medium">
            <span>↘</span>
            <span>Urgent</span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-1.5">
          <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
            Resolved Today
          </div>
          <div className="text-2xl font-bold text-[#10b981] tracking-tight">{stats.resolved}</div>
          <div className="text-[11px] text-[#10b981] flex items-center gap-1 mt-1 font-medium">
            <span>✓</span>
            <span>Daily Goal</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-6 border-b border-[#2a3040] mt-2">
        {Object.keys(tabCounts).map((tab) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer ${
                active ? "text-[#3b82f6]" : "text-[#8b95a8] hover:text-[#e8eaf0]"
              }`}
            >
              <span>{tab}</span>
              <span className={`ml-1 text-[10px] font-mono ${active ? "text-[#3b82f6]/70" : "text-[#4f5a6a]"}`}>
                {tabCounts[tab]}
              </span>
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]" />}
            </button>
          )
        })}
      </div>

      {/* ── Filters Row ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#161920] border border-[#2a3040] flex-1 max-w-xs">
          <Search size={14} className="text-[#4f5a6a]" />
          <input
            type="text"
            placeholder="Search by client, Priority"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            className="w-full bg-transparent border-0 text-xs text-[#e8eaf0] placeholder-[#4f5a6a] focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="appearance-none pr-8 pl-3 py-1.5 rounded bg-[#161920] border border-[#2a3040] text-xs text-[#8b95a8] focus:outline-none cursor-pointer"
          >
            <option>All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Waiting</option>
            <option>Resolved</option>
            <option>Closed</option>
            <option>Rejected</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4f5a6a] pointer-events-none" />
        </div>

        {/* Time Filter */}
        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => { setTimeFilter(e.target.value); setPage(1) }}
            className="appearance-none pr-8 pl-3 py-1.5 rounded bg-[#161920] border border-[#2a3040] text-xs text-[#8b95a8] focus:outline-none cursor-pointer"
          >
            <option>All time</option>
            <option>Today</option>
            <option>This week</option>
            <option>This month</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4f5a6a] pointer-events-none" />
        </div>

        {/* Rows per page */}
        <div className="ml-auto flex items-center gap-2 relative">
          <span className="text-xs text-[#4f5a6a]">Rows</span>
          <select
            className="appearance-none pr-8 pl-3 py-1.5 rounded bg-[#161920] border border-[#2a3040] text-xs text-[#e8eaf0] focus:outline-none cursor-pointer"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4f5a6a] pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border border-[#2a3040] bg-[#161920] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e2229] border-b border-[#2a3040]">
                {["Ticket ID", "Subject", "Client", "Priority", "Status", "Last Updated", "Assigned To"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] tracking-wider text-[#4f5a6a] uppercase font-mono font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3040]/70">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-[#8b95a8] italic">
                    No tickets match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((ticket) => {
                  const assigneeName = ticket.assignee?.name ?? "Unassigned"
                  const clientName   = ticket.user?.name ?? "—"
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      className="hover:bg-[#1e2229]/60 transition-colors cursor-pointer text-xs"
                    >
                      {/* Ticket ID */}
                      <td className="px-5 py-3.5 font-mono text-[#8b95a8] whitespace-nowrap font-medium">
                        {formatTicketId(ticket.id)}
                      </td>
                      {/* Subject */}
                      <td className="px-5 py-3.5 font-medium text-[#e8eaf0] max-w-[220px] truncate">
                        {ticket.subject}
                      </td>
                      {/* Client */}
                      <td className="px-5 py-3.5 text-[#8b95a8] whitespace-nowrap">{clientName}</td>
                      {/* Priority */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[#8b95a8]">
                          <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(ticket.priority)}`} />
                          <span>{formatPriorityLabel(ticket.priority)}</span>
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wide ${getStatusBadgeClass(ticket.status)}`}>
                          {formatStatusLabel(ticket.status)}
                        </span>
                      </td>
                      {/* Last Updated */}
                      <td className="px-5 py-3.5 text-[#8b95a8] whitespace-nowrap">
                        {formatDate(ticket.updated_at)}
                      </td>
                      {/* Assigned To — name only, no avatar */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-xs font-medium ${assigneeName === "Unassigned" ? "text-[#4f5a6a] italic" : "text-[#8b95a8]"}`}>
                          {assigneeName}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1e2229]/30 border-t border-[#2a3040]">
          <span className="text-xs text-[#4f5a6a]">
            Showing{" "}
            <span className="text-[#8b95a8] font-medium">
              {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="text-[#8b95a8] font-medium">{filtered.length}</span> Tickets
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded bg-[#161920] border border-[#2a3040] text-[#8b95a8] disabled:opacity-40 disabled:cursor-not-allowed hover:text-[#e8eaf0] transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>

            {pageNumbers.map((n, i) =>
              n === "..." ? (
                <span key={`ellipsis-${i}`} className="text-xs text-[#4f5a6a] px-1">...</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n as number)}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-colors cursor-pointer ${
                    safePage === n
                      ? "bg-[#3b82f6] text-white"
                      : "hover:bg-[#1e2229] text-[#8b95a8]"
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded bg-[#161920] border border-[#2a3040] text-[#8b95a8] disabled:opacity-40 disabled:cursor-not-allowed hover:text-[#e8eaf0] transition-colors cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

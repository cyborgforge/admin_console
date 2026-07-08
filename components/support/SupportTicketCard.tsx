"use client"

import type { Ticket } from "./types"

interface SupportTicketCardProps {
  ticket: Ticket
  onClick?: () => void
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
    const diff = Date.now() - d.getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch {
    return dateStr
  }
}

export function SupportTicketCard({ ticket, onClick }: SupportTicketCardProps) {
  const getPriorityDotColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "critical":
      case "high":   return "bg-[#ef4444]"
      case "medium": return "bg-[#f59e0b]"
      case "low":    return "bg-[#3b82f6]"
      default:       return "bg-[#8b95a8]"
    }
  }

  const getStatusClass = (status: Ticket["status"]) => {
    switch (status) {
      case "open":             return "border-[#ef4444] text-[#ef4444]"
      case "in_progress":      return "border-[#f59e0b] text-[#f59e0b]"
      case "waiting_for_user": return "border-[#3b82f6] text-[#3b82f6]"
      case "resolved":         return "border-[#4f5a6a] text-[#8b95a8]"
      case "closed":           return "border-[#4f5a6a] text-[#8b95a8]"
      case "rejected":         return "border-[#4f5a6a] text-[#8b95a8]"
      default:                 return "border-[#2a3040] text-[#8b95a8]"
    }
  }

  const clientName = ticket.user?.name ?? "—"

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border border-[#2a3040] bg-[#161920] hover:bg-[#1e2229] transition-all cursor-pointer flex flex-col gap-3"
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-[#8b95a8]">
          {ticket.id.slice(0, 8)}…
        </span>
        <span className="text-[11px] text-[#4f5a6a]">
          {formatDate(ticket.updated_at)}
        </span>
      </div>

      <div className="text-sm font-semibold text-[#e8eaf0] line-clamp-1">
        {ticket.subject}
      </div>

      <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2a3040]/50">
        <span className="text-[#8b95a8]">{clientName}</span>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-[#8b95a8]">
            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(ticket.priority)}`} />
            {formatPriorityLabel(ticket.priority)}
          </span>

          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wide uppercase ${getStatusClass(ticket.status)}`}>
            {formatStatusLabel(ticket.status)}
          </span>
        </div>
      </div>
    </div>
  )
}

"use client"

import type { Ticket } from "./types"

interface SupportTicketHeaderProps {
  ticket: Ticket
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

function formatTicketId(id: string): string {
  return `#TK-${id.slice(0, 4).toUpperCase()}`
}

export function SupportTicketHeader({ ticket }: SupportTicketHeaderProps) {
  const getPriorityBadgeClass = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "critical":
      case "high":   return "bg-[#ef4444] text-white"
      case "medium": return "bg-[#f59e0b] text-[#0d0f12]"
      case "low":    return "bg-[#3b82f6] text-white"
      default:       return "bg-[#4f5a6a] text-[#e8eaf0]"
    }
  }

  const clientName = ticket.user?.name ?? "Unknown Client"

  return (
    <div className="flex flex-col gap-2 pb-5 border-b border-[#2a3040] mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold font-mono text-[#e8eaf0] tracking-tight">
          {formatTicketId(ticket.id)}
        </h1>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${getPriorityBadgeClass(ticket.priority)}`}>
          {formatPriorityLabel(ticket.priority)} Priority
        </span>
      </div>
     <p className="text-sm text-[#8b95a8]">
  {ticket.subject}
  <span className="mx-1.5 text-[#4f5a6a]">•</span>
  <span className="text-[#e8eaf0] font-medium">{clientName}</span>
</p>

{ticket.problem_statement && (
  <p className="mt-2 max-w-3xl text-sm font-black leading-6 text-[#8b95a8] whitespace-pre-wrap">
    {ticket.problem_statement}
  </p>
)}
    </div>
  )
}

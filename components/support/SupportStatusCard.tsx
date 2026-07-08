"use client"

import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import type { Ticket } from "./types"

interface SupportStatusCardProps {
  ticket: Ticket
  onStatusChange?: (status: Ticket["status"]) => Promise<void> | void
}

const STATUS_OPTIONS: { label: string; value: Ticket["status"] }[] = [
  { label: "Open",        value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Waiting",     value: "waiting_for_user" },
  { label: "Resolved",    value: "resolved" },
  { label: "Closed",      value: "closed" },
  { label: "Rejected",    value: "rejected" },
]

function formatPriorityLabel(priority: Ticket["priority"]): string {
  switch (priority) {
    case "low":      return "Low"
    case "medium":   return "Medium"
    case "high":     return "High"
    case "critical": return "Critical"
    default:         return priority
  }
}

function formatCategoryLabel(category: Ticket["category"]): string {
  switch (category) {
    case "technical":      return "Technical"
    case "bug":            return "Bug"
    case "feature_request": return "Feature Request"
    case "billing":        return "Billing & Invoice"
    case "account":        return "Account"
    case "onboarding":     return "Onboarding"
    case "other":          return "Other"
    default:               return category
  }
}

/**
 * Compute a rough SLA deadline based on priority.
 * Returns remaining time as a human-readable string, or null if no SLA applies.
 */
function computeSlaDeadline(ticket: Ticket): { label: string; isUrgent: boolean } | null {
  if (ticket.status === "resolved" || ticket.status === "closed" || ticket.status === "rejected") {
    return null
  }

  const createdAt = ticket.created_at ? new Date(ticket.created_at).getTime() : null
  if (!createdAt) return null

  // SLA hours by priority
  const slaHours: Record<Ticket["priority"], number> = {
    critical: 4,
    high:     8,
    medium:   24,
    low:      72,
  }

  const slaDurationMs = slaHours[ticket.priority] * 60 * 60 * 1000
  const deadlineMs    = createdAt + slaDurationMs
  const remainingMs   = deadlineMs - Date.now()

  if (remainingMs <= 0) {
    return { label: "Overdue", isUrgent: true }
  }

  const remainingMins  = Math.floor(remainingMs / 60000)
  const remainingHours = Math.floor(remainingMins / 60)
  const leftMins       = remainingMins % 60

  if (remainingHours === 0) {
    return { label: `${remainingMins}m left`, isUrgent: true }
  }

  const isUrgent = remainingHours < 2
  const label    = leftMins > 0 ? `${remainingHours}h ${leftMins}m left` : `${remainingHours}h left`
  return { label, isUrgent }
}

export function SupportStatusCard({ ticket, onStatusChange }: SupportStatusCardProps) {
  const [saving, setSaving] = useState(false)

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "critical":
      case "high":   return "text-[#ef4444]"
      case "medium": return "text-[#f59e0b]"
      case "low":    return "text-[#3b82f6]"
      default:       return "text-[#8b95a8]"
    }
  }

  const getStatusBadgeClass = (status: Ticket["status"]) => {
    switch (status) {
      case "open":             return "bg-[#e8eaf0] text-[#0d0f12]"
      case "in_progress":      return "bg-[#f59e0b] text-[#0d0f12]"
      case "waiting_for_user": return "bg-[#3b82f6] text-white"
      case "resolved":         return "bg-[#10b981] text-white"
      case "closed":           return "bg-[#252b34] text-[#8b95a8]"
      case "rejected":         return "bg-[#252b34] text-[#8b95a8]"
      default:                 return "bg-[#1e2229] text-[#e8eaf0]"
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Ticket["status"]
    if (!onStatusChange || newStatus === ticket.status) return
    setSaving(true)
    try {
      await onStatusChange(newStatus)
    } finally {
      setSaving(false)
    }
  }

  const sla = computeSlaDeadline(ticket)

  return (
    <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-4">
      <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
        Ticket Intelligence
      </div>

      <div className="flex flex-col gap-3.5 text-xs">
        {/* Current Status — editable dropdown */}
        <div className="flex justify-between items-center">
          <span className="text-[#8b95a8]">Current Status</span>
          <div className="relative flex items-center gap-1.5">
            {saving && <Loader2 size={11} className="animate-spin text-[#8b95a8]" />}
            <div className="relative">
              <select
                value={ticket.status}
                onChange={(e) => void handleStatusChange(e)}
                disabled={saving}
                className={`
                  appearance-none pl-2 pr-6 py-0.5 rounded font-semibold text-[10px] tracking-wide uppercase
                  border-0 focus:outline-none cursor-pointer disabled:cursor-not-allowed
                  ${getStatusBadgeClass(ticket.status)}
                `}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="flex justify-between items-center">
          <span className="text-[#8b95a8]">Priority</span>
          <span className={`font-semibold flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
            <span>❗</span>
            <span>{formatPriorityLabel(ticket.priority)} Priority</span>
          </span>
        </div>

        {/* Ticket Category */}
        <div className="flex justify-between items-center">
          <span className="text-[#8b95a8]">Ticket Category</span>
          <span className="text-[#e8eaf0] font-medium">{formatCategoryLabel(ticket.category)}</span>
        </div>

        {/* SLA Deadline */}
        {sla && (
          <div className="flex justify-between items-center">
            <span className="text-[#8b95a8]">SLA Deadline</span>
            <span className={`font-semibold text-[11px] ${sla.isUrgent ? "text-[#ef4444]" : "text-[#f59e0b]"}`}>
              {sla.label}
            </span>
          </div>
        )}

        {/* Resolved At — show when resolved */}
        {ticket.resolved_at && (
          <div className="flex justify-between items-center">
            <span className="text-[#8b95a8]">Resolved At</span>
            <span className="text-[#10b981] font-medium">
              {new Date(ticket.resolved_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

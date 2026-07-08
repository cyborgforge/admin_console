"use client"

import type { Ticket } from "./types"

interface SupportClientDetailsCardProps {
  ticket: Ticket
  onViewCRM?: () => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatSourceLabel(source: Ticket["source"]): string {
  switch (source) {
    case "portal": return "Portal"
    case "email":  return "Email"
    case "phone":  return "Phone"
    case "chat":   return "Chat"
    case "system": return "System"
    case "other":  return "Other"
    default:       return source
  }
}

/**
 * Derive an onboarding stage description from the ticket category/product.
 * This is a display-only field derived from available ticket data.
 */
function getOnboardingStage(ticket: Ticket): { stage: string; current: number; total: number } | null {
  // Only show for onboarding or technical support tickets
  if (ticket.category !== "onboarding" && ticket.category !== "technical") return null

  // Map status to a stage progression
  const stages = [
    "Setup & Config",
    "User Training",
    "Data Migration",
    "Integration",
    "Go Live",
  ]

  const stageIndex =
    ticket.status === "open"             ? 1
    : ticket.status === "in_progress"   ? 2
    : ticket.status === "waiting_for_user" ? 3
    : ticket.status === "resolved"      ? 4
    : 0

  return {
    stage: `Stage ${stageIndex + 1} of ${stages.length}: ${stages[stageIndex] ?? stages[0]}`,
    current: stageIndex + 1,
    total: stages.length,
  }
}

export function SupportClientDetailsCard({ ticket, onViewCRM }: SupportClientDetailsCardProps) {
  const clientName = ticket.user?.name ?? "Unknown Client"
  const onboarding = getOnboardingStage(ticket)
  const progressPercent = onboarding ? Math.round((onboarding.current / onboarding.total) * 100) : 0

  return (
    <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
          Client Details
        </span>
        <button
          type="button"
          onClick={onViewCRM}
          className="text-[11px] text-[#3b82f6] hover:underline font-medium cursor-pointer"
        >
          View CRM
        </button>
      </div>

      <div className="flex flex-col gap-4 text-xs">
        {/* Company */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
            Company
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#e8eaf0] font-semibold">{clientName}</span>
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-[9px] font-bold">
              ✓
            </span>
          </div>
        </div>

        {/* Onboarding Stage — only for relevant categories */}
        {onboarding && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
              Onboarding Stage
            </span>
            {/* Progress bar */}
            <div className="w-full bg-[#252b34] rounded-full h-1.5">
              <div
                className="bg-[#3b82f6] h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-[#8b95a8]">{onboarding.stage}</span>
          </div>
        )}

        {/* Product */}
        {ticket.product && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
              Product
            </span>
            <span className="text-[#e8eaf0] font-medium">{ticket.product.name}</span>
          </div>
        )}

        {/* Note */}
        {ticket.note && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
              Note
            </span>
            <span className="text-[#8b95a8] leading-relaxed">{ticket.note}</span>
          </div>
        )}

        {/* Created & Source */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2a3040]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
              Created
            </span>
            <span className="text-[#e8eaf0] font-medium">{formatDate(ticket.created_at)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#4f5a6a] tracking-wider uppercase font-mono">
              Source
            </span>
            <span className="text-[#e8eaf0] font-medium">{formatSourceLabel(ticket.source)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

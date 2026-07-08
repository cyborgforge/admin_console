"use client"

import { SupportStatusCard } from "./SupportStatusCard"
import { SupportAssignmentCard } from "./SupportAssignmentCard"
import { SupportClientDetailsCard } from "./SupportClientDetailsCard"
import { SupportInternalNotes } from "./SupportInternalNotes"
import type { Ticket, InternalNote } from "./types"

interface SupportSidebarProps {
  ticket: Ticket
  notes: InternalNote[]
  onStatusChange?: (status: Ticket["status"]) => Promise<void> | void
  onAddNote?: (content: string) => Promise<void> | void
  onReassign?: () => void
  onViewCRM?: () => void
}

export function SupportSidebar({
  ticket,
  notes,
  onStatusChange,
  onAddNote,
  onReassign,
  onViewCRM,
}: SupportSidebarProps) {
  return (
    <div className="flex flex-col gap-4 w-full md:w-80 lg:w-96 flex-shrink-0">
      <SupportStatusCard ticket={ticket} onStatusChange={onStatusChange} />
      <SupportAssignmentCard assignee={ticket.assignee} onReassign={onReassign} />
      <SupportClientDetailsCard ticket={ticket} onViewCRM={onViewCRM} />
      <SupportInternalNotes notes={notes} onAddNote={onAddNote} />
    </div>
  )
}

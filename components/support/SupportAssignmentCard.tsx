"use client"

interface AssigneeInfo {
  id?: string
  name: string
}

interface SupportAssignmentCardProps {
  assignee?: AssigneeInfo | null
  onReassign?: () => void
}

export function SupportAssignmentCard({ assignee, onReassign }: SupportAssignmentCardProps) {
  const name = assignee?.name ?? "Unassigned"

  return (
    <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-4">
      <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
        Assignment
      </div>

      <div className="rounded-md border border-[#2a3040] bg-[#1e2229] p-3 flex flex-col gap-3">
        {/* Assigned To — name only, no avatar per design requirement */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#4f5a6a] font-mono uppercase tracking-wider">
            Assigned To
          </span>
          <span className={`text-sm font-semibold ${name === "Unassigned" ? "text-[#4f5a6a] italic" : "text-[#e8eaf0]"}`}>
            {name}
          </span>
        </div>

        <button
          type="button"
          onClick={onReassign}
          className="w-full py-1.5 rounded border border-[#35404f] bg-transparent hover:bg-[#252b34] text-xs font-medium text-[#e8eaf0] transition-colors cursor-pointer"
        >
          Reassign Ticket
        </button>
      </div>
    </div>
  )
}

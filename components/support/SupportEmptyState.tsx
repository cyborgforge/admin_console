"use client"

import { Headset } from "lucide-react"

interface SupportEmptyStateProps {
  title?: string
  description?: string
}

export function SupportEmptyState({
  title = "No support tickets found",
  description = "There are no tickets matching your active filter criteria."
}: SupportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-[#2a3040] bg-[#161920]/40">
      <div className="p-3 rounded-full bg-[#1e2229] border border-[#2a3040] text-[#8b95a8] mb-4">
        <Headset size={28} />
      </div>
      <h3 className="text-sm font-semibold text-[#e8eaf0] mb-1">{title}</h3>
      <p className="text-xs text-[#8b95a8] max-w-sm">{description}</p>
    </div>
  )
}

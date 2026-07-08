"use client"

import { Paperclip } from "lucide-react"
import type { Attachment } from "./types"

interface SupportAttachmentListProps {
  attachments?: Attachment[]
}

export function SupportAttachmentList({ attachments = [] }: SupportAttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {attachments.map((file, idx) => (
        <a
          key={idx}
          href={file.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3040] bg-[#1e2229] hover:bg-[#252b34] text-xs text-[#e8eaf0] transition-colors"
        >
          <Paperclip size={13} className="text-[#8b95a8]" />
          <span>{file.name}</span>
        </a>
      ))}
    </div>
  )
}

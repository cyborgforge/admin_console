"use client"

import { SupportAttachmentList } from "./SupportAttachmentList"
import type { Message } from "./types"

interface SupportMessageBubbleProps {
  message: Message
  isFirst?: boolean
  clientName?: string
  source?: string
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    const now = Date.now()
    const diff = now - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return "Just now"
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
    const days = Math.floor(hrs / 24)
    if (days < 7)  return `${days} day${days === 1 ? "" : "s"} ago`
    // For older dates use locale date + time
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " • " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  } catch {
    return dateStr
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function SupportMessageBubble({
  message,
  isFirst = false,
  clientName,
  source,
}: SupportMessageBubbleProps) {
  const isSupportStaff = message.sender_type === "support_staff"
  const isSystemMessage = message.sender_type === "system"

  const senderName =
    message.sender?.name ??
    (isSupportStaff
      ? "Support Staff"
      : isSystemMessage
      ? "System"
      : clientName ?? "User")

  const initials = getInitials(senderName)

  const avatarGradient =
    isSupportStaff
      ? "from-[#3b82f6] to-[#8b5cf6]"
      : isSystemMessage
      ? "from-[#4f5a6a] to-[#35404f]"
      : "from-[#10b981] to-[#059669]"

  // Format source for display
  const sourceLabel = source
    ? `Submitted via ${source.charAt(0).toUpperCase() + source.slice(1)}`
    : null

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-[10px] font-bold text-white uppercase`}
        >
          {initials}
        </div>
      </div>

      {/* Message Box */}
      <div
        className={`flex-1 rounded-lg border bg-[#161920] p-5 flex flex-col gap-3 relative transition-all ${
          isFirst
            ? "border-l-4 border-l-[#3b82f6] border-[#2a3040]"
            : "border-[#2a3040]"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-0.5">
            {isSupportStaff ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8b95a8]">
                <span className="font-bold text-[#e8eaf0]">Resolution Response</span>
                <span>by</span>
                <span className="text-[#e8eaf0] font-medium">{senderName}</span>
              </div>
            ) : isSystemMessage ? (
              <span className="font-bold text-[#8b95a8] text-sm">System</span>
            ) : (
              <span className="font-bold text-[#e8eaf0] text-sm">{senderName}</span>
            )}

            <div className="text-[11px] text-[#4f5a6a] flex items-center gap-1.5">
              {isFirst && sourceLabel && (
                <>
                  <span>{sourceLabel}</span>
                  <span>•</span>
                </>
              )}
              <span>
                {formatTimestamp(message.created_at)}
              </span>
              {message.is_edited && (
                <span className="italic">(edited)</span>
              )}
            </div>
          </div>

          {/* INITIAL REQUEST badge on first message */}
          {isFirst && (
            <span className="px-2 py-0.5 rounded border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[9px] font-bold text-[#3b82f6] tracking-wider uppercase whitespace-nowrap">
              Initial Request
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-xs text-[#e8eaf0] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Attachments */}
        <SupportAttachmentList attachments={message.attachments_json_array} />
      </div>
    </div>
  )
}

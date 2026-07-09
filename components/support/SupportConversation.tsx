"use client"

import { SupportMessageBubble } from "./SupportMessageBubble"
import { SupportResponseBox } from "./SupportResponseBox"
import type { Ticket, Message } from "./types"

interface SupportConversationProps {
  ticket: Ticket
  messages: Message[]
  onSendResponse?: (text: string) => Promise<void> | void
  onSendResponseclose?: (text: string) => Promise<void> | void
}

function formatClosedDate(dateStr: string | null): string {
  if (!dateStr) return ""
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

export function SupportConversation({
  ticket,
  messages,
  onSendResponse,
  onSendResponseclose,
}: SupportConversationProps) {
  const isClosed = ticket.status === "closed" || ticket.status === "resolved" || ticket.status === "rejected"
  const clientName = ticket.user?.name ?? "Client"

  // Format source label for display in message bubble
  const sourceLabel =
    ticket.source === "portal" ? "Customer Portal"
    : ticket.source === "email" ? "Email"
    : ticket.source === "phone" ? "Phone"
    : ticket.source === "chat"  ? "Chat"
    : ticket.source === "system"? "System"
    : ticket.source

  return (
    <div className="flex flex-col gap-6 flex-1 min-w-0">
      {/* Messages Stack */}
      <div className="flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="text-xs text-[#8b95a8] italic py-4">
            No messages yet for this ticket.
          </div>
        ) : (
          messages.map((message, index) => (
            <SupportMessageBubble
              key={message.id}
              message={message}
              isFirst={index === 0}
              clientName={clientName}
              source={index === 0 ? sourceLabel : undefined}
            />
          ))
        )}
      </div>

      {/* Closed Banner or Active Reply */}
      {isClosed ? (
        <div className="flex items-center justify-center gap-2.5 p-4 mt-4 rounded-lg border border-[#2a3040] bg-[#1e2229]/50 text-xs text-[#8b95a8]">
          <span className="text-base" role="img" aria-label="lock">🔒</span>
          <span>
            This ticket was closed{ticket.closed_at ? ` on ${formatClosedDate(ticket.closed_at)}` : ""}.
            Reopen the ticket to send a new response.
          </span>
        </div>
      ) : (
        <SupportResponseBox
  clientName={clientName}
  onSendResponse={onSendResponse}
  onSendResponseclose={onSendResponseclose}
/>
      )}
    </div>
  )
}

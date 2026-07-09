"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SupportTicketHeader } from "@/components/support/SupportTicketHeader"
import { SupportConversation } from "@/components/support/SupportConversation"
import { SupportSidebar } from "@/components/support/SupportSidebar"
import {
  getSupportTicket,
  getSupportTicketMessages,
  createSupportTicketMessage,
  updateSupportTicketStatus,
  getSupportTicketInternalNotes,
  createSupportTicketInternalNote,
} from "@/components/support/mock-data"
import { useAuth } from "@/hooks/use-auth"
import type { Ticket, Message, InternalNote } from "@/components/support/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TicketDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { user } = useAuth()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load ticket + messages + notes in parallel ──────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [ticketData, messagesData, notesData] = await Promise.all([
        getSupportTicket(id),
        getSupportTicketMessages(id),
        getSupportTicketInternalNotes(id),
      ])

      setTicket(ticketData)
      setMessages(messagesData)
      setNotes(notesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket details.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // ── Send a reply (and close ticket) ─────────────────────────────────────
  const handleSendResponseclose = async (text: string) => {
    if (!ticket) return
    try {
      const newMsg = await createSupportTicketMessage(ticket.id, {
        sender_type: "support_staff",
        sender_id: user.id,
        content: text,
      })
      setMessages((prev) => [...prev, newMsg])

      // Close the ticket after sending a response
      const updated = await updateSupportTicketStatus(ticket.id, "closed")
      setTicket(updated)
      toast.success("Response sent and ticket closed.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send response.")
    }
  }

  // ── Send a reply  ─────────────────────────────────────
  const handleSendResponse = async (text: string) => {
  if (!ticket) return

  try {
    const newMsg = await createSupportTicketMessage(ticket.id, {
      sender_type: "support_staff",
      sender_id: user.id,
      content: text,
    })

    setMessages((prev) => [...prev, newMsg])

    toast.success("Response sent.")
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to send response."
    )
  }
}
  // ── Change ticket status ─────────────────────────────────────────────────
  const handleStatusChange = async (status: Ticket["status"]) => {
    if (!ticket) return
    try {
      const updated = await updateSupportTicketStatus(ticket.id, status)
      setTicket(updated)
      toast.success(`Status updated to "${status}".`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.")
    }
  }

  // ── Add internal note ────────────────────────────────────────────────────
  const handleAddNote = async (content: string) => {
    if (!ticket) return
    try {
      const newNote = await createSupportTicketInternalNote(ticket.id, {
        content,
        created_by: user.id,
      })
      setNotes((prev) => [...prev, newNote])
      toast.success("Note added.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note.")
    }
  }

  return (
    <div className="content" id="section-ticket-detail">
      {/* Back button */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-[#8b95a8] hover:text-[#e8eaf0] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Tickets</span>
        </button>
      </div>

      {/* ── Loading state ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-[#3b82f6]" />
            <span className="text-xs text-[#8b95a8]">Loading ticket details...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-3 py-8">
          <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-4 py-3">
            {error}
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="btn btn-ghost text-xs w-fit"
          >
            Retry
          </button>
        </div>
      ) : ticket ? (
        <>
          {/* Ticket ID header */}
          <SupportTicketHeader ticket={ticket} />

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left — Conversation */}
            <SupportConversation
              ticket={ticket}
              messages={messages}
              onSendResponseclose={handleSendResponseclose}
              onSendResponse={handleSendResponse}
            />

            {/* Right — Intelligence Sidebar */}
            <SupportSidebar
              ticket={ticket}
              notes={notes}
              onStatusChange={handleStatusChange}
              onAddNote={handleAddNote}
              onReassign={() => toast.info("Reassign functionality coming soon.")}
              onViewCRM={() => router.push(`/clients`)}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[#8b95a8] text-sm">Ticket not found.</div>
        </div>
      )}
    </div>
  )
}

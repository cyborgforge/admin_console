"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SupportTicketList } from "@/components/support/SupportTicketList"
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog"
import { getSupportTickets } from "@/components/support/mock-data"
import type { Ticket } from "@/components/support/types"

export default function SupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSupportTickets()
      setTickets(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support tickets.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev])
    setShowCreate(false)
    toast.success("Ticket created successfully.")
  }

  return (
    <div className="content" id="section-support">
      {/* ── Page header ── */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#e8eaf0] tracking-tight">Tickets</h2>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Ticket
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-[#3b82f6]" />
            <span className="text-xs text-[#8b95a8]">Loading tickets...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-3 py-8">
          <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-4 py-3">
            {error}
          </div>
          <button
            type="button"
            onClick={() => void loadTickets()}
            className="btn btn-ghost text-xs w-fit"
          >
            Retry
          </button>
        </div>
      ) : (
        <SupportTicketList
          tickets={tickets}
          onSelectTicket={(id) => router.push(`/support/${id}`)}
        />
      )}

      <CreateTicketDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleTicketCreated}
      />
    </div>
  )
}

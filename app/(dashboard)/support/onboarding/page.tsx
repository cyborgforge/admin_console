"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SupportTicketList } from "@/components/support/SupportTicketList"
import { getSupportTickets } from "@/components/support/mock-data"
import type { Ticket } from "@/components/support/types"

export default function OnboardingSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true)
        setError(null)
        const data = await getSupportTickets()
        // Filter tickets with "onboarding" category
        const filtered = (data || []).filter((t) => t.category === "onboarding")
        setTickets(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load onboarding support tickets.")
      } finally {
        setLoading(false)
      }
    }
    void loadTickets()
  }, [])

  const handleSelectTicket = (id: string) => {
    router.push(`/support/${id}`)
  }

  return (
    <div className="content" id="section-onboarding-support">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#e8eaf0] tracking-tight">Tickets</h2>
      </div>

      {loading ? (
        <div className="text-xs text-[#8b95a8] mb-4">Loading onboarding tickets...</div>
      ) : error ? (
        <div className="text-xs text-[#ef4444] mb-4">Error: {error}</div>
      ) : (
        <SupportTicketList
          tickets={tickets}
          onSelectTicket={handleSelectTicket}
        />
      )}
    </div>
  )
}

"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type { OnboardingFormResponse } from "@/types/onboarding"

export function ResponseReviewPanel({
  response,
  onReviewed,
}: {
  response: OnboardingFormResponse | null
  onReviewed: () => void
}) {
  const [reviewing, setReviewing] = useState(false)

  async function updateStatus(status: "Approved" | "Rejected") {
    if (!response) return

    setReviewing(true)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) {
        throw new Error("Please sign in before reviewing.")
      }

      const res = await fetch(
        `/api/onboarding-forms-response/${response.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        toast.error(body?.error ?? "Failed to update status.")
        return
      }

      toast.success("Status updated")
      onReviewed()
    } finally {
      setReviewing(false)
    }
  }

  if (!response) {
    return (
      <div className="stat-card">
        <div className="empty-text">
          Select a form response to review
        </div>
      </div>
    )
  }

  return (
    <div className="stat-card">
      <div className="section-heading">
        Form Response
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          color: "var(--text2)",
          fontSize: "12px",
          marginTop: "10px",
        }}
      >
        {JSON.stringify(response.response_data, null, 2)}
      </pre>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <Button
          className="btn btn-primary"
          disabled={reviewing}
          onClick={() => void updateStatus("Approved")}
        >
          Approve
        </Button>
        <Button
          className="btn btn-ghost"
          variant="outline"
          disabled={reviewing}
          onClick={() => void updateStatus("Rejected")}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}

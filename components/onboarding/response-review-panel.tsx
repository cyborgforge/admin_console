"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type { OnboardingFormResponse } from "@/types/onboarding"
import { OnboardingStatusBadge } from "./status-badge"

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "var(--text3)", fontStyle: "italic" }}>-</span>
  }
  if (typeof value === "boolean") {
    return (
      <span className={value ? "badge badge-accepted" : "badge badge-churned"}>
        {value ? "Yes" : "No"}
      </span>
    )
  }
  if (typeof value === "object") {
    return (
      <pre style={{ margin: 0, fontSize: "11px", color: "var(--text2)", whiteSpace: "pre-wrap" }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  return String(value)
}

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
        <div className="section-heading">Form Response Detail</div>
        <div className="empty-text" style={{ padding: "16px 0" }}>
          Select a response from the table above to view submission details.
        </div>
      </div>
    )
  }

  const entries = Object.entries(response.response_data ?? {})

  return (
    <div className="stat-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <div className="section-heading" style={{ marginBottom: "2px" }}>
            Form Response — Version {response.version_number}
          </div>
          <div style={{ color: "var(--text3)", fontSize: "12px" }}>
            Submitted: {response.submitted_date ? new Date(response.submitted_date).toLocaleString() : "-"}
          </div>
        </div>
        <OnboardingStatusBadge status={response.status} />
      </div>

      {entries.length === 0 ? (
        <div className="empty-text" style={{ padding: "12px 0" }}>
          No submission fields in this response.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {entries.map(([key, val]) => (
            <div
              key={key}
              style={{
                background: "var(--surface2)",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "4px",
                }}
              >
                {formatLabel(key)}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", wordBreak: "break-word" }}>
                {renderValue(val)}
              </div>
            </div>
          ))}
        </div>
      )}

      {response.review_note ? (
        <div style={{ marginBottom: "14px", fontSize: "12px", color: "var(--text2)" }}>
          <strong>Review Note:</strong> {response.review_note}
        </div>
      ) : null}

      {response.status === "Pending" ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            borderTop: "1px solid var(--border)",
            paddingTop: "12px",
          }}
        >
          <Button
            className="btn btn-primary"
            disabled={reviewing}
            onClick={() => void updateStatus("Approved")}
          >
            Approve Response
          </Button>
          <Button
            className="btn btn-ghost"
            variant="outline"
            disabled={reviewing}
            onClick={() => void updateStatus("Rejected")}
          >
            Reject Response
          </Button>
        </div>
      ) : null}
    </div>
  )
}

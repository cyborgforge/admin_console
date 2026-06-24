"use client"

import type { Deal } from "@/types/deals"
import { useRouter } from "next/navigation"
const STAGES: Deal["stage"][] = [
  "new",
  "quote sent",
  "negotiation",
  "reviewing",
  "hold",
  "won",
  "lost",
]

const STAGE_LABELS: Record<
  Deal["stage"],
  string
> = {
  new: "New",
  "quote sent": "Quote Sent",
  negotiation: "Negotiation",
  reviewing: "Reviewing",
  hold: "On Hold",
  won: "Won",
  lost: "Lost",
}

interface ClientDealsTabProps {
  deals: Deal[]
  onCreateDeal?: (
    stage: Deal["stage"]
  ) => void
}

export default function ClientDealsTab({
  deals,
  onCreateDeal,
}: ClientDealsTabProps) {
   const router = useRouter()
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(7, minmax(260px, 1fr))",
        gap: "12px",
        overflowX: "auto",
      }}
    >
      {STAGES.map((stage) => {
        const stageDeals = deals.filter(
          (deal) => deal.stage === stage
        )

        return (
          <div
            key={stage}
            className="stat-card"
            style={{
              minWidth: "260px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {STAGE_LABELS[stage]}
              </div>

              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text3)",
                }}
              >
                {stageDeals.length}
              </span>
            </div>

            {/* Cards */}
            {stageDeals.map((deal) => (
              <div
                key={deal.id}
                style={{
                  padding: "12px",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "10px",
                  background:
                    "var(--surface)",
                }}
                
                   onClick={() => router.push(`/deals/${deal.id}`)}
                
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  {deal.deal_name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text3)",
                  }}
                >
                  Value
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginTop: "2px",
                  }}
                >
                  {deal.expected_value
                    ? `₹ ${deal.expected_value.toLocaleString(
                        "en-IN"
                      )}`
                    : "—"}
                </div>
              </div>
            ))}

            {/* Add Deal */}
            <button
              className="btn btn-ghost"
              onClick={() =>
                onCreateDeal?.(stage)
              }
              style={{
                    marginTop: "10px",
                    marginBottom: "50px",
                    cursor: "pointer",
                  }}
            >
              + Add Deal
            </button>
          </div>
        )
      })}
    </div>
  )
}
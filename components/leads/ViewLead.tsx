"use client"

import { useState } from "react"
import { Pencil, X } from "lucide-react"

import type {
  Lead,
  LeadStatus,
} from "@/app/(dashboard)/leads/page"

import LeadConversionDialog from "@/components/leads/LeadConversionDialog"
import { useLeadConversion } from "@/hooks/useLeadConversion"
import { getSupabaseClient } from "@/lib/supabaseClient"

interface ViewLeadProps {
  lead: Lead

  statusConfig: Record<
    LeadStatus,
    {
      label: string
      bg: string
      color: string
      dot: string
    }
  >

  closeView: () => void
  startEdit: () => void
  handleDeleteLead: (id: string) => void
  updateViewStatus: (status: LeadStatus) => void
}

export default function ViewLead({
  lead,
  statusConfig,
  closeView,
  startEdit,
  handleDeleteLead,
  updateViewStatus,
}: ViewLeadProps) {
  const conversion = useLeadConversion(lead)

  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const cannotConvert = lead.status === "closed-lost"

  async function changeStatus(status: LeadStatus) {
    if (statusSaving || status === lead.status) {
      return
    }

    try {
      setStatusSaving(true)
      setStatusError(null)

      const supabase = getSupabaseClient()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) {
        throw new Error("Please sign in to update the lead.")
      }

      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      })

      const data = (await response.json()) as {
        lead?: {
          status?: LeadStatus
        }
        error?: string
      }

      if (!response.ok || !data.lead) {
        throw new Error(
          data.error ?? "Failed to update lead status."
        )
      }

      updateViewStatus(status)
    } catch (error) {
      console.error("Lead status update failed:", error)

      setStatusError(
        error instanceof Error
          ? error.message
          : "Failed to update lead status."
      )
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <>
      {/* Lead details dialog */}

      <div
        className={conversion.open ? "hidden" : "lp-overlay"}
        onClick={closeView}
      >
        <div
          className="lp-view-dialog"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Top bar */}

          <div className="lp-view-topbar">
            {/* Status */}

            <div className="lp-view-status-wrap">
              <span className="lp-view-status-label">
                Status
              </span>

              <div
                className="lp-view-status-select-wrap"
                style={{
                  borderColor:
                    statusConfig[lead.status].color + "66",
                }}
              >
                <span
                  className="lp-dot"
                  style={{
                    background: statusConfig[lead.status].dot,
                  }}
                />

                <select
                  className="lp-view-status-select"
                  style={{
                    color: statusConfig[lead.status].color,
                  }}
                  value={lead.status}
                  disabled={statusSaving || conversion.saving}
                  onChange={(event) => {
                    void changeStatus(
                      event.target.value as LeadStatus
                    )
                  }}
                >
                  {(
                    Object.keys(statusConfig) as LeadStatus[]
                  ).map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {statusConfig[status].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}

            <div className="lp-view-topbar-actions">
              <button
                type="button"
                className="lp-view-edit-btn"
                title="Edit lead"
                disabled={statusSaving || conversion.saving}
                onClick={startEdit}
              >
                <Pencil size={13} />
              </button>

              <button
                type="button"
                className="lp-make-deal-btn disabled:cursor-not-allowed disabled:opacity-40"
                disabled={
                  cannotConvert ||
                  statusSaving ||
                  conversion.saving
                }
                title={
                  cannotConvert
                    ? "Change this lead from Not Found before creating a deal"
                    : "Convert lead and create deal"
                }
                onClick={conversion.openConversion}
              >
                Make Deal
              </button>

              <button
                type="button"
                className="lp-dialog-close"
                aria-label="Close lead details"
                disabled={statusSaving || conversion.saving}
                onClick={closeView}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {statusError && (
            <div className="px-5 py-2 text-xs text-destructive">
              {statusError}
            </div>
          )}

          <div className="lp-view-divider" />

          {/* Lead information */}

          <div className="lp-view-body">
            <div className="lp-view-grid">
              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  LEAD ID
                </div>

                <div className="lp-view-field-val">
                  {lead.id}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  LEAD NAME
                </div>

                <div className="lp-view-field-val">
                  {lead.leadName || "—"}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  EMAIL
                </div>

                <div className="lp-view-field-val">
                  {lead.email || "—"}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  PHONE
                </div>

                <div className="lp-view-field-val">
                  {lead.phone || "—"}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  COMPANY
                </div>

                <div className="lp-view-field-val">
                  {lead.company || "—"}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  CREATED AT
                </div>

                <div className="lp-view-field-val">
                  {lead.createdDate || "—"}
                </div>
              </div>

              <div className="lp-view-field">
                <div className="lp-view-field-label">
                  STATUS
                </div>

                <div className="lp-view-field-val">
                  <span
                    className="lp-badge"
                    style={{
                      background:
                        statusConfig[lead.status].bg,
                      color:
                        statusConfig[lead.status].color,
                      borderColor:
                        statusConfig[lead.status].color + "33",
                    }}
                  >
                    <span
                      className="lp-dot"
                      style={{
                        background:
                          statusConfig[lead.status].dot,
                      }}
                    />

                    {statusConfig[lead.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="lp-view-notes-field">
              <div className="lp-view-field-label">
                NOTES
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="lp-view-footer">
            <button
              type="button"
              className="lp-delete-btn"
              disabled={statusSaving || conversion.saving}
              onClick={() => handleDeleteLead(lead.id)}
            >
              Delete Lead
            </button>
          </div>
        </div>
      </div>

      {/* Lead conversion dialog */}

      {conversion.open && (
        <LeadConversionDialog
          lead={lead}
          saving={conversion.saving}
          error={conversion.error}
          onClose={conversion.closeConversion}
          onConvert={conversion.convertLead}
        />
      )}
    </>
  )
}
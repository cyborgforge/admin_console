"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type {
  OnboardingClientDetail,
  OnboardingFormAssigned,
  OnboardingFormResponse,
} from "@/types/onboarding"
import { OnboardingStatusBadge } from "@/components/onboarding/status-badge"
import { ProgressCell } from "@/components/onboarding/progress-cell"
import { OnboardingFormsTable } from "@/components/onboarding/forms-table"
import { OnboardingDocumentsTable } from "@/components/onboarding/documents-table"
import { ActivityTimeline } from "@/components/onboarding/activity-timeline"
import { ResponseReviewPanel } from "@/components/onboarding/response-review-panel"

type PageProps = {
  params: Promise<{ id: string }>
}

type Tab = "overview" | "forms" | "activity" | "tickets"

const tabContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  marginBottom: "16px",
}

const getTabStyle = (active: boolean): React.CSSProperties => ({
  border: "none",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: "calc(var(--radius) - 4px)",
  fontSize: "13px",
  fontWeight: 500,
  background: active ? "var(--accent-dim)" : "transparent",
  color: active ? "var(--accent)" : "var(--text3)",
  transition: "all .15s ease",
})

export default function ClientOnboardingDetailPage({
  params,
}: PageProps) {
  const { id } = use(params)
  const [detail, setDetail] =
    useState<OnboardingClientDetail | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [selectedForm, setSelectedForm] =
    useState<OnboardingFormAssigned | null>(null)
  const [selectedResponse, setSelectedResponse] =
    useState<OnboardingFormResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDetail(showLoader = false) {
    if (showLoader) {
      setLoading(true)
    }

    try {
      setError(null)
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) {
        throw new Error("Please sign in to load onboarding details.")
      }

      const response = await fetch(`/api/onboarding-clients/${id}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const responseData = (await response.json()) as {
          error?: string
        }
        throw new Error(responseData.error ?? "Failed to load onboarding details.")
      }

      const data = (await response.json()) as OnboardingClientDetail
      setDetail(data)

      if (!selectedForm && data.assigned_forms.length > 0) {
        setSelectedForm(data.assigned_forms[0])
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load onboarding details."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDetail(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const selectedFormResponses = useMemo(() => {
    if (!detail || !selectedForm) return []

    return detail.form_responses.filter(
      (response) => response.form_assigned_id === selectedForm.id
    )
  }, [detail, selectedForm])

  const activityItems = useMemo(() => {
    if (!detail) return []

    return [
      {
        id: `${detail.onboarding_client.id}-created`,
        label: "Onboarding created",
        date: detail.onboarding_client.created_at,
        detail: detail.client?.company_name,
      },
      ...detail.form_responses.map((response) => ({
        id: `form-${response.id}`,
        label: `Form response ${response.status}`,
        date: response.review_date ?? response.submitted_date ?? response.created_at,
        detail: response.review_note,
      })),
      ...detail.document_responses.map((response) => ({
        id: `document-${response.id}`,
        label: `Document response ${response.status}`,
        date: response.review_date ?? response.submitted_date ?? response.created_at,
        detail: response.document_link,
      })),
    ].sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0
      const bTime = b.date ? new Date(b.date).getTime() : 0
      return bTime - aTime
    })
  }, [detail])

  if (loading) {
    return (
      <div className="content">
        <div className="empty-text">Loading onboarding details...</div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="content">
        <div className="empty-text">{error ?? "Onboarding record not found."}</div>
      </div>
    )
  }

  const onboarding = detail.onboarding_client
  const client = detail.client

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "forms", label: "Forms" },
    { key: "activity", label: "Activity" },
    { key: "tickets", label: "Tickets" },
  ]

  return (
    <div className="content">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text3)",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Client Onboarding
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {client?.company_name ?? onboarding.client_id}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <OnboardingStatusBadge status={onboarding.status} />
          <Link href="/client-onboarding">
            <Button variant="outline" className="btn btn-ghost">
              Back to list
            </Button>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr) 300px",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="stat-card">
            <div className="section-heading">Onboarding Summary</div>
            <div className="info-row">
              <div className="info-row-label">Start Date</div>
              <div className="info-row-val">
                {onboarding.start_date
                  ? new Date(onboarding.start_date).toLocaleDateString()
                  : "-"}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Finish Date</div>
              <div className="info-row-val">
                {onboarding.finish_date
                  ? new Date(onboarding.finish_date).toLocaleDateString()
                  : "-"}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Status</div>
              <div className="info-row-val">{onboarding.status}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Forms</div>
            <ProgressCell filled={onboarding.forms_filled} total={onboarding.forms_total} />
          </div>
          <div className="stat-card">
            <div className="section-heading">Documents</div>
            <ProgressCell
              filled={onboarding.documents_filled}
              total={onboarding.documents_total}
            />
          </div>
        </div>

        <div>
          <div style={tabContainerStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={getTabStyle(activeTab === tab.key)}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="stat-card">
                <div className="section-heading">Forms Status</div>
                <OnboardingFormsTable
                  forms={detail.assigned_forms}
                  responses={detail.form_responses}
                  onSelect={(form) => {
                    setSelectedForm(form)
                    setActiveTab("forms")
                  }}
                />
              </div>
              <div className="stat-card">
                <div className="section-heading">Documents Status</div>
                <OnboardingDocumentsTable
                  documents={detail.assigned_documents}
                  responses={detail.document_responses}
                />
              </div>
              <div className="stat-card">
                <div className="section-heading">Tasks</div>
                <div className="empty-text">No onboarding tasks configured yet.</div>
              </div>
            </div>
          ) : null}

          {activeTab === "forms" ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "16px" }}>
              <div className="stat-card">
                <div className="section-heading">Assigned Forms</div>
                <OnboardingFormsTable
                  forms={detail.assigned_forms}
                  responses={detail.form_responses}
                  onSelect={(form) => {
                    setSelectedForm(form)
                    setSelectedResponse(null)
                  }}
                />
                <div className="section-heading" style={{ marginTop: "16px" }}>
                  Responses
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFormResponses.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="empty">No responses yet</td>
                        </tr>
                      ) : (
                        selectedFormResponses.map((response) => (
                          <tr
                            key={response.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <td>{response.version_number}</td>
                            <td>
                              <OnboardingStatusBadge status={response.status} />
                            </td>
                            <td className="quote-id">
                              {response.submitted_date
                                ? new Date(response.submitted_date).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <ResponseReviewPanel
                response={selectedResponse}
                onReviewed={() => void loadDetail()}
              />
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <ActivityTimeline items={activityItems} />
          ) : null}

          {activeTab === "tickets" ? (
            <div className="stat-card">
              <div className="section-heading">Tickets</div>
              <div className="empty-text">Ticket workflow is not configured yet.</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="stat-card">
            <div className="section-heading">Client Bio</div>
            <div className="client-name">{client?.company_name ?? "-"}</div>
            <div className="client-org">{client?.industry ?? "No industry"}</div>
            <div className="info-row">
              <div className="info-row-label">Email</div>
              <div className="info-row-val">{client?.email ?? "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Phone</div>
              <div className="info-row-val">{client?.phone ?? "-"}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Contact Highlight</div>
            <div className="empty-text">Use Contacts module for contact details.</div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Tasks Highlight</div>
            <div className="empty-text">No tasks configured.</div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Activity Highlight</div>
            <div className="empty-text">{activityItems[0]?.label ?? "No activity yet"}</div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Ticket Highlight</div>
            <div className="empty-text">No tickets yet.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

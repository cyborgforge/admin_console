"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
  const [updatingResponseId, setUpdatingResponseId] = useState<string | null>(null)

  async function updateResponseStatus(responseId: string, status: "Approved" | "Rejected") {
    setUpdatingResponseId(responseId)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) {
        toast.error("Please sign in before updating status.")
        return
      }

      const res = await fetch(`/api/onboarding-forms-response/${responseId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        toast.error(body?.error ?? "Failed to update response status.")
        return
      }

      toast.success(`Response status updated to ${status}`)
      await loadDetail()
    } catch {
      toast.error("An error occurred while updating status.")
    } finally {
      setUpdatingResponseId(null)
    }
  }

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

  const formsTotal = detail?.assigned_forms.length ?? 0
  const formsFilled = useMemo(() => {
    if (!detail) return 0
    return detail.assigned_forms.filter(
      (f) => f.status === "Approved"
    ).length
  }, [detail])

  const documentsTotal = detail?.assigned_documents.length ?? 0
  const documentsFilled = useMemo(() => {
    if (!detail) return 0
    return detail.assigned_documents.filter(
      (d) => d.status === "Approved"
    ).length
  }, [detail])

  const locationString = useMemo(() => {
    if (!detail?.client) return "-"
    const parts = [
      detail.client.city,
      detail.client.state,
      detail.client.country,
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(", ")
    return (
      detail.client.address_line_1 ||
      detail.client.location ||
      detail.branch?.city ||
      "-"
    )
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
              <div className="info-row-label">Due Date</div>
              <div className="info-row-val">
                {onboarding.due_date
                  ? new Date(onboarding.due_date).toLocaleDateString()
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
            <ProgressCell filled={formsFilled} total={formsTotal} />
          </div>
          <div className="stat-card">
            <div className="section-heading">Documents</div>
            <ProgressCell filled={documentsFilled} total={documentsTotal} />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              </div>

              <div className="stat-card">
                <div className="section-heading">
                  Responses {selectedForm ? `(${selectedForm.form?.form_name ?? selectedForm.form_id})` : ""}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFormResponses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty">
                            No responses submitted yet
                          </td>
                        </tr>
                      ) : (
                        selectedFormResponses.map((response) => (
                          <tr
                            key={response.id}
                            className={selectedResponse?.id === response.id ? "selected-row cursor-pointer" : "cursor-pointer"}
                            onClick={() => setSelectedResponse(response)}
                          >
                            <td>Version {response.version_number}</td>
                            <td>
                              <OnboardingStatusBadge status={response.status} />
                            </td>
                            <td className="quote-id">
                              {response.submitted_date
                                ? new Date(response.submitted_date).toLocaleString()
                                : "-"}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <Button
                                  size="sm"
                                  className="btn btn-primary"
                                  disabled={updatingResponseId === response.id}
                                  onClick={() => void updateResponseStatus(response.id, "Approved")}
                                  style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="btn btn-ghost"
                                  disabled={updatingResponseId === response.id}
                                  onClick={() => void updateResponseStatus(response.id, "Rejected")}
                                  style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
                                >
                                  Reject
                                </Button>
                              </div>
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
            <div className="client-name">{client?.company_name ?? onboarding.client_id}</div>
            <div className="client-org">{client?.industry ?? "No industry"}</div>
            <div className="info-row" style={{ marginTop: "10px" }}>
              <div className="info-row-label">Branch Name</div>
              <div className="info-row-val">{detail.branch?.branch_name ?? client?.branch_name ?? "Main Branch"}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Location</div>
              <div className="info-row-val">{locationString}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="section-heading">Contact Highlight</div>
            <div className="info-row">
              <div className="info-row-label">Name</div>
              <div className="info-row-val">{detail.contact?.name ?? client?.company_name ?? "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Email</div>
              <div className="info-row-val">{detail.contact?.email ?? client?.email ?? "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Phone No.</div>
              <div className="info-row-val">{detail.contact?.phone ?? detail.contact?.mobile ?? client?.phone ?? "-"}</div>
            </div>
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

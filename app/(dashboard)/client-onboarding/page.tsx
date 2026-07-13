"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import { getSupabaseClient } from "@/lib/supabaseClient"
import type {
  OnboardingClientListItem,
  OnboardingStatus,
} from "@/types/onboarding"
import { OnboardingStatusBadge } from "@/components/onboarding/status-badge"
import { ProgressCell } from "@/components/onboarding/progress-cell"

export default function ClientOnboardingPage() {
  const [items, setItems] = useState<OnboardingClientListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"" | OnboardingStatus>("")

  useEffect(() => {
    async function loadOnboardingClients() {
      try {
        setError(null)
        setLoading(true)

        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const token = session?.access_token

        if (!token) {
          throw new Error("Please sign in to load onboarding clients.")
        }

        const response = await fetch("/api/onboarding-clients", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const responseData = (await response.json()) as {
            error?: string
          }
          throw new Error(responseData.error ?? "Failed to load onboarding clients.")
        }

        const data = (await response.json()) as {
          onboarding_clients?: OnboardingClientListItem[]
        }

        setItems(data.onboarding_clients ?? [])
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load onboarding clients."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadOnboardingClients()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const clientName = item.client?.company_name ?? ""
      const searchText = `${clientName} ${item.status} ${item.id}`.toLowerCase()
      const matchesQuery = searchText.includes(query.toLowerCase())
      const matchesStatus = status ? item.status === status : true

      return matchesQuery && matchesStatus
    })
  }, [items, query, status])

  const counts = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "Pending").length,
      review: items.filter((item) => item.status === "Under Review").length,
      approved: items.filter((item) => item.status === "Approved").length,
    }
  }, [items])

  return (
    <div className="content" id="section-client-onboarding">
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Onboarding Clients</div>
          <div className="stat-val">{counts.total}</div>
          <div className="stat-change up">Live from backend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-val">{counts.pending}</div>
          <div className="stat-change">Awaiting action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Under Review</div>
          <div className="stat-val text-(--warn)">{counts.review}</div>
          <div className="stat-change">Needs approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-val text-(--accent2)">{counts.approved}</div>
          <div className="stat-change up">Completed</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text3)", marginBottom: "10px" }}>
          Loading onboarding clients...
        </div>
      ) : null}
      {error ? (
        <div style={{ color: "var(--warn)", marginBottom: "10px" }}>
          {error}
        </div>
      ) : null}

      <div className="filters">
        <div className="search-box">
          <Search size={14} color="var(--text3)" />
          <input
            placeholder="Search onboarding clients..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "" | OnboardingStatus)
          }
        >
          <option value="">All status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Skipped">Skipped</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Finish Date</th>
              <th>Forms</th>
              <th>Documents</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  <div className="empty-text">No onboarding clients found</div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/client-onboarding/${item.id}`}>
                      <div className="client-name">
                        {item.client?.company_name ?? item.client_id}
                      </div>
                      <div className="client-org">
                        {item.client?.industry ?? "Client onboarding"}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <OnboardingStatusBadge status={item.status} />
                  </td>
                  <td className="quote-id">
                    {item.start_date
                      ? new Date(item.start_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="quote-id">
                    {item.finish_date
                      ? new Date(item.finish_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <ProgressCell
                      filled={item.forms_filled}
                      total={item.forms_total}
                    />
                  </td>
                  <td>
                    <ProgressCell
                      filled={item.documents_filled}
                      total={item.documents_total}
                    />
                  </td>
                  <td className="quote-id">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

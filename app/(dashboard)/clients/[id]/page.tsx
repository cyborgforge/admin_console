"use client"

import { use, useEffect, useState } from "react"

import ClientDealsTab from "@/components/clients/clientDealsTab"
import ClientDetailsTab from "@/components/clients/clientDetailsTab"
import ActivitiesTab from "@/components/activities/ActivitiesTab"

import { getSupabaseClient } from "@/lib/supabaseClient"

import type { Activity } from "@/types/activity"
import type {
  Client,
  ClientStatus,
} from "@/types/client"
import type { Contact } from "@/types/contacts"
import type { Deal } from "@/types/deals"

type ClientTab =
  | "details"
  | "deals"
  | "activities"

type ClientBranchSummary = {
  id: string
  branch_name: string
  city?: string | null
  state?: string | null
}

type ClientDetailsResponse = {
  client?: Record<string, unknown>
  contacts?: Contact[]
  deals?: Deal[]
  error?: string
}

type BranchesResponse = {
  branches?: ClientBranchSummary[]
  error?: string
}

type ActivitiesResponse = {
  activities?: Activity[]
  error?: string
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readString(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readNullableString(
  value: unknown
) {
  const normalized =
    readString(value)

  return normalized || null
}

function normalizeStatus(
  value: unknown
): ClientStatus {
  if (
    value === "inactive" ||
    value === "prospect"
  ) {
    return value
  }

  return "active"
}

/*
 * API / Supabase currently returns:
 *
 * created_at
 * updated_at
 *
 * while the existing Client UI type expects:
 *
 * createdAt
 * updatedAt
 *
 * Keep that compatibility conversion here rather
 * than changing the shared Client type.
 */
function mapClientResponse(
  value: Record<string, unknown>
): Client {
  return {
    id:
      readString(
        value.id
      ),

    company_name:
      readString(
        value.company_name
      ),

    industry:
      readNullableString(
        value.industry
      ),

    website:
      readNullableString(
        value.website
      ),

    gst_number:
      readNullableString(
        value.gst_number
      ),

    company_size:
      readNullableString(
        value.company_size
      ),

    email:
      readNullableString(
        value.email
      ),

    phone:
      readNullableString(
        value.phone
      ),

    address_line_1:
      readNullableString(
        value.address_line_1
      ),

    city:
      readNullableString(
        value.city
      ),

    state:
      readNullableString(
        value.state
      ),

    country:
      readNullableString(
        value.country
      ),

    postal_code:
      readNullableString(
        value.postal_code
      ),

    status:
      normalizeStatus(
        value.status
      ),

    createdAt:
      readString(
        value.createdAt
      ) ||
      readString(
        value.created_at
      ),

    updatedAt:
      readString(
        value.updatedAt
      ) ||
      readString(
        value.updated_at
      ),

    created_by:
      readNullableString(
        value.created_by
      ),

    color:
      readString(
        value.color
      ) ||
      "#4c7ee1",

    notes:
      readNullableString(
        value.notes
      ),
  }
}

function getBranchLocation(
  branch:
    ClientBranchSummary
) {
  return [
    branch.city,
    branch.state,
  ]
    .filter(Boolean)
    .join(", ")
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ClientDetailsPage({
  params,
}: PageProps) {
  const {
    id,
  } =
    use(params)

  const [
    client,
    setClient,
  ] =
    useState<
      Client | null
    >(null)

  const [
    contacts,
    setContacts,
  ] =
    useState<Contact[]>(
      []
    )

  const [
    deals,
    setDeals,
  ] =
    useState<Deal[]>(
      []
    )

  const [
    branches,
    setBranches,
  ] =
    useState<
      ClientBranchSummary[]
    >([])

  const [
    activities,
    setActivities,
  ] =
    useState<Activity[]>(
      []
    )

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ClientTab>(
      "details"
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const [
    warning,
    setWarning,
  ] =
    useState<
      string | null
    >(null)

  /* ------------------------------------------------------------------------ */
  /* Load Client                                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled =
      false

    async function loadClientDetails() {
      try {
        setLoading(true)
        setError(null)
        setWarning(null)

        const supabase =
          getSupabaseClient()

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        const token =
          session?.access_token

        if (!token) {
          throw new Error(
            "Please sign in to load client details."
          )
        }

        const headers = {
          Authorization:
            `Bearer ${token}`,
        }

        /*
         * Main Client API already returns:
         *
         * client
         * contacts
         * deals
         *
         * Branches and activities are separate APIs.
         */

        const [
          clientResponse,
          branchesResponse,
          activitiesResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/clients/${encodeURIComponent(
                id
              )}`,
              {
                cache:
                  "no-store",
                headers,
              }
            ),

            fetch(
              `/api/branches?client_id=${encodeURIComponent(
                id
              )}`,
              {
                cache:
                  "no-store",
                headers,
              }
            ),

            fetch(
              `/api/activities?module=client&id=${encodeURIComponent(
                id
              )}`,
              {
                cache:
                  "no-store",
                headers,
              }
            ),
          ])

        /* ------------------------------------------------------------------ */
        /* Client / Contacts / Deals                                          */
        /* ------------------------------------------------------------------ */

        const clientData =
          (await clientResponse.json()) as
            ClientDetailsResponse

        if (
          !clientResponse.ok ||
          !clientData.client
        ) {
          throw new Error(
            clientData.error ??
              "Failed to load client details."
          )
        }

        if (cancelled) {
          return
        }

        setClient(
          mapClientResponse(
            clientData.client
          )
        )

        setContacts(
          clientData.contacts ??
            []
        )

        setDeals(
          clientData.deals ??
            []
        )

        /* ------------------------------------------------------------------ */
        /* Branches + Activities                                              */
        /* ------------------------------------------------------------------ */

        const warnings:
          string[] = []

        const branchesData =
          (await branchesResponse.json()) as
            BranchesResponse

        if (
          branchesResponse.ok
        ) {
          setBranches(
            branchesData.branches ??
              []
          )
        } else {
          setBranches([])

          warnings.push(
            branchesData.error ??
              "Branches could not be loaded."
          )
        }

        const activitiesData =
          (await activitiesResponse.json()) as
            ActivitiesResponse

        if (
          activitiesResponse.ok
        ) {
          setActivities(
            activitiesData.activities ??
              []
          )
        } else {
          setActivities([])

          warnings.push(
            activitiesData.error ??
              "Activities could not be loaded."
          )
        }

        setWarning(
          warnings.length >
            0
            ? warnings.join(
                " "
              )
            : null
        )
      } catch (
        caughtError
      ) {
        if (cancelled) {
          return
        }

        setClient(null)
        setContacts([])
        setDeals([])
        setBranches([])
        setActivities([])

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Failed to load client details."
        )
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          )
        }
      }
    }

    void loadClientDetails()

    return () => {
      cancelled =
        true
    }
  }, [id])

  /* ------------------------------------------------------------------------ */
  /* Tabs                                                                     */
  /* ------------------------------------------------------------------------ */

  const tabs: Array<{
    key: ClientTab
    label: string
  }> = [
    {
      key:
        "details",

      label:
        "Details",
    },

    {
      key:
        "deals",

      label:
        `Deals (${deals.length})`,
    },

    {
      key:
        "activities",

      label:
        "Activities",
    },
  ]

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="content">
        <div className="stat-card text-sm text-[var(--text3)]">
          Loading client details...
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (!client) {
    return (
      <div className="content">
        <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {
            error ??
            "Client not found."
          }
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="content">

      {/* Non-critical API warning */}

      {warning && (
        <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
          {
            warning
          }
        </div>
      )}

      {/* Header */}

      <div className="mb-[18px]">
        <div className="mb-1 text-xs text-[var(--text3)]">
          Client
        </div>

        <h1 className="text-2xl font-semibold text-[var(--text)]">
          {
            client.company_name ||
            "Client"
          }
        </h1>
      </div>

      {/* Main Layout */}

      <div className="grid items-start gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">

        {/* -------------------------------------------------------------- */}
        {/* Left Sidebar                                                   */}
        {/* -------------------------------------------------------------- */}

        <aside className="flex flex-col gap-3">

          {/* Company Information */}

          <div className="stat-card">
            <div className="section-heading">
              Company Information
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Industry
              </div>

              <div className="info-row-val">
                {
                  client.industry ??
                  "—"
                }
              </div>
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Status
              </div>

              <div className="info-row-val capitalize">
                {
                  client.status
                }
              </div>
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Created By
              </div>

              <div className="info-row-val break-all">
                {
                  client.created_by ??
                  "—"
                }
              </div>
            </div>
          </div>

          {/* Branches */}

          <div className="stat-card">
            <div className="section-heading">
              Branches (
              {
                branches.length
              }
              )
            </div>

            {branches.length ===
            0 ? (
              <div className="mt-3 text-sm text-[var(--text3)]">
                No branches found.
              </div>
            ) : (
              branches.map(
                (
                  branch,
                  index
                ) => {
                  const location =
                    getBranchLocation(
                      branch
                    )

                  return (
                    <div
                      className="info-row"
                      key={
                        branch.id
                      }
                    >
                      <div className="info-row-label">
                        Branch{" "}
                        {
                          index +
                          1
                        }
                      </div>

                      <div className="info-row-val">
                        <div>
                          {
                            branch.branch_name
                          }
                        </div>

                        {location && (
                          <div className="mt-1 text-xs text-[var(--text3)]">
                            {
                              location
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              )
            )}
          </div>
        </aside>

        {/* -------------------------------------------------------------- */}
        {/* Center Workspace                                               */}
        {/* -------------------------------------------------------------- */}

        <main className="min-w-0">

          {/* Tabs */}

          <div className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-1">

            {tabs.map(
              (tab) => {
                const active =
                  activeTab ===
                  tab.key

                return (
                  <button
                    key={
                      tab.key
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.key
                      )
                    }
                    className={`whitespace-nowrap rounded-[calc(var(--radius)-4px)] px-3.5 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "text-[var(--text3)] hover:text-[var(--text)]"
                    }`}
                  >
                    {
                      tab.label
                    }
                  </button>
                )
              }
            )}
          </div>

          {/* Tab Content */}

          <div className="client-workspace-content">

            {activeTab ===
              "details" && (
              <ClientDetailsTab
                client={
                  client
                }
              />
            )}

            {activeTab ===
              "deals" && (
              <ClientDealsTab
                deals={
                  deals
                }
              />
            )}

            {activeTab ===
              "activities" && (
              <ActivitiesTab
                activities={
                  activities
                }
              />
            )}

          </div>
        </main>

        {/* -------------------------------------------------------------- */}
        {/* Right Sidebar                                                  */}
        {/* -------------------------------------------------------------- */}

        <aside className="flex flex-col gap-3">

          {/* Contacts */}

          <div className="stat-card">
            <div className="section-heading">
              Contacts (
              {
                contacts.length
              }
              )
            </div>

            <div className="mt-3 flex flex-col gap-2.5">

              {contacts.length ===
              0 ? (
                <div className="text-sm text-[var(--text3)]">
                  No contacts found.
                </div>
              ) : (
                contacts.map(
                  (
                    contact
                  ) => {
                    const contactPhone =
                      contact.mobile ||
                      contact.phone

                    return (
                      <div
                        key={
                          contact.id
                        }
                        className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3"
                      >
                        <div className="text-sm font-semibold text-[var(--text)]">
                          {
                            contact.name
                          }
                        </div>

                        <div className="mt-0.5 text-xs text-[var(--text2)]">
                          {
                            contact.designation ||
                            contact.department ||
                            "No designation"
                          }
                        </div>

                        {(contact.email ||
                          contactPhone) && (
                          <div className="mt-2 space-y-1 text-xs text-[var(--text3)]">

                            {contact.email && (
                              <div className="break-all">
                                {
                                  contact.email
                                }
                              </div>
                            )}

                            {contactPhone && (
                              <div>
                                {
                                  contactPhone
                                }
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )
                  }
                )
              )}
            </div>
          </div>

          {/* Notes */}

          <div className="stat-card">
            <div className="section-heading">
              Notes
            </div>

            <div className="mt-3 text-sm text-[var(--text2)]">
              {
                client.notes ||
                "No notes recorded."
              }
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
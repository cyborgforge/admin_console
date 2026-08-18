"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Client } from "@/types/client"
import { Contact } from "@/types/contacts"
import { Deal } from "@/types/deals"
import { getSupabaseClient } from "@/lib/supabaseClient"
import ClientDetailsTab from "@/components/clients/clientDetailsTab"
import { useRouter } from "next/router"
import ClientDealsTab from "@/components/clients/clientDealsTab"
import ActivitiesTab from "@/components/activities/ActivitiesTab"
import type { Activity } from "@/types/activity";
type ClientTab =
  | "details"
  | "deals"
  | "activities"
  | "subscriptions"
  | "cases"


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

const getTabStyle = (
  active: boolean
): React.CSSProperties => ({
  border: "none",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: "calc(var(--radius) - 4px)",
  fontSize: "13px",
  fontWeight: 500,
  background: active
    ? "var(--accent-dim)"
    : "transparent",
  color: active
    ? "var(--accent)"
    : "var(--text3)",
  transition: "all .15s ease",
})

interface PageProps {
  params: Promise<{ id: string }>
}
export default function ClientDetailsPage({ params }: PageProps) {
    const [client, setClient] = useState<Client | null>(null)
    const [contacts, setContacts] = useState<Contact[] | null>([])
    const [deals, setDeals] = useState<Deal[] | null>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activities, setActivities] = useState<Activity[]>([]);

    //loader function to fetch client details by ID and set state
    const loadClient = async (
  clientId: string,
  showLoader = false
) => {
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
      throw new Error(
        "Please sign in to load client."
      )
    }

    const response = await fetch(
      `/api/clients/${clientId}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const responseData =
        (await response.json()) as {
          error?: string
        }

      throw new Error(
        responseData.error ??
          "Failed to load client."
      )
    }

    const data =
      (await response.json()) as {
        client: Client
        contacts: Contact[]
        deals: Deal[]
      }

    setClient(data.client)
    setContacts(data.contacts)
    setDeals(data.deals)


    const activityResponse = await fetch(
  `/api/activities?module=client&id=${clientId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const activityData = await activityResponse.json();

setActivities(activityData.activities);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to load client."
    )
  } finally {
    setLoading(false)
  }
}

// fetching current client using url client id
// const params = useParams<{
//   id: string
// }>()



  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  //const router = useRouter()

useEffect(() => {
  if (!id) return

  loadClient(id, true)
}, [id])

//---------

  const [activeTab, setActiveTab] =
    useState<ClientTab>("details")

  const tabs = [
    {
      key: "details",
      label: "Details",
    },
    {
      key: "deals",
      label: "Deals (1)",
    },
    {
      key: "activities",
      label: "Activities",
    },
    // {
    //   key: "subscriptions",
    //   label: "Subscriptions (1)",
    // },
    // {
    //   key: "cases",
    //   label: "Cases (1)",
    // },
  ] as const

  return (
    <div className="content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
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
            Client
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Apollo Pharmacy
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <Button
            variant="outline"
            className="btn btn-ghost"
          >
            Edit Client
          </Button>

          <Button className="btn btn-primary">
            New Deal
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "260px minmax(0,1fr) 300px",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div className="stat-card">
            <div className="section-heading">
              Company Information
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Branch
              </div>
              <div className="info-row-val">
                {"Chennai"}
              </div>
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Industry
              </div>
              <div className="info-row-val">
                 {client?.industry ?? "—"}
              </div>
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Status
              </div>
              <div className="info-row-val">
                {client?.status ?? "—"}
              </div>
            </div>

            <div className="info-row">
              <div className="info-row-label">
                Managed By
              </div>
              <div className="info-row-val">
               {client?.created_by ?? "—"}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="section-heading">
              Documents (3)
            </div>
          </div>
        </div>

        {/* Center Workspace */}
        <div>
          <div style={tabContainerStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={getTabStyle(
                  activeTab === tab.key
                )}
                onClick={() =>
                  setActiveTab(
                    tab.key as ClientTab
                  )
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="client-workspace-content">
            {activeTab ===
              "details" && (
               <ClientDetailsTab client={client} />
            )}

            {activeTab ===
              "deals" && (
              <ClientDealsTab deals={deals || []} />
            )}

            {activeTab === "activities" && (
               <ActivitiesTab
                  activities={activities}
                />
            )}

            {activeTab ===
              "subscriptions" && (
              <ClientSubscriptionsTab />
            )}

            {activeTab ===
              "cases" && (
              <ClientCasesTab />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
            {/* Contacts Highlight Card*/}
         <div className="stat-card">
  <div className="section-heading">
    Contacts ({contacts?.length})
  </div>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginTop: "12px",
    }}
  >
    {contacts?.length === 0 ? (
      <div
        style={{
          color: "var(--text3)",
          fontSize: "13px",
        }}
      >
        No contacts found
      </div>
    ) : (
      contacts?.map((contact) => (
        <div
          key={contact.id}
          style={{
            padding: "12px",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {contact.name}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "var(--text2)",
              marginTop: "2px",
            }}
          >
            {contact.designation ?? "No designation"}
          </div>

          {/* {(contact.email || contact.mobile) && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--text3)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              {contact.email && (
                <span>{contact.email}</span>
              )}

              {contact.mobile && (
                <span>{contact.mobile}</span>
              )}
            </div>
          )} */}
        </div>
      ))
    )}
  </div>
</div>

          <div className="stat-card">
            <div className="section-heading">
              Notes
            </div>
            <div>
                {client?.notes || "No notes recorded."}
            </div>
          </div>

          {/* <div className="stat-card">
            <div className="section-heading">
              Activities
            </div>
             <div style={{
              color: "var(--text3)",
              fontSize: "13px",
            }}>
                {"No activities recorded."}
            </div>
          </div> */}

          <div className="stat-card">
            <div className="section-heading">
              Tasks
            </div>
             <div style={{
              color: "var(--text3)",
              fontSize: "13px",
            }}>
                {"No activities recorded."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// function ClientDetailsTab() {
//   return (
//     <div className="stat-card">
//       Details Content
//     </div>
//   )
// }

// function ClientDealsTab() {
//   return (
//     <div className="stat-card">
//       Deals Pipeline
//     </div>
//   )
// }

function ClientSubscriptionsTab() {
  return (
    <div className="stat-card">
      Subscriptions Table
    </div>
  )
}

function ClientCasesTab() {
  return (
    <div className="stat-card">
      Cases Table
    </div>
  )
}
"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, Search } from "lucide-react"
import ViewLead from "@/components/leads/ViewLead"
import EditLead from "@/components/leads/EditLead"
import { getSupabaseClient } from "@/lib/supabaseClient"
import CreateLeadModal from "@/components/leads/createLeadModal"
import CreateLeadButton from "@/components/leads/createLeadButton"

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadStatus = "discovery" | "contacted" | "reviewing" | "closed-won" | "closed-lost"

export type CreateLeadDraft = {
  leadName: string
  company: string
  email: string
  phone: string
  status: LeadStatus
}

export interface Lead {
  id: string
  //name: string
  leadName: string
  //org: string
  company: string
  email: string
  phone: string
  status: LeadStatus
  //addedOn: string
  createdDate: string
  //notes: string
  color: string
}


// ─── Mock data ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#4c7ee1", "#8b5cf6", "#ec4899", "#d3a335", "#1ead82", "#06b6d4", "#f97316"]

// const MOCK_LEADS: Lead[] = [
//   { id: "L-1001", name: "Murali Prakash S", org: "Murali & Co",      email: "murali@gmail.com",   phone: "6734567183", status: "new",       addedOn: "2026-04-10", notes: "", color: "#4c7ee1" },
//   { id: "L-1002", name: "Anitha Rajan",     org: "Anitha Pharma",    email: "anitha@gmail.com",   phone: "9876543210", status: "contacted", addedOn: "2026-04-11", notes: "Interests: Pharmacy Suite, Clinic Suite", color: "#8b5cf6" },
//   { id: "L-1003", name: "Vikram Suresh",    org: "Vikram Clinics",   email: "vikram@gmail.com",   phone: "8765432109", status: "reviewed",  addedOn: "2026-04-12", notes: "", color: "#ec4899" },
//   { id: "L-1004", name: "Priya Nair",       org: "Priya Health",     email: "priya@gmail.com",    phone: "7654321098", status: "found",     addedOn: "2026-04-13", notes: "", color: "#1ead82" },
//   { id: "L-1005", name: "Senthil Kumar",    org: "SK Medicals",      email: "senthil@gmail.com",  phone: "6543210987", status: "not_found", addedOn: "2026-04-14", notes: "", color: "#d3a335" },
//   { id: "L-1006", name: "Deepa Menon",      org: "Deepa Healthcare", email: "deepa@gmail.com",    phone: "9988776655", status: "new",       addedOn: "2026-04-15", notes: "", color: "#06b6d4" },
//   { id: "L-1007", name: "Arun Chandran",    org: "Arun Hospitals",   email: "arun@gmail.com",     phone: "8877665544", status: "converted", addedOn: "2026-04-16", notes: "", color: "#f97316" },
//   { id: "L-1008", name: "Kavitha Balu",     org: "Kavitha Pharmacy", email: "kavitha@gmail.com",  phone: "7766554433", status: "new",       addedOn: "2026-04-17", notes: "", color: "#4c7ee1" },
//   { id: "L-1009", name: "Ravi Shankar",     org: "Ravi Surgicals",   email: "ravi@gmail.com",     phone: "6655443322", status: "archived",  addedOn: "2026-04-18", notes: "", color: "#8b5cf6" },
//   { id: "L-1010", name: "Meena Pillai",     org: "Meena Medicals",   email: "meena@gmail.com",    phone: "9900112233", status: "new",       addedOn: "2026-04-19", notes: "", color: "#1ead82" },
//   { id: "L-1011", name: "Suresh Babu",      org: "Suresh Clinics",   email: "suresh@gmail.com",   phone: "8811223344", status: "contacted", addedOn: "2026-04-20", notes: "", color: "#d3a335" },
//   { id: "L-1012", name: "Lakshmi Venkat",   org: "Lakshmi Stores",   email: "lakshmi@gmail.com",  phone: "7722334455", status: "new",       addedOn: "2026-04-21", notes: "", color: "#ec4899" },
// ]

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<LeadStatus, { label: string; bg: string; color: string; dot: string }> = {
  "discovery":       { label: "New",       bg: "rgba(76,126,225,0.12)",  color: "#4c7ee1", dot: "#4c7ee1" },
  "contacted": { label: "Contacted", bg: "rgba(211,163,53,0.12)",  color: "#d3a335", dot: "#d3a335" },
  "reviewing":  { label: "Reviewed",  bg: "rgba(110,107,176,0.12)", color: "#6e6bb0", dot: "#6e6bb0" },
  "closed-won":     { label: "Found",     bg: "rgba(74,171,176,0.12)",  color: "#4aabb0", dot: "#4aabb0" },
  "closed-lost": { label: "Not Found", bg: "rgba(196,96,111,0.12)",  color: "#c4606f", dot: "#c4606f" },
  // converted: { label: "Converted", bg: "rgba(30,173,130,0.12)",  color: "#1ead82", dot: "#1ead82" },
  // archived:  { label: "Archived",  bg: "rgba(90,96,112,0.12)",   color: "#5a6070", dot: "#5a6070" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all")
  const [period, setPeriod] = useState("all")
  const [activeTab, setActiveTab] = useState<"all" | "archived" | "existing">("all")

  // View dialog state — null = closed, otherwise the lead being viewed
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  // Whether the view dialog is in "edit mode"
  const [isEditing, setIsEditing] = useState(false)
  // Editable draft inside the view dialog
  const [editDraft, setEditDraft] = useState<Lead | null>(null)
  // whether the create lead dialog is open
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] =
  useState<CreateLeadDraft>({
    leadName: "",
    company: "",
    email: "",
    phone: "",
    status: "discovery",
  })

  // New lead dialog
  const [newOpen, setNewOpen] = useState(false)
  const [nName, setNName] = useState("")
  const [nOrg, setNOrg] = useState("")
  const [nEmail, setNEmail] = useState("")
  const [nPhone, setNPhone] = useState("")
  const [nStatus, setNStatus] = useState<LeadStatus>("discovery")

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     leads.length,
    newLeads:  leads.filter((l) => l.status === "discovery").length,
    contacted: leads.filter((l) => l.status === "contacted" || l.status === "reviewing").length,
    converted: leads.filter((l) => l.status === "closed-won").length,
  }), [leads])

  const tabCounts = useMemo(() => ({
    all:      leads.length,
    archived: leads.filter((l) => l.status === "closed-won" || l.status === "closed-lost").length,
    existing: leads.filter((l) => l.status !== "closed-won" && l.status !== "closed-lost").length,
  }), [leads])

  // // ── Filtered rows ──────────────────────────────────────────────────────────
  // const filtered = useMemo(() => leads.filter((l) => {
  //   const q = `${l.id} ${l.leadName} ${l.company} ${l.email} ${l.phone}`.toLowerCase()
  //   const mQ = q.includes(query.toLowerCase())
  //   const mS = statusFilter === "all" || l.status === statusFilter
  //   const mT = activeTab === "archived" ? l.status === "archived"
  //            : activeTab === "existing"  ? l.status === "converted"
  //            : l.status !== "archived"
  //   return mQ && mS && mT
  // }), [leads, query, statusFilter, activeTab])

  // --- New Filtered rows

  const filtered = useMemo(() =>
  leads.filter((l) => {
    const q = `${l.id} ${l.leadName} ${l.company} ${l.email} ${l.phone}`.toLowerCase()

    const mQ = q.includes(query.toLowerCase())

    const mS =
      statusFilter === "all" ||
      l.status === statusFilter

    const mT =
      activeTab === "archived"
        ? l.status === "closed-won" || l.status === "closed-lost"
        : activeTab === "existing"
        ? l.status !== "closed-won" && l.status !== "closed-lost"
        : true

    return mQ && mS && mT
  }),
  [leads, query, statusFilter, activeTab]
)
// -----

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!nName.trim() || !nEmail.trim()) return
    const lead: Lead = {
      id: `L-${1000 + leads.length + 1}`,
      leadName: nName, company: nOrg, email: nEmail, phone: nPhone, status: nStatus,
      createdDate: new Date().toISOString().slice(0, 10),
      //notes: "",
      color: AVATAR_COLORS[leads.length % AVATAR_COLORS.length],
    }
    setLeads((p) => [lead, ...p])
    setNewOpen(false)
    setNName(""); setNOrg(""); setNEmail(""); setNPhone(""); setNStatus("discovery")
  }

  // Open view dialog
  const openView = (lead: Lead) => {
    setViewingLead({ ...lead })
    setIsEditing(false)
    setEditDraft(null)
  }

  // Enter edit mode inside view dialog
  const startEdit = () => {
    if (!viewingLead) return
    setEditDraft({ ...viewingLead })
    setIsEditing(true)
  }

  // Save edits and exit edit mode
  // const saveEdit = () => {
  //   if (!editDraft) return
  //   setLeads((p) => p.map((l) => l.id === editDraft.id ? editDraft : l))
  //   setViewingLead({ ...editDraft })
  //   setIsEditing(false)
  //   setEditDraft(null)
  // }
const saveEdit = async () => {
  if (!editDraft) return

  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token

    if (!token) {
      throw new Error("Please sign in.")
    }

    const response = await fetch(
      `/api/leads/${editDraft.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadName: editDraft.leadName,
          company: editDraft.company,
          email: editDraft.email,
          phone: editDraft.phone,
          status: editDraft.status,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()

      throw new Error(
        errorData.error ?? "Failed to update lead."
      )
    }

    const data = await response.json()

    const updatedLead = data.lead ?? editDraft

    setLeads((current) =>
      current.map((lead) =>
        lead.id === updatedLead.id
          ? updatedLead
          : lead
      )
    )

    setViewingLead(updatedLead)
    setIsEditing(false)
    setEditDraft(null)
  } catch (error) {
    console.error(error)
    setError(
      error instanceof Error
        ? error.message
        : "Failed to update lead."
    )
  }
}

// ----- create lead handler
const createLead = async () => {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token

    if (!token) {
      throw new Error("Please sign in.")
    }

    const response = await fetch(
      "/api/leads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadName: createDraft.leadName,
          company: createDraft.company,
          email: createDraft.email,
          phone: createDraft.phone,
          status: createDraft.status,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()

      throw new Error(
        errorData.error ?? "Failed to create lead."
      )
    }

    const data = await response.json()

    const createdLead = data.lead as Lead

    setLeads((current) => [
      createdLead,
      ...current,
    ])

    setCreateDraft({
      leadName: "",
      company: "",
      email: "",
      phone: "",
      status: "discovery",
    })

    setIsCreateOpen(false)
  } catch (error) {
    console.error(error)

    setError(
      error instanceof Error
        ? error.message
        : "Failed to create lead."
    )
  }
}

//-------------

  // Cancel edit mode
  const cancelEdit = () => {
    setIsEditing(false)
    setEditDraft(null)
  }

  // Close view dialog
  const closeView = () => {
    setViewingLead(null)
    setIsEditing(false)
    setEditDraft(null)
  }

  // Update status directly from view (non-edit mode)
  const updateViewStatus = (status: LeadStatus) => {
    if (!viewingLead) return
    const updated = { ...viewingLead, status }
    setViewingLead(updated)
    setLeads((p) => p.map((l) => l.id === updated.id ? updated : l))
  }

  // const handleDeleteLead = (id: string) => {
  //   setLeads((p) => p.filter((l) => l.id !== id))
  //   closeView()
  // }
const handleDeleteLead = async (id: string) => {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token

    if (!token) {
      throw new Error("Please sign in.")
    }

    const response = await fetch(
      `/api/leads/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()

      throw new Error(
        errorData.error ?? "Failed to delete lead."
      )
    }

    setLeads((current) =>
      current.filter(
        (lead) => lead.id !== id
      )
    )

    closeView()
  } catch (error) {
    console.error(error)

    setError(
      error instanceof Error
        ? error.message
        : "Failed to delete lead."
    )
  }
}


  const closeCreateModal = () => {
  setIsCreateOpen(false)

  setCreateDraft({
    leadName: "",
    company: "",
    email: "",
    phone: "",
    status: "discovery",
  })
}

  // --- data fetching from supabase

  useEffect(() => {
  async function loadLeads(showLoader = false) {
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
        throw new Error("Please sign in to load leads.")
      }

      const response = await fetch("/api/leads", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const responseData = (await response.json()) as {
          error?: string
        }

        throw new Error(
          responseData.error ?? "Failed to load leads."
        )
      }

      const data = (await response.json()) as {
        leads: Lead[]
        status?: string
      }

      setLeads(data.leads ?? [])
    } catch {
      setError("Failed to load leads.")
    } finally {
      setLoading(false)
    }
  }

  loadLeads(true)
}, [])

// ----------------

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      
      <div className="lp-content">

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="lp-stats">
          <div className="lp-stat-card">
            <div className="lp-stat-label">TOTAL LEADS</div>
            <div className="lp-stat-val lp-stat-white">{stats.total}</div>
            <div className="lp-stat-change lp-up">↑ +12 This week</div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-label">NEW LEADS</div>
            <div className="lp-stat-val lp-stat-amber">{stats.newLeads}</div>
            <div className="lp-stat-sub">Awaiting response</div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-label">CONTACTED</div>
            <div className="lp-stat-val lp-stat-blue">{stats.contacted}</div>
            <div className="lp-stat-sub lp-stat-blue-sub">In Progress</div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-label">CONVERTED</div>
            <div className="lp-stat-val lp-stat-green">{stats.converted}</div>
            <div className="lp-stat-change lp-up">↑ Increased</div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="lp-tabs">
          {(["all", "archived", "existing"] as const).map((tab) => (
            <button
              key={tab}
              className={`lp-tab ${activeTab === tab ? "lp-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="lp-tab-count">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="lp-filters">
          <div className="lp-search">
            <Search size={13} color="#3d4450" />
            <input
              className="lp-search-input"
              placeholder="Search by client, quote ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="lp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | LeadStatus)}
          >
            <option value="all">All Status</option>
            <option value="discovery">Discovery</option>
            <option value="contacted">Contacted</option>
            <option value="reviewing">Reviewed</option>
            <option value="closed-won">Found</option>
            <option value="closed-lost">Not Found</option>
            {/* <option value="converted">Converted</option> */}
          </select>
          <select className="lp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">All time</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <CreateLeadButton
  onClick={() => {
    setCreateDraft({
      leadName: "",
      company: "",
      email: "",
      phone: "",
      status: "discovery",
    })

    setIsCreateOpen(true)
  }}
/>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead>
              <tr>
                <th>LEAD ID</th>
                <th>LEAD NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>STATUS</th>
                <th>ADDED ON</th>
                <th>VIEW</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="lp-empty">
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
                    <div>No leads found</div>
                  </td>
                </tr>
              ) : filtered.map((lead) => (
                <tr key={lead.id} className="lp-row">
                  <td className="lp-id">{lead.id}</td>
                  <td>
                    <div className="lp-name-cell">
                      <div
                        className="lp-avatar"
                        style={{ background: `${lead.color}22`, color: lead.color }}
                      >
                        {getInitials(lead.leadName)}
                      </div>
                      <div>
                        <div className="lp-name">{lead.leadName}</div>
                        <div className="lp-org">{lead.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="lp-muted">{lead.email}</td>
                  <td className="lp-muted">{lead.phone}</td>
                  <td>
                    <span
                      className="lp-badge"
                      style={{
                        background: statusConfig[lead.status].bg,
                        color: statusConfig[lead.status].color,
                        borderColor: statusConfig[lead.status].color + "33",
                      }}
                    >
                      <span className="lp-dot" style={{ background: statusConfig[lead.status].dot }} />
                      {statusConfig[lead.status].label}
                    </span>
                  </td>
                  <td className="lp-muted">{lead.createdDate}</td>
                  <td>
                    <div className="lp-actions">
                      <button
                        className="lp-icon-btn"
                        title="View"
                        onClick={() => openView(lead)}
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View / Edit Lead Dialog ──────────────────────────────────────────── */}
      {viewingLead && !isEditing && (
        <ViewLead
          lead={viewingLead}
          statusConfig={statusConfig}
          closeView={closeView}
          startEdit={startEdit}
          handleDeleteLead={handleDeleteLead}
          updateViewStatus={updateViewStatus}
        />
      )}

      {editDraft && isEditing && (
        <EditLead
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          statusConfig={statusConfig}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
        />
      )}

      {/* ── Create Lead Modal ──────────────────────────────────────────────────── */}
    

      {isCreateOpen && (
       <CreateLeadModal
  createDraft={createDraft}
  setCreateDraft={setCreateDraft}
  saveCreate={createLead}
  onClose={closeCreateModal}
/>
        )}

      {/* ── New Lead Dialog ──────────────────────────────────────────────────── */}
    

      {/* ── All styles ───────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Page-level header (outside lp-content) ───────────────────────── */
        .lp-page-header {
          display: flex;
          width:100%;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 20px;
          background: #171A21;
          position: sticky;
          top: 56px;
          z-index: 4;
        }
        .lp-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #e0e3ea;
          margin: 0;
        }
        .lp-header-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #e5e7eb;
          color: #111827;
          border: none;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .lp-header-btn:hover { background: #d1d5db; }

        /* ── Layout ───────────────────────────────────────────────────────── */
        .lp-content {
          width: 100%;
          padding: 20px 24px 24px;
          background: #141416;
          min-height: calc(100vh - 56px);
          box-sizing: border-box;
        } 

        /* ── Stat Cards ───────────────────────────────────────────────────── */
        .lp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .lp-stat-card {
          background: #161920;
          border: 1px solid #646465;
          border-radius: 10px;
          padding: 18px 20px 16px;
        }
        .lp-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #3d4450;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .lp-stat-val {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .lp-stat-white  { color: #e0e3ea; }
        .lp-stat-amber  { color: #d3a335; }
        .lp-stat-blue   { color: #4c7ee1; }
        .lp-stat-green  { color: #1ead82; }

        .lp-stat-change { font-size: 11px; color: #3d4450; }
        .lp-stat-change.lp-up { color: #1ead82; }
        .lp-stat-sub { font-size: 11px; color: #3d4450; }
        .lp-stat-blue-sub { color: #4c7ee1 !important; }

        /* ── Tabs ─────────────────────────────────────────────────────────── */
        .lp-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 16px;
          border-bottom: 1px solid #1d2027;
        }
        .lp-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 8px 16px 10px;
          font-size: 13px;
          font-weight: 500;
          color: #5a6070;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: -1px;
          transition: color 0.15s;
          font-family: inherit;
        }
        .lp-tab:hover { color: #c8d0e0; }
        .lp-tab-active { color: #c8d0e0 !important; border-bottom-color: #4c7ee1; }
        .lp-tab-count { font-size: 11px; color: #3d4450; }
        .lp-tab-active .lp-tab-count { color: #4c7ee1; }

        /* ── Filters ──────────────────────────────────────────────────────── */
        .lp-filters {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0;
        }
        .lp-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #21252e;
          border: 1px solid #2a2f3a;
          border-radius: 8px;
          padding: 7px 12px;
          flex: 1;
          max-width: 300px;
        }
        .lp-search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: #c8d0e0;
          width: 100%;
          font-family: inherit;
        }
        .lp-search-input::placeholder { color: #3d4450; }
        .lp-select {
          background: #21252e;
          border: 1px solid #2a2f3a;
          border-radius: 8px;
          padding: 7px 30px 7px 12px;
          font-size: 13px;
          color: #c8d0e0;
          cursor: pointer;
          outline: none;
          font-family: inherit;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%233d4450' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .lp-select option { background: #161920; color: #c8d0e0; }

        /* ── Table ────────────────────────────────────────────────────────── */
        .lp-table-wrap {
          margin-top: 16px;
          border: 1px solid #2b313c;
          border-radius: 14px;
          overflow: hidden;
        }
        .lp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .lp-table thead tr { background: #1F2128; }
        .lp-table th {
          padding: 10px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          color: #3d4450;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .lp-row { background: #171A21; transition: all 0.12s ease; }
        .lp-row:hover { background: #222833; transform: translateY(-1px); }
        .lp-table td { padding: 12px 16px; vertical-align: middle; }
        .lp-id { font-size: 12px; color: #929499; font-weight: 500; white-space: nowrap; }
        .lp-name-cell { display: flex; align-items: center; gap: 10px; }
        .lp-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .lp-name { font-size: 13px; font-weight: 500; color: #c2c8cc; line-height: 1.3; }
        .lp-org { font-size: 11px; color: #9e9fa0; margin-top: 1px; }
        .lp-muted { color: #9ba0ae; font-size: 13px; }

        /* ── Badge ────────────────────────────────────────────────────────── */
        .lp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 500;
          border: 1px solid transparent; white-space: nowrap;
        }
        .lp-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* ── Row actions ──────────────────────────────────────────────────── */
        .lp-actions { display: flex; align-items: center; gap: 4px; }
        .lp-icon-btn {
          background: none; border: none; color: #3d4450; cursor: pointer;
          padding: 5px; border-radius: 6px; display: flex; align-items: center;
          transition: color 0.12s, background 0.12s;
        }
        .lp-icon-btn:hover { color: #c8d0e0; background: rgba(255,255,255,0.05); }

        /* ── Empty state ──────────────────────────────────────────────────── */
        .lp-empty { text-align: center; padding: 48px 16px; color: #3d4450; font-size: 13px; }

        /* ── Overlay ──────────────────────────────────────────────────────── */
        .lp-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }

        /* ── View Dialog ──────────────────────────────────────────────────── */
        .lp-view-dialog {
          background: #161920; border: 1px solid #2a2f3a; border-radius: 12px;
          width: 100%; max-width: 520px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          animation: lp-in 0.16s ease; overflow: hidden;
        }
        .lp-view-topbar {
          display: flex; align-items: center;
          justify-content: space-between; padding: 16px 20px;
        }
        .lp-view-status-wrap { display: flex; align-items: center; gap: 10px; }
        .lp-view-status-label { font-size: 13px; font-weight: 500; color: #c8d0e0; }
        .lp-view-status-select-wrap {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 500;
          border: 1px solid transparent; background: #21252e;
        }
        .lp-view-status-select {
          background: transparent; border: none; outline: none;
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: inherit; appearance: none; padding-right: 14px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239ba0ae' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0px center;
        }
        .lp-view-status-select option { background: #161920; color: #c8d0e0; }
        .lp-view-topbar-actions { display: flex; align-items: center; gap: 8px; }
        .lp-view-edit-btn {
          background: #21252e; border: 1px solid #2a2f3a; border-radius: 7px;
          padding: 6px 8px; color: #9ba0ae; cursor: pointer;
          display: flex; align-items: center;
          transition: color 0.12s, border-color 0.12s;
        }
        .lp-view-edit-btn:hover { color: #c8d0e0; border-color: #3d4450; }

        /* Save / Cancel buttons in edit mode */
        .lp-save-btn {
          display: flex; align-items: center; gap: 5px;
          background: #1ead82; border: none; border-radius: 7px;
          padding: 6px 14px; font-size: 12px; font-weight: 500;
          color: #fff; cursor: pointer; font-family: inherit;
          transition: background 0.14s;
        }
        .lp-save-btn:hover { background: #18c491; }
        .lp-cancel-edit-btn {
          background: none; border: 1px solid #2a2f3a; border-radius: 7px;
          padding: 6px 12px; font-size: 12px; font-weight: 500;
          color: #5a6070; cursor: pointer; font-family: inherit;
          transition: color 0.14s, border-color 0.14s;
        }
        .lp-cancel-edit-btn:hover { color: #c8d0e0; border-color: #3d4450; }

        .lp-make-deal-btn {
          background: none; border: 1px solid #1ead82; border-radius: 7px;
          padding: 6px 14px; font-size: 12px; font-weight: 500;
          color: #1ead82; cursor: pointer; font-family: inherit;
          transition: background 0.14s;
        }
        .lp-make-deal-btn:hover { background: rgba(30,173,130,0.1); }

        .lp-view-divider { height: 1px; background: #1e2229; margin: 0 20px; }
        .lp-view-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .lp-view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lp-view-field {
          background: #1e2229; border: 1px solid #252b35;
          border-radius: 8px; padding: 12px 14px;
        }
        .lp-view-field-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.08em;
          color: #3d4450; text-transform: uppercase; margin-bottom: 5px;
        }
        .lp-view-field-val { font-size: 13px; color: #c2c8cc; font-weight: 400; }

        /* Inline inputs inside view field cards */
        .lp-inline-input {
          background: transparent; border: none; border-bottom: 1px solid #3d4450;
          outline: none; font-size: 13px; color: #c8d0e0;
          width: 100%; padding: 2px 0; font-family: inherit;
          transition: border-color 0.14s;
        }
        .lp-inline-input:focus { border-bottom-color: #4c7ee1; }
        .lp-inline-input::placeholder { color: #3d4450; }

        .lp-view-notes-field {
          background: #1e2229; border: 1px solid #252b35;
          border-radius: 8px; padding: 12px 14px; min-height: 72px;
        }
        .lp-view-notes-val { margin-top: 4px; color: #5a6070; }

        /* Inline textarea for notes */
        .lp-inline-textarea {
          background: transparent; border: none; outline: none;
          font-size: 13px; color: #c8d0e0; width: 100%;
          resize: none; min-height: 48px; font-family: inherit;
          padding: 2px 0; line-height: 1.5;
          border-bottom: 1px solid #3d4450;
          transition: border-color 0.14s;
        }
        .lp-inline-textarea:focus { border-bottom-color: #4c7ee1; }
        .lp-inline-textarea::placeholder { color: #3d4450; }

        .lp-view-footer { padding: 0 20px 18px; display: flex; align-items: center; }
        .lp-delete-btn {
          background: none; border: 1px solid rgba(196,96,111,0.4);
          border-radius: 7px; padding: 6px 14px;
          font-size: 12px; font-weight: 500; color: #c4606f;
          cursor: pointer; font-family: inherit;
          transition: background 0.14s, border-color 0.14s;
        }
        .lp-delete-btn:hover { background: rgba(196,96,111,0.1); border-color: #c4606f; }

        /* ── New Lead Dialog ──────────────────────────────────────────────── */
        .lp-dialog {
          background: #161920; border: 1px solid #2a2f3a; border-radius: 12px;
          width: 100%; max-width: 500px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          animation: lp-in 0.16s ease;
        }
        @keyframes lp-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lp-dialog-header {
          display: flex; align-items: center;
          justify-content: space-between; padding: 18px 20px 0;
        }
        .lp-dialog-title { font-size: 14px; font-weight: 600; color: #c8d0e0; }
        .lp-dialog-close {
          background: none; border: none; color: #5a6070; cursor: pointer;
          padding: 4px; border-radius: 6px; display: flex; align-items: center;
          transition: color 0.12s;
        }
        .lp-dialog-close:hover { color: #c8d0e0; }
        .lp-dialog-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
        .lp-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 20px 18px; }
        .lp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .lp-field { display: flex; flex-direction: column; gap: 5px; }
        .lp-field label {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.07em; color: #3d4450;
        }
        .lp-field input, .lp-field select {
          background: #1e2329; border: 1px solid #2a2f3a; border-radius: 7px;
          padding: 8px 11px; font-size: 13px; color: #c8d0e0; outline: none;
          transition: border-color 0.14s; font-family: inherit;
        }
        .lp-field input::placeholder { color: #3d4450; }
        .lp-field input:focus, .lp-field select:focus { border-color: #4c7ee1; }
        .lp-field select option { background: #161920; }

        .lp-btn-ghost {
          background: none; border: 1px solid #2a2f3a; border-radius: 7px;
          padding: 7px 14px; font-size: 13px; color: #5a6070; cursor: pointer;
          font-family: inherit; transition: color 0.14s, border-color 0.14s;
        }
        .lp-btn-ghost:hover { color: #c8d0e0; border-color: #3d4450; }
        .lp-btn-primary {
          background: #4c7ee1; border: none; border-radius: 7px;
          padding: 7px 14px; font-size: 13px; font-weight: 500; color: #fff;
          cursor: pointer; font-family: inherit;
          transition: background 0.14s, opacity 0.14s;
        }
        .lp-btn-primary:hover:not(:disabled) { background: #3a6dd0; }
        .lp-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </>
  )
}

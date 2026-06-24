"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
// import { getSupabaseClient } from "@/lib/supabaseClient"  // ← SUPABASE COMMENTED OUT

// Import custom components
import { ClientHeader } from "@/components/clients/client-header"
import { ClientDetailsSidebar } from "@/components/clients/client-details-sidebar"
import { DealPipeline, Deal } from "@/components/clients/deal-pipeline"
import { UpcomingTasks, Task } from "@/components/clients/upcoming-tasks"
import { AddActivityModal } from "@/components/clients/add-activity-modal"
import { NewDealModal } from "@/components/clients/new-deal-modal"
//import { AddClientDialog } from "@/components/clients/add-client-dialog"
import { NewTaskModal } from "@/components/clients/new-task-modal"

// ─────────────────────────────────────────────────────────────────────────────
// MOCK CLIENT DATA
// ─────────────────────────────────────────────────────────────────────────────
const mockClients = [
  {
    id: "1",
    name: "Apollo Hospitals",
    industry: "Healthcare",
    city: "Chennai",
    email: "apollo@hospital.com",
    phone: "+91 9876543210",
    status: "active",
    product: "Pharmacy ERP",
    totalBilled: 450000,
    quotes: 12,
    since: "Jan 2023",
    color: "#3b82f6",
    gst: "33ABCDE1234F1Z5",
    notes: "Major enterprise healthcare client.",
  },
  {
    id: "2",
    name: "MedPlus Pharma",
    industry: "Retail Pharmacy",
    city: "Hyderabad",
    email: "contact@medplus.com",
    phone: "+91 9988776655",
    status: "prospect",
    product: "POS System",
    totalBilled: 180000,
    quotes: 5,
    since: "Jun 2024",
    color: "#10b981",
    gst: "36AAACM9988L1Z2",
    notes: "Interested in multi-store integration.",
  },
  {
    id: "3",
    name: "Care Diagnostics",
    industry: "Diagnostics",
    city: "Bangalore",
    email: "info@caredx.com",
    phone: "+91 9123456789",
    status: "active",
    product: "Lab Management",
    totalBilled: 320000,
    quotes: 8,
    since: "Mar 2022",
    color: "#8b5cf6",
    gst: "29AACCC2222D1Z8",
    notes: "Requires custom reporting dashboards.",
  },
  {
    id: "4",
    name: "LifeCare Clinic",
    industry: "Clinic",
    city: "Mumbai",
    email: "hello@lifecare.com",
    phone: "+91 9011223344",
    status: "inactive",
    product: "Clinic CRM",
    totalBilled: 95000,
    quotes: 2,
    since: "Sep 2021",
    color: "#f59e0b",
    gst: "27AAACL1111Q1Z7",
    notes: "Support contract expired.",
  },
  {
    id: "5",
    name: "Green Cross Medicals",
    industry: "Medical Store",
    city: "Coimbatore",
    email: "sales@greencross.com",
    phone: "+91 9445566778",
    status: "active",
    product: "Billing Software",
    totalBilled: 275000,
    quotes: 6,
    since: "Dec 2020",
    color: "#06b6d4",
    gst: "33AACCG5555R1Z9",
    notes: "Expanding to 5 new branches.",
  },
  {
    id: "6",
    name: "Prime Health",
    industry: "Hospital",
    city: "Delhi",
    email: "admin@primehealth.com",
    phone: "+91 9887766554",
    status: "prospect",
    product: "Hospital ERP",
    totalBilled: 120000,
    quotes: 4,
    since: "Feb 2025",
    color: "#ef4444",
    gst: "07AACCP4444T1Z1",
    notes: "Waiting for management approval.",
  },
  {
    id: "7",
    name: "Nova Labs",
    industry: "Diagnostics",
    city: "Pune",
    email: "support@novalabs.com",
    phone: "+91 9776655443",
    status: "active",
    product: "Lab ERP",
    totalBilled: 390000,
    quotes: 10,
    since: "Jul 2022",
    color: "#14b8a6",
    gst: "27AACCN7777M1Z2",
    notes: "Strong long-term client.",
  },
  {
    id: "8",
    name: "Elite Pharmacy",
    industry: "Retail",
    city: "Madurai",
    email: "contact@elitepharmacy.com",
    phone: "+91 9665544332",
    status: "inactive",
    product: "POS",
    totalBilled: 88000,
    quotes: 1,
    since: "Apr 2021",
    color: "#a855f7",
    gst: "33AACCE8888P1Z4",
    notes: "Migrated to competitor.",
  },
  {
    id: "9",
    name: "Wellness Care",
    industry: "Healthcare",
    city: "Kochi",
    email: "team@wellnesscare.com",
    phone: "+91 9554433221",
    status: "active",
    product: "CRM",
    totalBilled: 510000,
    quotes: 14,
    since: "Jan 2020",
    color: "#0ea5e9",
    gst: "32AACCW9999X1Z6",
    notes: "Top revenue-generating client.",
  },
  {
    id: "10",
    name: "Metro Hospitals",
    industry: "Hospital",
    city: "Chennai",
    email: "info@metrohospitals.com",
    phone: "+91 9444433332",
    status: "prospect",
    product: "Hospital Suite",
    totalBilled: 210000,
    quotes: 7,
    since: "Aug 2024",
    color: "#f97316",
    gst: "33AACCM1010K1Z5",
    notes: "Negotiating enterprise pricing.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DEALS DATA  (keyed by client id)
// ─────────────────────────────────────────────────────────────────────────────
const mockDealsData: Record<string, Deal[]> = {
  "1": [
    { id: "DL-001", name: "Pharmacy Suite Renewal",   value: 65000,  stage: "Prospect",    priority: "medium", label: "Initial contact"  },
    { id: "DL-002", name: "Lab Module Add-on",         value: 28000,  stage: "Qualified",   priority: "high",   label: "Demo scheduled"  },
    { id: "DL-003", name: "Multi-branch License",      value: 120000, stage: "Proposal",    priority: "medium", label: "Quote sent"       },
    { id: "DL-004", name: "Core PMS",                  value: 65000,  stage: "Closed Won",  priority: "low",    label: "Closed Mar 2026" },
  ],
  "2": [
    { id: "DL-101", name: "POS System Setup",          value: 45000,  stage: "Qualified",   priority: "high",   label: "Needs demo"      },
    { id: "DL-102", name: "Multi-store Integration",   value: 90000,  stage: "Proposal",    priority: "medium", label: "Quote pending"   },
  ],
  "3": [
    { id: "DL-201", name: "Lab Management Renewal",    value: 80000,  stage: "Closed Won",  priority: "low",    label: "Closed Jan 2026" },
    { id: "DL-202", name: "Custom Reporting Module",   value: 35000,  stage: "Prospect",    priority: "medium", label: "Under discussion" },
  ],
}

// Returns deals for a given client id, or a sensible default set
const getMockDeals = (clientId: string): Deal[] =>
  mockDealsData[clientId] ?? [
    { id: "DL-001", name: "Pharmacy Suite Renewal",  value: 65000,  stage: "Prospect",   priority: "medium", label: "Initial contact"  },
    { id: "DL-002", name: "Lab Module Add-on",        value: 28000,  stage: "Qualified",  priority: "high",   label: "Demo scheduled"  },
    { id: "DL-003", name: "Multi-branch License",     value: 120000, stage: "Proposal",   priority: "medium", label: "Quote sent"       },
    { id: "DL-004", name: "Core PMS",                 value: 65000,  stage: "Closed Won", priority: "low",    label: "Closed Mar 2026" },
  ]

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ACTIVITIES DATA  (keyed by client id)
// ─────────────────────────────────────────────────────────────────────────────
const mockActivitiesData: Record<string, any[]> = {
  "1": [
    { id: "AC-1", type: "Call",    title: "Call — Renewal discussion",           description: "Discussed license options and discount structure.", dateTime: new Date(Date.now() - 48  * 60 * 60 * 1000).toISOString(), assignedUser: "Sujjeeth" },
    { id: "AC-2", type: "Email",   title: "Email — Quote QT-2026-B23E89 sent",   description: "Sent PDF quote with discount applied.",             dateTime: new Date(Date.now() - 96  * 60 * 60 * 1000).toISOString(), assignedUser: "Sujjeeth" },
    { id: "AC-3", type: "Meeting", title: "Meeting — Product demo with Priya",   description: "Demoed lab module expansion and resolved IT concerns.", dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), assignedUser: "Hari"     },
  ],
  "2": [
    { id: "AC-4", type: "Call",    title: "Call — Initial discovery call",       description: "Discussed multi-store integration needs.",           dateTime: new Date(Date.now() - 24  * 60 * 60 * 1000).toISOString(), assignedUser: "Hari"     },
    { id: "AC-5", type: "Email",   title: "Email — Brochure sent",               description: "Sent product brochure and pricing sheet.",           dateTime: new Date(Date.now() - 72  * 60 * 60 * 1000).toISOString(), assignedUser: "Sujjeeth" },
  ],
}

const getMockActivities = (clientId: string): any[] =>
  mockActivitiesData[clientId] ?? [
    { id: "AC-1", type: "Call",    title: "Call — Renewal discussion",         description: "Discussed license options and discount structure.", dateTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), assignedUser: "Sujjeeth" },
    { id: "AC-2", type: "Email",   title: "Email — Quote QT-2026-B23E89 sent", description: "Sent PDF quote with discount applied.",            dateTime: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), assignedUser: "Sujjeeth" },
    { id: "AC-3", type: "Meeting", title: "Meeting — Product demo with Priya", description: "Demoed lab module and resolved IT concerns.",       dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), assignedUser: "Hari"    },
  ]

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TASKS DATA  (keyed by client id)
// ─────────────────────────────────────────────────────────────────────────────
const mockTasksData: Record<string, Task[]> = {
  "1": [
    { id: 1, text: "Send renewal quotation to Ramesh Kumar",        due: "Jun 10",        priority: "high",   done: true             },
    { id: 2, text: "Follow up on multi-branch license proposal",    due: "Jun 12 · Today",priority: "high",   done: false, overdue: true },
    { id: 3, text: "Schedule product demo for Lab Module",          due: "Jun 15",        priority: "medium", done: false            },
    { id: 4, text: "Collect outstanding payment for Core PMS",      due: "Jun 18",        priority: "low",    done: false            },
    { id: 5, text: "Check in on onboarding progress",               due: "Jun 22",        priority: "low",    done: false            },
  ],
  "2": [
    { id: 1, text: "Follow up on multi-store integration proposal", due: "Jun 13",        priority: "high",   done: false            },
    { id: 2, text: "Send updated POS pricing sheet",                due: "Jun 16",        priority: "medium", done: false            },
  ],
}

const getMockTasks = (clientId: string): Task[] =>
  mockTasksData[clientId] ?? [
    { id: 1, text: "Send renewal quotation to Ramesh Kumar",     due: "Jun 10",        priority: "high",   done: true             },
    { id: 2, text: "Follow up on multi-branch license proposal", due: "Jun 12 · Today",priority: "high",   done: false, overdue: true },
    { id: 3, text: "Schedule product demo for Lab Module",       due: "Jun 15",        priority: "medium", done: false            },
    { id: 4, text: "Collect outstanding payment for Core PMS",   due: "Jun 18",        priority: "low",    done: false            },
    { id: 5, text: "Check in on onboarding progress",            due: "Jun 22",        priority: "low",    done: false            },
  ]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: mapClient
// ─────────────────────────────────────────────────────────────────────────────
function mapClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    city: row.city,
    email: row.email,
    phone: row.phone,
    status: row.status,
    product: row.product,
    totalBilled: Number(row.total_billed || row.totalBilled || 0),
    quotes: Number(row.quotes_count || row.quotes || 0),
    since: row.since_label || row.since || "Jan 2026",
    color: row.color || "#3b82f6",
    gst: row.gst || "-",
    notes: row.notes || "",
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClientDetailsPage({ params }: PageProps) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const router = useRouter()

  // State definitions
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  // Modal Open/Close states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [initialDealStage, setInitialDealStage] = useState<Deal["stage"]>("Prospect")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)


  // ───────────────────────────────────────────────────────────────────────────
  // 1. Fetch Client Details
  // ───────────────────────────────────────────────────────────────────────────
  const loadClient = async () => {
    if (!id) return
    try {
      // ── SUPABASE (commented out) ──────────────────────────────────────────
      // const supabase = getSupabaseClient()
      // const { data, error } = await supabase
      //   .from("clients")
      //   .select("*")
      //   .eq("id", id)
      //   .single()
      // if (data) {
      //   setClient(mapClient(data))
      // } else {
      //   setClient(null)
      // }

      // ── MOCK DATA ─────────────────────────────────────────────────────────
      const found = mockClients.find((c) => c.id === id) ?? null
      setClient(found ? mapClient(found) : null)
    } catch (err) {
      console.error("Error loading client:", err)
      setClient(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClient()

    // Listen for client updates from Edit dialog
    const handleClientChanged = () => {
      void loadClient()
    }
    window.addEventListener("client:changed", handleClientChanged)
    return () => {
      window.removeEventListener("client:changed", handleClientChanged)
    }
  }, [id])

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Fetch Deals, Activities, Tasks
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return

    const loadDealsActivitiesAndTasks = async () => {
      // ── SUPABASE — Load Deals (commented out) ────────────────────────────
      // const supabase = getSupabaseClient()
      // try {
      //   const { data, error } = await supabase
      //     .from("deals")
      //     .select("*")
      //     .eq("client_id", id)
      //   if (error || !data) throw new Error("Deals table missing or query failed")
      //   const mappedDeals: Deal[] = data.map((d: any) => ({
      //     id: d.id,
      //     name: d.name,
      //     value: Number(d.value),
      //     stage: d.stage as Deal["stage"],
      //     expectedCloseDate: d.expected_close_date,
      //     notes: d.notes,
      //     priority: d.priority as any,
      //   }))
      //   setDeals(mappedDeals)
      // } catch (err) {
      //   const localKey = `deals_${id}`
      //   const localData = localStorage.getItem(localKey)
      //   if (localData) {
      //     setDeals(JSON.parse(localData))
      //   } else {
      //     ... initialMockDeals fallback ...
      //   }
      // }

      // ── MOCK DATA — Deals ─────────────────────────────────────────────────
      const localDealsKey = `deals_${id}`
      const savedDeals = localStorage.getItem(localDealsKey)
      if (savedDeals) {
        setDeals(JSON.parse(savedDeals))
      } else {
        const initial = getMockDeals(id)
        localStorage.setItem(localDealsKey, JSON.stringify(initial))
        setDeals(initial)
      }

      // ── SUPABASE — Load Activities (commented out) ────────────────────────
      // try {
      //   const { data, error } = await supabase
      //     .from("activities")
      //     .select("*")
      //     .eq("client_id", id)
      //     .order("created_at", { ascending: false })
      //   if (error || !data) throw new Error("Activities table missing or query failed")
      //   const mappedActs = data.map((a: any) => ({
      //     id: a.id,
      //     type: a.type,
      //     title: a.title,
      //     description: a.description,
      //     dateTime: a.date_time,
      //     assignedUser: a.assigned_user,
      //   }))
      //   setActivities(mappedActs)
      // } catch (err) {
      //   const localKey = `activities_${id}`
      //   const localData = localStorage.getItem(localKey)
      //   if (localData) {
      //     setActivities(JSON.parse(localData))
      //   } else {
      //     ... initialMockActs fallback ...
      //   }
      // }

      // ── MOCK DATA — Activities ────────────────────────────────────────────
      const localActsKey = `activities_${id}`
      const savedActs = localStorage.getItem(localActsKey)
      if (savedActs) {
        setActivities(JSON.parse(savedActs))
      } else {
        const initial = getMockActivities(id)
        localStorage.setItem(localActsKey, JSON.stringify(initial))
        setActivities(initial)
      }

      // ── Tasks (always localStorage — no DB table) ─────────────────────────
      const localTasksKey = `tasks_${id}`
      const savedTasks = localStorage.getItem(localTasksKey)
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      } else {
        const initial = getMockTasks(id)
        localStorage.setItem(localTasksKey, JSON.stringify(initial))
        setTasks(initial)
      }
    }

    void loadDealsActivitiesAndTasks()
  }, [id])

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Save Deal Stage Update
  // ───────────────────────────────────────────────────────────────────────────
  const handleUpdateDealStage = async (dealId: string, newStage: Deal["stage"]) => {
    // Optimistic UI update
    setDeals((prev) => {
      const next = prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
      localStorage.setItem(`deals_${id}`, JSON.stringify(next))
      return next
    })

    // ── SUPABASE (commented out) ──────────────────────────────────────────
    // const supabase = getSupabaseClient()
    // try {
    //   const { error } = await supabase
    //     .from("deals")
    //     .update({ stage: newStage })
    //     .eq("id", dealId)
    //   if (error) throw error
    // } catch (err) {
    //   console.warn("Could not save deal stage update in Supabase, utilizing localStorage.")
    // }

    // ── MOCK DATA — already persisted to localStorage above ───────────────
    console.log(`[Mock] Deal ${dealId} stage updated to: ${newStage}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Save New Deal
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveDeal = async (newDeal: {
    name: string
    value: number
    stage: Deal["stage"]
    expectedCloseDate: string
    notes: string
  }) => {
    const dealId = `DL-${Date.now()}`
    const fullDeal: Deal = {
      id: dealId,
      priority: "medium",
      ...newDeal,
    }

    setDeals((prev) => {
      const next = [...prev, fullDeal]
      localStorage.setItem(`deals_${id}`, JSON.stringify(next))
      return next
    })

    // ── SUPABASE (commented out) ──────────────────────────────────────────
    // const supabase = getSupabaseClient()
    // try {
    //   const { error } = await supabase
    //     .from("deals")
    //     .insert({
    //       id: dealId,
    //       client_id: id,
    //       name: newDeal.name,
    //       value: newDeal.value,
    //       stage: newDeal.stage,
    //       expected_close_date: newDeal.expectedCloseDate || null,
    //       notes: newDeal.notes,
    //       priority: "medium",
    //     })
    //   if (error) throw error
    // } catch (err) {
    //   console.warn("Could not insert deal in Supabase, utilizing localStorage.")
    // }

    // ── MOCK DATA — already persisted to localStorage above ───────────────
    console.log(`[Mock] New deal created: ${dealId} — ${newDeal.name}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Save New Activity
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveActivity = async (newAct: {
    type: "Call" | "Email" | "Meeting" | "Task" | "Note"
    title: string
    description: string
    dateTime: string
    assignedUser: string
  }) => {
    const actId = `AC-${Date.now()}`
    const fullAct = { id: actId, ...newAct }

    setActivities((prev) => {
      const next = [fullAct, ...prev]
      localStorage.setItem(`activities_${id}`, JSON.stringify(next))
      return next
    })

    // ── SUPABASE (commented out) ──────────────────────────────────────────
    // const supabase = getSupabaseClient()
    // try {
    //   const { error } = await supabase
    //     .from("activities")
    //     .insert({
    //       id: actId,
    //       client_id: id,
    //       type: newAct.type,
    //       title: newAct.title,
    //       description: newAct.description,
    //       date_time: newAct.dateTime,
    //       assigned_user: newAct.assignedUser,
    //     })
    //   if (error) throw error
    // } catch (err) {
    //   console.warn("Could not insert activity in Supabase, utilizing localStorage.")
    // }

    // ── MOCK DATA — already persisted to localStorage above ───────────────
    console.log(`[Mock] New activity logged: ${actId} — ${newAct.title}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Handle Tasks Modification
  // ───────────────────────────────────────────────────────────────────────────
  const handleToggleTask = (taskId: number) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
      localStorage.setItem(`tasks_${id}`, JSON.stringify(next))
      return next
    })
  }

  const handleDeleteTask = (taskId: number) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId)
      localStorage.setItem(`tasks_${id}`, JSON.stringify(next))
      return next
    })
  }

  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: Date.now(),
      text,
      due: "Jun 25",
      priority: "medium",
      done: false,
    }

    setTasks((prev) => {
      const next = [...prev, newTask]
      localStorage.setItem(`tasks_${id}`, JSON.stringify(next))
      return next
    })
  }

  // Open deal modal seeding stage
  const handleOpenNewDealModal = (stage: Deal["stage"]) => {
    setInitialDealStage(stage)
    setIsDealModalOpen(true)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Loading Screen
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#141416] text-[#c8d0e0]">
        <div className="w-6 h-6 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-[#8b95a8] font-mono">Loading client details...</span>
      </div>
    )
  }

  // Client Not Found State
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#141416]">
        <div className="text-4xl mb-4 font-mono select-none">⚠️</div>
        <h1 className="text-sm font-semibold text-[#e8eaf0] mb-2 font-mono uppercase tracking-wider">
          Client Not Found
        </h1>
        <p className="text-xs text-[#8b95a8] max-w-xs mb-6 leading-relaxed">
          The client record you are trying to view does not exist in the database or you do not have permission to access it.
        </p>
        <button
          onClick={() => router.push("/clients")}
          className="lp-btn-primary px-4 py-2 cursor-pointer font-medium text-xs rounded-md border-0"
        >
          Back to Clients List
        </button>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="cd-page">
        {/* Left-side Page Content */}
        <div className="cd-content">
          {/* Sub-header profile summary */}
          <ClientHeader
            client={client}
            onEditClick={() => setIsEditClientOpen(true)}
            onAddActivityClick={() => setIsActivityModalOpen(true)}
            onNewDealClick={() => handleOpenNewDealModal("Prospect")}
          />

          {/* Stats quick overview */}
          <div className="cd-stats">
            {[
              {
                label: "Open Deals",
                value: deals.filter((d) => d.stage !== "Closed Won").length.toString(),
                sub: "In progress",
                valClass: "lp-stat-blue",
              },
              {
                label: "Revenue",
                value: `₹${(
                  client.totalBilled +
                  deals.filter((d) => d.stage === "Closed Won").reduce((sum, d) => sum + d.value, 0)
                ).toLocaleString("en-IN")}`,
                sub: "Total billed + closed won",
                valClass: "lp-stat-green",
              },
              {
                label: "Outstanding",
                value: "₹65,000",
                sub: "Awaiting payment",
                valClass: "cd-stat-amber",
              },
              {
                label: "Contacts",
                value: "3",
                sub: "Linked people",
                valClass: "lp-stat-white",
              },
              {
                label: "Next Follow-up",
                value: "Jun 15",
                sub: "In 3 days",
                valClass: "cd-stat-amber",
              },
            ].map((card, idx) => (
              <div key={idx} className="lp-stat-card">
                <div className="lp-stat-label">{card.label}</div>
                <div className={`lp-stat-val ${card.valClass}`}>{card.value}</div>
                <div className="lp-stat-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Main Content Layout */}
          <div className="cd-main-grid">
            {/* Left Main column - occupies remaining space */}
            <div className="cd-left-col flex-1 min-w-0">
              <div className="flex flex-col gap-5">
                {/* 1. Kanban Deal Pipeline */}
                <DealPipeline
                  deals={deals}
                  onUpdateDealStage={handleUpdateDealStage}
                  onOpenNewDealModal={handleOpenNewDealModal}
                />

                {/* 2. Upcoming Tasks list */}
                <UpcomingTasks
  tasks={tasks}
  onToggleTask={handleToggleTask}
  onDeleteTask={handleDeleteTask}
  onOpenAddTaskModal={() => setIsTaskModalOpen(true)}
/>
              </div>
            </div>
          </div>
        </div>

        {/* Right-side Client Details Sidebar (Sticky Navigation Panel) */}
        <ClientDetailsSidebar
          client={client}
          activities={activities}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
        />
      </div>

      {/* Edit Client dialog from existing system */}
      {/* <AddClientDialog
        hideTrigger
        mode="edit"
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        clientToEdit={client}
      /> */}

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
      />

      {/* New Deal Modal */}
      <NewDealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onSave={handleSaveDeal}
      />
      {/*For adding new task */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleAddTask}
       />

      {/* Embedded page styles to prevent global conflicts */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        
        .cd-page {
          display: flex;
          flex-direction: column;
          background: #141416;
          color: #c8d0e0;
          font-family: inherit;
          width: 100%;
          min-height: calc(100vh - 56px);
        }

        @media (min-width: 1024px) {
          .cd-page {
            flex-direction: row;
            align-items: stretch;
          }
        }

        .cd-client-sidebar {
          width: 100%;
          flex-shrink: 0;
          background: #161920;
          border-bottom: 1px solid #2a3040;
        }

        @media (min-width: 1024px) {
          .cd-client-sidebar {
            width: 320px;
            border-bottom: none;
            border-right: 1px solid #2a3040;
            position: sticky;
            top: 56px;
            height: calc(100vh - 56px);
            display: flex;
            flex-direction: column;
          }
        }

        .cd-sidebar-inner {
          width: 100%;
          height: 100%;
        }

        @media (min-width: 1024px) {
          .cd-sidebar-inner {
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }
        }

        .cd-sidebar-header {
          padding: 14px 20px;
          border-bottom: 1px solid #1e2229;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cd-sidebar-title {
          font-size: 13px;
          font-weight: 600;
          color: #c8d0e0;
        }

        .cd-content {
          padding: 24px;
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 768px) {
          .cd-content {
            padding: 16px;
          }
        }

        /* ── Client Header ── */
        .cd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
          background: #1a1e27/20;
          border-bottom: 1px solid #1e2229;
          padding-bottom: 18px;
        }
        .cd-header-left { display: flex; align-items: center; gap: 16px; }
        .cd-avatar-block {
          width: 48px; height: 48px;
          background: #1e2229;
          border: 1px solid #2a2f3a;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700;
          flex-shrink: 0;
        }
        .cd-title {
          font-size: 22px; font-weight: 700; color: #f0f2f8;
          margin-bottom: 8px; letter-spacing: -0.3px;
        }
        .cd-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cd-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 500;
          border: 1px solid transparent;
        }
        .cd-badge-active {
          background: rgba(30,173,130,0.12);
          color: #1ead82;
          border-color: rgba(30,173,130,0.25);
        }
        .cd-badge-meta {
          background: #1e2229;
          color: #8b95a8;
          border-color: #2a2f3a;
        }
        .cd-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── Actions ── */
        .cd-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; position: relative; }
        .cd-action-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; font-size: 13px; font-weight: 500;
          border-radius: 8px; cursor: pointer; font-family: inherit;
        }
        .cd-more-wrap { position: relative; }
        .cd-more-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
        }
        .cd-more-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: #1e2229; border: 1px solid #2a2f3a;
          border-radius: 8px; z-index: 40;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          min-width: 130px; overflow: hidden;
        }
        .cd-more-item {
          display: block; width: 100%; text-align: left;
          padding: 9px 14px; font-size: 13px; color: #c8d0e0;
          background: none; border: none; cursor: pointer;
          font-family: inherit; transition: background 0.12s;
        }
        .cd-more-item:hover { background: #252b35; }

        /* ── Stat Cards ── */
        .cd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 2fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .lp-stat-card {
          background: #161920;
          border: 1px solid #2a3040;
          border-radius: 10px;
          padding: 18px 10px 16px;
        }
        .lp-stat-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          color: #4f5a6a; text-transform: uppercase; margin-bottom: 8px;
        }
        .lp-stat-val {
          font-size: 26px; font-weight: 700; line-height: 1;
          margin-bottom: 6px; letter-spacing: -0.5px;
        }
        .lp-stat-white { color: #e0e3ea; }
        .lp-stat-blue { color: #3b82f6; }
        .lp-stat-green { color: #1ead82; }
        .cd-stat-amber { color: #d3a335; }
        .lp-stat-sub { font-size: 11px; color: #4f5a6a; }

        /* ── Main Layout Grid ── */
        .cd-main-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* ── Card Styles ── */
        .cd-card {
          background: #161920;
          border: 1px solid #2a3040;
          border-radius: 12px;
          overflow: hidden;
        }
        .cd-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #1e2229;
        }
        .cd-card-title {
          font-size: 13px; font-weight: 600; color: #c8d0e0;
        }
        .cd-sm-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px; font-size: 12px; font-weight: 500;
          border-radius: 7px; cursor: pointer; border: 0;
        }

        /* ── Upcoming Tasks ── */
        .cd-task-list { }
        .cd-task-checkbox { width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; accent-color: #3b82f6; }
        .cd-priority-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .cd-task-text { font-size: 13px; }
        .cd-task-due { font-size: 11px; white-space: nowrap; flex-shrink: 0; }
        .cd-task-overdue { color: #c4606f !important; }
        .cd-delete-btn:hover { color: #c4606f !important; }

        /* ── Details Card Accordions ── */
        .cd-details-card { background: #161920; }
        .cd-accordion-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          background: none; border: none; border-top: 1px solid #1e2229;
          font-size: 12px; font-weight: 600; color: #8b95a8;
          cursor: pointer; font-family: inherit;
          transition: background 0.12s, color 0.12s;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cd-accordion-btn:hover { background: #1a1e27; color: #e8eaf0; }
        .cd-chevron {
          transition: transform 0.2s ease-in-out;
          flex-shrink: 0; color: #4f5a6a;
        }
        .cd-chevron-open { transform: rotate(180deg); }

        .cd-accordion-body {
          padding: 14px 20px;
          display: flex; flex-direction: column; gap: 10px;
          background: #1a1e27/40;
          border-top: 1px solid #1e2229;
        }

        .cd-accordion-contacts {
          background: #1a1e27/40;
          border-top: 1px solid #1e2229;
        }

        .lp-view-field {
          background: #1e2229; border: 1px solid #2a3040;
          border-radius: 8px; padding: 10px 12px;
        }
        .lp-view-field-label {
          font-size: 9px; font-weight: 600; letter-spacing: 0.08em;
          color: #4f5a6a; text-transform: uppercase; margin-bottom: 5px;
        }
        .lp-view-field-val { font-size: 13px; color: #c2c8cc; }
        
        .lp-view-notes-field {
          background: #1e2229; border: 1px solid #2a3040;
          border-radius: 8px; padding: 10px 12px;
          width: 100%;
        }
        .lp-view-notes-val { color: #8b95a8; margin-top: 4px; }

        .cd-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .cd-tag {
          background: #1e2229; border: 1px solid #2a3040;
          border-radius: 20px; padding: 2px 9px;
          font-size: 11px; color: #8b95a8;
        }
        .cd-link { color: #3b82f6; cursor: pointer; }

        /* ── Contacts ── */
        .cd-contact-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 20px;
          border-bottom: 1px solid #1e2229;
        }
        .cd-contact-row:last-child { border-bottom: none; }
        .cd-contact-row:hover { background: #1e2229; }
        .cd-contact-info { flex: 1; min-width: 0; }

        /* ── Activities ── */
        .cd-activity-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 20px;
          border-bottom: 1px solid #1e2229;
        }
        .cd-activity-row:last-child { border-bottom: none; }
        .cd-activity-row:hover { background: #1e2229; }

        /* ── Documents ── */
        .cd-doc-row {
          display: flex; align-items: center; gap: 8px;
        }
        .cd-doc-name {
          flex: 1; font-size: 12px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Reused LP primitives ── */
        .lp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 500;
          border: 1px solid transparent; white-space: nowrap;
        }
        .lp-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .lp-avatar {
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; flex-shrink: 0;
        }
        .lp-icon-btn {
          background: none; border: none; color: #4f5a6a; cursor: pointer;
          padding: 5px; border-radius: 6px; display: flex; align-items: center;
          transition: color 0.12s, background 0.12s;
        }
        .lp-icon-btn:hover { color: #c8d0e0; background: rgba(255,255,255,0.05); }
        .lp-btn-ghost {
          background: none; border: 1px solid #2a3040; border-radius: 7px;
          padding: 7px 14px; font-size: 13px; color: #8b95a8; cursor: pointer;
          transition: color 0.14s, border-color 0.14s;
          display: flex; align-items: center;
        }
        .lp-btn-ghost:hover { color: #c8d0e0; border-color: #4f5a6a; }
        .lp-btn-primary {
          background: #3b82f6; border: none; border-radius: 7px;
          padding: 7px 14px; font-size: 13px; font-weight: 500; color: #fff;
          cursor: pointer;
          transition: background 0.14s;
          display: flex; align-items: center; gap: 6px;
        }
        .lp-btn-primary:hover { background: #2563eb; }
      `}</style>
    </>
  )
}


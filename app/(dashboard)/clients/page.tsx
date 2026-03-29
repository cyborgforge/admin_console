"use client"

import { useEffect, useMemo, useState } from "react"
import { LayoutGrid, Rows3, X } from "lucide-react"
import { useRef } from "react"

import { ClientCard } from "@/components/clients/client-card"
import { ClientTable } from "@/components/clients/client-table"
import { NewQuoteDialog } from "@/components/quotations/new-quote-dialog"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { Client } from "@/types/client"

type ClientChangedDetail = {
  client?: Client
}

const clientStatusLabel: Record<Client["status"], string> = {
  active: "Active",
  prospect: "Prospect",
  churned: "Churned",
}

function clientStatusBadgeClass(status: Client["status"]) {
  if (status === "active") return "badge badge-accepted"
  if (status === "prospect") return "badge badge-review"
  return "badge badge-draft"
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [product, setProduct] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)
  const [quoteSeedClient, setQuoteSeedClient] = useState<Client | null>(null)
  const optimisticClientIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function loadClients(showLoader = false) {
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
          throw new Error("Please sign in to load clients.")
        }

        const response = await fetch("/api/clients", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const responseData = (await response.json()) as { error?: string }
          throw new Error(responseData.error ?? "Failed to load clients.")
        }

        const data = (await response.json()) as { clients: Client[]; source?: string }
        const fetchedClients = data.clients ?? []

        setClients((current) => {
          const merged = [...fetchedClients]
          const mergedIds = new Set(merged.map((client) => client.id))

          for (const client of current) {
            if (optimisticClientIdsRef.current.has(client.id) && !mergedIds.has(client.id)) {
              merged.unshift(client)
              mergedIds.add(client.id)
            }
          }

          for (const client of fetchedClients) {
            if (optimisticClientIdsRef.current.has(client.id)) {
              optimisticClientIdsRef.current.delete(client.id)
            }
          }

          return merged
        })

      } catch {
        setError("Failed to load clients.")
      } finally {
        setLoading(false)
      }
    }

    void loadClients(true)

    const handleClientChanged = (event: Event) => {
      const customEvent = event as CustomEvent<ClientChangedDetail>
      const nextClient = customEvent.detail?.client

      if (nextClient) {
        optimisticClientIdsRef.current.add(nextClient.id)
        setClients((current) => {
          if (current.some((client) => client.id === nextClient.id)) {
            return current
          }

          return [nextClient, ...current]
        })
      }

      void loadClients()
    }

    window.addEventListener("client:changed", handleClientChanged)

    return () => {
      window.removeEventListener("client:changed", handleClientChanged)
    }
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchText = `${client.name} ${client.organization} ${client.city}`.toLowerCase()
      const matchesQuery = searchText.includes(query.toLowerCase())
      const matchesStatus = status ? client.status === status : true
      const matchesProduct = product ? client.product.toLowerCase().includes(product.toLowerCase()) : true
      return matchesQuery && matchesStatus && matchesProduct
    })
  }, [clients, query, status, product])

  const totalClients = clients.length
  const activeClients = clients.filter((client) => client.status === "active").length
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalBilled, 0)
  const avgDealSize = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0

  return (
    <div className="content" id="section-clients">
      <div className="stats">
        <div className="stat-card"><div className="stat-label">Total Clients</div><div className="stat-val">{totalClients}</div><div className="stat-change up">Live from backend</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-val text-(--accent2)">{activeClients}</div><div className="stat-change up">Active subscriptions</div></div>
        <div className="stat-card"><div className="stat-label">Avg. Deal Size</div><div className="stat-val text-accent">Rs {avgDealSize.toLocaleString("en-IN")}</div><div className="stat-change up">Computed from records</div></div>
        <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-val text-(--warn)">Rs {totalRevenue.toLocaleString("en-IN")}</div><div className="stat-change up">Computed from records</div></div>
      </div>

      {loading ? <div style={{ color: "var(--text3)", marginBottom: "10px" }}>Loading clients...</div> : null}
      {error ? <div style={{ color: "var(--warn)", marginBottom: "10px" }}>{error}</div> : null}

      <div className="filters">
        <div className="search-box">
          <input placeholder="Search clients..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="filter-select" value={product} onChange={(event) => setProduct(event.target.value)}>
          <option value="">All Products</option>
          <option value="pharmacy">Pharmacy Suite</option>
          <option value="clinic">Clinic Suite</option>
          <option value="retail">Retail Suite</option>
        </select>
        <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="churned">Churned</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button type="button" className="icon-btn" onClick={() => setView("grid")} style={view === "grid" ? { width: "32px", height: "32px", background: "var(--accent-dim)", color: "var(--accent)" } : { width: "32px", height: "32px" }}>
            <LayoutGrid size={15} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setView("list")} style={view === "list" ? { width: "32px", height: "32px", background: "var(--accent-dim)", color: "var(--accent)" } : { width: "32px", height: "32px" }}>
            <Rows3 size={15} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div id="clients-grid">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <ClientTable clients={filteredClients} onRowClick={(client) => setSelectedClient(client)} />
        </div>
      )}

      <Sheet open={Boolean(selectedClient)} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent side="right" className="panel add-client-sheet" showCloseButton={false}>
          {selectedClient ? (
            <>
              <SheetHeader className="panel-header add-client-header">
                <div className="client-cell" style={{ alignItems: "center", gap: "12px" }}>
                  <div className="client-avatar" style={{ width: "34px", height: "34px", backgroundColor: `${selectedClient.color}22`, color: selectedClient.color }}>
                    {selectedClient.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <SheetTitle className="panel-title text-(--text)">{selectedClient.name} · {selectedClient.role}</SheetTitle>
                    <SheetDescription className="panel-subtitle" style={{ marginTop: "2px" }}>
                      {selectedClient.organization} · {selectedClient.city}
                    </SheetDescription>
                  </div>
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    className="close-btn"
                    aria-label="Close client details"
                    onClick={() => setSelectedClient(null)}
                  >
                    <X size={14} />
                  </button>
                </SheetClose>
              </SheetHeader>
              <div className="panel-body add-client-body">
                <div className="client-detail-grid">
                  <div className="info-row"><div className="info-row-label">Email</div><div className="info-row-val">{selectedClient.email}</div></div>
                  <div className="info-row"><div className="info-row-label">Phone</div><div className="info-row-val">{selectedClient.phone}</div></div>
                  <div className="info-row"><div className="info-row-label">Industry</div><div className="info-row-val">{selectedClient.industry}</div></div>
                  <div className="info-row"><div className="info-row-label">Product</div><div className="info-row-val">{selectedClient.product}</div></div>
                  <div className="info-row"><div className="info-row-label">GST Number</div><div className="info-row-val">{selectedClient.gst || "-"}</div></div>
                  <div className="info-row"><div className="info-row-label">Client since</div><div className="info-row-val">{selectedClient.since}</div></div>
                  <div className="info-row">
                    <div className="info-row-label">Status</div>
                    <div className="info-row-val">
                      <span className={clientStatusBadgeClass(selectedClient.status)}>{clientStatusLabel[selectedClient.status]}</span>
                    </div>
                  </div>
                  <div className="info-row"><div className="info-row-label">Notes</div><div className="info-row-val">{selectedClient.notes || "No notes yet"}</div></div>
                </div>
                <div className="client-detail-stats">
                  <div className="stat-card" style={{ padding: "12px 14px" }}>
                    <div className="stat-label">Total billed</div>
                    <div className="stat-val" style={{ fontSize: "20px", color: "#10B981" }}>Rs {selectedClient.totalBilled.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="stat-card" style={{ padding: "12px 14px" }}>
                    <div className="stat-label">Total quotes</div>
                    <div className="stat-val" style={{ fontSize: "20px", color: "#E8EAF0" }}>{selectedClient.quotes}</div>
                  </div>
                  <div className="stat-card" style={{ padding: "12px 14px" }}>
                    <div className="stat-label">Client since</div>
                    <div className="stat-val" style={{ fontSize: "20px", color: "#E8EAF0" }}>{selectedClient.since}</div>
                  </div>
                </div>

                <div>
                  <div className="section-heading" style={{ marginBottom: "10px" }}>Quote history</div>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      overflow: "hidden",
                      background: "var(--surface)",
                    }}
                  >
                    <Table className="client-detail-history-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={5} style={{ color: "var(--text3)", textAlign: "center", padding: "18px" }}>
                            No quotes yet for this client
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <SheetFooter className="panel-footer add-client-footer">
                <SheetClose asChild>
                  <Button variant="outline" className="btn btn-ghost" onClick={() => setSelectedClient(null)}>
                    Close
                  </Button>
                </SheetClose>
                <Button
                  variant="outline"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!selectedClient) {
                      return
                    }
                    setQuoteSeedClient(selectedClient)
                    setSelectedClient(null)
                    setNewQuoteOpen(true)
                  }}
                >
                  New quote for client
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <NewQuoteDialog
        hideTrigger
        mode="create"
        open={newQuoteOpen}
        onOpenChange={setNewQuoteOpen}
        initialClient={
          quoteSeedClient
            ? {
              name: quoteSeedClient.name,
              organization: quoteSeedClient.organization,
              email: quoteSeedClient.email,
              phone: quoteSeedClient.phone,
            }
            : null
        }
      />
    </div>
  )
}

"use client"

import React, { useEffect, useMemo, useState } from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { Search, Plus, Package, Wrench } from "lucide-react"

import { ItemKind, ItemType, ItemStatus, ProductModule, ProductService, AnyItem } from "./types"
import { MOCK_PRODUCTS, MOCK_SERVICES } from "./mock-data"
import { typeConfig, statusConfig, getInitials, formatINR } from "./config"
import { TypeBadge, StatusBadge } from "./badges"
import { DataTable, ColumnDef } from "./data-table"
import { RadixSelect } from "./radix-select"
import { ViewItem } from "./view-item-dialog"
import { ItemFormDialog } from "./item-form-dialog"

import "./product-management.css"

export function ProductManagement() {
  const [products, setProducts] = useState<ProductModule[]>(MOCK_PRODUCTS)
  const [services, setServices] = useState<ProductService[]>(MOCK_SERVICES)

  const [activeKind, setActiveKind] = useState<ItemKind>("product")

  const [productStatusTab, setProductStatusTab] = useState<"all" | ItemStatus>("all")
  const [serviceStatusTab, setServiceStatusTab] = useState<"all" | ItemStatus>("all")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all")

  // View / edit dialog state
  const [viewing, setViewing] = useState<{ kind: ItemKind; data: AnyItem } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<AnyItem | null>(null)

  // New item dialog
  const [formOpen, setFormOpen] = useState(false)
  const [formKind, setFormKind] = useState<ItemKind>("product")

  const dataset = activeKind === "product" ? products : services

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: dataset.length,
      active: dataset.filter((i) => i.status === "active").length,
      inactive: dataset.filter((i) => i.status === "inactive").length,
      core: dataset.filter((i) => i.type === "core").length,
    }),
    [dataset]
  )

  const statusCounts = useMemo(
    () => ({
      all: dataset.length,
      active: dataset.filter((i) => i.status === "active").length,
      inactive: dataset.filter((i) => i.status === "inactive").length,
    }),
    [dataset]
  )

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const q = `${p.id} ${p.product_name} ${p.product_code} ${p.category}`.toLowerCase()
        const matchQ = q.includes(query.toLowerCase())
        const matchStatus = productStatusTab === "all" || p.status === productStatusTab
        const matchType = typeFilter === "all" || p.type === typeFilter
        return matchQ && matchStatus && matchType
      }),
    [products, query, productStatusTab, typeFilter]
  )

  const filteredServices = useMemo(
    () =>
      services.filter((s) => {
        const q = `${s.id} ${s.service_name} ${s.service_code} ${s.category}`.toLowerCase()
        const matchQ = q.includes(query.toLowerCase())
        const matchStatus = serviceStatusTab === "all" || s.status === serviceStatusTab
        const matchType = typeFilter === "all" || s.type === typeFilter
        return matchQ && matchStatus && matchType
      }),
    [services, query, serviceStatusTab, typeFilter]
  )

  // ── View / edit handlers ─────────────────────────────────────────────────────
  const openView = (kind: ItemKind, data: AnyItem) => {
    setViewing({ kind, data: { ...data } })
    setIsEditing(false)
    setEditDraft(null)
  }

  const startEdit = () => {
    if (!viewing) return
    setEditDraft({ ...viewing.data })
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditDraft(null)
  }

  const saveEdit = () => {
    if (!editDraft || !viewing) return
    if (viewing.kind === "product") {
      setProducts((p) => p.map((x) => (x.id === editDraft.id ? (editDraft as ProductModule) : x)))
    } else {
      setServices((p) => p.map((x) => (x.id === editDraft.id ? (editDraft as ProductService) : x)))
    }
    setViewing({ kind: viewing.kind, data: { ...editDraft } })
    setIsEditing(false)
    setEditDraft(null)
  }

  const closeView = () => {
    setViewing(null)
    setIsEditing(false)
    setEditDraft(null)
  }

  const updateViewStatus = (status: ItemStatus) => {
    if (!viewing) return
    const updated = { ...viewing.data, status } as AnyItem
    setViewing({ kind: viewing.kind, data: updated })
    if (viewing.kind === "product") {
      setProducts((p) => p.map((x) => (x.id === updated.id ? (updated as ProductModule) : x)))
    } else {
      setServices((p) => p.map((x) => (x.id === updated.id ? (updated as ProductService) : x)))
    }
  }

  const deleteItem = () => {
    if (!viewing) return
    if (viewing.kind === "product") {
      setProducts((p) => p.filter((x) => x.id !== viewing.data.id))
    } else {
      setServices((p) => p.filter((x) => x.id !== viewing.data.id))
    }
    closeView()
  }

  // ── New item handlers ────────────────────────────────────────────────────────
  const openNewForm = (kind: ItemKind) => {
    setFormKind(kind)
    setFormOpen(true)
  }

  const createItem = (kind: ItemKind, payload: Record<string, any>) => {
    const today = new Date().toISOString().slice(0, 10)
    if (kind === "product") {
      const item: ProductModule = {
        id: `P-${2000 + products.length + 1}`,
        product_code: payload.code,
        product_name: payload.name,
        description: payload.description,
        category: payload.category,
        type: payload.type,
        price: payload.price,
        tax_percentage: payload.tax_percentage,
        status: payload.status,
        notes: payload.notes,
        created_at: today,
        updated_at: today,
        created_by: "You",
      }
      setProducts((p) => [item, ...p])
    } else {
      const item: ProductService = {
        id: `S-${3000 + services.length + 1}`,
        service_code: payload.code,
        service_name: payload.name,
        description: payload.description,
        category: payload.category,
        type: payload.type,
        duration: payload.duration,
        price: payload.price,
        tax_percentage: payload.tax_percentage,
        status: payload.status,
        notes: payload.notes,
        created_at: today,
        updated_at: today,
        created_by: "You",
      }
      setServices((p) => [item, ...p])
    }
    setFormOpen(false)
  }

  // ── Column configs ───────────────────────────────────────────────────────────
  const productColumns: ColumnDef<ProductModule>[] = [
    { key: "code", label: "CODE", render: (i) => <span className="pm-code">{i.product_code}</span> },
    {
      key: "name",
      label: "NAME",
      render: (i) => (
        <div className="pm-name-cell">
          <div className="pm-avatar" style={{ background: `${typeConfig[i.type].color}22`, color: typeConfig[i.type].color }}>
            {getInitials(i.product_name)}
          </div>
          <div>
            <div className="pm-name">{i.product_name}</div>
            <div className="pm-sub">{i.category}</div>
          </div>
        </div>
      ),
    },
    { key: "type", label: "TYPE", render: (i) => <TypeBadge type={i.type} /> },
    { key: "price", label: "PRICE", render: (i) => <span className="pm-muted">{formatINR(i.price)}</span> },
    { key: "tax", label: "TAX %", render: (i) => <span className="pm-muted">{i.tax_percentage}%</span> },
    { key: "status", label: "STATUS", render: (i) => <StatusBadge status={i.status} /> },
  ]

  const serviceColumns: ColumnDef<ProductService>[] = [
    { key: "code", label: "CODE", render: (i) => <span className="pm-code">{i.service_code}</span> },
    {
      key: "name",
      label: "NAME",
      render: (i) => (
        <div className="pm-name-cell">
          <div className="pm-avatar" style={{ background: `${typeConfig[i.type].color}22`, color: typeConfig[i.type].color }}>
            {getInitials(i.service_name)}
          </div>
          <div>
            <div className="pm-name">{i.service_name}</div>
            <div className="pm-sub">{i.category}</div>
          </div>
        </div>
      ),
    },
    { key: "type", label: "TYPE", render: (i) => <TypeBadge type={i.type} /> },
    { key: "duration", label: "DURATION", render: (i) => <span className="pm-muted">{i.duration}</span> },
    { key: "price", label: "PRICE", render: (i) => <span className="pm-muted">{formatINR(i.price)}</span> },
    { key: "tax", label: "TAX %", render: (i) => <span className="pm-muted">{i.tax_percentage}%</span> },
    { key: "status", label: "STATUS", render: (i) => <StatusBadge status={i.status} /> },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pm-page-header">
        <h1 className="pm-page-title">Product Management</h1>
        <div className="pm-header-actions">
          <button className="pm-header-btn pm-header-btn-ghost" onClick={() => openNewForm("service")}>
            <Plus size={14} /> New Service
          </button>
          <button className="pm-header-btn" onClick={() => openNewForm("product")}>
            <Plus size={14} /> New Product
          </button>
        </div>
      </div>

      <div className="pm-content">
        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="pm-stats">
          <div className="pm-stat-card">
            <div className="pm-stat-label">{activeKind === "product" ? "TOTAL PRODUCTS" : "TOTAL SERVICES"}</div>
            <div className="pm-stat-val pm-stat-white">{stats.total}</div>
            <div className="pm-stat-sub">Across all categories</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-label">ACTIVE</div>
            <div className="pm-stat-val pm-stat-green">{stats.active}</div>
            <div className="pm-stat-change pm-up">↑ Available for sale</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-label">INACTIVE</div>
            <div className="pm-stat-val pm-stat-amber">{stats.inactive}</div>
            <div className="pm-stat-sub">Hidden from quotes</div>
          </div>
          <div className="pm-stat-card">
            <div className="pm-stat-label">CORE {activeKind === "product" ? "MODULES" : "SERVICES"}</div>
            <div className="pm-stat-val pm-stat-blue">{stats.core}</div>
            <div className="pm-stat-sub">Not add-ons</div>
          </div>
        </div>

        {/* ── Primary tabs: Products / Services ─────────────────────────── */}
        <Tabs.Root value={activeKind} onValueChange={(v) => setActiveKind(v as ItemKind)}>
          <Tabs.List className="pm-main-tabs">
            <Tabs.Trigger value="product" className="pm-main-tab">
              <Package size={14} />
              Products
              <span className="pm-main-tab-count">{products.length}</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="service" className="pm-main-tab">
              <Wrench size={14} />
              Services
              <span className="pm-main-tab-count">{services.length}</span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="product" className="pm-tab-content">
            {/* ── Status sub-tabs ───────────────────────────────────────── */}
            <Tabs.Root value={productStatusTab} onValueChange={(v) => setProductStatusTab(v as "all" | ItemStatus)}>
              <Tabs.List className="pm-subtabs">
                <Tabs.Trigger value="all" className="pm-subtab">
                  All <span className="pm-subtab-count">{statusCounts.all}</span>
                </Tabs.Trigger>
                <Tabs.Trigger value="active" className="pm-subtab">
                  Active <span className="pm-subtab-count">{statusCounts.active}</span>
                </Tabs.Trigger>
                <Tabs.Trigger value="inactive" className="pm-subtab">
                  Inactive <span className="pm-subtab-count">{statusCounts.inactive}</span>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            {/* ── Filters ───────────────────────────────────────────────── */}
            <div className="pm-filters">
              <div className="pm-search">
                <Search size={13} color="#3d4450" />
                <input
                  className="pm-search-input"
                  placeholder="Search by name, code, category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <RadixSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as "all" | ItemType)}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "core", label: "Core" },
                  { value: "add_on", label: "Add-on" },
                ]}
                className="pm-select-trigger-w"
              />
            </div>

            <DataTable
              items={filteredProducts}
              columns={productColumns}
              onView={(item) => openView("product", item)}
              emptyIcon="📦"
              emptyLabel="No products found"
            />
          </Tabs.Content>

          <Tabs.Content value="service" className="pm-tab-content">
            <Tabs.Root value={serviceStatusTab} onValueChange={(v) => setServiceStatusTab(v as "all" | ItemStatus)}>
              <Tabs.List className="pm-subtabs">
                <Tabs.Trigger value="all" className="pm-subtab">
                  All <span className="pm-subtab-count">{statusCounts.all}</span>
                </Tabs.Trigger>
                <Tabs.Trigger value="active" className="pm-subtab">
                  Active <span className="pm-subtab-count">{statusCounts.active}</span>
                </Tabs.Trigger>
                <Tabs.Trigger value="inactive" className="pm-subtab">
                  Inactive <span className="pm-subtab-count">{statusCounts.inactive}</span>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div className="pm-filters">
              <div className="pm-search">
                <Search size={13} color="#3d4450" />
                <input
                  className="pm-search-input"
                  placeholder="Search by name, code, category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <RadixSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as "all" | ItemType)}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "core", label: "Core" },
                  { value: "add_on", label: "Add-on" },
                ]}
                className="pm-select-trigger-w"
              />
            </div>

            <DataTable
              items={filteredServices}
              columns={serviceColumns}
              onView={(item) => openView("service", item)}
              emptyIcon="🛠️"
              emptyLabel="No services found"
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* ── View / Edit Dialog ─────────────────────────────────────────────── */}
      {viewing && (
        <ViewItem
          open={!!viewing}
          kind={viewing.kind}
          data={viewing.data}
          isEditing={isEditing}
          editDraft={editDraft}
          onClose={closeView}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={deleteItem}
          onUpdateStatus={updateViewStatus}
          onDraftChange={(patch) => setEditDraft((d) => (d ? ({ ...d, ...patch } as AnyItem) : d))}
        />
      )}

      {/* ── New Product / Service Dialog ──────────────────────────────────── */}
      <ItemFormDialog open={formOpen} kind={formKind} onClose={() => setFormOpen(false)} onCreate={createItem} />
    </>
  )
}

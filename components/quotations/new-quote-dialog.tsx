"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { getSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { CreateQuotationPayload, QuotationLineItem } from "@/types/quotation"

type CoreModule = {
  id: string
  name: string
  desc: string
  price: number
  isCore: boolean
}

type SupportItem = {
  id: string
  name: string
  desc: string
  options: { value: string; label: string }[]
  basePrice: number
  enabled: boolean
  selectedOption: string
}

const SUITE_CATALOGUE: Record<string, { core: CoreModule[]; addons: CoreModule[] }> = {
  pharmacy: {
    core: [
      { id: "outlet", name: "Outlet Management", desc: "Multi-outlet setup, branch control", price: 12000, isCore: true },
      { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts, barcode", price: 18000, isCore: true },
      { id: "admin", name: "Admin Panel", desc: "Centralised dashboard & reports", price: 10000, isCore: true },
      { id: "user", name: "User Management", desc: "Roles, permissions, staff login", price: 8000, isCore: true },
      { id: "delivery", name: "Delivery App", desc: "Driver app, route & status tracking", price: 9000, isCore: true },
    ],
    addons: [
      { id: "inventory", name: "Inventory Management", desc: "Stock levels, expiry tracking", price: 14000, isCore: false },
      { id: "online", name: "Online Ordering", desc: "Web & mobile ordering portal", price: 12000, isCore: false },
      { id: "hrms", name: "HRMS", desc: "Attendance, payroll, leaves", price: 10000, isCore: false },
      { id: "loyalty", name: "Loyalty Program", desc: "Points, offers, customer rewards", price: 7000, isCore: false },
      { id: "analytics", name: "Analytics Dashboard", desc: "Sales insights, trend reports", price: 11000, isCore: false },
    ],
  },
  clinic: {
    core: [
      { id: "emr", name: "EMR", desc: "Electronic medical records", price: 15000, isCore: true },
      { id: "appointments", name: "Appointments", desc: "Scheduling & reminders", price: 8000, isCore: true },
      { id: "billing", name: "Billing", desc: "Invoice & payments", price: 10000, isCore: true },
    ],
    addons: [
      { id: "prescription", name: "Digital Prescription", desc: "E-prescriptions, templates", price: 6000, isCore: false },
      { id: "lab", name: "Lab Integration", desc: "Results, reports sync", price: 12000, isCore: false },
      { id: "teleconsult", name: "Teleconsultation", desc: "Video consults", price: 9000, isCore: false },
    ],
  },
  retail: {
    core: [
      { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts", price: 16000, isCore: true },
      { id: "inventory", name: "Inventory Management", desc: "Stock tracking", price: 12000, isCore: true },
    ],
    addons: [
      { id: "online", name: "Online Ordering", desc: "E-commerce portal", price: 14000, isCore: false },
      { id: "loyalty", name: "Loyalty Program", desc: "Points & rewards", price: 8000, isCore: false },
      { id: "analytics", name: "Analytics", desc: "Sales insights", price: 10000, isCore: false },
    ],
  },
}

const DEFAULT_SUPPORT_ITEMS: SupportItem[] = [
  {
    id: "onboard",
    name: "Onboarding & setup",
    desc: "Initial installation, data migration, go-live",
    options: [
      { value: "1", label: "1 session" },
      { value: "2", label: "2 sessions" },
      { value: "3", label: "3 sessions" },
    ],
    basePrice: 5000,
    enabled: true,
    selectedOption: "1",
  },
  {
    id: "training",
    name: "Staff training",
    desc: "On-site / remote training for end users",
    options: [
      { value: "1", label: "1 day" },
      { value: "2", label: "2 days" },
      { value: "3", label: "3 days" },
    ],
    basePrice: 3000,
    enabled: true,
    selectedOption: "1",
  },
  {
    id: "amc",
    name: "AMC — Annual maintenance",
    desc: "Bug fixes, updates, priority support",
    options: [
      { value: "1", label: "1 year" },
      { value: "2", label: "2 years" },
      { value: "3", label: "3 years" },
    ],
    basePrice: 8000,
    enabled: false,
    selectedOption: "1",
  },
  {
    id: "support",
    name: "24/7 support plan",
    desc: "Dedicated helpdesk + SLA response",
    options: [
      { value: "6", label: "6 months" },
      { value: "12", label: "12 months" },
    ],
    basePrice: 6000,
    enabled: false,
    selectedOption: "6",
  },
]

export function NewQuoteDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState("")
  const [organization, setOrganization] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [product, setProduct] = useState("pharmacy")
  const [expiry, setExpiry] = useState("")
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState("0")

  // Core modules (can be removed)
  const [removedCores, setRemovedCores] = useState<Set<string>>(new Set())
  // Active addons
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())
  // Custom modules
  const [customModules, setCustomModules] = useState<{ name: string; price: number }[]>([])
  // Support items
  const [supportItems, setSupportItems] = useState<SupportItem[]>(DEFAULT_SUPPORT_ITEMS.map((s) => ({ ...s })))

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suite = SUITE_CATALOGUE[product] || SUITE_CATALOGUE.pharmacy

  const activeCoreModules = suite.core.filter((m) => !removedCores.has(m.id))
  const activeAddonModules = suite.addons.filter((m) => activeAddons.has(m.id))

  const computedTotal = useMemo(() => {
    const coreTotal = activeCoreModules.reduce((sum, m) => sum + m.price, 0)
    const addonTotal = activeAddonModules.reduce((sum, m) => sum + m.price, 0)
    const customTotal = customModules.reduce((sum, m) => sum + m.price, 0)
    const modulesSubtotal = coreTotal + addonTotal + customTotal

    const supportTotal = supportItems
      .filter((s) => s.enabled)
      .reduce((sum, s) => sum + s.basePrice * Number(s.selectedOption), 0)

    const subtotal = modulesSubtotal + supportTotal
    const discountValue = Number(discount) || 0
    const clampedDiscount = Math.max(0, Math.min(subtotal, discountValue))
    const gst = Math.round((subtotal - clampedDiscount) * 0.18)

    return {
      modulesSubtotal,
      supportTotal,
      subtotal,
      gst,
      discount: clampedDiscount,
      total: subtotal - clampedDiscount + gst,
    }
  }, [activeCoreModules, activeAddonModules, customModules, supportItems, discount])

  const resetForm = () => {
    setClient("")
    setOrganization("")
    setEmail("")
    setPhone("")
    setProduct("pharmacy")
    setExpiry("")
    setNotes("")
    setDiscount("0")
    setRemovedCores(new Set())
    setActiveAddons(new Set())
    setCustomModules([])
    setSupportItems(DEFAULT_SUPPORT_ITEMS.map((s) => ({ ...s })))
    setError(null)
  }

  const handleSuiteChange = (newSuite: string) => {
    setProduct(newSuite)
    setRemovedCores(new Set())
    setActiveAddons(new Set())
  }

  const removeCore = (id: string) => {
    setRemovedCores((prev) => new Set([...prev, id]))
  }

  const restoreCore = (id: string) => {
    setRemovedCores((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleAddon = (id: string) => {
    setActiveAddons((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSupportItem = (id: string) => {
    setSupportItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const updateSupportOption = (id: string, value: string) => {
    setSupportItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selectedOption: value } : s))
    )
  }

  async function createQuotation(status: "draft" | "sent") {
    setError(null)

    if (!client.trim() || !organization.trim()) {
      setError("Client and organization are required.")
      return
    }

    setSubmitting(true)

    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("Please sign in before creating quotations.")
      }

      const lineItems: QuotationLineItem[] = [
        ...activeCoreModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...activeAddonModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...customModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...supportItems
          .filter((s) => s.enabled)
          .map((s) => ({ name: s.name, quantity: Number(s.selectedOption), unitPrice: s.basePrice })),
      ]

      const productLabel =
        product === "pharmacy"
          ? "Pharmacy Management Suite"
          : product === "clinic"
            ? "Clinic Management Suite"
            : "Retail Suite"

      const payload: CreateQuotationPayload = {
        client,
        organization,
        product: productLabel,
        status,
        expiry: expiry || "-",
        discount: Number(discount) || 0,
        lineItems,
        notes,
      }

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to create quotation.")
      }

      window.dispatchEvent(new CustomEvent("quotation:changed"))
      toast.success(status === "draft" ? "Quotation saved as draft." : "Quotation sent to client.")
      setOpen(false)
      resetForm()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create quotation."
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={triggerClassName}>
          <Plus size={13} />
          New Quote
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="panel quote-composer-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header quote-composer-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">New Quotation</SheetTitle>
            <SheetDescription className="panel-subtitle">QT-2025-049 · Draft</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close new quotation panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body quote-composer-body">
          {/* Client details */}
          <div>
            <div className="section-heading">Client details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client name</label>
                <Input className="form-input" placeholder="e.g. Apollo Pharmacy" value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Organisation</label>
                <Input className="form-input" placeholder="Company or hospital name" value={organization} onChange={(e) => setOrganization(e.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <Input className="form-input" type="email" placeholder="billing@client.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <Input className="form-input" placeholder="+91 98xxx xxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Quote details */}
          <div>
            <div className="section-heading">Quote details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product suite</label>
                <select className="form-input" value={product} onChange={(e) => handleSuiteChange(e.target.value)}>
                  <option value="pharmacy">Pharmacy Management Suite</option>
                  <option value="clinic">Clinic Management Suite</option>
                  <option value="retail">Retail Suite</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valid until</label>
                <Input className="form-input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Core modules */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Core modules</div>
              {removedCores.size > 0 && (
                <button
                  type="button"
                  className="add-line-btn"
                  style={{ padding: "4px 10px", fontSize: "11.5px", width: "auto", margin: 0 }}
                  onClick={() => setRemovedCores(new Set())}
                >
                  <Plus size={11} />
                  Restore module
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {activeCoreModules.map((mod) => (
                <div
                  key={mod.id}
                  className="line-item"
                  style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                >
                  <div>
                    <div className="line-item-name">{mod.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>{mod.desc}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Core
                  </span>
                  <div className="line-item-price">{fmt(mod.price)}</div>
                  <button type="button" className="remove-item" onClick={() => removeCore(mod.id)} aria-label="Remove module">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add-on modules */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Add-on modules</div>
              <span style={{ fontSize: "11px", color: "var(--text3)" }}>Optional extras</span>
            </div>

            {/* Active addons */}
            {activeAddonModules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {activeAddonModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="line-item"
                    style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                  >
                    <div>
                      <div className="line-item-name">{mod.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text3)" }}>{mod.desc}</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "var(--accent2-dim)",
                        color: "var(--accent2)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      Add-on
                    </span>
                    <div className="line-item-price">{fmt(mod.price)}</div>
                    <button type="button" className="remove-item" onClick={() => toggleAddon(mod.id)} aria-label="Remove module">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeAddonModules.length === 0 && (
              <div style={{ fontSize: "12px", color: "var(--text3)", padding: "8px 0" }}>
                No add-ons selected yet.
              </div>
            )}

            {/* Add-on picker buttons */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <select
                  className="form-input"
                  style={{ width: "100%", fontSize: "12px" }}
                  onChange={(e) => {
                    if (e.target.value) toggleAddon(e.target.value)
                    e.target.value = ""
                  }}
                  value=""
                >
                  <option value="">+ Add from catalogue</option>
                  {suite.addons
                    .filter((m) => !activeAddons.has(m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {fmt(m.price)}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                className="add-line-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  const name = prompt("Module name:")
                  if (!name) return
                  const price = Number(prompt("Price (₹):"))
                  if (!price || price <= 0) return
                  setCustomModules((prev) => [...prev, { name, price }])
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Type a custom module
              </button>
            </div>

            {/* Custom modules */}
            {customModules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {customModules.map((mod, idx) => (
                  <div
                    key={`custom-${idx}`}
                    className="line-item"
                    style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                  >
                    <div>
                      <div className="line-item-name">{mod.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text3)" }}>Custom module</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "var(--warn-dim)",
                        color: "var(--warn)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      Custom
                    </span>
                    <div className="line-item-price">{fmt(mod.price)}</div>
                    <button
                      type="button"
                      className="remove-item"
                      onClick={() => setCustomModules((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove module"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support & training */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Support & training</div>
              <span style={{ fontSize: "11px", color: "var(--text3)" }}>Optional — recommended</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {supportItems.map((item) => (
                <div
                  key={item.id}
                  className="line-item"
                  style={{
                    gridTemplateColumns: "1fr 100px 110px 28px",
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div>
                    <div className="line-item-name">{item.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>{item.desc}</div>
                  </div>
                  <select
                    className="form-input"
                    style={{ padding: "4px 8px", fontSize: "12px", height: "32px" }}
                    value={item.selectedOption}
                    onChange={(e) => updateSupportOption(item.id, e.target.value)}
                  >
                    {item.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="line-item-price" style={{ color: item.enabled ? "var(--accent2)" : "var(--text3)" }}>
                    {fmt(item.basePrice * Number(item.selectedOption))}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => toggleSupportItem(item.id)}
                      style={{ accentColor: "var(--accent)", width: "14px", height: "14px" }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Modules subtotal</span>
              <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedTotal.modulesSubtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Support & training</span>
              <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedTotal.supportTotal)}</span>
            </div>
            <div className="summary-row">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Discount
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  style={{
                    width: "70px",
                    padding: "3px 6px",
                    fontSize: "12px",
                    background: "var(--surface3)",
                    border: "1px solid var(--border2)",
                    borderRadius: "4px",
                    color: "var(--text)",
                    fontFamily: "var(--mono)",
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>₹</span>
              </span>
              <span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>− {fmt(computedTotal.discount)}</span>
            </div>
            <div className="summary-row">
              <span>GST (18%)</span>
              <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedTotal.gst)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{fmt(computedTotal.total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes to client</label>
            <Textarea
              className="form-input quote-notes"
              rows={3}
              placeholder="Add any terms, conditions or notes…"
              style={{ resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        </div>

        <SheetFooter className="panel-footer quote-composer-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-ghost quote-draft-btn"
            variant="outline"
            style={{ color: "var(--warn)" }}
            onClick={() => void createQuotation("draft")}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save as draft"}
          </Button>
          <Button
            className="btn btn-primary quote-send-btn"
            onClick={() => void createQuotation("sent")}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send to client →"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

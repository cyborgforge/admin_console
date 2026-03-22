"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type Module = {
  id: string
  name: string
  desc: string
  price: number
  isCore: boolean
  enabled: boolean
}

const SUITE_CATALOGUE: Record<string, Module[]> = {
  pharmacy: [
    { id: "outlet", name: "Outlet Management", desc: "Multi-outlet setup, branch control", price: 12000, isCore: true, enabled: true },
    { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts, barcode", price: 18000, isCore: true, enabled: true },
    { id: "admin", name: "Admin Panel", desc: "Centralised dashboard & reports", price: 10000, isCore: true, enabled: true },
    { id: "user", name: "User Management", desc: "Roles, permissions, staff login", price: 8000, isCore: true, enabled: true },
    { id: "delivery", name: "Delivery App", desc: "Driver app, route & status tracking", price: 9000, isCore: true, enabled: true },
    { id: "inventory", name: "Inventory Management", desc: "Stock levels, expiry tracking", price: 14000, isCore: false, enabled: false },
    { id: "online", name: "Online Ordering", desc: "Web & mobile ordering portal", price: 12000, isCore: false, enabled: false },
    { id: "hrms", name: "HRMS", desc: "Attendance, payroll, leaves", price: 10000, isCore: false, enabled: false },
    { id: "loyalty", name: "Loyalty Program", desc: "Points, offers, customer rewards", price: 7000, isCore: false, enabled: false },
    { id: "analytics", name: "Analytics Dashboard", desc: "Sales insights, trend reports", price: 11000, isCore: false, enabled: false },
  ],
  clinic: [
    { id: "emr", name: "EMR", desc: "Electronic medical records", price: 15000, isCore: true, enabled: true },
    { id: "appointments", name: "Appointments", desc: "Scheduling & reminders", price: 8000, isCore: true, enabled: true },
    { id: "billing", name: "Billing", desc: "Invoice & payments", price: 10000, isCore: true, enabled: true },
    { id: "prescription", name: "Digital Prescription", desc: "E-prescriptions, templates", price: 6000, isCore: false, enabled: false },
    { id: "lab", name: "Lab Integration", desc: "Results, reports sync", price: 12000, isCore: false, enabled: false },
    { id: "teleconsult", name: "Teleconsultation", desc: "Video consults", price: 9000, isCore: false, enabled: false },
  ],
  retail: [
    { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts", price: 16000, isCore: true, enabled: true },
    { id: "inventory", name: "Inventory Management", desc: "Stock tracking", price: 12000, isCore: true, enabled: true },
    { id: "online", name: "Online Ordering", desc: "E-commerce portal", price: 14000, isCore: false, enabled: false },
    { id: "loyalty", name: "Loyalty Program", desc: "Points & rewards", price: 8000, isCore: false, enabled: false },
    { id: "analytics", name: "Analytics", desc: "Sales insights", price: 10000, isCore: false, enabled: false },
  ],
}

export function AddSubscriptionDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState("")
  const [plan, setPlan] = useState("growth")
  const [suite, setSuite] = useState("pharmacy")
  const [cycle, setCycle] = useState("annual")
  const [startDate, setStartDate] = useState("")
  const [renewalDate, setRenewalDate] = useState("")
  const [modules, setModules] = useState<Module[]>(SUITE_CATALOGUE.pharmacy.map((m) => ({ ...m })))
  const [submitting, setSubmitting] = useState(false)

  const updateSuiteModules = (newSuite: string) => {
    setSuite(newSuite)
    setModules(SUITE_CATALOGUE[newSuite]?.map((m) => ({ ...m })) ?? [])
  }

  const toggleModule = (id: string) => {
    setModules((current) =>
      current.map((mod) => (mod.id === id ? { ...mod, enabled: !mod.enabled } : mod))
    )
  }

  const computedSummary = useMemo(() => {
    const activeModules = modules.filter((m) => m.enabled)
    const basePrice = activeModules.reduce((sum, m) => sum + m.price, 0)
    const mrr = Math.round(basePrice / 12)
    return {
      moduleCount: activeModules.length,
      basePrice,
      cycleLabel: cycle === "monthly" ? "Monthly" : cycle === "quarterly" ? "Quarterly" : "Annual",
      mrr,
    }
  }, [modules, cycle])

  const resetForm = () => {
    setClient("")
    setPlan("growth")
    setSuite("pharmacy")
    setCycle("annual")
    setStartDate("")
    setRenewalDate("")
    setModules(SUITE_CATALOGUE.pharmacy.map((m) => ({ ...m })))
  }

  async function activateSubscription() {
    if (!client) {
      toast.error("Please select a client.")
      return
    }

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Subscription activated successfully.")
    setOpen(false)
    resetForm()
    setSubmitting(false)
  }

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={triggerClassName}>
          <Plus size={13} />
          Add Subscription
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="panel add-subscription-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header add-subscription-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">Add subscription</SheetTitle>
            <SheetDescription className="panel-subtitle">Activate modules for a client</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close add subscription panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body add-subscription-body">
          {/* Client & plan */}
          <div>
            <div className="section-heading">Client & plan</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client</label>
                <select
                  className="form-input"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                >
                  <option value="">— select client —</option>
                  <option value="Apollo Pharmacy">Apollo Pharmacy</option>
                  <option value="Green Cross Clinic">Green Cross Clinic</option>
                  <option value="MedPlus Pharma">MedPlus Pharma</option>
                  <option value="City Hospital">City Hospital</option>
                  <option value="Lifeline Hospital">Lifeline Hospital</option>
                  <option value="Quick Mart">Quick Mart</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Plan</label>
                <select
                  className="form-input"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">Suite</label>
                <select
                  className="form-input"
                  value={suite}
                  onChange={(e) => updateSuiteModules(e.target.value)}
                >
                  <option value="pharmacy">Pharmacy Management Suite</option>
                  <option value="clinic">Clinic Management Suite</option>
                  <option value="retail">Retail Suite</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Billing cycle</label>
                <select
                  className="form-input"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active modules picker */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Active modules</div>
              <span style={{ fontSize: "11px", color: "var(--text3)" }}>Toggle to activate / deactivate</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className={`sub-mod-row ${mod.enabled ? "on" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleModule(mod.id)}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{mod.name}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text3)" }}>
                      {mod.desc} · {fmt(mod.price)}/yr
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {mod.isCore && (
                      <span className="sub-mod-core" style={{ fontSize: "10px", fontFamily: "var(--mono)" }}>Core</span>
                    )}
                    <div className={`sub-mod-toggle ${mod.enabled ? "on" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div>
            <div className="section-heading">Dates</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start date</label>
                <Input
                  className="form-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Renewal date</label>
                <Input
                  className="form-input"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Active modules</span>
              <span style={{ fontFamily: "var(--mono)" }}>{computedSummary.moduleCount} modules</span>
            </div>
            <div className="summary-row">
              <span>Base price</span>
              <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedSummary.basePrice)}/yr</span>
            </div>
            <div className="summary-row">
              <span>Billing cycle</span>
              <span style={{ fontFamily: "var(--mono)" }}>{computedSummary.cycleLabel}</span>
            </div>
            <div className="summary-row summary-total">
              <span style={{ color: "#FFFFFF" }}>MRR</span>
              <span style={{ color: "#10B981" }}>{fmt(computedSummary.mrr)}/mo</span>
            </div>
          </div>
        </div>

        <SheetFooter className="panel-footer add-subscription-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost add-subscription-cancel-btn" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-primary add-subscription-activate-btn"
            onClick={() => void activateSubscription()}
            disabled={submitting}
          >
            {submitting ? "Activating..." : "Activate subscription"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

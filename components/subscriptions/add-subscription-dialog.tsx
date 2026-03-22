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
  name: string
  price: number
  enabled: boolean
}

const pharmacyModules: Module[] = [
  { name: "Outlet Management", price: 2000, enabled: true },
  { name: "POS & Billing", price: 3000, enabled: true },
  { name: "Inventory Management", price: 2500, enabled: true },
  { name: "Online Ordering", price: 2000, enabled: false },
  { name: "Delivery App", price: 1500, enabled: false },
  { name: "HRMS", price: 1800, enabled: false },
  { name: "Analytics Dashboard", price: 1200, enabled: false },
]

const clinicModules: Module[] = [
  { name: "EMR", price: 3500, enabled: true },
  { name: "Appointments", price: 1500, enabled: true },
  { name: "Billing", price: 2000, enabled: true },
  { name: "Digital Prescription", price: 1800, enabled: false },
  { name: "Lab Integration", price: 2500, enabled: false },
  { name: "Teleconsultation", price: 2000, enabled: false },
]

const retailModules: Module[] = [
  { name: "POS & Billing", price: 2500, enabled: true },
  { name: "Inventory Management", price: 2000, enabled: true },
  { name: "Online Ordering", price: 1800, enabled: false },
  { name: "Loyalty Program", price: 1200, enabled: false },
  { name: "Analytics", price: 1000, enabled: false },
]

const suiteModulesMap: Record<string, Module[]> = {
  pharmacy: pharmacyModules,
  clinic: clinicModules,
  retail: retailModules,
}

export function AddSubscriptionDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState("")
  const [plan, setPlan] = useState("growth")
  const [suite, setSuite] = useState("pharmacy")
  const [cycle, setCycle] = useState("annual")
  const [startDate, setStartDate] = useState("")
  const [renewalDate, setRenewalDate] = useState("")
  const [modules, setModules] = useState<Module[]>(pharmacyModules.map((m) => ({ ...m })))
  const [submitting, setSubmitting] = useState(false)

  const updateSuiteModules = (newSuite: string) => {
    setSuite(newSuite)
    setModules(suiteModulesMap[newSuite]?.map((m) => ({ ...m })) ?? [])
  }

  const toggleModule = (index: number) => {
    setModules((current) =>
      current.map((mod, i) => (i === index ? { ...mod, enabled: !mod.enabled } : mod))
    )
  }

  const computedSummary = useMemo(() => {
    const activeModules = modules.filter((m) => m.enabled)
    const basePrice = activeModules.reduce((sum, m) => sum + m.price, 0)
    const cycleMultiplier = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12
    const mrr = basePrice
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
    setModules(pharmacyModules.map((m) => ({ ...m })))
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
              {modules.map((mod, index) => (
                <div
                  key={mod.name}
                  className={`sub-mod-row ${mod.enabled ? "on" : ""}`}
                  onClick={() => toggleModule(index)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{mod.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>₹{mod.price.toLocaleString("en-IN")}/mo</div>
                  </div>
                  <div className={`sub-mod-toggle ${mod.enabled ? "on" : ""}`} />
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
              <span style={{ fontFamily: "var(--mono)" }}>₹{computedSummary.basePrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span>Billing cycle</span>
              <span style={{ fontFamily: "var(--mono)" }}>{computedSummary.cycleLabel}</span>
            </div>
            <div className="summary-row summary-total">
              <span>MRR</span>
              <span style={{ color: "var(--accent2)" }}>₹{computedSummary.mrr.toLocaleString("en-IN")}/mo</span>
            </div>
          </div>
        </div>

        <SheetFooter className="panel-footer add-subscription-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-primary"
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

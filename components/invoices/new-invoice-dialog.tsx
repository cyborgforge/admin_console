"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

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

type InvoiceLineItem = {
  description: string
  quantity: number
  rate: number
}

export function NewInvoiceDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [fromQuote, setFromQuote] = useState("")
  const [client, setClient] = useState("")
  const [gstin, setGstin] = useState("")
  const [email, setEmail] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [gstRate, setGstRate] = useState("18")
  const [taxType, setTaxType] = useState("igst")
  const [discount, setDiscount] = useState("0")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, rate: 0 },
  ])

  const computedTotal = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
    const discountValue = Number(discount) || 0
    const clampedDiscount = Math.max(0, Math.min(subtotal, discountValue))
    const taxableAmount = subtotal - clampedDiscount
    const gst = Math.round(taxableAmount * (Number(gstRate) / 100))
    return {
      subtotal,
      discount: clampedDiscount,
      gst,
      total: taxableAmount + gst,
    }
  }, [lineItems, discount, gstRate])

  const resetForm = () => {
    setFromQuote("")
    setClient("")
    setGstin("")
    setEmail("")
    setDueDate("")
    setGstRate("18")
    setTaxType("igst")
    setDiscount("0")
    setPaymentTerms("")
    setLineItems([{ description: "", quantity: 1, rate: 0 }])
  }

  const addLineItem = () => {
    setLineItems((current) => [...current, { description: "", quantity: 1, rate: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current))
  }

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const loadFromQuote = (quoteRef: string) => {
    setFromQuote(quoteRef)
    if (quoteRef === "QT-2025-047") {
      setClient("Green Cross Clinic")
      setEmail("billing@greencross.in")
      setLineItems([
        { description: "EMR Module", quantity: 1, rate: 15000 },
        { description: "Appointments Module", quantity: 1, rate: 8000 },
        { description: "Billing Module", quantity: 1, rate: 6000 },
      ])
    } else if (quoteRef === "QT-2025-046") {
      setClient("MedPlus Pharma")
      setEmail("billing@medplus.in")
      setLineItems([
        { description: "POS & Billing", quantity: 1, rate: 18000 },
        { description: "Inventory Management", quantity: 1, rate: 14000 },
        { description: "Online Ordering", quantity: 1, rate: 12000 },
      ])
    } else if (quoteRef === "QT-2025-042") {
      setClient("Lifeline Hospital")
      setEmail("accounts@lifeline.org")
      setLineItems([
        { description: "EMR Module", quantity: 1, rate: 20000 },
        { description: "Teleconsultation", quantity: 1, rate: 15000 },
        { description: "Lab Integration", quantity: 1, rate: 12000 },
      ])
    }
  }

  async function createInvoice(status: "draft" | "sent") {
    if (!client.trim()) {
      toast.error("Client name is required.")
      return
    }

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success(status === "draft" ? "Invoice saved as draft." : "Invoice sent to client.")
    setOpen(false)
    resetForm()
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={triggerClassName}>
          <Plus size={13} />
          New Invoice
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="panel new-invoice-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header new-invoice-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">New Invoice</SheetTitle>
            <SheetDescription className="panel-subtitle">INV-2025-025 · Draft</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close new invoice panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body new-invoice-body">
          {/* From quote banner */}
          <div
            style={{
              background: "var(--accent-dim)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--accent)" }}>
                Convert from an accepted quote?
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text2)", marginTop: "2px" }}>
                Pick a quote and all line items will be imported automatically
              </div>
            </div>
            <select
              className="form-input"
              style={{ width: "180px", fontSize: "12px" }}
              value={fromQuote}
              onChange={(e) => loadFromQuote(e.target.value)}
            >
              <option value="">— select quote —</option>
              <option value="QT-2025-047">QT-2025-047 · Green Cross</option>
              <option value="QT-2025-046">QT-2025-046 · MedPlus</option>
              <option value="QT-2025-042">QT-2025-042 · Lifeline</option>
            </select>
          </div>

          {/* Bill to */}
          <div>
            <div className="section-heading">Bill to</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client name</label>
                <Input
                  className="form-input"
                  placeholder="e.g. Apollo Pharmacy"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <Input
                  className="form-input"
                  placeholder="29AAAAA0000A1Z5"
                  style={{ fontFamily: "var(--mono)", fontSize: "12px" }}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <Input
                  className="form-input"
                  type="email"
                  placeholder="billing@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due date</label>
                <Input
                  className="form-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Line items</div>
              <Button className="btn btn-ghost btn-sm" variant="outline" onClick={addLineItem}>
                + Add item
              </Button>
            </div>
            <div
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface3)" }}>
                    <th className="inv-table-th">Description</th>
                    <th className="inv-table-th" style={{ textAlign: "right", width: "70px" }}>Qty</th>
                    <th className="inv-table-th" style={{ textAlign: "right", width: "100px" }}>Rate</th>
                    <th className="inv-table-th" style={{ textAlign: "right", width: "100px" }}>Amount</th>
                    <th style={{ width: "32px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <Input
                          className="form-input"
                          style={{ padding: "5px 8px", fontSize: "12.5px" }}
                          placeholder="Module / service description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <Input
                          className="form-input"
                          style={{ padding: "5px 8px", fontSize: "12.5px", width: "52px", textAlign: "center" }}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value) || 1)}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <Input
                          className="form-input"
                          style={{ padding: "5px 8px", fontSize: "12.5px", width: "90px", textAlign: "right", fontFamily: "var(--mono)" }}
                          type="number"
                          placeholder="0"
                          value={item.rate || ""}
                          onChange={(e) => updateLineItem(index, "rate", Number(e.target.value) || 0)}
                        />
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontFamily: "var(--mono)",
                          fontSize: "12.5px",
                          color: "var(--accent2)",
                        }}
                      >
                        ₹{(item.quantity * item.rate).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text3)",
                            cursor: "pointer",
                            fontSize: "16px",
                            lineHeight: 1,
                          }}
                          onClick={() => removeLineItem(index)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax & summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
            <div>
              <div className="section-heading">Tax settings</div>
              <div className="form-group">
                <label className="form-label">GST rate</label>
                <select
                  className="form-input"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                >
                  <option value="0">0% — Exempt</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18% — Standard</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Tax type</label>
                <select
                  className="form-input"
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                >
                  <option value="igst">IGST (Interstate)</option>
                  <option value="cgst_sgst">CGST + SGST (Intrastate)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Discount (₹)</label>
                <Input
                  className="form-input"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ fontFamily: "var(--mono)" }}
                />
              </div>
            </div>
            <div className="summary-box" style={{ marginTop: "28px" }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span style={{ fontFamily: "var(--mono)" }}>₹{computedTotal.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>
                  − ₹{computedTotal.discount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="summary-row">
                <span>GST ({gstRate}%)</span>
                <span style={{ fontFamily: "var(--mono)" }}>₹{computedTotal.gst.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span style={{ color: "var(--accent2)" }}>₹{computedTotal.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Payment terms */}
          <div className="form-group">
            <label className="form-label">Payment terms / notes</label>
            <Textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Payment due within 30 days. Bank transfer preferred."
              style={{ resize: "vertical" }}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="panel-footer new-invoice-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-ghost"
            variant="outline"
            style={{ color: "var(--warn)" }}
            onClick={() => void createInvoice("draft")}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save draft"}
          </Button>
          <Button
            className="btn btn-ghost"
            variant="outline"
            style={{ color: "var(--accent)" }}
            onClick={() => toast.success("Preview PDF coming soon")}
            disabled={submitting}
          >
            Preview PDF
          </Button>
          <Button
            className="btn btn-primary"
            onClick={() => void createInvoice("sent")}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send to client →"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

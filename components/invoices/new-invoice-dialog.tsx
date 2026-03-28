"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { getSupabaseClient } from "@/lib/supabaseClient"
import { useQuotations } from "@/hooks/use-quotations"
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
import { QuotationPDFPreview } from "@/components/quotations/quotation-pdf-preview"
import type { CreateInvoicePayload, InvoiceLineItem } from "@/types/invoice"
import type { Quotation } from "@/types/quotation"

export function NewInvoiceDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [previewingQuote, setPreviewingQuote] = useState<Quotation | null>(null)
  const [fromQuote, setFromQuote] = useState("")
  const [client, setClient] = useState("")
  const [org, setOrg] = useState("")
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
  const { quotations } = useQuotations()

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

  const validateEmail = (emailValue: string) => {
    if (!emailValue.trim()) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const validateGST = (gstValue: string) => {
    if (!gstValue.trim()) return true
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/
    return gstRegex.test(gstValue)
  }

  const resetForm = () => {
    setFromQuote("")
    setClient("")
    setOrg("")
    setGstin("")
    setEmail("")
    setDueDate("")
    setGstRate("18")
    setTaxType("igst")
    setDiscount("0")
    setPaymentTerms("")
    setLineItems([{ description: "", quantity: 1, rate: 0 }])
    setPreviewingQuote(null)
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
    if (!quoteRef) {
      setOrg("")
      return
    }

    const selectedQuote = quotations.find(q => q.id === quoteRef)
    if (selectedQuote) {
      setClient(selectedQuote.client)
      setOrg(selectedQuote.organization)
      
      // Create line items from quotation line items
      if (selectedQuote.lineItems && selectedQuote.lineItems.length > 0) {
        setLineItems(
          selectedQuote.lineItems.map((item) => ({
            description: item.name,
            quantity: item.quantity,
            rate: item.unitPrice,
          }))
        )
      } else {
        // Fallback: create a single line item with the total amount
        setLineItems([
          { description: selectedQuote.product, quantity: 1, rate: selectedQuote.amount },
        ])
      }
    }
  }

  async function createInvoice(status: "draft" | "sent") {
    if (!client.trim()) {
      toast.error("Client name is required.")
      return
    }

    if (email.trim() && !validateEmail(email)) {
      toast.error("Please enter a valid email address.")
      return
    }

    if (gstin.trim() && !validateGST(gstin)) {
      toast.error("Please enter a valid GST number.")
      return
    }

    const validLineItems = lineItems.filter((item) => item.description.trim() && item.quantity > 0)
    if (validLineItems.length === 0) {
      toast.error("Add at least one valid line item.")
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
        throw new Error("Please sign in before creating invoices.")
      }

      const payload: CreateInvoicePayload = {
        client,
        org: org || client,
        quoteRef: fromQuote || "-",
        product: taxType === "cgst_sgst" ? "clinic" : "pharmacy",
        status,
        due: dueDate || "-",
        gstin,
        email,
        gstRate: Number(gstRate) || 18,
        taxType: taxType === "cgst_sgst" ? "cgst_sgst" : "igst",
        discount: Number(discount) || 0,
        paymentTerms,
        lineItems: validLineItems,
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to create invoice.")
      }

      window.dispatchEvent(new CustomEvent("invoice:changed"))
      toast.success(status === "draft" ? "Invoice saved as draft." : "Invoice sent to client.")
      setOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invoice."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return (
    <>
      {previewingQuote && (
        <QuotationPDFPreview
          quotation={previewingQuote}
          open={Boolean(previewingQuote)}
          onOpenChange={(open) => !open && setPreviewingQuote(null)}
        />
      )}
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
              background: "#3B82F61F",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#3B82F6" }}>
                Convert from an accepted quote?
              </div>
              <div style={{ fontSize: "11.5px", color: "#8B95A8", marginTop: "2px" }}>
                Pick a quote and all line items will be imported automatically
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                className="form-input"
                style={{ width: "180px", fontSize: "12px" }}
                value={fromQuote}
                onChange={(e) => {
                  const selectedQuoteId = e.target.value
                  const selectedQuote = quotations.find(q => q.id === selectedQuoteId)
                  if (selectedQuote) {
                    setPreviewingQuote(selectedQuote)
                  }
                  loadFromQuote(selectedQuoteId)
                }}
              >
                <option value="">— select quote —</option>
                {quotations.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.id} · {quote.client.substring(0, 15)}…
                  </option>
                ))}
              </select>
              {fromQuote && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const selectedQuote = quotations.find(q => q.id === fromQuote)
                    if (selectedQuote) {
                      setPreviewingQuote(selectedQuote)
                    }
                  }}
                  title="Preview selected quote"
                >
                  Preview
                </Button>
              )}
            </div>
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
                  placeholder="dd-mm-yyyy"
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
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{
                  padding: "4px 10px",
                  fontSize: "11.5px",
                  background: "transparent",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text2)",
                  cursor: "pointer",
                }}
                onClick={addLineItem}
              >
                + Add item
              </button>
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
                    <th className="inv-table-th" style={{ textAlign: "center", width: "60px" }}>Qty</th>
                    <th className="inv-table-th" style={{ textAlign: "right", width: "90px" }}>Rate</th>
                    <th className="inv-table-th" style={{ textAlign: "right", width: "90px" }}>Amount</th>
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
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
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
                          className="form-input new-invoice-rate-input"
                          style={{ padding: "5px 8px", fontSize: "12.5px", width: "80px", textAlign: "right", fontFamily: "var(--mono)" }}
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
                          color: "#10B981",
                        }}
                      >
                        {fmt(item.quantity * item.rate)}
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
                <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedTotal.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <span style={{ fontFamily: "var(--mono)", color: "#10B981" }}>
                  − {fmt(computedTotal.discount)}
                </span>
              </div>
              <div className="summary-row">
                <span>GST ({gstRate}%)</span>
                <span style={{ fontFamily: "var(--mono)" }}>{fmt(computedTotal.gst)}</span>
              </div>
              <div className="summary-row summary-total">
                <span style={{ color: "#FFFFFF" }}>Total</span>
                <span style={{ color: "#10B981" }}>{fmt(computedTotal.total)}</span>
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
            className="btn btn-ghost new-invoice-draft-btn"
            variant="outline"
            onClick={() => void createInvoice("draft")}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save draft"}
          </Button>
          <Button
            className="btn btn-ghost new-invoice-preview-btn"
            variant="outline"
            onClick={() => toast.success("Preview PDF coming soon")}
            disabled={submitting}
          >
            Preview PDF
          </Button>
          <Button
            className="btn btn-primary new-invoice-send-btn"
            onClick={() => void createInvoice("sent")}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send to client →"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  )
}

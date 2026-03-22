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

const EMPTY_LINE_ITEM: QuotationLineItem = {
  name: "New Module",
  quantity: 1,
  unitPrice: 0,
}

export function NewQuoteDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState("")
  const [organization, setOrganization] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [product, setProduct] = useState("Pharmacy Management Suite")
  const [expiry, setExpiry] = useState("")
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState("2000")
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    { name: "POS & Billing", quantity: 1, unitPrice: 18000 },
    { name: "Inventory Management", quantity: 1, unitPrice: 14000 },
    { name: "HRMS", quantity: 1, unitPrice: 10000 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computedTotal = useMemo(() => {
    const subtotal = lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
    const discountValue = Number(discount)
    const clampedDiscount = Number.isFinite(discountValue) ? Math.max(0, Math.min(subtotal, discountValue)) : 0
    const gst = Math.round((subtotal - clampedDiscount) * 0.18)
    return {
      subtotal,
      gst,
      discount: clampedDiscount,
      total: Math.max(0, subtotal - clampedDiscount) + gst,
    }
  }, [discount, lineItems])

  const resetForm = () => {
    setClient("")
    setOrganization("")
    setEmail("")
    setPhone("")
    setProduct("Pharmacy Management Suite")
    setExpiry("")
    setNotes("")
    setDiscount("2000")
    setLineItems([
      { name: "POS & Billing", quantity: 1, unitPrice: 18000 },
      { name: "Inventory Management", quantity: 1, unitPrice: 14000 },
      { name: "HRMS", quantity: 1, unitPrice: 10000 },
    ])
    setError(null)
  }

  async function createQuotation(status: "draft" | "sent") {
    setError(null)

    if (!client.trim() || !organization.trim() || !product.trim()) {
      setError("Client, organization and product are required.")
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

      const payload: CreateQuotationPayload = {
        client,
        organization,
        product,
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
          <div>
            <div className="section-heading">Client details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client name</label>
                <Input className="form-input" placeholder="e.g. Apollo Pharmacy" value={client} onChange={(event) => setClient(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Organisation</label>
                <Input className="form-input" placeholder="Company or hospital name" value={organization} onChange={(event) => setOrganization(event.target.value)} />
              </div>
            </div>
            <div className="form-row quote-row-gap">
              <div className="form-group">
                <label className="form-label">Email</label>
                <Input className="form-input" type="email" placeholder="billing@client.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <Input className="form-input" placeholder="+91 98xxx xxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading">Quote details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product suite</label>
                <select className="form-input" value={product} onChange={(event) => setProduct(event.target.value)}>
                  <option value="Pharmacy Management Suite">Pharmacy Management Suite</option>
                  <option value="Clinic Management Suite">Clinic Management Suite</option>
                  <option value="Retail Management Suite">Retail Suite</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valid until</label>
                <Input className="form-input" type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading">Modules & pricing</div>
            <div className="line-items">
              {lineItems.map((lineItem, index) => (
                <div className="line-item quote-line-item" key={`${lineItem.name}-${index}`}>
                  <div>
                    <div className="line-item-name">{lineItem.name || "New Module"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>{index < 2 ? "Core module" : "Add-on module"}</div>
                  </div>
                  <div className="line-item-qty quote-line-qty">{lineItem.quantity}</div>
                  <div className="line-item-price quote-line-price">₹{lineItem.unitPrice.toLocaleString("en-IN")}</div>
                  <button
                    type="button"
                    className="remove-item"
                    onClick={() => {
                      setLineItems((current) =>
                        current.length > 1 ? current.filter((_, entryIndex) => entryIndex !== index) : current,
                      )
                    }}
                    aria-label="Remove module"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-line-btn quote-add-line" onClick={() => setLineItems((current) => [...current, { ...EMPTY_LINE_ITEM }])}>
              <Plus size={13} />
              Add module
            </button>
          </div>

          <div className="summary-box">
            <div className="summary-row"><span>Subtotal</span><span style={{ fontFamily: "var(--mono)" }}>₹{computedTotal.subtotal.toLocaleString("en-IN")}</span></div>
            <div className="summary-row"><span>GST (18%)</span><span style={{ fontFamily: "var(--mono)" }}>₹{computedTotal.gst.toLocaleString("en-IN")}</span></div>
            <div className="summary-row"><span>Discount</span><span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>− ₹{computedTotal.discount.toLocaleString("en-IN")}</span></div>
            <div className="summary-row summary-total"><span>Total</span><span>₹{computedTotal.total.toLocaleString("en-IN")}</span></div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes to client</label>
            <Textarea className="form-input quote-notes" rows={3} placeholder="Add any terms, conditions or notes…" style={{ resize: "vertical" }} value={notes} onChange={(event) => setNotes(event.target.value)} />
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

"use client"

import { useState } from "react"
import { Wallet, X } from "lucide-react"
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

export function RecordPaymentDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState("")
  const [invoice, setInvoice] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMode, setPaymentMode] = useState("bank")
  const [referenceId, setReferenceId] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setClient("")
    setInvoice("")
    setAmount("")
    setPaymentDate("")
    setPaymentMode("bank")
    setReferenceId("")
    setNotes("")
  }

  async function savePayment() {
    if (!client || !invoice || !amount) {
      toast.error("Client, invoice and amount are required.")
      return
    }

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Payment recorded successfully.")
    setOpen(false)
    resetForm()
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={triggerClassName} variant="outline">
          <Wallet size={13} />
          Record payment
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="panel record-payment-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header record-payment-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">Record payment</SheetTitle>
            <SheetDescription className="panel-subtitle">Mark an invoice as paid</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close record payment panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body record-payment-body">
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
              <option value="Reliance Retail">Reliance Retail</option>
              <option value="Lifeline Hospital">Lifeline Hospital</option>
              <option value="Quick Mart">Quick Mart</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice reference</label>
            <select
              className="form-input"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            >
              <option value="">— select invoice —</option>
              <option value="INV-2025-024">INV-2025-024 · Apollo · ₹58,200</option>
              <option value="INV-2025-020">INV-2025-020 · Reliance · ₹82,000 (overdue)</option>
              <option value="INV-2025-019">INV-2025-019 · Wellness · ₹41,600 (overdue)</option>
              <option value="INV-2025-017">INV-2025-017 · Quick Mart · ₹38,750</option>
              <option value="INV-2025-016">INV-2025-016 · Apollo · ₹26,000 (partial)</option>
              <option value="INV-2025-015">INV-2025-015 · MedPlus · ₹45,000 (overdue)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount received (₹)</label>
              <Input
                className="form-input record-payment-amount-input"
                type="number"
                placeholder="0"
                style={{ fontFamily: "var(--mono)" }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment date</label>
              <Input
                className="form-input"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment mode</label>
            <select
              className="form-input"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="bank">Bank transfer / NEFT</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="rtgs">RTGS / IMPS</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction / reference ID</label>
            <Input
              className="form-input"
              placeholder="e.g. UTR123456789"
              style={{ fontFamily: "var(--mono)", fontSize: "12px" }}
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <Textarea
              className="form-input"
              rows={2}
              placeholder="Any notes about this payment..."
              style={{ resize: "none" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="panel-footer record-payment-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost record-payment-cancel-btn" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-primary record-payment-save-btn"
            onClick={() => void savePayment()}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save payment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

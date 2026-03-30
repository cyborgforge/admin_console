"use client"

import { X } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { InvoiceLineItem } from "@/types/invoice"

export type InvoicePreviewPayload = {
  id: string
  client: string
  org: string
  email?: string
  due: string
  gstin?: string
  gstRate: number
  taxType: "igst" | "cgst_sgst"
  discount: number
  paymentTerms?: string
  lineItems: InvoiceLineItem[]
}

type InvoicePDFPreviewProps = {
  invoice: InvoicePreviewPayload
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoicePDFPreview({ invoice, open, onOpenChange }: InvoicePDFPreviewProps) {
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")
  const clientName = invoice.client?.trim() ?? ""
  const organizationName = invoice.org?.trim() ?? ""
  const primaryBillTo = organizationName || clientName || "-"
  const showSecondaryClient = Boolean(clientName) && clientName.toLowerCase() !== organizationName.toLowerCase()

  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const discount = Math.max(0, Math.min(subtotal, invoice.discount || 0))
  const taxableAmount = subtotal - discount
  const gstAmount = Math.round(taxableAmount * ((invoice.gstRate || 18) / 100))
  const total = taxableAmount + gstAmount

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="panel pdf-preview-sheet"
        showCloseButton={false}
        style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#161920" }}
      >
        <SheetHeader className="panel-header pdf-preview-header" style={{ height: "78.8px", width: "544px" }}>
          <div>
            <SheetTitle className="panel-title" style={{ fontSize: "15px", fontFamily: "var(--font-dm-sans)", color: "#E8EAF0" }}>
              Invoice preview
            </SheetTitle>
            <SheetDescription className="panel-subtitle" style={{ fontSize: "12px", color: "#4F5A6A", fontFamily: "var(--font-dm-sans)" }}>
              {invoice.id} · {invoice.client}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close invoice preview" onClick={() => onOpenChange(false)}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body pdf-preview-body" style={{ background: "#161920", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "32px", color: "#000000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1A1A2E", fontFamily: "var(--font-dm-sans)" }}>Fluxworks</div>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px", fontFamily: "var(--font-dm-sans)" }}>Software Solutions</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#3B82F6", fontFamily: "var(--font-dm-sans)" }}>INVOICE</div>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px", fontFamily: "var(--font-dm-sans)" }}>{invoice.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "4px", fontFamily: "var(--font-dm-sans)" }}>
                  Bill to
                </div>
                <div style={{ fontSize: "12.5px", color: "#1A1A2E", fontWeight: 600, fontFamily: "var(--font-dm-sans)" }}>{primaryBillTo}</div>
                {showSecondaryClient ? (
                  <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>{clientName}</div>
                ) : null}
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>{invoice.email || "-"}</div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>GSTIN: {invoice.gstin || "-"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "4px", fontFamily: "var(--font-dm-sans)" }}>
                  Details
                </div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>Due: {invoice.due || "-"}</div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>
                  Tax type: {invoice.taxType === "cgst_sgst" ? "CGST + SGST" : "IGST"}
                </div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>GST: {invoice.gstRate}%</div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", marginBottom: "20px", fontFamily: "var(--font-dm-sans)" }}>
              <thead>
                <tr style={{ background: "#f4f6fa" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>Description</th>
                  <th style={{ textAlign: "center", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>Rate</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((item, idx, arr) => (
                    <tr key={idx} style={{ borderBottom: idx < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                      <td style={{ padding: "9px 10px", fontFamily: "var(--font-dm-sans)" }}>{item.description}</td>
                      <td style={{ textAlign: "center", padding: "9px 10px", fontFamily: "var(--font-dm-sans)" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", padding: "9px 10px", fontFamily: "'DM Mono', monospace" }}>{fmt(item.rate)}</td>
                      <td style={{ textAlign: "right", padding: "9px 10px", fontFamily: "'DM Mono', monospace" }}>{fmt(item.quantity * item.rate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px 10px", textAlign: "center", color: "#999", fontFamily: "var(--font-dm-sans)" }}>
                      No items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "240px", fontSize: "12.5px", fontFamily: "var(--font-dm-sans)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#555" }}>
                  <span>Subtotal</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#555" }}>
                    <span>Discount</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: "#10b981" }}>− {fmt(discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#555" }}>
                  <span>GST ({invoice.gstRate}%)</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(gstAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #1a1a2e", marginTop: "6px", fontWeight: 700, fontSize: "14px" }}>
                  <span>Total</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: "#10b981" }}>{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "12px", background: "#f4f6fa", borderRadius: "6px", fontSize: "11.5px", color: "#666", fontFamily: "var(--font-dm-sans)" }}>
              {invoice.paymentTerms || "Payment due as per agreed terms."}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

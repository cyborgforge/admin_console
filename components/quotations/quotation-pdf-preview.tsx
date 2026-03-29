"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X, Copy, Download, Send } from "lucide-react"
import { toast } from "sonner"

import { getSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import type { Quotation } from "@/types/quotation"

interface QuotationPDFPreviewProps {
  quotation: Quotation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationPDFPreview({
  quotation,
  open,
  onOpenChange,
}: QuotationPDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resolvedContact, setResolvedContact] = useState<{ email?: string; phone?: string } | null>(null)
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  useEffect(() => {
    let cancelled = false

    async function resolveContactFromClients() {
      const hasEmail = Boolean(quotation.email?.trim())
      const hasPhone = Boolean(quotation.phone?.trim())

      if (!open || (hasEmail && hasPhone)) {
        if (!cancelled) {
          setResolvedContact(null)
        }
        return
      }

      try {
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const accessToken = session?.access_token
        if (!accessToken) {
          return
        }

        const response = await fetch("/api/clients", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as {
          clients?: Array<{ name?: string; organization?: string; email?: string; phone?: string }>
        }

        const match = (data.clients ?? []).find((clientRow) => {
          const byOrg =
            clientRow.organization?.trim().toLowerCase() ===
            quotation.organization?.trim().toLowerCase()
          const byName =
            clientRow.name?.trim().toLowerCase() === quotation.client?.trim().toLowerCase()
          return byOrg || byName
        })

        if (!cancelled) {
          setResolvedContact(
            match
              ? {
                  email: match.email,
                  phone: match.phone,
                }
              : null,
          )
        }
      } catch {
        if (!cancelled) {
          setResolvedContact(null)
        }
      }
    }

    void resolveContactFromClients()

    return () => {
      cancelled = true
    }
  }, [open, quotation.client, quotation.organization, quotation.email, quotation.phone])

  const billToEmail = useMemo(() => {
    const fromQuotation = quotation.email?.trim()
    if (fromQuotation) {
      return fromQuotation
    }
    const fromClient = resolvedContact?.email?.trim()
    return fromClient || "-"
  }, [quotation.email, resolvedContact?.email])

  const billToPhone = useMemo(() => {
    const fromQuotation = quotation.phone?.trim()
    if (fromQuotation) {
      return fromQuotation
    }
    const fromClient = resolvedContact?.phone?.trim()
    return fromClient || "-"
  }, [quotation.phone, resolvedContact?.phone])

  const generatePDF = useCallback(async () => {
    setIsGenerating(true)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("Please sign in before generating PDFs.")
      }

      const response = await fetch("/api/quotations/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ quotation }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error ?? "Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quotation.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generating PDF"
      toast.error(message)
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [quotation])

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/quotations/${quotation.id}`
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const sendToClient = useCallback(async () => {
    if (!quotation.email) {
      toast.error("Client email is required to send quotation")
      return
    }

    setIsSending(true)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("Please sign in before sending quotations.")
      }

      const response = await fetch("/api/quotations/send-to-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ quotation }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error ?? "Failed to send quotation")
      }

      const result = (await response.json()) as { message?: string }
      toast.success(result.message || "Quotation sent successfully!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error sending quotation"
      toast.error(message)
      console.error("Error sending quotation:", error)
    } finally {
      setIsSending(false)
    }
  }, [quotation])

  const previewLineItems = quotation.lineItems ?? []

  // Calculate line items total
  const lineItemsTotal = (previewLineItems.length > 0 ? previewLineItems : []).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  const subtotal = lineItemsTotal
  const discount = quotation.discount || 0
  const gst = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + gst

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="panel pdf-preview-sheet"
        showCloseButton={false}
        style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}
      >
        <SheetHeader className="panel-header pdf-preview-header" style={{ height: "78.8px", width: "544px" }}>
          <div>
            <SheetTitle className="panel-title" style={{ fontSize: "15px", fontFamily: "var(--font-dm-sans)", color: "#E8EAF0" }}>Quote preview</SheetTitle>
            <SheetDescription className="panel-subtitle" style={{ fontSize: "12px", color: "#4F5A6A", fontFamily: "var(--font-dm-sans)" }}>{quotation.id} · {quotation.client}</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close PDF preview" onClick={() => onOpenChange(false)}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div
          className="panel-body pdf-preview-body"
          style={{ background: "#161920", overflowY: "auto", flex: 1, minHeight: 0 }}
        >
          {/* PDF Preview Content */}
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "32px", color: "#000000" }}>
            {/* Header with branding */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1A1A2E", fontFamily: "var(--font-dm-sans)" }}>Fluxworks</div>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px", fontFamily: "var(--font-dm-sans)" }}>Software Solutions</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#3B82F6", fontFamily: "var(--font-dm-sans)" }}>QUOTATION</div>
                <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px", fontFamily: "var(--font-dm-sans)" }}>{quotation.id}</div>
              </div>
            </div>

            {/* Bill To & Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "4px", fontFamily: "var(--font-dm-sans)" }}>
                  Bill to
                </div>
                <div style={{ fontSize: "12.5px", color: "#1A1A2E", fontWeight: 600, fontFamily: "var(--font-dm-sans)" }}>
                  {quotation.organization}
                </div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>
                  {billToEmail}
                </div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>
                  {billToPhone}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "4px", fontFamily: "var(--font-dm-sans)" }}>
                  Details
                </div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>Date: {new Date(quotation.createdAt || new Date()).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</div>
                <div style={{ fontSize: "12.5px", color: "#555", fontFamily: "var(--font-dm-sans)" }}>Expiry: {quotation.expiry}</div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#10b981", marginTop: "4px", fontFamily: "var(--font-dm-sans)" }}>Valid for 30 days</div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", marginBottom: "20px", fontFamily: "var(--font-dm-sans)" }}>
              <thead>
                <tr style={{ background: "#f4f6fa" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>
                    Module
                  </th>
                  <th style={{ textAlign: "center", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>
                    Qty
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}>
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewLineItems.length > 0 ? (
                  previewLineItems.map((item, idx, arr) => (
                    <tr key={idx} style={{ borderBottom: idx < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                      <td style={{ padding: "9px 10px", fontFamily: "var(--font-dm-sans)" }}>{item.name}</td>
                      <td style={{ textAlign: "center", padding: "9px 10px", fontFamily: "var(--font-dm-sans)" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", padding: "9px 10px", fontFamily: "'DM Mono', monospace" }}>
                        {fmt(item.unitPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: "20px 10px", textAlign: "center", color: "#999", fontFamily: "var(--font-dm-sans)" }}>
                      No items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary Section */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "220px", fontSize: "12.5px", fontFamily: "var(--font-dm-sans)" }}>
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
                  <span>GST (18%)</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(gst)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #1a1a2e", marginTop: "6px", fontWeight: 700, fontSize: "14px" }}>
                  <span>Total</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: "#3b82f6" }}>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer message */}
            <div style={{ marginTop: "20px", padding: "12px", background: "#f4f6fa", borderRadius: "6px", fontSize: "11.5px", color: "#666", fontFamily: "var(--font-dm-sans)" }}>
              This quotation is valid for 30 days from the date of issue. Prices are subject to change upon renewal.
            </div>
          </div>
        </div>

        <SheetFooter
          className="panel-footer pdf-preview-footer"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            padding: "16px 24px",
            borderTop: "1px solid #2a3b57",
            background: "#161920",
            flexShrink: 0,
            width: "100%",
          }}
        >
          <Button
            type="button"
            className="btn btn-ghost"
            variant="outline"
            onClick={copyShareLink}
            style={{ flex: 1, padding: "7px 14px", fontSize: "13px", color: "#8B95A8", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Copy size={16} />
            {copied ? "Copied" : "Copy share link"}
          </Button>
          <Button
            type="button"
            className="btn btn-ghost"
            variant="outline"
            onClick={() => void sendToClient()}
            disabled={isSending || !quotation.email}
            style={{ flex: 1, padding: "7px 14px", fontSize: "13px", color: isSending || !quotation.email ? "#555" : "#8B95A8", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            title={!quotation.email ? "Client email is required" : "Send quotation to client email"}
          >
            <Send size={16} />
            {isSending ? "Starting..." : "Send to client"}
          </Button>
          <Button
            type="button"
            className="btn btn-primary"
            onClick={() => void generatePDF()}
            disabled={isGenerating}
            style={{ flex: 1, padding: "7px 14px", fontSize: "13px", backgroundColor: "#3B82F6", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Download size={16} />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
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
import { InvoicePDFPreview, type InvoicePreviewPayload } from "@/components/invoices/invoice-pdf-preview"
import { QuotationPDFPreview } from "@/components/quotations/quotation-pdf-preview"
import type { CreateInvoicePayload, Invoice, InvoiceLineItem, UpdateInvoicePayload } from "@/types/invoice"
import type { Quotation } from "@/types/quotation"

type ClientDirectoryItem = {
  name?: string
  organization?: string
  email?: string
  gst?: string
}

type NewInvoiceDialogProps = {
  triggerClassName?: string
  mode?: "create" | "edit"
  open?: boolean
  hideTrigger?: boolean
  invoiceToEdit?: Invoice | null
  onOpenChange?: (open: boolean) => void
  onSaveEdit?: (invoiceId: string, payload: Omit<UpdateInvoicePayload, "id">) => Promise<void> | void
}

export function NewInvoiceDialog({
  triggerClassName,
  mode = "create",
  open,
  hideTrigger,
  invoiceToEdit,
  onOpenChange,
  onSaveEdit,
}: NewInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [previewingQuote, setPreviewingQuote] = useState<Quotation | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
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
  const [previewingInvoice, setPreviewingInvoice] = useState<InvoicePreviewPayload | null>(null)
  const [clientDirectory, setClientDirectory] = useState<ClientDirectoryItem[]>([])
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, rate: 0 },
  ])
  const { quotations } = useQuotations()

  const isOpen = typeof open === "boolean" ? open : internalOpen

  const setSheetOpen = (nextOpen: boolean) => {
    if (typeof open !== "boolean") {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const findClientMatch = (nameValue: string, orgValue: string) => {
    const normalizedName = nameValue.trim().toLowerCase()
    const normalizedOrg = orgValue.trim().toLowerCase()

    return clientDirectory.find((row) => {
      const rowName = row.name?.trim().toLowerCase() ?? ""
      const rowOrg = row.organization?.trim().toLowerCase() ?? ""

      if (normalizedOrg && rowOrg === normalizedOrg) {
        return true
      }

      if (normalizedName && rowName === normalizedName) {
        return true
      }

      return false
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadClients() {
      if (!isOpen) {
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

        const data = (await response.json()) as { clients?: ClientDirectoryItem[] }
        if (!cancelled) {
          setClientDirectory(data.clients ?? [])
        }
      } catch {
        if (!cancelled) {
          setClientDirectory([])
        }
      }
    }

    void loadClients()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const clientSearchTerm = client.trim().toLowerCase()
  const matchedClients = useMemo(() => {
    if (!clientSearchTerm) {
      return [] as Quotation[]
    }

    const uniqueMatches = new Map<string, Quotation>()
    for (const quotation of quotations) {
      const normalizedName = quotation.client.trim().toLowerCase()
      if (!normalizedName) {
        continue
      }

      if (normalizedName.includes(clientSearchTerm) && !uniqueMatches.has(normalizedName)) {
        uniqueMatches.set(normalizedName, quotation)
      }
    }

    return Array.from(uniqueMatches.values()).slice(0, 5)
  }, [clientSearchTerm, quotations])

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
    setPreviewingInvoice(null)
    setShowClientDropdown(false)
  }

  const toDateInputValue = (value: string) => {
    if (!value || value === "-") {
      return ""
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
      return ""
    }

    return parsedDate.toISOString().slice(0, 10)
  }

  useEffect(() => {
    if (mode !== "edit" || !invoiceToEdit || !isOpen) {
      return
    }

    setFromQuote(invoiceToEdit.quoteRef === "-" ? "" : invoiceToEdit.quoteRef)
    setClient(invoiceToEdit.client)
    setOrg(invoiceToEdit.org)
    setGstin(invoiceToEdit.gstin ?? "")
    setEmail(invoiceToEdit.email ?? "")
    setDueDate(toDateInputValue(invoiceToEdit.due))
    setGstRate(String(invoiceToEdit.gstRate ?? 18))
    setTaxType(invoiceToEdit.taxType === "cgst_sgst" ? "cgst_sgst" : "igst")
    setDiscount(String(invoiceToEdit.discount ?? 0))
    setPaymentTerms(invoiceToEdit.paymentTerms ?? "")
    setLineItems(
      invoiceToEdit.lineItems && invoiceToEdit.lineItems.length > 0
        ? invoiceToEdit.lineItems
        : [{ description: "", quantity: 1, rate: 0 }],
    )
    setPreviewingQuote(null)
    setShowClientDropdown(false)
  }, [invoiceToEdit, isOpen, mode])

  const buildInvoicePdfPayload = (invoiceId: string): InvoicePreviewPayload => {
    const validLineItems = lineItems.filter((item) => item.description.trim() && item.quantity > 0)

    return {
      id: invoiceId,
      client: client.trim(),
      org: (org || client).trim(),
      email: email.trim() || undefined,
      due: dueDate || "-",
      gstin: gstin.trim() || undefined,
      gstRate: Number(gstRate) || 18,
      taxType: taxType === "cgst_sgst" ? "cgst_sgst" : "igst",
      discount: Number(discount) || 0,
      paymentTerms: paymentTerms.trim() || undefined,
      lineItems: validLineItems,
    }
  }

  function previewInvoicePDF() {
    const validLineItems = lineItems.filter((item) => item.description.trim() && item.quantity > 0)

    if (!client.trim()) {
      toast.error("Client name is required.")
      return
    }

    if (validLineItems.length === 0) {
      toast.error("Add at least one valid line item.")
      return
    }

    const payload = buildInvoicePdfPayload(fromQuote || `INV-DRAFT-${Date.now()}`)
    setPreviewingInvoice(payload)
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
      setEmail("")
      setGstin("")
      return
    }

    const selectedQuote = quotations.find(q => q.id === quoteRef)
    if (selectedQuote) {
      const matchedClient = findClientMatch(selectedQuote.client, selectedQuote.organization)
      const gstValue = matchedClient?.gst?.trim()

      setClient(selectedQuote.client)
      setOrg(selectedQuote.organization)
      setEmail(selectedQuote.email ?? matchedClient?.email ?? "")
      setGstin(gstValue && gstValue !== "-" ? gstValue : "")
      
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

  async function submitInvoice(status?: "draft" | "sent") {
    if (!client.trim()) {
      toast.error("Client name is required.")
      return
    }

    if (email.trim() && !validateEmail(email)) {
      toast.error("Please enter a valid email address.")
      return
    }

    if (status === "sent" && !email.trim()) {
      toast.error("Client email is required to send invoice.")
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
        throw new Error(mode === "edit" ? "Please sign in before updating invoices." : "Please sign in before creating invoices.")
      }

      if (mode === "edit") {
        if (!invoiceToEdit) {
          throw new Error("Invoice details are missing for edit.")
        }

        const updatePayload: Omit<UpdateInvoicePayload, "id"> = {
          client,
          org: org || client,
          quoteRef: fromQuote || "-",
          product: invoiceToEdit.product ?? (taxType === "cgst_sgst" ? "clinic" : "pharmacy"),
          due: dueDate || "-",
          gstin,
          email,
          gstRate: Number(gstRate) || 18,
          taxType: taxType === "cgst_sgst" ? "cgst_sgst" : "igst",
          discount: Number(discount) || 0,
          paymentTerms,
          lineItems: validLineItems,
        }

        if (onSaveEdit) {
          await onSaveEdit(invoiceToEdit.id, updatePayload)
        } else {
          const updateResponse = await fetch("/api/invoices", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ id: invoiceToEdit.id, ...updatePayload }),
          })

          if (!updateResponse.ok) {
            const updateError = (await updateResponse.json()) as { error?: string }
            throw new Error(updateError.error ?? "Failed to update invoice.")
          }
        }

        window.dispatchEvent(new CustomEvent("invoice:changed"))
        toast.success("Invoice updated successfully.")
        setSheetOpen(false)
        resetForm()
        return
      }

      if (!status) {
        throw new Error("Status is required to create invoice.")
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

      const responseData = (await response.json()) as { invoice?: { id: string } }
      const createdInvoiceId = responseData.invoice?.id ?? `INV-${Date.now()}`

      if (status === "sent") {
        const deliveryPayload = buildInvoicePdfPayload(createdInvoiceId)
        const sendResponse = await fetch("/api/invoices/send-to-client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ invoice: deliveryPayload }),
        })

        if (!sendResponse.ok) {
          const sendError = (await sendResponse.json()) as { error?: string }
          throw new Error(sendError.error ?? "Invoice created but failed to send email.")
        }
      }

      window.dispatchEvent(new CustomEvent("invoice:changed"))
      toast.success(status === "draft" ? "Invoice saved as draft." : "Invoice sent to client.")
      setSheetOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : mode === "edit" ? "Failed to update invoice." : "Failed to create invoice."
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
      {previewingInvoice ? (
        <InvoicePDFPreview
          invoice={previewingInvoice}
          open={Boolean(previewingInvoice)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setPreviewingInvoice(null)
            }
          }}
        />
      ) : null}
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setSheetOpen(nextOpen)
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      {!hideTrigger ? (
        <SheetTrigger asChild>
          <Button className={triggerClassName}>
            <Plus size={13} />
            New Invoice
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent side="right" className="panel new-invoice-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header new-invoice-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">{mode === "edit" ? "Edit Invoice" : "New Invoice"}</SheetTitle>
            <SheetDescription className="panel-subtitle">
              {mode === "edit" && invoiceToEdit ? `${invoiceToEdit.id} · ${invoiceToEdit.status}` : "INV-2025-025 · Draft"}
            </SheetDescription>
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
                    {quote.id} · {quote.client} · {quote.status}
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
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">Client name</label>
                <div style={{ position: "relative" }}>
                  <Input
                    className="form-input"
                    placeholder="e.g. Apollo Pharmacy"
                    value={client}
                    onChange={(e) => {
                      setClient(e.target.value)
                      setShowClientDropdown(true)
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                  />
                  {showClientDropdown && client.trim().length > 0 && matchedClients.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#1e2229",
                        border: "1px solid #2a3b57",
                        borderTop: "none",
                        borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 50,
                        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {matchedClients.map((quote) => (
                        <button
                          key={quote.id}
                          type="button"
                          onClick={() => {
                            const matchedClient = findClientMatch(quote.client, quote.organization)
                            const gstValue = matchedClient?.gst?.trim()

                            setClient(quote.client)
                            setOrg(quote.organization)
                            setEmail(quote.email ?? matchedClient?.email ?? "")
                            setGstin(gstValue && gstValue !== "-" ? gstValue : "")
                            setShowClientDropdown(false)
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            textAlign: "left",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid #2a3b57",
                            color: "#e8eaf0",
                            cursor: "pointer",
                            fontSize: "13px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#252b32"
                            e.currentTarget.style.color = "#3b82f6"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent"
                            e.currentTarget.style.color = "#e8eaf0"
                          }}
                        >
                          {quote.client}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
            onClick={() => void submitInvoice(mode === "edit" ? undefined : "draft")}
            disabled={submitting}
          >
            {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Save draft"}
          </Button>
          <Button
            className="btn btn-ghost new-invoice-preview-btn"
            variant="outline"
            onClick={previewInvoicePDF}
            disabled={submitting}
          >
            Preview PDF
          </Button>
          {mode === "create" ? (
            <Button
              className="btn btn-primary new-invoice-send-btn"
              onClick={() => void submitInvoice("sent")}
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send to client →"}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Eye, Pencil, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuotationPDFPreview } from "@/components/quotations/quotation-pdf-preview"

import type { Quotation } from "@/types/quotation"

function badgeClass(status: Quotation["status"]) {
  if (status === "draft") return "badge badge-draft"
  if (status === "sent") return "badge badge-sent"
  if (status === "accepted") return "badge badge-accepted"
  if (status === "expired") return "badge badge-expired"
  return "badge badge-review"
}

const labels: Record<Quotation["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
  review: "In Review",
}

export function QuotesTable({
  quotations,
  onSendToClient,
  onSaveEdit,
}: {
  quotations: Quotation[]
  onSendToClient?: (quotationId: string) => Promise<void> | void
  onSaveEdit?: (
    quotationId: string,
    payload: Partial<Pick<Quotation, "client" | "organization" | "product" | "expiry" | "status">>,
  ) => Promise<void> | void
}) {
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)
  const [previewingQuotation, setPreviewingQuotation] = useState<Quotation | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [saving, setSaving] = useState(false)

  const [editClient, setEditClient] = useState("")
  const [editOrganization, setEditOrganization] = useState("")
  const [editProduct, setEditProduct] = useState("")
  const [editExpiry, setEditExpiry] = useState("")
  const [editStatus, setEditStatus] = useState<Quotation["status"]>("draft")

  const quotationInitials = useMemo(() => {
    if (!viewingQuotation) {
      return "QT"
    }

    return viewingQuotation.client
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
  }, [viewingQuotation])

  function openEditDialog(quotation: Quotation) {
    setEditingQuotation(quotation)
    setEditClient(quotation.client)
    setEditOrganization(quotation.organization)
    setEditProduct(quotation.product)
    setEditExpiry(quotation.expiry === "-" ? "" : quotation.expiry)
    setEditStatus(quotation.status)
  }

  async function handleSaveEdit() {
    if (!editingQuotation || !onSaveEdit) {
      setEditingQuotation(null)
      return
    }

    setSaving(true)
    try {
      await onSaveEdit(editingQuotation.id, {
        client: editClient.trim(),
        organization: editOrganization.trim(),
        product: editProduct.trim(),
        expiry: editExpiry.trim() || "-",
        status: editStatus,
      })
      setEditingQuotation(null)
    } finally {
      setSaving(false)
    }
  }

  if (quotations.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📄</div>
        <div className="empty-text">No quotations found</div>
      </div>
    )
  }

  return (
    <>
      {previewingQuotation && (
        <QuotationPDFPreview
          quotation={previewingQuotation}
          open={Boolean(previewingQuotation)}
          onOpenChange={(open) => !open && setPreviewingQuotation(null)}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((q) => (
            <TableRow key={q.id}>
              <TableCell>
                <span className="quote-id">{q.id}</span>
              </TableCell>
              <TableCell>
                <div className="client-cell">
                  <div className="client-avatar" style={{ backgroundColor: `${q.color}22`, color: q.color }}>
                    {q.client
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="client-name">{q.client}</div>
                    <div className="client-org">{q.organization}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ color: "var(--text2)" }}>{q.product}</TableCell>
              <TableCell>
                <span className="amount">Rs {q.amount.toLocaleString("en-IN")}</span>
              </TableCell>
              <TableCell>
                <span className={badgeClass(q.status)}>{labels[q.status]}</span>
              </TableCell>
              <TableCell style={{ color: "var(--text3)", fontSize: "12.5px" }}>{q.expiry}</TableCell>
              <TableCell>
                <div className="row-actions">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="icon-btn"
                    onClick={() => setPreviewingQuotation(q)}
                    title="Preview PDF"
                  >
                    <Eye size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="icon-btn"
                    onClick={() => openEditDialog(q)}
                    title="Edit quotation"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="icon-btn"
                    onClick={() => void onSendToClient?.(q.id)}
                    title="Send message to client"
                  >
                    <Send size={13} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(viewingQuotation)} onOpenChange={(open) => !open && setViewingQuotation(null)}>
        <DialogContent className="max-w-xl!">
          {viewingQuotation ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewingQuotation.id}</DialogTitle>
                <DialogDescription>Quotation details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 px-6 pb-2">
                <div className="client-cell">
                  <div className="client-avatar" style={{ backgroundColor: `${viewingQuotation.color}22`, color: viewingQuotation.color }}>
                    {quotationInitials}
                  </div>
                  <div>
                    <div className="client-name">{viewingQuotation.client}</div>
                    <div className="client-org">{viewingQuotation.organization}</div>
                  </div>
                </div>
                <div className="info-row"><div className="info-row-label">Product</div><div className="info-row-val">{viewingQuotation.product}</div></div>
                <div className="info-row"><div className="info-row-label">Amount</div><div className="info-row-val">Rs {viewingQuotation.amount.toLocaleString("en-IN")}</div></div>
                <div className="info-row"><div className="info-row-label">Status</div><div className="info-row-val">{labels[viewingQuotation.status]}</div></div>
                <div className="info-row"><div className="info-row-label">Expiry</div><div className="info-row-val">{viewingQuotation.expiry}</div></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingQuotation(null)}>Close</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingQuotation)} onOpenChange={(open) => !open && setEditingQuotation(null)}>
        <DialogContent className="max-w-xl!">
          {editingQuotation ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit {editingQuotation.id}</DialogTitle>
                <DialogDescription>Update and save quotation details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 px-6 pb-2">
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <Input className="form-input" value={editClient} onChange={(event) => setEditClient(event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <Input className="form-input" value={editOrganization} onChange={(event) => setEditOrganization(event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <Input className="form-input" value={editProduct} onChange={(event) => setEditProduct(event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry</label>
                  <Input className="form-input" value={editExpiry} onChange={(event) => setEditExpiry(event.target.value)} placeholder="Apr 10, 2026" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={editStatus} onChange={(event) => setEditStatus(event.target.value as Quotation["status"])}>
                    <option value="draft">Draft</option>
                    <option value="review">In Review</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingQuotation(null)} disabled={saving}>Cancel</Button>
                <Button onClick={() => void handleSaveEdit()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

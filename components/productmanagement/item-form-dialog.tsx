import React, { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { ItemKind, ItemStatus, ItemType } from "./types"
import { RadixSelect } from "./radix-select"
import { typeConfig, statusConfig } from "./config"

interface ItemFormDialogProps {
  open: boolean
  kind: ItemKind
  onClose: () => void
  onCreate: (kind: ItemKind, payload: Record<string, any>) => void
}

const EMPTY_FORM = {
  name: "",
  code: "",
  category: "",
  type: "core" as ItemType,
  duration: "",
  price: "",
  tax_percentage: "18",
  status: "active" as ItemStatus,
  description: "",
  notes: "",
}

export function ItemFormDialog({ open, kind, onClose, onCreate }: ItemFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const isProduct = kind === "product"

  // Reset the form whenever the dialog is (re)opened or the kind changes
  useEffect(() => {
    if (open) setForm(EMPTY_FORM)
  }, [open, kind])

  const update = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }))

  const canSubmit = form.name.trim().length > 0 && form.code.trim().length > 0 && form.price.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onCreate(kind, {
      name: form.name.trim(),
      code: form.code.trim(),
      category: form.category.trim(),
      type: form.type,
      duration: form.duration.trim(),
      price: Number(form.price) || 0,
      tax_percentage: Number(form.tax_percentage) || 0,
      status: form.status,
      description: form.description.trim(),
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="pm-overlay" />
        <Dialog.Content className="pm-dialog" aria-describedby={undefined}>
          <div className="pm-dialog-header">
            <Dialog.Title className="pm-dialog-title">{isProduct ? "New Product" : "New Service"}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="pm-dialog-close" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="pm-dialog-body">
            <div className="pm-form-row">
              <div className="pm-field">
                <label>{isProduct ? "Product Name" : "Service Name"}</label>
                <input
                  placeholder={isProduct ? "e.g. Pharmacy Suite" : "e.g. Onboarding & Setup"}
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </div>
              <div className="pm-field">
                <label>Code</label>
                <input
                  placeholder={isProduct ? "e.g. PHM-CORE" : "e.g. ONB-001"}
                  value={form.code}
                  onChange={(e) => update({ code: e.target.value })}
                />
              </div>
            </div>

            <div className="pm-form-row">
              <div className="pm-field">
                <label>Category</label>
                <input
                  placeholder="e.g. Pharmacy, Clinic, Support"
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                />
              </div>
              <div className="pm-field">
                <label>Type</label>
                <RadixSelect
                  value={form.type}
                  onChange={(v) => update({ type: v as ItemType })}
                  options={[
                    { value: "core", label: typeConfig.core.label },
                    { value: "add_on", label: typeConfig.add_on.label },
                  ]}
                />
              </div>
            </div>

            <div className="pm-form-row">
              {!isProduct && (
                <div className="pm-field">
                  <label>Duration</label>
                  <input
                    placeholder="e.g. 3 days, Ongoing"
                    value={form.duration}
                    onChange={(e) => update({ duration: e.target.value })}
                  />
                </div>
              )}
              <div className="pm-field">
                <label>Status</label>
                <RadixSelect
                  value={form.status}
                  onChange={(v) => update({ status: v as ItemStatus })}
                  options={[
                    { value: "active", label: statusConfig.active.label },
                    { value: "inactive", label: statusConfig.inactive.label },
                  ]}
                />
              </div>
            </div>

            <div className="pm-form-row">
              <div className="pm-field">
                <label>Price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                />
              </div>
              <div className="pm-field">
                <label>Tax %</label>
                <input
                  type="number"
                  placeholder="18"
                  value={form.tax_percentage}
                  onChange={(e) => update({ tax_percentage: e.target.value })}
                />
              </div>
            </div>

            <div className="pm-field">
              <label>Description</label>
              <textarea
                placeholder="What does this product or service include?"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>

            <div className="pm-field">
              <label>Notes</label>
              <textarea
                placeholder="Internal notes (optional)"
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </div>

          <div className="pm-dialog-footer">
            <Dialog.Close asChild>
              <button className="pm-btn-ghost">Cancel</button>
            </Dialog.Close>
            <button className="pm-btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
              Create {isProduct ? "product" : "service"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

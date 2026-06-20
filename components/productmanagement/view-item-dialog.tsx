import React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Pencil, Trash2, X } from "lucide-react"
import { AnyItem, ItemKind, ItemStatus, getName, getCode, ProductService } from "./types"
import { RadixSelect } from "./radix-select"
import { statusConfig, typeConfig } from "./config"

interface ViewItemProps {
  open: boolean
  kind: ItemKind
  data: AnyItem
  isEditing: boolean
  editDraft: AnyItem | null
  onClose: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: ItemStatus) => void
  onDraftChange: (patch: Record<string, any>) => void
}

export function ViewItem({
  open,
  kind,
  data,
  isEditing,
  editDraft,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onUpdateStatus,
  onDraftChange,
}: ViewItemProps) {
  const isProduct = kind === "product"
  const view = isEditing && editDraft ? editDraft : data
  const name = getName(kind, view)
  const code = getCode(kind, view)

  const updateName = (v: string) =>
    onDraftChange(isProduct ? { product_name: v } : { service_name: v })
  const updateCode = (v: string) =>
    onDraftChange(isProduct ? { product_code: v } : { service_code: v })

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="pm-overlay" />
        <Dialog.Content className="pm-view-dialog" aria-describedby={undefined}>
          {/* ── Topbar ─────────────────────────────────────────────────── */}
          <div className="pm-view-topbar">
            <div className="pm-view-heading">
              <Dialog.Title className="pm-view-title">{name}</Dialog.Title>
              <span className="pm-view-code">{code}</span>
            </div>

            <div className="pm-view-topbar-actions">
              {!isEditing && (
                <RadixSelect
                  value={view.status}
                  onChange={(v) => onUpdateStatus(v as ItemStatus)}
                  options={[
                    { value: "active", label: statusConfig.active.label },
                    { value: "inactive", label: statusConfig.inactive.label },
                  ]}
                  className="pm-select-trigger-w"
                />
              )}

              {isEditing ? (
                <>
                  <button className="pm-cancel-edit-btn" onClick={onCancelEdit}>
                    Cancel
                  </button>
                  <button className="pm-save-btn" onClick={onSaveEdit}>
                    Save changes
                  </button>
                </>
              ) : (
                <button className="pm-view-edit-btn" title="Edit" onClick={onStartEdit}>
                  <Pencil size={14} />
                </button>
              )}

              <Dialog.Close asChild>
                <button className="pm-view-close-btn" aria-label="Close">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="pm-view-divider" />

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="pm-view-body">
            <div className="pm-view-grid">
              <div className="pm-view-field">
                <div className="pm-view-field-label">{isProduct ? "Product Name" : "Service Name"}</div>
                {isEditing ? (
                  <input className="pm-inline-input" value={name} onChange={(e) => updateName(e.target.value)} />
                ) : (
                  <div className="pm-view-field-val">{name}</div>
                )}
              </div>
              <div className="pm-view-field">
                <div className="pm-view-field-label">Code</div>
                {isEditing ? (
                  <input className="pm-inline-input" value={code} onChange={(e) => updateCode(e.target.value)} />
                ) : (
                  <div className="pm-view-field-val">{code}</div>
                )}
              </div>

              <div className="pm-view-field">
                <div className="pm-view-field-label">Category</div>
                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    value={view.category}
                    onChange={(e) => onDraftChange({ category: e.target.value })}
                  />
                ) : (
                  <div className="pm-view-field-val">{view.category}</div>
                )}
              </div>
              <div className="pm-view-field">
                <div className="pm-view-field-label">Type</div>
                {isEditing ? (
                  <RadixSelect
                    value={view.type}
                    onChange={(v) => onDraftChange({ type: v })}
                    options={[
                      { value: "core", label: typeConfig.core.label },
                      { value: "add_on", label: typeConfig.add_on.label },
                    ]}
                  />
                ) : (
                  <div className="pm-view-field-val">{typeConfig[view.type].label}</div>
                )}
              </div>

              {!isProduct && (
                <div className="pm-view-field">
                  <div className="pm-view-field-label">Duration</div>
                  {isEditing ? (
                    <input
                      className="pm-inline-input"
                      value={(view as ProductService).duration}
                      onChange={(e) => onDraftChange({ duration: e.target.value })}
                    />
                  ) : (
                    <div className="pm-view-field-val">{(view as ProductService).duration}</div>
                  )}
                </div>
              )}

              <div className="pm-view-field">
                <div className="pm-view-field-label">Price (₹)</div>
                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    type="number"
                    value={view.price}
                    onChange={(e) => onDraftChange({ price: Number(e.target.value) })}
                  />
                ) : (
                  <div className="pm-view-field-val">₹{view.price.toLocaleString("en-IN")}</div>
                )}
              </div>
              <div className="pm-view-field">
                <div className="pm-view-field-label">Tax %</div>
                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    type="number"
                    value={view.tax_percentage}
                    onChange={(e) => onDraftChange({ tax_percentage: Number(e.target.value) })}
                  />
                ) : (
                  <div className="pm-view-field-val">{view.tax_percentage}%</div>
                )}
              </div>
            </div>

            <div className="pm-view-field">
              <div className="pm-view-field-label">Description</div>
              {isEditing ? (
                <textarea
                  className="pm-inline-textarea"
                  value={view.description}
                  onChange={(e) => onDraftChange({ description: e.target.value })}
                />
              ) : (
                <div className="pm-view-field-val">{view.description || "—"}</div>
              )}
            </div>

            <div className="pm-view-notes-field">
              <div className="pm-view-field-label">Notes</div>
              {isEditing ? (
                <textarea
                  className="pm-inline-textarea"
                  placeholder="Add a note..."
                  value={view.notes}
                  onChange={(e) => onDraftChange({ notes: e.target.value })}
                />
              ) : (
                <div className="pm-view-notes-val">{view.notes || "No notes yet"}</div>
              )}
            </div>

            <div className="pm-view-meta">
              <span>Created {view.created_at} by {view.created_by}</span>
              <span>Updated {view.updated_at}</span>
            </div>
          </div>

          <div className="pm-view-footer">
            <button className="pm-delete-btn" onClick={onDelete}>
              <Trash2 size={12} style={{ marginRight: 6, verticalAlign: -2 }} />
              Delete {isProduct ? "product" : "service"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

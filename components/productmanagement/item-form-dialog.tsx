import React, { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import {
  ItemKind,
  ItemStatus,
  ItemType,
} from "./types"

import { RadixSelect } from "./radix-select"
import { typeConfig, statusConfig } from "./config"

interface ItemFormDialogProps {
  open: boolean
  kind: ItemKind
  saving: boolean

  onClose: () => void

  onCreate: (
    kind: ItemKind,
    payload: Record<string, unknown>
  ) => Promise<void>
}

const EMPTY_FORM = {
  name: "",
  code: "",
  category: "",
  type: "core" as ItemType,
  price: "",
  tax_percentage: "18",
  status: "active" as ItemStatus,
  description: "",
  notes: "",
}

export function ItemFormDialog({
  open,
  kind,
  saving,
  onClose,
  onCreate,
}: ItemFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)

  const isProduct =
    kind === "product"

  const update = (
    patch: Partial<
      typeof EMPTY_FORM
    >
  ) => {
    setForm((current) => ({
      ...current,
      ...patch,
    }))
  }

  const canSubmit =
    form.name.trim().length > 0 &&
    form.code.trim().length > 0 &&
    form.price.trim().length > 0

  const handleSubmit =
    async () => {
      if (
        !canSubmit ||
        saving
      ) {
        return
      }

      await onCreate(kind, {
        name:
          form.name.trim(),

        code:
          form.code.trim(),

        category:
          form.category.trim(),

        type:
          form.type,

        price:
          Number(form.price) ||
          0,

        tax_percentage:
          Number(
            form.tax_percentage
          ) || 0,

        status:
          form.status,

        description:
          form.description.trim(),

        notes:
          form.notes.trim(),
      })
    }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(
        nextOpen
      ) => {
        if (
          !nextOpen &&
          !saving
        ) {
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="pm-overlay" />

        <Dialog.Content
          className="pm-dialog"
          aria-describedby={
            undefined
          }
        >
          {/* Header */}

          <div className="pm-dialog-header">
            <Dialog.Title className="pm-dialog-title">
              {isProduct
                ? "New Product"
                : "New Service"}
            </Dialog.Title>

            <button
              type="button"
              className="pm-dialog-close"
              aria-label="Close"
              disabled={saving}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Body */}

          <div className="pm-dialog-body">

            {/* Name + Code */}

            <div className="pm-form-row">
              <div className="pm-field">
                <label>
                  {isProduct
                    ? "Product Name"
                    : "Service Name"}
                </label>

                <input
                  autoFocus
                  placeholder={
                    isProduct
                      ? "e.g. Pharmacy Suite"
                      : "e.g. Annual Maintenance Contract"
                  }
                  value={
                    form.name
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    update({
                      name:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </div>

              <div className="pm-field">
                <label>
                  Code
                </label>

                <input
                  placeholder={
                    isProduct
                      ? "e.g. MOD005"
                      : "e.g. SER003"
                  }
                  value={
                    form.code
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    update({
                      code:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </div>
            </div>

            {/* Category + Type */}

            <div className="pm-form-row">
              <div className="pm-field">
                <label>
                  Category
                </label>

                <input
                  placeholder={
                    isProduct
                      ? "e.g. Healthcare"
                      : "e.g. Maintenance"
                  }
                  value={
                    form.category
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    update({
                      category:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </div>

              <div className="pm-field">
                <label>
                  Type
                </label>

                <RadixSelect
                  value={
                    form.type
                  }
                  onChange={(
                    value
                  ) =>
                    update({
                      type:
                        value as ItemType,
                    })
                  }
                  options={[
                    {
                      value:
                        "core",
                      label:
                        typeConfig
                          .core
                          .label,
                    },
                    {
                      value:
                        "add_on",
                      label:
                        typeConfig
                          .add_on
                          .label,
                    },
                  ]}
                />
              </div>
            </div>

            {/* Status + Price */}

            <div className="pm-form-row">
              <div className="pm-field">
                <label>
                  Status
                </label>

                <RadixSelect
                  value={
                    form.status
                  }
                  onChange={(
                    value
                  ) =>
                    update({
                      status:
                        value as ItemStatus,
                    })
                  }
                  options={[
                    {
                      value:
                        "active",
                      label:
                        statusConfig
                          .active
                          .label,
                    },
                    {
                      value:
                        "inactive",
                      label:
                        statusConfig
                          .inactive
                          .label,
                    },
                  ]}
                />
              </div>

              <div className="pm-field">
                <label>
                  Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    form.price
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    update({
                      price:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </div>
            </div>

            {/* Tax */}

            <div className="pm-field">
              <label>
                Tax %
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="18"
                value={
                  form.tax_percentage
                }
                disabled={
                  saving
                }
                onChange={(
                  event
                ) =>
                  update({
                    tax_percentage:
                      event
                        .target
                        .value,
                  })
                }
              />
            </div>

            {/* Description */}

            <div className="pm-field">
              <label>
                Description
              </label>

              <textarea
                placeholder={
                  isProduct
                    ? "Describe this product..."
                    : "Describe this service..."
                }
                value={
                  form.description
                }
                disabled={
                  saving
                }
                onChange={(
                  event
                ) =>
                  update({
                    description:
                      event
                        .target
                        .value,
                  })
                }
              />
            </div>

            {/* Notes */}

            <div className="pm-field">
              <label>
                Notes
              </label>

              <textarea
                placeholder="Internal notes (optional)"
                value={
                  form.notes
                }
                disabled={
                  saving
                }
                onChange={(
                  event
                ) =>
                  update({
                    notes:
                      event
                        .target
                        .value,
                  })
                }
              />
            </div>
          </div>

          {/* Footer */}

          <div className="pm-dialog-footer">
            <button
              type="button"
              className="pm-btn-ghost"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="pm-btn-primary"
              disabled={
                !canSubmit ||
                saving
              }
              onClick={() =>
                void handleSubmit()
              }
            >
              {saving
                ? "Saving..."
                : `Create ${
                    isProduct
                      ? "product"
                      : "service"
                  }`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
import React, { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

import {
  AlertTriangle,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

import {
  AnyItem,
  ItemKind,
  ItemStatus,
  ProductModule,
  ProductService,
  getCode,
  getName,
} from "./types"

import { RadixSelect } from "./radix-select"

import {
  statusConfig,
  typeConfig,
} from "./config"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ViewItemProps {
  open: boolean

  kind: ItemKind

  data: AnyItem

  /*
   * This is the REAL type value
   * currently stored in Supabase.
   *
   * Examples:
   * Software
   * AMC
   * core
   * add_on
   */
  databaseType: string

  isEditing: boolean
  editDraft: AnyItem | null

  saving: boolean

  onClose: () => void

  onStartEdit: () => void

  onCancelEdit: () => void

  onSaveEdit: () => Promise<void>

  onDelete: () => Promise<void>

  onUpdateStatus: (
    status: ItemStatus
  ) => Promise<void>

  onDraftChange: (
    patch: Record<string, unknown>
  ) => void
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function isSupportedUiType(
  value: string
): value is "core" | "add_on" {
  return (
    value === "core" ||
    value === "add_on"
  )
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )
}

/* -------------------------------------------------------------------------- */
/*                             VIEW COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ViewItem({
  open,
  kind,
  data,
  databaseType,
  isEditing,
  editDraft,
  saving,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onUpdateStatus,
  onDraftChange,
}: ViewItemProps) {
  const isProduct =
    kind === "product"

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState(false)

  const view =
    isEditing &&
    editDraft
      ? editDraft
      : data

  const name =
    getName(
      kind,
      view
    )

  const code =
    getCode(
      kind,
      view
    )

  /*
   * Existing database may contain:
   *
   * Software
   * AMC
   *
   * while types.ts supports only:
   *
   * core
   * add_on
   *
   * We display the REAL DB value.
   */
  const storedType =
    databaseType.trim()

  const hasLegacyType =
    Boolean(
      storedType
    ) &&
    !isSupportedUiType(
      storedType
    )

  const displayedType =
    hasLegacyType
      ? storedType
      : typeConfig[
          view.type
        ].label

  /* ------------------------------------------------------------------------ */
  /*                             FIELD UPDATERS                               */
  /* ------------------------------------------------------------------------ */

  function updateName(
    value: string
  ) {
    if (isProduct) {
      onDraftChange({
        product_name:
          value,
      })

      return
    }

    onDraftChange({
      service_name:
        value,
    })
  }

  function updateCode(
    value: string
  ) {
    if (isProduct) {
      onDraftChange({
        product_code:
          value,
      })

      return
    }

    onDraftChange({
      service_code:
        value,
    })
  }

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

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
          className="pm-view-dialog"
          aria-describedby={
            undefined
          }
        >

          {/* -------------------------------------------------------------- */}
          {/* Header                                                         */}
          {/* -------------------------------------------------------------- */}

          <div className="pm-view-topbar">

            <div className="pm-view-heading">
              <Dialog.Title className="pm-view-title">
                {name ||
                  (isProduct
                    ? "Product"
                    : "Service")}
              </Dialog.Title>

              <span className="pm-view-code">
                {code ||
                  "—"}
              </span>
            </div>

            <div className="pm-view-topbar-actions">

              {/* Status selector */}

              {!isEditing && (
                <RadixSelect
                  value={
                    view.status
                  }
                  onChange={(
                    value
                  ) =>
                    void onUpdateStatus(
                      value as ItemStatus
                    )
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
                  className="pm-select-trigger-w"
                />
              )}

              {/* Edit buttons */}

              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="pm-cancel-edit-btn"
                    disabled={
                      saving
                    }
                    onClick={
                      onCancelEdit
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="pm-save-btn"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void onSaveEdit()
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="pm-view-edit-btn"
                  title="Edit"
                  disabled={
                    saving
                  }
                  onClick={
                    onStartEdit
                  }
                >
                  <Pencil
                    size={14}
                  />
                </button>
              )}

              {/* Close */}

              <button
                type="button"
                className="pm-view-close-btn"
                aria-label="Close"
                disabled={
                  saving
                }
                onClick={
                  onClose
                }
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="pm-view-divider" />

          {/* -------------------------------------------------------------- */}
          {/* Body                                                           */}
          {/* -------------------------------------------------------------- */}

          <div className="pm-view-body">

            <div className="pm-view-grid">

              {/* Name */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  {isProduct
                    ? "Product Name"
                    : "Service Name"}
                </div>

                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    value={
                      name
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      updateName(
                        event.target
                          .value
                      )
                    }
                  />
                ) : (
                  <div className="pm-view-field-val">
                    {name ||
                      "—"}
                  </div>
                )}
              </div>

              {/* Code */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  Code
                </div>

                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    value={
                      code
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      updateCode(
                        event.target
                          .value
                      )
                    }
                  />
                ) : (
                  <div className="pm-view-field-val">
                    {code ||
                      "—"}
                  </div>
                )}
              </div>

              {/* Category */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  Category
                </div>

                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    value={
                      view.category
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      onDraftChange({
                        category:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                ) : (
                  <div className="pm-view-field-val">
                    {view.category ||
                      "—"}
                  </div>
                )}
              </div>

              {/* Type */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  Type
                </div>

                {isEditing ? (
                  hasLegacyType ? (
                    /*
                     * Software / AMC / other existing
                     * database values are shown but
                     * not converted to core/add_on.
                     */
                    <div
                      className="pm-view-field-val"
                      title="Existing database type is preserved"
                    >
                      {storedType}
                    </div>
                  ) : (
                    <RadixSelect
                      value={
                        view.type
                      }
                      onChange={(
                        value
                      ) =>
                        onDraftChange({
                          type:
                            value,
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
                  )
                ) : (
                  <div className="pm-view-field-val">
                    {displayedType ||
                      "—"}
                  </div>
                )}
              </div>

              {/* Price */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  Price (₹)
                </div>

                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      view.price
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      onDraftChange({
                        price:
                          Number(
                            event
                              .target
                              .value
                          ),
                      })
                    }
                  />
                ) : (
                  <div className="pm-view-field-val">
                    ₹
                    {Number(
                      view.price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </div>
                )}
              </div>

              {/* Tax */}

              <div className="pm-view-field">
                <div className="pm-view-field-label">
                  Tax %
                </div>

                {isEditing ? (
                  <input
                    className="pm-inline-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      view.tax_percentage
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      onDraftChange({
                        tax_percentage:
                          Number(
                            event
                              .target
                              .value
                          ),
                      })
                    }
                  />
                ) : (
                  <div className="pm-view-field-val">
                    {
                      view.tax_percentage
                    }
                    %
                  </div>
                )}
              </div>

            </div>

            {/* ---------------------------------------------------------- */}
            {/* Description                                                */}
            {/* ---------------------------------------------------------- */}

            <div className="pm-view-field">
              <div className="pm-view-field-label">
                Description
              </div>

              {isEditing ? (
                <textarea
                  className="pm-inline-textarea"
                  value={
                    view.description
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    onDraftChange({
                      description:
                        event
                          .target
                          .value,
                    })
                  }
                />
              ) : (
                <div className="pm-view-field-val">
                  {view.description ||
                    "—"}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Notes                                                      */}
            {/* ---------------------------------------------------------- */}

            <div className="pm-view-notes-field">
              <div className="pm-view-field-label">
                Notes
              </div>

              {isEditing ? (
                <textarea
                  className="pm-inline-textarea"
                  placeholder="Add a note..."
                  value={
                    view.notes
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    onDraftChange({
                      notes:
                        event
                          .target
                          .value,
                    })
                  }
                />
              ) : (
                <div className="pm-view-notes-val">
                  {view.notes ||
                    "No notes yet"}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Metadata                                                   */}
            {/* ---------------------------------------------------------- */}

            <div className="pm-view-meta">
              <span>
                Created{" "}
                {formatDate(
                  view.created_at
                )}{" "}
                by{" "}
                {view.created_by ||
                  "—"}
              </span>

              <span>
                Updated{" "}
                {formatDate(
                  view.updated_at
                )}
              </span>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Delete Confirmation                                            */}
          {/* -------------------------------------------------------------- */}

          {confirmDelete && (
            <div className="mx-5 mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4">
              <div className="flex items-start gap-3">

                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <AlertTriangle
                    size={16}
                  />
                </div>

                <div className="flex-1">

                  <p className="text-sm font-semibold text-red-300">
                    Delete this{" "}
                    {isProduct
                      ? "product"
                      : "service"}
                    ?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#9299a8]">
                    You are about to delete{" "}
                    <span className="font-medium text-[#d8dbe2]">
                      {name}
                    </span>
                    . This action cannot be
                    undone.
                  </p>

                  <div className="mt-4 flex justify-end gap-2">

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmDelete(
                          false
                        )
                      }
                      className="rounded-lg border border-[#343a46] bg-[#20242c] px-3.5 py-2 text-xs font-medium text-[#b7bdc8] transition hover:bg-[#272c35] hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void onDelete()
                      }
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2
                        size={14}
                      />

                      {saving
                        ? "Deleting..."
                        : "Yes, Delete"}
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Footer                                                         */}
          {/* -------------------------------------------------------------- */}

          {!confirmDelete && (
            <div className="pm-view-footer">
              <button
                type="button"
                className="pm-delete-btn"
                disabled={
                  saving
                }
                onClick={() =>
                  setConfirmDelete(
                    true
                  )
                }
              >
                <Trash2
                  size={12}
                  style={{
                    marginRight: 6,
                    verticalAlign: -2,
                  }}
                />

                Delete{" "}
                {isProduct
                  ? "product"
                  : "service"}
              </button>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
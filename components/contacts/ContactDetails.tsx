import { useState } from "react"

import {
  AlertTriangle,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

import type { Contact } from "@/types/contacts"

type ContactDetailsProps = {
  contact: Contact
  clientName: string
  branchName: string

  saving: boolean

  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

function formatContactId(id: string) {
  if (!id) return "—"

  if (id.length <= 12) {
    return id
  }

  return `C-${id.slice(0, 8).toUpperCase()}`
}

function formatDate(value?: string) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ContactDetails({
  contact,
  clientName,
  branchName,
  saving,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailsProps) {
  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState(false)

  const fields = [
    {
      label: "Designation",
      value:
        contact.designation || "—",
    },
    {
      label: "Department",
      value:
        contact.department || "—",
    },
    {
      label: "Client",
      value: clientName || "—",
    },
    {
      label: "Branch",
      value: branchName || "—",
    },
    {
      label: "Email",
      value: contact.email || "—",
    },
    {
      label: "Mobile",
      value: contact.mobile || "—",
    },
    {
      label: "Phone",
      value: contact.phone || "—",
    },
    {
      label: "Added On",
      value: formatDate(
        contact.created_at
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose()
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#303541] bg-[#181b22] shadow-2xl">
        {/* Header */}

        <div className="flex items-start justify-between border-b border-[#292e38] px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-[#e6e8ed]">
              Contact Details
            </h2>

            <p className="mt-1 text-xs text-[#747b8a]">
              {formatContactId(
                contact.id
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#747b8a] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}

        <div className="px-6 py-5">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-base font-bold text-blue-400">
              {getInitials(
                contact.name
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-[#e6e8ed]">
                {contact.name}
              </h3>

              <p className="mt-1 text-sm text-[#838a98]">
                {contact.designation ||
                  "No designation"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.label}
                className="rounded-xl border border-[#2c313b] bg-[#1d2129] p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#69707e]">
                  {field.label}
                </p>

                <p className="mt-1.5 break-words text-sm text-[#d0d4dd]">
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          {contact.linkedin && (
            <div className="mt-3 rounded-xl border border-[#2c313b] bg-[#1d2129] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#69707e]">
                LinkedIn
              </p>

              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block break-all text-sm text-blue-400 transition hover:text-blue-300"
              >
                {contact.linkedin}
              </a>
            </div>
          )}

          {/* Inline delete confirmation UI */}

          {confirmDelete && (
            <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <AlertTriangle
                    size={16}
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-300">
                    Delete this contact?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#9299a8]">
                    You are about to delete{" "}
                    <span className="font-medium text-[#d8dbe2]">
                      {contact.name}
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
                      onClick={onDelete}
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
        </div>

        {/* Footer */}

        {!confirmDelete && (
          <div className="flex items-center justify-between border-t border-[#292e38] px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setConfirmDelete(
                  true
                )
              }
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3.5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={15} />

              Delete
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onEdit}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              <Pencil size={15} />

              Edit Contact
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
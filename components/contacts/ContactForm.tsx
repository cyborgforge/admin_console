import {
  type FormEvent,
  useMemo,
} from "react"

import { Loader2, X } from "lucide-react"

import type { ContactDraft } from "@/types/contacts"

export type ContactClientOption = {
  id: string
  company_name: string
}

export type ContactBranchOption = {
  id: string
  branch_name: string
  client_id: string
}

type ContactFormProps = {
  title: string
  description?: string

  draft: ContactDraft

  clients: ContactClientOption[]
  branches: ContactBranchOption[]

  saving: boolean

  submitLabel: string

  onChange: (draft: ContactDraft) => void
  onSubmit: () => void
  onClose: () => void
}

const inputClass =
  "w-full rounded-lg border border-[#303541] bg-[#1d2129] px-3 py-2.5 text-sm text-[#d5d9e2] outline-none transition placeholder:text-[#555b68] focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#747b8a]"

export default function ContactForm({
  title,
  description,
  draft,
  clients,
  branches,
  saving,
  submitLabel,
  onChange,
  onSubmit,
  onClose,
}: ContactFormProps) {
  const availableBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          branch.client_id ===
          draft.client_id
      ),
    [branches, draft.client_id]
  )

  function updateField<
    K extends keyof ContactDraft,
  >(
    field: K,
    value: ContactDraft[K]
  ) {
    onChange({
      ...draft,
      [field]: value,
    })
  }

  function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    onSubmit()
  }

  const canSubmit = Boolean(
    draft.name.trim() &&
      draft.client_id &&
      draft.branch_id
  )

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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#303541] bg-[#181b22] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#292e38] px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-[#e6e8ed]">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs text-[#747b8a]">
                {description}
              </p>
            )}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">

            {/* Name + Designation */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Contact Name *
                </label>

                <input
                  autoFocus
                  value={draft.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter contact name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Designation
                </label>

                <input
                  value={draft.designation}
                  onChange={(event) =>
                    updateField(
                      "designation",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Managing Director"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Client + Branch */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Client *
                </label>

                <select
                  value={draft.client_id}
                  onChange={(event) => {
                    onChange({
                      ...draft,
                      client_id:
                        event.target.value,
                      branch_id: "",
                    })
                  }}
                  className={inputClass}
                >
                  <option value="">
                    Select client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Branch *
                </label>

                <select
                  value={draft.branch_id}
                  disabled={!draft.client_id}
                  onChange={(event) =>
                    updateField(
                      "branch_id",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    {draft.client_id
                      ? "Select branch"
                      : "Select client first"}
                  </option>

                  {availableBranches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.branch_name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Department */}

            <div>
              <label className={labelClass}>
                Department
              </label>

              <input
                value={draft.department}
                onChange={(event) =>
                  updateField(
                    "department",
                    event.target.value
                  )
                }
                placeholder="e.g. Sales, Finance, IT"
                className={inputClass}
              />
            </div>

            {/* Email + Mobile */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Email
                </label>

                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Mobile
                </label>

                <input
                  value={draft.mobile}
                  onChange={(event) =>
                    updateField(
                      "mobile",
                      event.target.value
                    )
                  }
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Alternate Phone + LinkedIn */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Alternate Phone
                </label>

                <input
                  value={draft.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="Office number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  LinkedIn
                </label>

                <input
                  value={draft.linkedin}
                  onChange={(event) =>
                    updateField(
                      "linkedin",
                      event.target.value
                    )
                  }
                  placeholder="LinkedIn profile URL"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#292e38] px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-[#303541] px-4 py-2 text-sm font-medium text-[#9aa1af] transition hover:border-[#454c59] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                !canSubmit || saving
              }
              className="flex min-w-[125px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
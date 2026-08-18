"use client"

import { Check } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import type { ContactDraft } from "@/types/contacts"
import type {
  ContactBranchOption,
  ContactClientOption,
} from "./CreateContactModal"

interface EditContactProps {
  draft: ContactDraft
  setDraft: Dispatch<SetStateAction<ContactDraft | null>>
  clients: ContactClientOption[]
  branches: ContactBranchOption[]
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export default function EditContact({
  draft,
  setDraft,
  clients,
  branches,
  saving,
  onSave,
  onCancel,
}: EditContactProps) {
  const availableBranches = branches.filter(
    (branch) => branch.client_id === draft.client_id
  )

  const updateField = <K extends keyof ContactDraft>(
    key: K,
    value: ContactDraft[K]
  ) => {
    setDraft((current) =>
      current ? { ...current, [key]: value } : current
    )
  }

  const canSave =
    draft.name.trim().length > 0 &&
    draft.client_id.trim().length > 0 &&
    draft.branch_id.trim().length > 0 &&
    !saving

  return (
    <div className="lp-overlay" onClick={onCancel}>
      <div
        className="lp-view-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lp-view-topbar">
          <div className="lp-view-status-wrap">
            <span className="lp-view-status-label">Edit Contact</span>
          </div>

          <div className="lp-view-topbar-actions">
            <button
              className="lp-save-btn"
              onClick={onSave}
              disabled={!canSave}
            >
              <Check size={13} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="lp-cancel-edit-btn"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="lp-view-divider" />

        <div className="lp-view-body">
          <div className="lp-view-grid">
            <div className="lp-view-field">
              <div className="lp-view-field-label">CONTACT NAME *</div>
              <input
                className="lp-inline-input"
                value={draft.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">CLIENT *</div>
              <select
                className="lp-inline-input"
                value={draft.client_id}
                onChange={(event) => {
                  const clientId = event.target.value
                  setDraft((current) =>
                    current
                      ? { ...current, client_id: clientId, branch_id: "" }
                      : current
                  )
                }}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">BRANCH *</div>
              <select
                className="lp-inline-input"
                value={draft.branch_id}
                disabled={!draft.client_id}
                onChange={(event) => updateField("branch_id", event.target.value)}
              >
                <option value="">Select branch</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">DESIGNATION</div>
              <input
                className="lp-inline-input"
                value={draft.designation}
                onChange={(event) =>
                  updateField("designation", event.target.value)
                }
              />
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">DEPARTMENT</div>
              <input
                className="lp-inline-input"
                value={draft.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
              />
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">EMAIL</div>
              <input
                className="lp-inline-input"
                type="email"
                value={draft.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">MOBILE</div>
              <input
                className="lp-inline-input"
                value={draft.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
              />
            </div>

            <div className="lp-view-field">
              <div className="lp-view-field-label">PHONE</div>
              <input
                className="lp-inline-input"
                value={draft.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
          </div>

          <div className="lp-view-notes-field">
            <div className="lp-view-field-label">LINKEDIN</div>
            <input
              className="lp-inline-input"
              value={draft.linkedin}
              onChange={(event) => updateField("linkedin", event.target.value)}
            />
          </div>
        </div>

        <div className="lp-view-footer" />
      </div>
    </div>
  )
}

import type {
  LeadStatus,
  CreateLeadDraft,
} from "@/app/(dashboard)/leads/page"

interface CreateLeadProps {
  createDraft: CreateLeadDraft
  setCreateDraft: React.Dispatch<
    React.SetStateAction<CreateLeadDraft>
  >
  saveCreate: () => void
  onClose: () => void
}

export default function CreateLeadModal({
  createDraft,
  setCreateDraft,
  saveCreate,
  onClose,
}: CreateLeadProps) {
  const updateField = <
    K extends keyof CreateLeadDraft
  >(
    key: K,
    value: CreateLeadDraft[K]
  ) => {
    setCreateDraft((draft) => ({
      ...draft,
      [key]: value,
    }))
  }

  const canCreate =
    createDraft.leadName.trim().length > 0 &&
    createDraft.email.trim().length > 0

  return (
    <div
      className="lp-overlay"
      onClick={onClose}
    >
      <div
        className="lp-view-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="lp-view-topbar">
          <div className="lp-view-status-wrap">
            <span className="lp-view-status-label">
              New Lead
            </span>
          </div>

          <div className="lp-view-topbar-actions">
            <button
              className="lp-save-btn"
              onClick={saveCreate}
              disabled={!canCreate}
            >
              Create
            </button>

            <button
              className="lp-cancel-edit-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="lp-view-divider" />

        {/* Form Body */}
        <div className="lp-view-body">
          <div className="lp-view-grid">
            {/* Lead Name */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">
                LEAD NAME
              </div>

              <input
                className="lp-inline-input"
                placeholder="Enter lead name"
                value={createDraft.leadName}
                onChange={(e) =>
                  updateField(
                    "leadName",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Email */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">
                EMAIL
              </div>

              <input
                className="lp-inline-input"
                type="email"
                placeholder="company@example.com"
                value={createDraft.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Phone */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">
                PHONE
              </div>

              <input
                className="lp-inline-input"
                placeholder="+91 XXXXX XXXXX"
                value={createDraft.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Company */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">
                COMPANY
              </div>

              <input
                className="lp-inline-input"
                placeholder="Company name"
                value={createDraft.company}
                onChange={(e) =>
                  updateField(
                    "company",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Status */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">
                STATUS
              </div>

              <select
                className="lp-inline-input"
                value={createDraft.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target
                      .value as LeadStatus
                  )
                }
              >
                <option value="discovery">
                  Discovery
                </option>
                <option value="contacted">
                  Contacted
                </option>
                <option value="reviewing">
                  Reviewing
                </option>
                <option value="closed-won">
                  Found
                </option>
                <option value="closed-lost">
                  Not Found
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lp-view-footer" />
      </div>
    </div>
  )
}
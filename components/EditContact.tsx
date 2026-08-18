"use client"

import { ExternalLink, Pencil, X } from "lucide-react"
import type { Contact } from "@/types/contacts"

interface ViewContactProps {
  contact: Contact
  clientName: string
  branchName: string
  onClose: () => void
  onEdit: () => void
  onDelete: (id: string) => void
}

const valueOrDash = (value: string | null | undefined) =>
  value?.trim() ? value : "—"

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || "—"
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ViewContact({
  contact,
  clientName,
  branchName,
  onClose,
  onEdit,
  onDelete,
}: ViewContactProps) {
  return (
    <div className="lp-overlay" onClick={onClose}>
      <div
        className="lp-view-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lp-view-topbar">
          <div className="lp-view-status-wrap">
            <span className="lp-view-status-label">Contact Details</span>
          </div>

          <div className="lp-view-topbar-actions">
            <button className="lp-view-edit-btn" title="Edit" onClick={onEdit}>
              <Pencil size={13} />
            </button>
            {contact.linkedin && (
              <a
                className="lp-make-deal-btn"
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                LinkedIn <ExternalLink size={12} />
              </a>
            )}
            <button className="lp-dialog-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="lp-view-divider" />

        <div className="lp-view-body">
          <div className="lp-view-grid">
            <div className="lp-view-field">
              <div className="lp-view-field-label">CONTACT ID</div>
              <div className="lp-view-field-val" title={contact.id}>
                {contact.id}
              </div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">CONTACT NAME</div>
              <div className="lp-view-field-val">{contact.name}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">EMAIL</div>
              <div className="lp-view-field-val">{valueOrDash(contact.email)}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">MOBILE</div>
              <div className="lp-view-field-val">{valueOrDash(contact.mobile)}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">PHONE</div>
              <div className="lp-view-field-val">{valueOrDash(contact.phone)}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">DESIGNATION</div>
              <div className="lp-view-field-val">{valueOrDash(contact.designation)}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">DEPARTMENT</div>
              <div className="lp-view-field-val">{valueOrDash(contact.department)}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">CLIENT</div>
              <div className="lp-view-field-val">{clientName || "—"}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">BRANCH</div>
              <div className="lp-view-field-val">{branchName || "—"}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">CREATED AT</div>
              <div className="lp-view-field-val">{formatDate(contact.created_at)}</div>
            </div>
          </div>

          <div className="lp-view-notes-field">
            <div className="lp-view-field-label">LINKEDIN</div>
            <div className="lp-view-field-val lp-view-notes-val">
              {valueOrDash(contact.linkedin)}
            </div>
          </div>
        </div>

        <div className="lp-view-footer">
          <button className="lp-delete-btn" onClick={() => onDelete(contact.id)}>
            Delete Contact
          </button>
        </div>
      </div>
    </div>
  )
}

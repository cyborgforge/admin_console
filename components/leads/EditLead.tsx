"use client"

import React from "react"
import { Check } from "lucide-react"
import type { Lead, LeadStatus } from "@/app/(dashboard)/leads/page"

interface EditLeadProps {
  editDraft: Lead
  setEditDraft: React.Dispatch<React.SetStateAction<Lead | null>>
  statusConfig: Record<
    LeadStatus,
    { label: string; bg: string; color: string; dot: string }
  >
  saveEdit: () => void
  cancelEdit: () => void
}

export default function EditLead({
  editDraft,
  setEditDraft,
  statusConfig,
  saveEdit,
  cancelEdit,
}: EditLeadProps) {
  return (
    <div className="lp-overlay" onClick={cancelEdit}>
      <div className="lp-view-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="lp-view-topbar">
          {/* Status */}
          <div className="lp-view-status-wrap">
            <span className="lp-view-status-label">Status</span>
            <div
              className="lp-view-status-select-wrap"
              style={{ borderColor: statusConfig[editDraft.status].color + "66" }}
            >
              <span className="lp-dot" style={{ background: statusConfig[editDraft.status].dot }} />
              <select
                className="lp-view-status-select"
                style={{ color: statusConfig[editDraft.status].color }}
                value={editDraft.status}
                onChange={(e) => {
                  const s = e.target.value as LeadStatus
                  setEditDraft({ ...editDraft, status: s })
                }}
              >
                {(Object.keys(statusConfig) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="lp-view-topbar-actions">
            <button className="lp-save-btn" onClick={saveEdit}>
              <Check size={13} />
              Save
            </button>
            <button className="lp-cancel-edit-btn" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="lp-view-divider" />

        {/* Fields Grid — edit mode shows inputs */}
        <div className="lp-view-body">
          <div className="lp-view-grid">
            {/* LEAD ID — always read-only */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">LEAD ID</div>
              <div className="lp-view-field-val">{editDraft.id}</div>
            </div>

            {/* LEAD NAME */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">LEAD NAME</div>
              <input
                className="lp-inline-input"
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
              />
            </div>

            {/* EMAIL */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">EMAIL</div>
              <input
                className="lp-inline-input"
                type="email"
                value={editDraft.email}
                onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
              />
            </div>

            {/* PHONE */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">PHONE</div>
              <input
                className="lp-inline-input"
                value={editDraft.phone}
                onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
              />
            </div>

            {/* COMPANY */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">COMPANY</div>
              <input
                className="lp-inline-input"
                value={editDraft.org}
                onChange={(e) => setEditDraft({ ...editDraft, org: e.target.value })}
              />
            </div>

            {/* INDUSTRY — static */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">INDUSTRY</div>
              <div className="lp-view-field-val">Healthcare</div>
            </div>

            {/* CREATED AT — read-only */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">CREATED AT</div>
              <div className="lp-view-field-val">{editDraft.addedOn}</div>
            </div>

            {/* STATUS badge */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">STATUS</div>
              <div className="lp-view-field-val">
                <span
                  className="lp-badge"
                  style={{
                    background: statusConfig[editDraft.status].bg,
                    color: statusConfig[editDraft.status].color,
                    borderColor: statusConfig[editDraft.status].color + "33",
                  }}
                >
                  <span className="lp-dot" style={{ background: statusConfig[editDraft.status].dot }} />
                  {statusConfig[editDraft.status].label}
                </span>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="lp-view-notes-field">
            <div className="lp-view-field-label">NOTES</div>
            <textarea
              className="lp-inline-textarea"
              value={editDraft.notes}
              placeholder="Add notes..."
              onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Footer: Empty in edit mode */}
        <div className="lp-view-footer" />
      </div>
    </div>
  )
}

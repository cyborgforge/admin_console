"use client"

import React from "react"
import { Pencil, X } from "lucide-react"
import type { Lead, LeadStatus } from "@/app/(dashboard)/leads/page"

interface ViewLeadProps {
  lead: Lead
  statusConfig: Record<
    LeadStatus,
    { label: string; bg: string; color: string; dot: string }
  >
  closeView: () => void
  startEdit: () => void
  handleDeleteLead: (id: string) => void
  updateViewStatus: (status: LeadStatus) => void
}

export default function ViewLead({
  lead,
  statusConfig,
  closeView,
  startEdit,
  handleDeleteLead,
  updateViewStatus,
}: ViewLeadProps) {
  return (
    <div className="lp-overlay" onClick={closeView}>
      <div className="lp-view-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="lp-view-topbar">
          {/* Status */}
          <div className="lp-view-status-wrap">
            <span className="lp-view-status-label">Status</span>
            <div
              className="lp-view-status-select-wrap"
              style={{ borderColor: statusConfig[lead.status].color + "66" }}
            >
              <span className="lp-dot" style={{ background: statusConfig[lead.status].dot }} />
              <select
                className="lp-view-status-select"
                style={{ color: statusConfig[lead.status].color }}
                value={lead.status}
                onChange={(e) => {
                  const s = e.target.value as LeadStatus
                  updateViewStatus(s)
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
            <button className="lp-view-edit-btn" title="Edit" onClick={startEdit}>
              <Pencil size={13} />
            </button>
            <button className="lp-make-deal-btn">Make Deal</button>
            <button className="lp-dialog-close" onClick={closeView}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="lp-view-divider" />

        {/* Fields Grid — view mode shows values */}
        <div className="lp-view-body">
          <div className="lp-view-grid">
            {/* LEAD ID — always read-only */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">LEAD ID</div>
              <div className="lp-view-field-val">{lead.id}</div>
            </div>

            {/* LEAD NAME */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">LEAD NAME</div>
              <div className="lp-view-field-val">{lead.leadName}</div>
            </div>

            {/* EMAIL */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">EMAIL</div>
              <div className="lp-view-field-val">{lead.email}</div>
            </div>

            {/* PHONE */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">PHONE</div>
              <div className="lp-view-field-val">{lead.phone}</div>
            </div>

            {/* COMPANY */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">COMPANY</div>
              <div className="lp-view-field-val">{lead.company || "—"}</div>
            </div>

            {/* INDUSTRY — static */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">INDUSTRY</div>
              <div className="lp-view-field-val">Healthcare</div>
            </div>

            {/* CREATED AT — read-only */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">CREATED AT</div>
              <div className="lp-view-field-val">{lead.createdDate}</div>
            </div>

            {/* STATUS badge */}
            <div className="lp-view-field">
              <div className="lp-view-field-label">STATUS</div>
              <div className="lp-view-field-val">
                <span
                  className="lp-badge"
                  style={{
                    background: statusConfig[lead.status].bg,
                    color: statusConfig[lead.status].color,
                    borderColor: statusConfig[lead.status].color + "33",
                  }}
                >
                  <span className="lp-dot" style={{ background: statusConfig[lead.status].dot }} />
                  {statusConfig[lead.status].label}
                </span>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="lp-view-notes-field">
            <div className="lp-view-field-label">NOTES</div>
            {/* <div className="lp-view-field-val lp-view-notes-val">
              {lead.notes || "—"}
            </div> */}
          </div>
        </div>

        {/* Footer: Delete */}
        <div className="lp-view-footer">
          <div className="lp-view-footer">
            <button
              className="lp-delete-btn"
              onClick={() => handleDeleteLead(lead.id)}
            >
              Delete Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

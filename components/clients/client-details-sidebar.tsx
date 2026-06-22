"use client"

import React, { useState } from "react"
import { 
  ChevronDown, 
  Mail, 
  Phone, 
  FileText, 
  Download,
  X 
} from "lucide-react"
import type { Client } from "@/types/client"

interface Contact {
  initials: string
  name: string
  role: string
  color: string
}

interface Document {
  name: string
  iconColor: string
}

interface ClientDetailsSidebarProps {
  client: Client
  activities: Array<{
    id: string
    type: "Call" | "Email" | "Meeting" | "Task" | "Note"
    title: string
    description: string
    dateTime: string
    assignedUser: string
  }>
  isOpenMobile?: boolean
  setIsOpenMobile?: (open: boolean) => void
}

export function ClientDetailsSidebar({
  client,
  activities,
  isOpenMobile = false,
  setIsOpenMobile,
}: ClientDetailsSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    companyInfo: true,
    moreDetails: false,
    notes: false,
    contacts: true,
    activities: true,
    documents: false,
  })

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Predefined mock data for contacts and documents
  const contacts: Contact[] = [
    { initials: "RK", name: "Ramesh Kumar", role: "Director", color: "#4c7ee1" },
    { initials: "PL", name: "Priya Lakshmi", role: "Operations Manager", color: "#1ead82" },
    { initials: "AV", name: "Anand Venkat", role: "IT Head", color: "#8b5cf6" },
  ]

  const documents: Document[] = [
    { name: `Contract_${client.name.replace(/\s+/g, "_")}_2026.pdf`, iconColor: "#4c7ee1" },
    { name: `Proposal_${client.product.replace(/\s+/g, "_")}.pdf`, iconColor: "#d3a335" },
  ]

  const getActivityEmoji = (type: string) => {
    switch (type) {
      case "Call": return "📞"
      case "Email": return "📧"
      case "Meeting": return "🤝"
      case "Task": return "☑️"
      default: return "📝"
    }
  }

  const formatActivityDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  // Sidebar Header Layout
  const renderHeader = (showCloseButton: boolean) => (
    <div className="cd-sidebar-header flex items-center justify-between">
      <h3 className="cd-sidebar-title font-semibold text-sm">Client Details</h3>
      {showCloseButton ? (
        <button 
          onClick={() => setIsOpenMobile?.(false)} 
          className="lp-icon-btn p-1.5 cursor-pointer border-0"
          title="Close Panel"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  )

  // Expanded View Content (standard accordions with custom highlights)
  const renderExpandedContent = () => (
    <div className="cd-expanded-content flex flex-col">
      {/* 1. Company Information */}
      <div className={`cd-sidebar-section ${expanded.companyInfo ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("companyInfo")}
          className="cd-accordion-btn"
        >
          Company Information
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.companyInfo ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.companyInfo ? "open" : ""}`}>
          <div className="cd-accordion-body">
            <div className="lp-view-field">
              <div className="lp-view-field-label">Branch</div>
              <div className="lp-view-field-val">{client.name} — {client.city} HQ</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">Industry</div>
              <div className="lp-view-field-val">{client.industry}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">Tags</div>
              <div className="cd-tags">
                <span className="cd-tag">Enterprise</span>
                <span className="cd-tag">{client.product}</span>
                <span className="cd-tag">Multi-branch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. More Details */}
      <div className={`cd-sidebar-section ${expanded.moreDetails ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("moreDetails")}
          className="cd-accordion-btn"
        >
          More details
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.moreDetails ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.moreDetails ? "open" : ""}`}>
          <div className="cd-accordion-body">
            <div className="lp-view-field">
              <div className="lp-view-field-label">GST No.</div>
              <div className="lp-view-field-val">{client.gst || "-"}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">Website</div>
              <div className="lp-view-field-val cd-link hover:underline">
                {client.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.in
              </div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">City</div>
              <div className="lp-view-field-val">{client.city}</div>
            </div>
            <div className="lp-view-field">
              <div className="lp-view-field-label">Client since</div>
              <div className="lp-view-field-val">{client.since || "Jan 2026"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Notes */}
      <div className={`cd-sidebar-section ${expanded.notes ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("notes")}
          className="cd-accordion-btn"
        >
          Notes
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.notes ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.notes ? "open" : ""}`}>
          <div className="cd-accordion-body">
            <div className="lp-view-notes-field">
              <div className="lp-view-field-label">Internal Notes</div>
              <div className="lp-view-field-val lp-view-notes-val text-xs leading-relaxed">
                {client.notes || "No notes configured yet. Edit client to add internal notes."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Client Contacts */}
      <div className={`cd-sidebar-section ${expanded.contacts ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("contacts")}
          className="cd-accordion-btn"
        >
          Client Contacts
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.contacts ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.contacts ? "open" : ""}`}>
          <div className="cd-accordion-contacts">
            {contacts.map((c, idx) => (
              <div key={idx} className="cd-contact-row">
                <div
                  className="lp-avatar flex-shrink-0"
                  style={{ background: `${c.color}22`, color: c.color, width: 28, height: 28, fontSize: 10 }}
                >
                  {c.initials}
                </div>
                <div className="cd-contact-info flex-1 min-w-0">
                  <div className="cd-contact-name text-xs font-medium text-[#c2c8cc] truncate">{c.name}</div>
                  <div className="cd-contact-role text-[10px] text-[#5a6070] truncate">{c.role}</div>
                </div>
                <div className="cd-contact-actions flex gap-1">
                  <button
                    className="lp-icon-btn hover:bg-white/5 p-1 rounded cursor-pointer border-0"
                    onClick={() => alert(`Sending email to ${c.name.toLowerCase().replace(" ", ".")}@example.com`)}
                    title="Send email"
                  >
                    <Mail size={12} className="text-[#5a6070] hover:text-[#c8d0e0]" />
                  </button>
                  <button
                    className="lp-icon-btn hover:bg-white/5 p-1 rounded cursor-pointer border-0"
                    onClick={() => alert(`Calling ${c.name} at +91 90000 00000`)}
                    title="Call contact"
                  >
                    <Phone size={12} className="text-[#5a6070] hover:text-[#c8d0e0]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Activities */}
      <div className={`cd-sidebar-section ${expanded.activities ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("activities")}
          className="cd-accordion-btn"
        >
          Activities
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.activities ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.activities ? "open" : ""}`}>
          <div className="cd-accordion-contacts max-h-[250px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-5 text-[11px] text-[#4f5a6a]">
                No recorded activities yet.
              </div>
            ) : (
              activities.map((a, idx) => (
                <div key={idx} className="cd-activity-row">
                  <span className="cd-activity-icon text-sm flex-shrink-0 select-none">
                    {getActivityEmoji(a.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="cd-activity-title text-xs font-medium text-[#c2c8cc] truncate">
                      {a.title}
                    </div>
                    <div className="cd-activity-meta text-[10px] text-[#5a6070] mt-0.5">
                      {a.assignedUser} · {formatActivityDate(a.dateTime)}
                    </div>
                    {a.description && (
                      <div className="text-[10px] text-[#4f5a6a] mt-1 italic break-words">
                        {a.description}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Documents */}
      <div className={`cd-sidebar-section ${expanded.documents ? "cd-section-active" : ""}`}>
        <button
          onClick={() => toggleSection("documents")}
          className="cd-accordion-btn"
        >
          Documents
          <ChevronDown
            size={13}
            className={`cd-chevron ${expanded.documents ? "cd-chevron-open" : ""}`}
          />
        </button>
        <div className={`cd-accordion-container ${expanded.documents ? "open" : ""}`}>
          <div className="cd-accordion-body">
            {documents.map((doc, idx) => (
              <div key={idx} className="cd-doc-row flex items-center justify-between gap-3 pb-2 border-b border-[#1e2229] last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={13} style={{ color: doc.iconColor, flexShrink: 0 }} />
                  <span className="cd-doc-name text-xs text-[#9ba0ae] truncate">{doc.name}</span>
                </div>
                <button
                  className="lp-icon-btn hover:bg-white/5 p-1 rounded cursor-pointer border-0"
                  onClick={() => alert(`Downloading ${doc.name}...`)}
                  title="Download document"
                >
                  <Download size={12} className="text-[#5a6070] hover:text-[#c8d0e0]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. Desktop / Tablet Sidebar View */}
      <aside className="client-details-sidebar hidden md:flex flex-col">
        {renderHeader(false)}
        <div className="cd-sidebar-inner custom-scrollbar flex-1">
          {renderExpandedContent()}
        </div>
      </aside>

      {/* 2. Mobile Drawer Overlay View */}
      {isOpenMobile && (
        <div className="md:hidden">
          <div className="drawer-overlay" onClick={() => setIsOpenMobile?.(false)} />
          <aside className="drawer-content flex flex-col">
            {renderHeader(true)}
            <div className="cd-sidebar-inner custom-scrollbar flex-1">
              {renderExpandedContent()}
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .client-details-sidebar {
          width: 300px;
          min-width: 340px;
          flex-shrink: 0;
          background: #161920;
          border-left: 1px solid #2a3040;
          position: sticky;
          top: 56px;
          height: calc(100vh - 56px);
          overflow-y: auto;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 15;
          display: flex;
          flex-direction: column;
        }

        .cd-sidebar-inner {
          display: flex;
          flex-direction: column;
        }

        .cd-sidebar-header {
          padding: 14px 20px;
          border-bottom: 1px solid #1e2229;
          height: 56px;
          flex-shrink: 0;
        }

        .cd-sidebar-title {
          font-size: 11px;
          font-weight: 600;
          color: #8b95a8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: var(--font-geist-mono, monospace);
        }

        /* Active section highlights */
        .cd-sidebar-section {
          border-left: 2px solid transparent;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .cd-sidebar-section.cd-section-active {
          border-left-color: #3b82f6;
          background: rgba(59, 130, 246, 0.015);
        }

        .cd-sidebar-section.cd-section-active .cd-accordion-btn {
          color: #e8eaf0;
        }

        .cd-accordion-container {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.25s cubic-bezier(0, 1, 0, 1), opacity 0.2s ease;
        }
        
        .cd-accordion-container.open {
          max-height: 800px;
          opacity: 1;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a3040;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #35404f;
        }

        /* Mobile Drawer slide animations */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 9998;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease-out;
        }

        .drawer-content {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 300px;
          background: #161920;
          border-left: 1px solid #2a3040;
          z-index: 9999;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

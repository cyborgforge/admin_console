// @ts-nocheck
"use client"

import React, { useState } from "react"
import { Edit, Activity, Plus, MoreHorizontal, Info } from "lucide-react"
import type { Client } from "@/types/client"

interface ClientHeaderProps {
  client: Client
  onEditClick: () => void
  onAddActivityClick: () => void
  onNewDealClick: () => void 
}

export function ClientHeader({
  client,
  onEditClick,
  onAddActivityClick,
  onNewDealClick,
}: ClientHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  return (
    <div className="cd-header">
      <div className="cd-header-left">
        <div
          className="cd-avatar-block"
          style={{ color: client.color || "#4c7ee1" }}
        >
          {client.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <h1 className="cd-title">{client.name}</h1>
          <div className="cd-badges">
            <span className="cd-badge cd-badge-active">
              <span
                className="cd-badge-dot"
                style={{
                  background:
                    client.status === "active"
                      ? "#1ead82"
                      : client.status === "prospect"
                      ? "#d3a335"
                      : "#c4606f",
                }}
              />
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </span>
            <span className="cd-badge cd-badge-meta">
              <span>👤</span> Handled by Executive
            </span>
           
          </div>
        </div>
      </div>

      <div className="cd-header-actions">
        
        <button
          onClick={onEditClick}
          className="lp-btn-ghost cd-action-btn cursor-pointer"
        >
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={onAddActivityClick}
          className="lp-btn-ghost cd-action-btn cursor-pointer"
        >
          <Activity size={14} />
          Add Activity
        </button>
        <button
          onClick={onNewDealClick}
          className="lp-btn-primary cd-action-btn cursor-pointer"
        >
          <Plus size={14} />
          New Deal
        </button>
        <div className="cd-more-wrap">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="lp-icon-btn cd-more-btn border border-[#2a2f3a] bg-transparent rounded-md cursor-pointer hover:bg-white/5"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="cd-more-menu z-20">
                
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    onEditClick()
                  }}
                  className="cd-more-item"
                >
                  Edit Client Profile
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    onAddActivityClick()
                  }}
                  className="cd-more-item"
                >
                  Log New Activity
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    onNewDealClick()
                  }}
                  className="cd-more-item"
                >
                  Create New Deal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

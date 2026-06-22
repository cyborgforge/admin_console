import React from "react"
import { ItemType, ItemStatus } from "./types"
import { typeConfig, statusConfig } from "./config"

export function TypeBadge({ type }: { type: ItemType }) {
  const c = typeConfig[type]
  return (
    <span className="pm-badge" style={{ background: c.bg, color: c.color, borderColor: c.color + "33" }}>
      {c.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const c = statusConfig[status]
  return (
    <span className="pm-badge" style={{ background: c.bg, color: c.color, borderColor: c.color + "33" }}>
      <span className="pm-dot" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

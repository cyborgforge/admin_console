import React from "react"
import { Eye } from "lucide-react"

export interface ColumnDef<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
}

export function DataTable<T extends { id: string }>({
  items,
  columns,
  onView,
  emptyIcon,
  emptyLabel,
}: {
  items: T[]
  columns: ColumnDef<T>[]
  onView: (item: T) => void
  emptyIcon: string
  emptyLabel: string
}) {
  return (
    <div className="pm-table-wrap">
      <table className="pm-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>VIEW</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="pm-empty">
                <div style={{ fontSize: 28, marginBottom: 8 }}>{emptyIcon}</div>
                <div>{emptyLabel}</div>
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="pm-row">
                {columns.map((c) => (
                  <td key={c.key}>{c.render(item)}</td>
                ))}
                <td>
                  <div className="pm-actions">
                    <button className="pm-icon-btn" title="View" onClick={() => onView(item)}>
                      <Eye size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

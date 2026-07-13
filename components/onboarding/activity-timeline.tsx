type ActivityItem = {
  id: string
  label: string
  date: string | null
  detail?: string | null
}

export function ActivityTimeline({
  items,
}: {
  items: ActivityItem[]
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {items.length === 0 ? (
        <div className="empty-text">No activity yet</div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="stat-card"
            style={{ padding: "12px" }}
          >
            <div className="client-name">{item.label}</div>
            <div className="client-org">
              {item.date
                ? new Date(item.date).toLocaleString()
                : "-"}
            </div>
            {item.detail ? (
              <div
                style={{
                  color: "var(--text2)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {item.detail}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}

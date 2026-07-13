export function ProgressCell({
  filled,
  total,
}: {
  filled: number
  total: number
}) {
  const pct =
    total > 0
      ? Math.min(100, Math.round((filled / total) * 100))
      : 0

  return (
    <div style={{ minWidth: "120px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--text2)",
          fontSize: "12px",
          marginBottom: "6px",
        }}
      >
        <span>
          {filled}/{total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "999px",
          background: "var(--surface2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent)",
          }}
        />
      </div>
    </div>
  )
}

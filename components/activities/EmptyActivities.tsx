// components/activities/EmptyActivities.tsx

/**
 * Displayed when there are no activities available.
 */
export default function EmptyActivities() {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "var(--text3)",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        No Activities
      </div>

      <div
        style={{
          fontSize: "13px",
        }}
      >
        No activities have been recorded yet.
      </div>
    </div>
  );
}
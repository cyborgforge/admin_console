import type { Activity } from "@/types/activity";
import ActivityIcon from "./ActivityIcon";

interface ActivityCardProps {
  activity: Activity;
}

/**
 * Displays a single activity in the timeline.
 */
export default function ActivityCard({
  activity,
}: ActivityCardProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Timeline Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "var(--surface2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ActivityIcon
          type={activity.type}
          className="h-5 w-5"
        />
      </div>

      {/* Activity Details */}
      <div
        style={{
          flex: 1,
        }}
      >
        {/* Activity Title */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {activity.title}
          </div>

          <span
            style={{
              fontSize: "12px",
              color: "var(--text3)",
            }}
          >
            {new Date(
              activity.timestamp
            ).toLocaleString()}
          </span>
        </div>

        {/* Activity Description */}
        <div
          style={{
            fontSize: "14px",
            color: "var(--text2)",
            marginBottom: "8px",
          }}
        >
          {activity.description}
        </div>

        {/* Activity User */}
        <div
          style={{
            fontSize: "12px",
            color: "var(--text3)",
          }}
        >
          Performed by{" "}
          <strong>{activity.user.name}</strong>
        </div>
      </div>
    </div>
  );
}
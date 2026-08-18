// components/activities/ActivityList.tsx

import type { Activity } from "@/types/activity";
import ActivityCard from "./ActivityCard";
import EmptyActivities from "./EmptyActivities";

interface ActivityListProps {
  activities: Activity[];
}

/**
 * Displays the list of activities.
 * Renders an empty state when no activities are available.
 */
export default function ActivityList({
  activities,
}: ActivityListProps) {
  // Show empty state when there are no activities.
  if (!activities || activities.length === 0) {
    return <EmptyActivities />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
        />
      ))}
    </div>
  );
}
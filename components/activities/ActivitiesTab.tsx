import type { Activity } from "@/types/activity";
import ActivityList from "./ActivityList";

interface ActivitiesTabProps {
  activities: Activity[];
}

/**
 * Activities tab displayed in Client Details and Deal Details.
 * Acts as the container for the activity timeline.
 */
export default function ActivitiesTab({
  activities,
}: ActivitiesTabProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Activities Timeline */}
      <div className="stat-card">
        <div className="section-heading">
          Activities Timeline
        </div>

        <ActivityList
          activities={activities}
        />
      </div>
    </div>
  );
}
import type { OnboardingStatus } from "@/types/onboarding"

const statusClass: Record<OnboardingStatus, string> = {
  Pending: "badge badge-draft",
  "In Progress": "badge badge-review",
  "Under Review": "badge badge-review",
  Approved: "badge badge-accepted",
  Rejected: "badge badge-churned",
  Skipped: "badge badge-draft",
}

export function OnboardingStatusBadge({
  status,
}: {
  status: OnboardingStatus
}) {
  return (
    <span className={statusClass[status]}>
      {status}
    </span>
  )
}

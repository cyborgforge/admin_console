import type {
  OnboardingFormAssigned,
  OnboardingFormResponse,
} from "@/types/onboarding"

import { OnboardingStatusBadge } from "./status-badge"

export function OnboardingFormsTable({
  forms,
  responses,
  onSelect,
}: {
  forms: OnboardingFormAssigned[]
  responses: OnboardingFormResponse[]
  onSelect?: (form: OnboardingFormAssigned) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Form</th>
            <th>Status</th>
            <th>Due</th>
            <th>Responses</th>
          </tr>
        </thead>
        <tbody>
          {forms.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">
                No forms assigned
              </td>
            </tr>
          ) : (
            forms.map((form) => {
              const formResponses = responses.filter(
                (item) => item.form_assigned_id === form.id
              )
              const latestResponse = formResponses[0]
              const isApproved =
                form.status === "Approved" ||
                (form.status as string) === "Accepted" ||
                formResponses.some(
                  (r) =>
                    r.status === "Approved" ||
                    (r.status as string) === "Accepted"
                )
              const displayStatus = isApproved
                ? "Approved"
                : latestResponse?.status ?? form.status ?? "Pending"

              return (
                <tr
                  key={form.id}
                  onClick={() => onSelect?.(form)}
                  className={onSelect ? "cursor-pointer" : undefined}
                >
                  <td>{form.form?.form_name ?? form.form_id}</td>
                  <td>
                    <OnboardingStatusBadge status={displayStatus} />
                  </td>
                  <td className="quote-id">
                    {form.due_date
                      ? new Date(form.due_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{formResponses.length}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

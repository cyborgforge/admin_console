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
            <th>Version</th>
            <th>Status</th>
            <th>Due</th>
            <th>Responses</th>
          </tr>
        </thead>
        <tbody>
          {forms.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">
                No forms assigned
              </td>
            </tr>
          ) : (
            forms.map((form) => {
              const formResponses = responses
                .filter((item) => item.form_assigned_id === form.id)
                .sort((a, b) => b.version_number - a.version_number)

              const latest = formResponses[0]
              const displayStatus = latest?.status ?? form.status ?? "Pending"
              const versionText = latest ? `v${latest.version_number}` : "-"

              return (
                <tr
                  key={form.id}
                  onClick={() => onSelect?.(form)}
                  className={onSelect ? "cursor-pointer" : undefined}
                >
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {form.form?.form_name ?? form.form_id}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "var(--surface2)",
                        color: "var(--accent)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {versionText}
                    </span>
                  </td>
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


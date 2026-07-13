import type {
  OnboardingDocumentAssigned,
  OnboardingDocumentResponse,
} from "@/types/onboarding"

import { OnboardingStatusBadge } from "./status-badge"

export function OnboardingDocumentsTable({
  documents,
  responses,
}: {
  documents: OnboardingDocumentAssigned[]
  responses: OnboardingDocumentResponse[]
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Status</th>
            <th>Due</th>
            <th>Latest Submission</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">
                No documents assigned
              </td>
            </tr>
          ) : (
            documents.map((document) => {
              const latest = responses.find(
                (item) =>
                  item.document_assigned_id === document.id
              )

              return (
                <tr key={document.id}>
                  <td>
                    {document.document?.name ??
                      document.document_id}
                  </td>
                  <td>
                    <OnboardingStatusBadge
                      status={document.status}
                    />
                  </td>
                  <td className="quote-id">
                    {document.due_date
                      ? new Date(
                          document.due_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{latest?.document_link ?? "-"}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

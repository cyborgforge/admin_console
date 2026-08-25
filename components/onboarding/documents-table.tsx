import { FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

import type {
  OnboardingDocumentAssigned,
  OnboardingDocumentResponse,
} from "@/types/onboarding"

import { OnboardingStatusBadge } from "./status-badge"

export function OnboardingDocumentsTable({
  documents,
  responses,
  updatingResponseId,
  onResponseStatus,
}: {
  documents: OnboardingDocumentAssigned[]
  responses: OnboardingDocumentResponse[]
  updatingResponseId?: string | null
  onResponseStatus?: (
    responseId: string,
    status: "Approved" | "Rejected"
  ) => void
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">
                No documents assigned
              </td>
            </tr>
          ) : (
            documents.map((document) => {
              const docResponses = responses.filter(
                (item) => item.document_assigned_id === document.id
              )
              const latest = docResponses[0]
              const isApproved =
                document.status === "Approved" ||
                (document.status as string) === "Accepted" ||
                docResponses.some(
                  (r) =>
                    r.status === "Approved" ||
                    (r.status as string) === "Accepted"
                )
              const displayStatus = isApproved
                ? "Approved"
                : latest?.status ?? document.status ?? "Pending"

              return (
                <tr key={document.id}>
                  <td>
                    {document.document?.name ??
                      document.document_id}
                  </td>
                  <td>
                    <OnboardingStatusBadge
                      status={displayStatus}
                    />
                  </td>
                  <td className="quote-id">
                    {document.due_date
                      ? new Date(
                          document.due_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {latest?.document_link ? (
                      <a
                        href={latest.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "var(--accent)",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                        title="Open document"
                      >
                        <FileText size={15} />
                        <span>View Document</span>
                        <ExternalLink size={12} style={{ opacity: 0.7 }} />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {latest?.status === "Pending" && onResponseStatus ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Button
                          size="sm"
                          className="btn btn-primary"
                          disabled={updatingResponseId === latest.id}
                          onClick={() => onResponseStatus(latest.id, "Approved")}
                          style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="btn btn-ghost"
                          disabled={updatingResponseId === latest.id}
                          onClick={() => onResponseStatus(latest.id, "Rejected")}
                          style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

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
  onSelect,
}: {
  documents: OnboardingDocumentAssigned[]
  responses: OnboardingDocumentResponse[]
  onSelect?: (document: OnboardingDocumentAssigned) => void
}) {
  const handleOpenDocument = (
    e: React.MouseEvent,
    link: string | null | undefined
  ) => {
    e.stopPropagation()
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Version</th>
            <th>Status</th>
            <th>Due</th>
            <th>Document File</th>
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
              const docResponses = responses
                .filter((item) => item.document_assigned_id === document.id)
                .sort((a, b) => b.version_number - a.version_number)

              const latest = docResponses[0]
              const displayStatus = latest?.status ?? document.status ?? "Pending"
              const versionText = latest ? `v${latest.version_number}` : "-"
              const documentLink = latest?.document_link

              return (
                <tr
                  key={document.id}
                  onClick={() => onSelect?.(document)}
                  className={onSelect ? "cursor-pointer" : undefined}
                >
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {document.document?.name ?? document.document_id}
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
                    {document.due_date
                      ? new Date(document.due_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {documentLink ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="btn btn-ghost"
                        onClick={(e) => handleOpenDocument(e, documentLink)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          height: "28px",
                          fontSize: "12px",
                          padding: "0 10px",
                        }}
                      >
                        <FileText size={14} color="var(--accent)" />
                        <span>View Document</span>
                        <ExternalLink size={12} style={{ opacity: 0.6 }} />
                      </Button>
                    ) : latest ? (
                      <span style={{ fontSize: "12px", color: "var(--text3)", fontStyle: "italic" }}>
                        Submitted (No file link)
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text3)" }}>
                        -
                      </span>
                    )}
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


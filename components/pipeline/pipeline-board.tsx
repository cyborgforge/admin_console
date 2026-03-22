import type { Quotation, QuotationStatus } from "@/types/quotation"

const stages: QuotationStatus[] = ["draft", "review", "sent", "accepted", "expired"]

const labels: Record<QuotationStatus, string> = {
  draft: "Draft",
  review: "In Review",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
}

export function PipelineBoard({ quotations }: { quotations: Quotation[] }) {
  return (
    <div className="pipeline">
      {stages.map((stage) => {
        const items = quotations.filter((quote) => quote.status === stage)
        return (
          <div className="pipeline-col" key={stage}>
            <div className="pipeline-col-header">
              <div className="pipeline-col-title">{labels[stage]}</div>
              <div className="pipeline-count">{items.length}</div>
            </div>
            {items.map((quote) => (
              <div className="pipeline-card" key={quote.id}>
                <div className="pipeline-card-id">{quote.id}</div>
                <div className="pipeline-card-client">{quote.client}</div>
                <div className="pipeline-card-amount">Rs {quote.amount.toLocaleString("en-IN")}</div>
                <div className="pipeline-card-date">{quote.expiry}</div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

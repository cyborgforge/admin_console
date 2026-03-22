import type { Client } from "@/types/client"

function clientBadgeClass(status: Client["status"]) {
  return status === "active" ? "badge badge-accepted" : status === "prospect" ? "badge badge-review" : "badge badge-draft"
}

const labels: Record<Client["status"], string> = {
  active: "Active",
  prospect: "Prospect",
  churned: "Churned",
}

export function ClientCard({
  client,
  onClick,
}: {
  client: Client
  onClick?: () => void
}) {
  return (
    <div className="client-card" onClick={onClick}>
      <div className="client-card-header">
        <div className="client-card-avatar" style={{ backgroundColor: `${client.color}22`, color: client.color }}>
          {client.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>
        <span className={clientBadgeClass(client.status)}>{labels[client.status]}</span>
      </div>
      <div className="client-card-name">{client.name}</div>
      <div className="client-card-role">{client.role}</div>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px", marginTop: "10px" }}>{client.organization}</div>
      <div style={{ fontSize: "11.5px", color: "var(--text3)", marginBottom: "12px" }}>{client.industry} · {client.city}</div>
      <hr className="client-card-divider" />
      <div className="client-card-meta">
        <div>
          <div className="client-card-meta-label">Product</div>
          <div className="client-card-meta-val">{client.product}</div>
        </div>
        <div>
          <div className="client-card-meta-label">Quotes</div>
          <div className="client-card-meta-val">{client.quotes}</div>
        </div>
      </div>
      <div className="client-card-footer">
        <span className="amount" style={{ color: "var(--accent2)" }}>Rs {client.totalBilled.toLocaleString("en-IN")}</span>
        <span style={{ fontSize: "11.5px", color: "var(--text3)" }}>{client.since}</span>
      </div>
    </div>
  )
}

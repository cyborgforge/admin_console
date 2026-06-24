import type { Client } from "@/types/client"

function clientBadgeClass(status: Client["status"]) {
  return status === "active" ? "badge badge-accepted" : status === "prospect" ? "badge badge-review" : "badge badge-draft"
}

const labels: Record<Client["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  prospect: "Prospect",
}

export function ClientCard({
  client,
  onClick,
}: {
  client: Client
  onClick?: () => void
}) {
  console.log("ClientCard data:", client)
  return (
    // <div className="client-card" onClick={onClick}>
    <div className="client-card" >
      <div className="client-card-header">
        <div className="client-card-avatar" style={{ backgroundColor: `#1e40af22`, color: "#1e40af" }}>
          {client.company_name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>
        <span className={clientBadgeClass(client.status)}>{labels[client.status]}</span>
      </div>
      <div className="client-card-name">{client.company_name}</div>
      {/* <div className="client-card-role">{client.role}</div> */}
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px", marginTop: "10px" }}>{client.industry}</div>
      <div style={{ fontSize: "11.5px", color: "var(--text3)", marginBottom: "12px" }}>{client.industry} · {client.city}</div>
      <hr className="client-card-divider" />
       <div className="client-card-meta">
        <div>
          <div className="client-card-meta-label">Product</div>
          <div className="client-card-meta-val">None</div>
        </div>
        <div>
          <div className="client-card-meta-label">Quotes</div>
          <div className="client-card-meta-val">0</div>
        </div>
      </div>
      <div className="client-card-footer">
        {/* <span className="amount" style={{ color: "var(--accent2)" }}>Rs {client.totalBilled.toLocaleString("en-IN")}</span> */}
        <span style={{ fontSize: "11.5px", color: "var(--text3)" }}>0</span>
      </div>  
      
    </div>
  )
}

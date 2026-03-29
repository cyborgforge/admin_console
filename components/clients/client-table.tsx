import type { Client } from "@/types/client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function clientBadgeClass(status: Client["status"]) {
  return status === "active" ? "badge badge-accepted" : status === "prospect" ? "badge badge-review" : "badge badge-draft"
}

const labels: Record<Client["status"], string> = {
  active: "Active",
  prospect: "Prospect",
  churned: "Churned",
}

export function ClientTable({
  clients,
  onRowClick,
}: {
  clients: Client[]
  onRowClick?: (client: Client) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total Billed</TableHead>
          <TableHead>Quotes</TableHead>
          <TableHead>Since</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow
            key={client.id}
            className="cursor-pointer"
            onClick={() => onRowClick?.(client)}
          >
            <TableCell>
              <div className="client-cell">
                <div className="client-avatar" style={{ backgroundColor: `${client.color}22`, color: client.color }}>
                  {client.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="client-name">{client.name}</div>
                  <div className="client-org">{client.organization}</div>
                </div>
              </div>
            </TableCell>
            <TableCell style={{ color: "var(--text2)" }}>{client.product}</TableCell>
            <TableCell>
              <span className={clientBadgeClass(client.status)}>{labels[client.status]}</span>
            </TableCell>
            <TableCell>
              <span className="amount" style={{ color: "var(--accent2)" }}>Rs {client.totalBilled.toLocaleString("en-IN")}</span>
            </TableCell>
            <TableCell style={{ color: "var(--text2)" }}>{client.quotes}</TableCell>
            <TableCell style={{ color: "var(--text3)", fontSize: "12.5px" }}>{client.since}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

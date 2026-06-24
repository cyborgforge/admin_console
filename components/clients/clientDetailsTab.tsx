import type { Client } from "@/types/client"

interface ClientDetailsTabProps {
  client: Client | null
}

export default function ClientDetailsTab({
  client,
}: ClientDetailsTabProps) {
  
    if(!client) {
        <div>No client found</div>
    }
    else{
    return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2, minmax(0, 1fr))",
        gap: "16px",
      }}
    >
      {/* Company Profile */}
      <div className="stat-card">
        <div className="section-heading">
          Company Profile
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Company Name
          </div>
          <div className="info-row-val">
            {client.company_name}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Industry
          </div>
          <div className="info-row-val">
            {client.industry ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Company Size
          </div>
          <div className="info-row-val">
            {client.company_size ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            GST Number
          </div>
          <div className="info-row-val">
            {client.gst_number ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Website
          </div>
          <div className="info-row-val">
            {client.website ? (
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  color:
                    "var(--accent)",
                }}
              >
                {client.website}
              </a>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="stat-card">
        <div className="section-heading">
          Contact Information
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Email
          </div>
          <div className="info-row-val">
            {client.email ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Phone
          </div>
          <div className="info-row-val">
            {client.phone ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Status
          </div>

          <div className="info-row-val">
            <span
              className={
                client.status ===
                "active"
                  ? "badge badge-accepted"
                  : client.status ===
                    "prospect"
                  ? "badge badge-review"
                  : "badge badge-draft"
              }
            >
              {client.status}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="stat-card">
        <div className="section-heading">
          Address
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Address
          </div>

          <div className="info-row-val">
            {client.address_line_1 ??
              "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            City
          </div>

          <div className="info-row-val">
            {client.city ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            State
          </div>

          <div className="info-row-val">
            {client.state ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Country
          </div>

          <div className="info-row-val">
            {client.country ?? "—"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Postal Code
          </div>

          <div className="info-row-val">
            {client.postal_code ??
              "—"}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="stat-card">
        <div className="section-heading">
          System Information
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Client ID
          </div>

          <div
            className="info-row-val"
            style={{
              fontFamily:
                "monospace",
            }}
          >
            {client.id}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Created At
          </div>

          <div className="info-row-val">
            {new Date(
              client.createdAt
            ).toLocaleString()}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Last Updated
          </div>

          <div className="info-row-val">
            {new Date(
              client.updatedAt
            ).toLocaleString()}
          </div>
        </div>

        <div className="info-row">
          <div className="info-row-label">
            Created By
          </div>

          <div className="info-row-val">
            {client.created_by ??
              "—"}
          </div>
        </div>
      </div>
    </div>
  )
}}
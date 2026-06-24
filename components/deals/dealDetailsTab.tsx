"use client"

import type { Deal } from "@/types/deals"
import type { DealProductModule } from "@/types/deal-products/module"
import type { DealProductService } from "@/types/deal-products/service"

interface DealDetailsTabProps {
  deal: Deal | null
  modules: DealProductModule[] | []
  services: DealProductService[] | []
}

export default function DealDetailsTab({
  deal,
  modules,
  services,
}: DealDetailsTabProps) {
    console.log("entered DealDetailsTab")
    console.log("DealDetailsTab deal:", deal)
    console.log("DealDetailsTab modules:", modules)
    console.log("DealDetailsTab services:", services)
    if(deal === null) {
        return (
            <h1>No deal data available.</h1>
        )
    }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Client Requirement */}
      <div className="stat-card">
        <div className="section-heading">
          Client Requirement / Interest
        </div>

        <div
          style={{
            minHeight: "140px",
            color: "var(--text2)",
            lineHeight: 1.7,
            fontSize: "14px",
          }}
        >
          { deal.client_requirement || "No requirements recorded." }
        </div>
      </div>

      {/* Offering Summary */}
      <div className="stat-card">
        <div className="section-heading">
          Our Offering Summary
        </div>

        <div
          style={{
            minHeight: "140px",
            color: "var(--text2)",
            lineHeight: 1.7,
            fontSize: "14px",
          }}
        >
          <ul
            style={{
              paddingLeft: "18px",
              margin: 0,
            }}
          >
             <li>
              We offer, {deal.offering_summary || "No offering summary recorded."}
            </li>
            <li>
              {modules?.length ?? 0} Product Modules
            </li>
           

            <li>
              {services?.length ?? 0} Services
            </li>

            <li>
              Estimated Deal Value: ₹{" "}
              {(deal.expected_value ?? 0).toLocaleString(
                "en-IN"
              )}
            </li>

            <li>
              Current Stage: {deal.stage}
            </li>
          </ul>
        </div>
      </div>

      {/* Deal Items */}
      <div className="stat-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div className="section-heading">
            Deal Items
          </div>

          <button className="btn btn-primary">
            Add Item
          </button>
        </div>

        {/* Product Modules */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontWeight: 600,
              marginBottom: "12px",
              color: "var(--text)",
            }}
          >
            Product Modules
          </div>

          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th>MODULE</th>
                  <th>QTY</th>
                  <th>UNIT PRICE</th>
                  <th>DISCOUNT %</th>
                  <th>TAX %</th>
                  <th>LINE TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {modules?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="lp-empty"
                    >
                      No product modules added.
                    </td>
                  </tr>
                ) : (
                  modules.map((module) => {
                    const subtotal =
                      module.quantity *
                      module.deal_unit_price

                    const discounted =
                      subtotal *
                      (1 -
                        (module.discount_percent ??
                          0) /
                          100)

                    const total =
                      discounted *
                      (1 +
                        (module.deal_tax_percentage ??
                          0) /
                          100)

                    return (
                      <tr
                        key={module.id}
                        className="lp-row"
                      >
                        <td>
                          {
                            module.product_module
                              ?.product_name
                          }
                        </td>

                        <td>
                          {module.quantity}
                        </td>

                        <td>
                          ₹{" "}
                          {module.deal_unit_price.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          {module.discount_percent ??
                            0}
                          %
                        </td>

                        <td>
                          {module.deal_tax_percentage ??
                            0}
                          %
                        </td>

                        <td>
                          ₹{" "}
                          {total.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Services */}
        <div>
          <div
            style={{
              fontWeight: 600,
              marginBottom: "12px",
              color: "var(--text)",
            }}
          >
            Services
          </div>

          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th>SERVICE</th>
                  <th>QTY</th>
                  <th>UNIT PRICE</th>
                  <th>DISCOUNT %</th>
                  <th>TAX %</th>
                  <th>LINE TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="lp-empty"
                    >
                      No services added.
                    </td>
                  </tr>
                ) : (
                  services.map((service) => {
                    const subtotal =
                      service.quantity *
                      service.deal_unit_price

                    const discounted =
                      subtotal *
                      (1 -
                        (service.discount_percent ??
                          0) /
                          100)

                    const total =
                      discounted *
                      (1 +
                        (service.deal_tax_percentage ??
                          0) /
                          100)

                    return (
                      <tr
                        key={service.id}
                        className="lp-row"
                      >
                        <td>
                          {
                            service.product_service
                              ?.service_name
                          }
                        </td>

                        <td>
                          {service.quantity}
                        </td>

                        <td>
                          ₹{" "}
                          {service.deal_unit_price.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          {service.discount_percent ??
                            0}
                          %
                        </td>

                        <td>
                          {service.deal_tax_percentage ??
                            0}
                          %
                        </td>

                        <td>
                          ₹{" "}
                          {total.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
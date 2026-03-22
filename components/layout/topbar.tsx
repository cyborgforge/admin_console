"use client"

import { usePathname } from "next/navigation"
import { Download, Eye, Link2, Plus, Wallet, X } from "lucide-react"
import { toast } from "sonner"

import { NewQuoteDialog } from "../quotations/new-quote-dialog"
import { AddClientDialog } from "../clients/add-client-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/quotations": "Quotations",
  "/clients": "Clients",
  "/invoices": "Invoices",
  "/subscriptions": "Subscriptions",
  "/accounts": "Accounts",
  "/pipeline": "Pipeline",
}

export function Topbar() {
  const pathname = usePathname()
  const title = titles[pathname] ?? "Dashboard"
  const isClients = pathname.startsWith("/clients")
  const isQuotations = pathname.startsWith("/quotations")
  const isInvoices = pathname.startsWith("/invoices")
  const isSubscriptions = pathname.startsWith("/subscriptions")
  const isAccounts = pathname.startsWith("/accounts")

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        {isQuotations ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button className="btn btn-ghost btn-sm" variant="outline">
                <Eye size={13} />
                Preview PDF
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="panel pdf-preview-sheet" showCloseButton={false}>
              <SheetHeader className="panel-header pdf-preview-header">
                <div>
                  <SheetTitle className="panel-title text-(--text)">Quote preview</SheetTitle>
                  <SheetDescription className="panel-subtitle">QT-2025-043 · MedPlus Pharma</SheetDescription>
                </div>
                <SheetClose asChild>
                  <button type="button" className="close-btn" aria-label="Close quote preview">
                    <X size={14} />
                  </button>
                </SheetClose>
              </SheetHeader>

              <div className="panel-body pdf-preview-body">
                <div className="preview-paper preview-paper-tight">
                  <div className="preview-head">
                    <div>
                      <div className="preview-brand">FluxWorks</div>
                      <div className="preview-sub">Software Solutions</div>
                    </div>
                    <div>
                      <div className="preview-title">QUOTATION</div>
                      <div className="preview-sub" style={{ textAlign: "right" }}>QT-2025-043</div>
                    </div>
                  </div>
                  <div className="preview-grid">
                    <div>
                      <div className="preview-label">Bill to</div>
                      <div style={{ fontWeight: 600 }}>MedPlus Pharma Pvt Ltd</div>
                      <div style={{ color: "#555", fontSize: "12.5px" }}>billing@medplus.in</div>
                      <div style={{ color: "#555", marginTop: "2px" }}>+91 98765 43210</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="preview-label">Details</div>
                      <div style={{ color: "#555", fontSize: "12.5px" }}>Date: Mar 19, 2025</div>
                      <div style={{ color: "#555", fontSize: "12.5px" }}>Expiry: Apr 19, 2025</div>
                      <div style={{ color: "#10b981", marginTop: "4px", fontWeight: 600 }}>Valid for 30 days</div>
                    </div>
                  </div>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Pharmacy POS &amp; Billing</td>
                        <td>1</td>
                        <td>₹18,000</td>
                      </tr>
                      <tr>
                        <td>Inventory Management</td>
                        <td>1</td>
                        <td>₹14,000</td>
                      </tr>
                      <tr>
                        <td>Online Ordering Portal</td>
                        <td>1</td>
                        <td>₹12,000</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="preview-total-wrap">
                    <div className="preview-total-box">
                      <div className="preview-total-row"><span>Subtotal</span><span>₹44,000</span></div>
                      <div className="preview-total-row"><span>GST (18%)</span><span>₹7,920</span></div>
                      <div className="preview-total-row total"><span>Total</span><span>₹51,920</span></div>
                    </div>
                  </div>
                  <div className="preview-footnote">
                    This quotation is valid for 30 days from the date of issue. Prices are subject to change upon renewal.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    className="btn btn-ghost"
                    variant="outline"
                    onClick={() => toast.success("Share link copied")}
                    style={{ flex: 1 }}
                  >
                    <Link2 size={13} />
                    Copy share link
                  </Button>
                  <Button
                    className="btn btn-primary"
                    onClick={() => toast.success("PDF download started")}
                    style={{ flex: 1 }}
                  >
                    <Download size={13} />
                    Download PDF
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : null}

        {isQuotations ? <NewQuoteDialog triggerClassName="btn btn-primary" /> : null}
        {isClients ? <AddClientDialog triggerClassName="btn btn-primary" /> : null}
        {isInvoices ? (
          <Button className="btn btn-primary" onClick={() => toast.success("New invoice flow coming next")}> 
            <Plus size={13} />
            New Invoice
          </Button>
        ) : null}
        {isSubscriptions ? (
          <Button className="btn btn-primary" onClick={() => toast.success("Add subscription flow coming next")}>
            <Plus size={13} />
            Add Subscription
          </Button>
        ) : null}
        {isAccounts ? (
          <Button className="btn btn-ghost" variant="outline" onClick={() => toast.success("Record payment flow coming next")}>
            <Wallet size={13} />
            Record Payment
          </Button>
        ) : null}
      </div>
    </header>
  )
}

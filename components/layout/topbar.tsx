"use client"

import { usePathname } from "next/navigation"

import { NewQuoteDialog } from "../quotations/new-quote-dialog"
import { AddClientDialog } from "../clients/add-client-dialog"
import { NewInvoiceDialog } from "../invoices/new-invoice-dialog"
import { AddSubscriptionDialog } from "../subscriptions/add-subscription-dialog"
import { RecordPaymentDialog } from "../accounts/record-payment-dialog"

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
        {isQuotations ? <NewQuoteDialog triggerClassName="btn btn-primary" /> : null}
        {isClients ? <AddClientDialog triggerClassName="btn btn-primary" /> : null}
        {isInvoices ? <NewInvoiceDialog triggerClassName="btn btn-primary" /> : null}
        {isSubscriptions ? <AddSubscriptionDialog triggerClassName="btn btn-primary" /> : null}
        {isAccounts ? <RecordPaymentDialog triggerClassName="btn btn-ghost" /> : null}
      </div>
    </header>
  )
}

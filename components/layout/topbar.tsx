"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { NewQuoteDialog } from "../quotations/new-quote-dialog"
import { NewInvoiceDialog } from "../invoices/new-invoice-dialog"
import { AddSubscriptionDialog } from "../subscriptions/add-subscription-dialog"
import { RecordPaymentDialog } from "../accounts/record-payment-dialog"
import { AddClientDialog } from "../clients/add-client-dialog"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/quotations": "Quotations",
  "/leads": "Leads",
  "/clients": "Clients",
  "/invoices": "Invoices",
  "/subscriptions": "Subscriptions",
  "/accounts": "Accounts",
  "/pipeline": "Pipeline",
  "/ProductManagement": "Product Management",
}

export function Topbar() {
  const pathname = usePathname()
  const isClients = pathname === "/clients"
  const isQuotations = pathname.startsWith("/quotations")
  const isInvoices = pathname.startsWith("/invoices")
  const isSubscriptions = pathname.startsWith("/subscriptions")
  const isAccounts = pathname.startsWith("/accounts")
  const isLeads = pathname.startsWith("/leads")

  const [dynamicTitle, setDynamicTitle] = useState<string>("")
  const match = pathname.match(/^\/clients\/([^/]+)$/)
  const clientId = match ? match[1] : null

  useEffect(() => {
    if (pathname.match(/^\/clients\/[^/]+\/editing$/)) {
      setDynamicTitle("Edit Client")
    } else if (clientId) {
      setDynamicTitle("Client Details")
    } else {
      const mapped = titles[pathname]
      if (mapped) {
        setDynamicTitle(mapped)
      } else {
        const segments = pathname.split("/").filter(Boolean)
        if (segments.length === 0) {
          setDynamicTitle("Dashboard")
        } else {
          const lastSegment = segments[segments.length - 1]
          const words = lastSegment
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]+/g, " ")
            .trim()
          const capitalized = words
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
          setDynamicTitle(capitalized)
        }
      }
    }
  }, [pathname, clientId])

  return (
    <header className="topbar">
      <div className="topbar-title">{dynamicTitle}</div>
      <div className="topbar-right">
        {isQuotations ? <NewQuoteDialog triggerClassName="btn btn-primary" /> : null}
        {isClients ? <AddClientDialog triggerClassName="btn btn-primary" /> : null}
        {isInvoices ? <NewInvoiceDialog triggerClassName="btn btn-primary" /> : null}
        {isSubscriptions ? <AddSubscriptionDialog triggerClassName="btn btn-primary" /> : null}
        {isAccounts ? <RecordPaymentDialog triggerClassName="btn btn-ghost" /> : null}
        {/* {isLeads ? <RecordPaymentDialog triggerClassName="btn btn-ghost" /> : null} */}
        
      </div>
    </header>
  )
}


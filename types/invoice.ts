export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "partial"

export type InvoiceProduct = "pharmacy" | "clinic" | "retail"

export type InvoiceLineItem = {
  description: string
  quantity: number
  rate: number
}

export type Invoice = {
  id: string
  client: string
  org: string
  quoteRef: string
  product: InvoiceProduct
  amount: number
  gst: number
  total: number
  status: InvoiceStatus
  due: string
  color: string
  gstin?: string
  email?: string
  gstRate?: number
  taxType?: "igst" | "cgst_sgst"
  discount?: number
  paymentTerms?: string
  lineItems?: InvoiceLineItem[]
}

export type CreateInvoicePayload = {
  client: string
  org?: string
  quoteRef?: string
  product?: InvoiceProduct
  status?: InvoiceStatus
  due?: string
  color?: string
  gstin?: string
  email?: string
  gstRate?: number
  taxType?: "igst" | "cgst_sgst"
  discount?: number
  paymentTerms?: string
  lineItems?: InvoiceLineItem[]
}

export type UpdateInvoicePayload = {
  id: string
  client?: string
  org?: string
  quoteRef?: string
  product?: InvoiceProduct
  status?: InvoiceStatus
  due?: string
  color?: string
  gstin?: string
  email?: string
  gstRate?: number
  taxType?: "igst" | "cgst_sgst"
  discount?: number
  paymentTerms?: string
  lineItems?: InvoiceLineItem[]
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "expired" | "review"

export type Quotation = {
  id: string
  client: string
  organization: string
  email?: string
  phone?: string
  product: string
  amount: number
  status: QuotationStatus
  expiry: string
  color: string
  createdAt?: string
  lineItems?: QuotationLineItem[]
  discount?: number
  notes?: string
}

export type QuotationLineItem = {
  name: string
  quantity: number
  unitPrice: number
}

export type CreateQuotationPayload = {
  client: string
  organization: string
  email?: string
  phone?: string
  product: string
  status?: QuotationStatus
  expiry?: string
  color?: string
  amount?: number
  discount?: number
  lineItems?: QuotationLineItem[]
  notes?: string
}

export type UpdateQuotationPayload = {
  id: string
  client?: string
  organization?: string
  email?: string
  phone?: string
  product?: string
  color?: string
  status?: QuotationStatus
  expiry?: string
  amount?: number
  discount?: number
  lineItems?: QuotationLineItem[]
  notes?: string
}

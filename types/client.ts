export type ClientStatus = "active" | "prospect" | "churned"

export type Client = {
  id: string
  name: string
  role: string
  organization: string
  industry: string
  city: string
  email: string
  phone: string
  status: ClientStatus
  product: string
  totalBilled: number
  quotes: number
  since: string
  color: string
  gst: string
  notes: string
}

export type CreateClientPayload = {
  name: string
  role: string
  organization: string
  industry: string
  city: string
  email: string
  phone: string
  status?: ClientStatus
  product: string
  color?: string
  gst?: string
  notes?: string
}

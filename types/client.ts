export type ClientStatus = "active" | "inactive" | "prospect"

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
  companyName?: string
  company_name?: string
  name?: string
  role?: string
  organization?: string
  industry?: string
  website?: string
  gstNumber?: string
  gst_number?: string
  companySize?: string
  company_size?: string
  email?: string
  phone?: string
  addressLine1?: string
  address_line_1?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  postal_code?: string
  status?: ClientStatus
  product?: string
  color?: string
  gst?: string
  notes?: string
}

export type UpdateClientPayload = {
  id: string
  companyName?: string
  company_name?: string
  name?: string
  role?: string
  organization?: string
  industry?: string
  website?: string
  gstNumber?: string
  gst_number?: string
  companySize?: string
  company_size?: string
  email?: string
  phone?: string
  addressLine1?: string
  address_line_1?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  postal_code?: string
  status?: ClientStatus
  product?: string
  color?: string
  gst?: string
  notes?: string
}

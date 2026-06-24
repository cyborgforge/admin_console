export type ClientStatus = "active" | "inactive" | "prospect"

// export type Client = {
//   id: string
//   name: string
//   role: string
//   organization: string
//   industry: string
//   city: string
//   email: string
//   phone: string
//   status: ClientStatus
//   product: string
//   totalBilled: number
//   quotes: number
//   since: string
//   color: string
//   gst: string
//   notes: string
// }

export type Client = {
 id: string

  company_name: string
  industry: string | null
  website: string | null
  gst_number: string | null
  company_size: string | null

  email: string | null
  phone: string | null

  address_line_1: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null

  status: ClientStatus

  createdAt: string
  updatedAt: string

  created_by: string | null

  color: string
  notes:string | null
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

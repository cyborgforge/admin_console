export interface Contact {
  id: string

  name: string

  designation: string | null
  department: string | null

  email: string | null

  mobile: string | null
  phone: string | null

  linkedin: string | null

  client_id: string
  branch_id: string

  created_at: string
  updated_at: string

  created_by: string | null

   clients?: {
    id: string
    company_name: string
  } | null
}

export interface CreateContactPayload {
  name: string

  client_id: string
  branch_id: string

  designation?: string
  department?: string

  email?: string

  mobile?: string
  phone?: string

  linkedin?: string
}

export interface UpdateContactPayload {
  name?: string

  designation?: string | null
  department?: string | null

  email?: string | null

  mobile?: string | null
  phone?: string | null

  linkedin?: string | null
}

export type ContactDraft = {
  name: string

  designation: string
  department: string

  email: string

  mobile: string
  phone: string

  linkedin: string

  client_id: string
  branch_id: string
}

export const DEFAULT_CONTACT_DRAFT: ContactDraft = {
  name: "",

  designation: "",
  department: "",

  email: "",

  mobile: "",
  phone: "",

  linkedin: "",

  client_id: "",
  branch_id: "",
}
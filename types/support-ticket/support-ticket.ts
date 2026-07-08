export type SupportTicketPriority =
  | "low"
  | "medium"
  | "high"
  | "critical"

export type SupportTicketCategory =
  | "technical"
  | "bug"
  | "feature_request"
  | "billing"
  | "account"
  | "onboarding"
  | "other"

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_for_user"
  | "resolved"
  | "closed"
  | "rejected"

export type SupportTicketSource =
  | "portal"
  | "email"
  | "phone"
  | "chat"
  | "system"
  | "other"

export interface SupportTicketAttachment {
  name: string
  link: string
}

export interface SupportTicket {
  id: string

  user_id: string
  product_id: string

  subject: string

  problem_statement: string

  priority: SupportTicketPriority

  category: SupportTicketCategory

  status: SupportTicketStatus

  assigned_to: string | null

  source: SupportTicketSource

  created_at: string | null
  updated_at: string | null

  resolved_at: string | null
  closed_at: string | null

  note: string | null

  attachments_json_array: SupportTicketAttachment[]

  user?: {
    id: string
    name: string
  }

  product?: {
    id: string
    name: string
  }

  assignee?: {
    id: string
    name: string
  }
}

export interface CreateSupportTicketPayload {
  user_id: string

  product_id: string

  subject: string

  problem_statement: string

  priority?: SupportTicketPriority

  category: SupportTicketCategory

  assigned_to?: string

  source?: SupportTicketSource

  note?: string

  attachments_json_array?: SupportTicketAttachment[]
}

export interface UpdateSupportTicketPayload {
  subject?: string

  problem_statement?: string

  priority?: SupportTicketPriority

  category?: SupportTicketCategory

  status?: SupportTicketStatus

  assigned_to?: string | null

  source?: SupportTicketSource

  resolved_at?: string | null

  closed_at?: string | null

  note?: string | null

  attachments_json_array?: SupportTicketAttachment[]
}

export type SupportTicketDraft = {
  user_id: string

  product_id: string

  subject: string

  problem_statement: string

  priority: SupportTicketPriority

  category: SupportTicketCategory

  assigned_to: string

  source: SupportTicketSource

  note: string

  attachments_json_array: SupportTicketAttachment[]
}

export const DEFAULT_SUPPORT_TICKET_DRAFT: SupportTicketDraft = {
  user_id: "",

  product_id: "",

  subject: "",

  problem_statement: "",

  priority: "medium",

  category: "technical",

  assigned_to: "",

  source: "portal",

  note: "",

  attachments_json_array: [],
}

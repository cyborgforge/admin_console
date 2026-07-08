// ─── Enum Types (match backend exactly) ────────────────────────────────────

export type SupportTicketPriority = "low" | "medium" | "high" | "critical"

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

export type SupportTicketSource = "portal" | "email" | "phone" | "chat" | "system" | "other"

export type TicketMessageSenderType = "user" | "support_staff" | "system"

// ─── Attachment ─────────────────────────────────────────────────────────────

export interface Attachment {
  name: string
  link: string
}

// ─── Ticket (matches SupportTicket backend type) ────────────────────────────

export interface Ticket {
  id: string

  user_id: string
  product_id: string

  subject: string
  problem_statement: string

  priority: SupportTicketPriority
  category: SupportTicketCategory
  status: SupportTicketStatus
  source: SupportTicketSource

  assigned_to: string | null

  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
  closed_at: string | null

  note: string | null
  attachments_json_array: Attachment[]

  user?: { id: string; name: string }
  product?: { id: string; name: string }
  assignee?: { id: string; name: string }
}

// ─── Message (matches TicketMessage backend type) ───────────────────────────

export interface Message {
  id: string

  ticket_id: string

  sender_type: TicketMessageSenderType
  sender_id: string | null

  content: string

  created_at: string | null
  updated_at: string | null
  is_edited: boolean | null

  attachments_json_array: Attachment[]

  sender?: { id: string; name: string }
}

// ─── InternalNote (matches SupportTicketInternalNote backend type) ──────────

export interface InternalNote {
  id: string

  ticket_id: string

  content: string

  created_at: string | null
  updated_at: string | null

  created_by: string

  creator?: { id: string; name: string }
}

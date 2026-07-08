export interface SupportTicketFeedback {
  id: string

  ticket_id: string

  feedback_template_id: string | null

  feedback_content: Record<string, any>

  submitted_at: string | null

  submitted_by: string

  feedback_template?: {
    id: string
    name: string
  } | null
}

export interface CreateSupportTicketFeedbackPayload {
  ticket_id: string

  feedback_template_id?: string

  feedback_content: Record<string, any>

  submitted_by: string
}

export interface UpdateSupportTicketFeedbackPayload {
  feedback_template_id?: string | null

  feedback_content?: Record<string, any>
}

export type SupportTicketFeedbackDraft = {
  ticket_id: string

  feedback_template_id: string

  feedback_content: Record<string, any>

  submitted_by: string
}

export const DEFAULT_SUPPORT_TICKET_FEEDBACK_DRAFT: SupportTicketFeedbackDraft = {
  ticket_id: "",

  feedback_template_id: "",

  feedback_content: {},

  submitted_by: "",
}

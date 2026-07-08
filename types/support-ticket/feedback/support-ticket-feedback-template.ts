
export interface SupportTicketFeedbackTemplate {
  id: string

  name: string

  description: string | null

  is_active: boolean | null

  created_at: string | null
  updated_at: string | null
}

export interface CreateSupportTicketFeedbackTemplatePayload {
  name: string

  description?: string

  is_active?: boolean
}

export interface UpdateSupportTicketFeedbackTemplatePayload {
  name?: string

  description?: string | null

  is_active?: boolean
}

export type SupportTicketFeedbackTemplateDraft = {
  name: string

  description: string

  is_active: boolean
}

export const DEFAULT_SUPPORT_TICKET_FEEDBACK_TEMPLATE_DRAFT: SupportTicketFeedbackTemplateDraft = {
  name: "",

  description: "",

  is_active: true,
}

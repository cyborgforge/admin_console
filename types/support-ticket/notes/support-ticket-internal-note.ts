export interface SupportTicketInternalNote {
  id: string

  ticket_id: string

  content: string

  created_at: string | null
  updated_at: string | null

  created_by: string

  creator?: {
    id: string
    name: string
  }
}

export interface CreateSupportTicketInternalNotePayload {
  ticket_id: string

  content: string

  created_by: string
}

export interface UpdateSupportTicketInternalNotePayload {
  content?: string
}

export type SupportTicketInternalNoteDraft = {
  ticket_id: string

  content: string

  created_by: string
}

export const DEFAULT_SUPPORT_TICKET_INTERNAL_NOTE_DRAFT: SupportTicketInternalNoteDraft = {
  ticket_id: "",

  content: "",

  created_by: "",
}

export type TicketMessageSenderType =
  | "user"
  | "support_staff"
  | "system"

export interface TicketMessageAttachment {
  name: string
  link: string
}

export interface TicketMessage {
  id: string

  ticket_id: string

  sender_type: TicketMessageSenderType

  sender_id: string | null

  content: string

  created_at: string | null
  updated_at: string | null

  is_edited: boolean | null

  attachments_json_array: TicketMessageAttachment[]

  sender?: {
    id: string
    name: string
  }
}

export interface CreateTicketMessagePayload {
  ticket_id: string

  sender_type: TicketMessageSenderType

  sender_id?: string

  content: string

  attachments_json_array?: TicketMessageAttachment[]
}

export interface UpdateTicketMessagePayload {
  content?: string

  is_edited?: boolean

  attachments_json_array?: TicketMessageAttachment[]
}

export type TicketMessageDraft = {
  ticket_id: string

  sender_type: TicketMessageSenderType

  sender_id: string

  content: string

  attachments_json_array: TicketMessageAttachment[]
}

export const DEFAULT_TICKET_MESSAGE_DRAFT: TicketMessageDraft = {
  ticket_id: "",

  sender_type: "user",

  sender_id: "",

  content: "",

  attachments_json_array: [],
}
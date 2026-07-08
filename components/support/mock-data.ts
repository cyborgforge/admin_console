/**
 * Support API utilities
 *
 * Replaces the missing @/app/api/support/supportApi module.
 * All functions call the implemented Next.js API routes with the
 * Supabase Bearer token obtained from the browser session.
 */

import { getSupabaseClient } from "@/lib/supabaseClient"
import type {
  Ticket,
  Message,
  InternalNote,
  SupportTicketStatus,
} from "./types"

// ─── Auth Helper ─────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── Support Tickets ─────────────────────────────────────────────────────────

/**
 * GET /api/support-tickets
 * Returns all support tickets ordered by created_at desc.
 */
export async function getSupportTickets(): Promise<Ticket[]> {
  const data = await fetchWithAuth<{ supportTickets: Ticket[] }>("/api/support-tickets")
  return data.supportTickets ?? []
}

/**
 * GET /api/support-tickets/:ticketID
 * Returns a single support ticket by ID.
 */
export async function getSupportTicket(id: string): Promise<Ticket> {
  const data = await fetchWithAuth<{ supportTicket: Ticket }>(`/api/support-tickets/${id}`)
  return data.supportTicket
}

export interface CreateTicketPayload {
  user_id: string
  product_id: string
  subject: string
  problem_statement: string
  priority?: Ticket["priority"]
  category: Ticket["category"]
  source?: Ticket["source"]
  assigned_to?: string
  note?: string
}

/**
 * POST /api/support-tickets
 * Creates a new support ticket.
 */
export async function createSupportTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const data = await fetchWithAuth<{ supportTicket: Ticket }>("/api/support-tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return data.supportTicket
}

/**
 * PUT /api/support-tickets/:ticketID/status
 * Updates the status of a support ticket.
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<Ticket> {
  const data = await fetchWithAuth<{ supportTicket: Ticket }>(
    `/api/support-tickets/${ticketId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  )
  return data.supportTicket
}

/**
 * PUT /api/support-tickets/:ticketID
 * Updates general fields of a support ticket.
 */
export async function updateSupportTicket(
  ticketId: string,
  payload: Partial<Omit<Ticket, "id" | "user_id" | "product_id" | "created_at">>
): Promise<Ticket> {
  const data = await fetchWithAuth<{ supportTicket: Ticket }>(
    `/api/support-tickets/${ticketId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  )
  return data.supportTicket
}

/**
 * PUT /api/support-tickets/:ticketID/assignee
 * Updates the assignee of a support ticket.
 */
export async function updateSupportTicketAssignee(
  ticketId: string,
  assignedTo: string | null
): Promise<Ticket> {
  const data = await fetchWithAuth<{ supportTicket: Ticket }>(
    `/api/support-tickets/${ticketId}/assignee`,
    {
      method: "PUT",
      body: JSON.stringify({ assigned_to: assignedTo }),
    }
  )
  return data.supportTicket
}

/**
 * DELETE /api/support-tickets/:ticketID
 * Deletes a support ticket.
 */
export async function deleteSupportTicket(ticketId: string): Promise<void> {
  await fetchWithAuth<{ success: boolean }>(`/api/support-tickets/${ticketId}`, {
    method: "DELETE",
  })
}

// ─── Ticket Messages ─────────────────────────────────────────────────────────

/**
 * GET /api/support-tickets/:ticketID/messages
 * Returns all messages for a ticket ordered by created_at asc.
 */
export async function getSupportTicketMessages(ticketId: string): Promise<Message[]> {
  const data = await fetchWithAuth<{ ticketMessages: Message[] }>(
    `/api/support-tickets/${ticketId}/messages`
  )
  return data.ticketMessages ?? []
}

export interface CreateMessagePayload {
  sender_type: Message["sender_type"]
  sender_id?: string
  content: string
  attachments_json_array?: Message["attachments_json_array"]
}

/**
 * POST /api/support-tickets/:ticketID/messages
 * Creates a new message on a ticket.
 */
export async function createSupportTicketMessage(
  ticketId: string,
  payload: CreateMessagePayload
): Promise<Message> {
  const data = await fetchWithAuth<{ ticketMessage: Message }>(
    `/api/support-tickets/${ticketId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        ticket_id: ticketId,
        ...payload,
      }),
    }
  )
  return data.ticketMessage
}

// ─── Internal Notes ───────────────────────────────────────────────────────────

/**
 * GET /api/support-tickets/:ticketID/internal-notes
 * Returns all internal notes for a ticket ordered by created_at asc.
 */
export async function getSupportTicketInternalNotes(ticketId: string): Promise<InternalNote[]> {
  const data = await fetchWithAuth<{ internalNotes: InternalNote[] }>(
    `/api/support-tickets/${ticketId}/internal-notes`
  )
  return data.internalNotes ?? []
}

export interface CreateInternalNotePayload {
  content: string
  created_by: string
}

/**
 * POST /api/support-tickets/:ticketID/internal-notes
 * Creates a new internal note on a ticket.
 */
export async function createSupportTicketInternalNote(
  ticketId: string,
  payload: CreateInternalNotePayload
): Promise<InternalNote> {
  const data = await fetchWithAuth<{ internalNote: InternalNote }>(
    `/api/support-tickets/${ticketId}/internal-notes`,
    {
      method: "POST",
      body: JSON.stringify({
        ticket_id: ticketId,
        ...payload,
      }),
    }
  )
  return data.internalNote
}

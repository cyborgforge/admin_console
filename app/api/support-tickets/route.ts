import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

import type {
  CreateSupportTicketPayload,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketSource,
} from "@/types/support-ticket/support-ticket"

const SUPPORT_TICKETS_TABLE =
  process.env.SUPABASE_SUPPORT_TICKETS_TABLE ??
  "support_tickets"

type SupportTicketPayload =
  CreateSupportTicketPayload

function isSupportTicketPriority(
  value: unknown
): value is SupportTicketPriority {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  )
}

function isSupportTicketCategory(
  value: unknown
): value is SupportTicketCategory {
  return (
    value === "technical" ||
    value === "bug" ||
    value === "feature_request" ||
    value === "billing" ||
    value === "account" ||
    value === "onboarding" ||
    value === "other"
  )
}

function isSupportTicketSource(
  value: unknown
): value is SupportTicketSource {
  return (
    value === "portal" ||
    value === "email" ||
    value === "phone" ||
    value === "chat" ||
    value === "system" ||
    value === "other"
  )
}

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readNullableString(
  value: unknown
) {
  const trimmed =
    readString(value)

  return trimmed || null
}

function getAccessToken(
  request: Request
) {
  const authHeader =
    request.headers.get(
      "authorization"
    )

  if (
    !authHeader?.startsWith(
      "Bearer "
    )
  ) {
    return null
  }

  return authHeader
    .slice(7)
    .trim()
}

async function requireAuthenticatedRequest(
  request: Request
) {
  const accessToken =
    getAccessToken(request)

  if (!accessToken) {
    return {
      errorResponse:
        NextResponse.json(
          {
            error:
              "Missing access token.",
          },
          {
            status: 401,
          }
        ),
      supabase: null,
      userId: null,
    }
  }

  const supabase =
    getSupabaseServerClient(
      accessToken
    )

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      accessToken
    )

  if (
    error ||
    !data.user
  ) {
    return {
      errorResponse:
        NextResponse.json(
          {
            error:
              "Invalid or expired session.",
          },
          {
            status: 401,
          }
        ),
      supabase: null,
      userId: null,
    }
  }

  return {
    errorResponse: null,
    supabase,
    userId:
      data.user.id,
  }
}

function normalizeCreatePayload(
  payload: SupportTicketPayload
) {
  const user_id =
    readString(
      payload.user_id
    )

  if (!user_id) {
    throw new Error(
      "user_id is required."
    )
  }

  const product_id =
    readString(
      payload.product_id
    )

  if (!product_id) {
    throw new Error(
      "product_id is required."
    )
  }

  const subject =
    readString(
      payload.subject
    )

  if (!subject) {
    throw new Error(
      "subject is required."
    )
  }

  const problem_statement =
    readString(
      payload.problem_statement
    )

  if (
    !problem_statement
  ) {
    throw new Error(
      "problem_statement is required."
    )
  }

  if (
    !isSupportTicketCategory(
      payload.category
    )
  ) {
    throw new Error(
      "Invalid category."
    )
  }

  if (
    payload.priority !==
      undefined &&
    !isSupportTicketPriority(
      payload.priority
    )
  ) {
    throw new Error(
      "Invalid priority."
    )
  }

  if (
    payload.source !==
      undefined &&
    !isSupportTicketSource(
      payload.source
    )
  ) {
    throw new Error(
      "Invalid source."
    )
  }

  return {
    user_id,

    product_id,

    subject,

    problem_statement,

    priority:
      payload.priority ??
      "medium",

    category:
      payload.category,

    status: "open",

    assigned_to:
      readNullableString(
        payload.assigned_to
      ),

    source:
      payload.source ??
      "portal",

    note:
      readNullableString(
        payload.note
      ),

    attachments_json_array:
      payload.attachments_json_array ??
      [],
  }
}/**
 * GET /api/support-tickets
 */
export async function GET(request: Request) {
  try {
    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const { data, error } =
      await authContext.supabase
        .from(SUPPORT_TICKETS_TABLE)
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch support tickets.",
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json({
      supportTickets: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch support tickets.",
      },
      {
        status: 500,
      }
    )
  }
}
/**
 * POST /api/support-tickets
 */
export async function POST(
  request: Request
) {
  try {
    const authContext =
      await requireAuthenticatedRequest(
        request
      )

    if (
      authContext.errorResponse ||
      !authContext.supabase
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as SupportTicketPayload

    const payload =
      normalizeCreatePayload(
        body
      )

    const { data, error } =
      await authContext.supabase
        .from(
          SUPPORT_TICKETS_TABLE
        )
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create support ticket.",
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        supportTicket: data,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid payload.",
      },
      {
        status: 400,
      }
    )
  }
}
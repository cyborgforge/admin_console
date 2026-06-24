import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const CONTACTS_TABLE =
  process.env.SUPABASE_CONTACTS_TABLE ?? "contacts"

type ContactPayload = {
  name?: unknown
  designation?: unknown
  department?: unknown
  email?: unknown
  mobile?: unknown
  phone?: unknown
  linkedin?: unknown
  client_id?: unknown
  branch_id?: unknown
}

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readNullableString(value: unknown) {
  const trimmed = readString(value)

  return trimmed || null
}

function readRequiredUuid(
  value: unknown,
  fieldName: string
) {
  const trimmed = readString(value)

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`)
  }

  return trimmed
}

function getAccessToken(request: Request) {
  const authHeader =
    request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim()
}

async function requireAuthenticatedRequest(
  request: Request
) {
  const accessToken = getAccessToken(request)

  if (!accessToken) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing access token." },
        { status: 401 }
      ),
      supabase: null,
      userId: null,
    }
  }

  const supabase =
    getSupabaseServerClient(accessToken)

  const { data, error } =
    await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      ),
      supabase: null,
      userId: null,
    }
  }

  return {
    errorResponse: null,
    supabase,
    userId: data.user.id,
  }
}

function normalizeCreatePayload(
  payload: ContactPayload,
  userId: string
) {
  const name = readString(payload.name)
  const client_id = readRequiredUuid(
    payload.client_id,
    "client_id"
  )
  const branch_id = readRequiredUuid(
    payload.branch_id,
    "branch_id"
  )

  if (!name) {
    throw new Error("name is required.")
  }

  return {
    name,
    designation: readNullableString(
      payload.designation
    ),
    department: readNullableString(
      payload.department
    ),
    email: readNullableString(payload.email),
    mobile: readNullableString(payload.mobile),
    phone: readNullableString(payload.phone),
    linkedin: readNullableString(
      payload.linkedin
    ),
    client_id,
    branch_id,
    created_by: userId,
  }
}

async function requireRecordExists(
  supabase: NonNullable<
    Awaited<
      ReturnType<typeof requireAuthenticatedRequest>
    >["supabase"]
  >,
  table: string,
  id: string,
  fieldName: string
) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`${fieldName} does not exist.`)
  }
}

/**
 * GET /api/contacts
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

    const url = new URL(request.url)
    const client_id =
      url.searchParams.get("client_id")
    const branch_id =
      url.searchParams.get("branch_id")

    let query = authContext.supabase
      .from(CONTACTS_TABLE)
       .select(`
    *,
    clients (
      id,
      company_name
    )
  `)
  .order("created_at", {
    ascending: false,
  })

    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    if (branch_id) {
      query = query.eq("branch_id", branch_id)
    }

    const { data, error } = await query.order(
      "created_at",
      { ascending: false }
    )

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Failed to fetch contacts.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      contacts: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch contacts.",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contacts
 */
export async function POST(request: Request) {
  try {
    const authContext =
      await requireAuthenticatedRequest(request)

    if (
      authContext.errorResponse ||
      !authContext.supabase ||
      !authContext.userId
    ) {
      return authContext.errorResponse!
    }

    const body =
      (await request.json()) as ContactPayload

    const payload = normalizeCreatePayload(
      body,
      authContext.userId
    )

    await requireRecordExists(
      authContext.supabase,
      "clients",
      payload.client_id,
      "client_id"
    )

    await requireRecordExists(
      authContext.supabase,
      "branches",
      payload.branch_id,
      "branch_id"
    )

    const { data, error } =
      await authContext.supabase
        .from(CONTACTS_TABLE)
        .insert(payload)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to create contact.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { contact: data },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid payload.",
      },
      { status: 400 }
    )
  }
}

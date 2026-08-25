import { NextResponse } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

export const ONBOARDING_STATUSES = [
  "Pending",
  "In Progress",
  "Under Review",
  "Approved",
  "Rejected",
  "Skipped",
] as const

export type OnboardingStatus =
  (typeof ONBOARDING_STATUSES)[number]

type SupabaseServerClient = ReturnType<
  typeof getSupabaseServerClient
>

type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "status"

export type FieldConfig = {
  type: FieldType
  required?: boolean
  nullable?: boolean
  defaultValue?: unknown
}

export type ForeignKeyConfig = {
  field: string
  table: string
}

export type ResourceConfig = {
  table: string
  responseKey: string
  responseListKey: string
  fields: Record<string, FieldConfig>
  filters?: string[]
  foreignKeys?: ForeignKeyConfig[]
}

function isOnboardingStatus(
  value: unknown
): value is OnboardingStatus {
  return ONBOARDING_STATUSES.includes(
    value as OnboardingStatus
  )
}

function readString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function normalizeValue(
  field: string,
  value: unknown,
  config: FieldConfig,
  forCreate: boolean
) {
  if (value === undefined) {
    if (forCreate && config.required) {
      throw new Error(`${field} is required.`)
    }

    return undefined
  }

  if (value === null) {
    if (config.required || config.nullable === false) {
      throw new Error(`${field} cannot be empty.`)
    }

    return null
  }

  if (config.type === "status") {
    if (!isOnboardingStatus(value)) {
      throw new Error(
        `${field} must be ${ONBOARDING_STATUSES.join(", ")}.`
      )
    }

    return value
  }

  if (config.type === "string") {
    const trimmed = readString(value)

    if (!trimmed) {
      if (config.required || config.nullable === false) {
        throw new Error(`${field} cannot be empty.`)
      }

      return null
    }

    return trimmed
  }

  if (config.type === "number") {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
      throw new Error(`${field} must be a valid number.`)
    }

    return parsed
  }

  if (config.type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error(`${field} must be a boolean.`)
    }

    return value
  }

  return value
}

function buildPayload(
  body: Record<string, unknown>,
  config: ResourceConfig,
  userId: string | null,
  forCreate: boolean
) {
  const payload: Record<string, unknown> = {}

  for (const [field, fieldConfig] of Object.entries(
    config.fields
  )) {
    const normalized = normalizeValue(
      field,
      body[field],
      fieldConfig,
      forCreate
    )

    if (normalized !== undefined) {
      payload[field] = normalized
    } else if (
      forCreate &&
      fieldConfig.defaultValue !== undefined
    ) {
      payload[field] = fieldConfig.defaultValue
    }
  }

  if (forCreate && userId) {
    // Only include `created_by` when the resource defines the field
    if (config.fields && Object.prototype.hasOwnProperty.call(config.fields, "created_by")) {
      payload.created_by = userId
    }
  }

  return payload
}

function validateSearchParams(
  searchParams: URLSearchParams,
  config: ResourceConfig
) {
  const allowed = new Set(config.filters ?? [])

  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) {
      throw new Error(
        `Unsupported query parameter: ${key}.`
      )
    }

    const fieldConfig = config.fields[key]

    if (
      fieldConfig?.type === "status" &&
      !isOnboardingStatus(searchParams.get(key))
    ) {
      throw new Error(
        `${key} must be ${ONBOARDING_STATUSES.join(", ")}.`
      )
    }
  }
}

function getAccessToken(request: Request) {
  const authHeader =
    request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim()
}

export async function requireAuthenticatedRequest(
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

export async function recalculateOnboardingCounts(
  supabase: SupabaseServerClient,
  onboardingId: string
) {
  const [formsRes, docsRes] = await Promise.all([
    supabase
      .from("onboarding_forms_assigned")
      .select("id, status")
      .eq("onboarding_id", onboardingId),
    supabase
      .from("onboarding_documents_assigned")
      .select("id, status")
      .eq("onboarding_id", onboardingId),
  ])

  const forms = formsRes.data ?? []
  const docs = docsRes.data ?? []

  const forms_total = forms.length
  const forms_filled = forms.filter(
    (f: { status?: string }) =>
      f.status === "Approved" || f.status === "Accepted"
  ).length

  const documents_total = docs.length
  const documents_filled = docs.filter(
    (d: { status?: string }) =>
      d.status === "Approved" || d.status === "Accepted"
  ).length

  await supabase
    .from("onboarding_clients")
    .update({
      forms_total,
      forms_filled,
      documents_total,
      documents_filled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", onboardingId)

  return {
    forms_total,
    forms_filled,
    documents_total,
    documents_filled,
  }
}

async function requireRecordExists(
  supabase: SupabaseServerClient,
  table: string,
  id: unknown,
  fieldName: string
) {
  if (typeof id !== "string" || !id.trim()) {
    return
  }

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    throw new Error(`${fieldName} does not exist.`)
  }
}

async function validateForeignKeys(
  supabase: SupabaseServerClient,
  payload: Record<string, unknown>,
  config: ResourceConfig
) {
  for (const foreignKey of config.foreignKeys ?? []) {
    await requireRecordExists(
      supabase,
      foreignKey.table,
      payload[foreignKey.field],
      foreignKey.field
    )
  }
}

export function createCollectionHandlers(
  config: ResourceConfig
) {
  return {
    GET: async (request: Request) => {
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
        validateSearchParams(url.searchParams, config)

        let query = authContext.supabase
          .from(config.table)
          .select("*")

        for (const key of url.searchParams.keys()) {
          const value = url.searchParams.get(key)

          if (value) {
            query = query.eq(key, value)
          }
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
                `Failed to fetch ${config.responseListKey}.`,
            },
            { status: 400 }
          )
        }

        return NextResponse.json({
          [config.responseListKey]: data ?? [],
        })
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : `Failed to fetch ${config.responseListKey}.`,
          },
          { status: 500 }
        )
      }
    },
    POST: async (request: Request) => {
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
          (await request.json()) as Record<
            string,
            unknown
          >

        const payload = buildPayload(
          body,
          config,
          authContext.userId,
          true
        )

        await validateForeignKeys(
          authContext.supabase,
          payload,
          config
        )

        const { data, error } =
          await authContext.supabase
            .from(config.table)
            .insert(payload)
            .select()
            .single()

        if (error || !data) {
          return NextResponse.json(
            {
              error:
                error?.message ??
                `Failed to create ${config.responseKey}.`,
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { [config.responseKey]: data },
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
    },
  }
}

export function createItemHandlers(
  config: ResourceConfig
) {
  return {
    GET: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      const { id } = await params
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
          .from(config.table)
          .select("*")
          .eq("id", id)
          .single()

      if (error || !data) {
        return NextResponse.json(
          { error: `${config.responseKey} not found.` },
          { status: 404 }
        )
      }

      return NextResponse.json({
        [config.responseKey]: data,
      })
    },
    PUT: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const { id } = await params
        const authContext =
          await requireAuthenticatedRequest(request)

        if (
          authContext.errorResponse ||
          !authContext.supabase
        ) {
          return authContext.errorResponse!
        }

        const body =
          (await request.json()) as Record<
            string,
            unknown
          >

        const payload = buildPayload(
          body,
          config,
          null,
          false
        )

        if (Object.keys(payload).length === 0) {
          return NextResponse.json(
            {
              error:
                "No fields provided for update.",
            },
            { status: 400 }
          )
        }

        await validateForeignKeys(
          authContext.supabase,
          payload,
          config
        )

        const { data, error } =
          await authContext.supabase
            .from(config.table)
            .update(payload)
            .eq("id", id)
            .select()
            .single()

        if (error || !data) {
          return NextResponse.json(
            {
              error:
                error?.message ??
                `Failed to update ${config.responseKey}.`,
            },
            { status: 400 }
          )
        }

        return NextResponse.json({
          [config.responseKey]: data,
        })
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
    },
    DELETE: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      const { id } = await params
      const authContext =
        await requireAuthenticatedRequest(request)

      if (
        authContext.errorResponse ||
        !authContext.supabase
      ) {
        return authContext.errorResponse!
      }

      const { error } = await authContext.supabase
        .from(config.table)
        .delete()
        .eq("id", id)

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message ??
              `Failed to delete ${config.responseKey}.`,
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true })
    },
  }
}

export function createStatusHandler(
  config: ResourceConfig
) {
  return async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const authContext =
        await requireAuthenticatedRequest(request)

      if (
        authContext.errorResponse ||
        !authContext.supabase
      ) {
        return authContext.errorResponse!
      }

      const body =
        (await request.json()) as Record<
          string,
          unknown
        >

      if (!isOnboardingStatus(body.status)) {
        throw new Error(
          `status must be ${ONBOARDING_STATUSES.join(", ")}.`
        )
      }

      if (
        config.table.endsWith("_response") &&
        (body.status === "Approved" || body.status === "Rejected")
      ) {
        const { data: currentResponse, error: currentResponseError } =
          await authContext.supabase
            .from(config.table)
            .select("status")
            .eq("id", id)
            .maybeSingle()

        if (currentResponseError || !currentResponse) {
          throw new Error(`${config.responseKey} not found.`)
        }

        if (currentResponse.status !== "Pending") {
          throw new Error(
            `Only pending responses can be approved or rejected.`
          )
        }
      }

      const updateData: Record<string, unknown> = {
        status: body.status,
      }

      if (body.review_note !== undefined) {
        updateData.review_note = normalizeValue(
          "review_note",
          body.review_note,
          { type: "string", nullable: true },
          false
        )
      }

      if (
        body.status === "Approved" &&
        "completed_at" in config.fields
      ) {
        updateData.completed_at =
          new Date().toISOString()
      }

      if (
        body.due_date !== undefined &&
        "due_date" in config.fields
      ) {
        updateData.due_date = normalizeValue(
          "due_date",
          body.due_date,
          { type: "string", nullable: true },
          false
        )
      }

      if (
        config.table.endsWith("_response") &&
        authContext.userId
      ) {
        // Only include review_by/review_date if the resource defines those fields
        if (config.fields && Object.prototype.hasOwnProperty.call(config.fields, "review_by")) {
          updateData.review_by = authContext.userId
        }

        if (config.fields && Object.prototype.hasOwnProperty.call(config.fields, "review_date")) {
          updateData.review_date = new Date().toISOString()
        }
      }

      const { data, error } =
        await authContext.supabase
          .from(config.table)
          .update(updateData)
          .eq("id", id)
          .select()
          .single()

      if (error || !data) {
        return NextResponse.json(
          {
            error:
              error?.message ??
              `Failed to update ${config.responseKey} status.`,
          },
          { status: 400 }
        )
      }

      // If this is a response or assigned table, propagate status change to the assigned item & client
      try {
        if (config.table === "onboarding_forms_response") {
          const resp: any = data
          const assignedId = resp.form_assigned_id

          if (assignedId) {
            const { data: allResponses } = await authContext.supabase
              .from("onboarding_forms_response")
              .select("status")
              .eq("form_assigned_id", assignedId)

            const isApproved = (allResponses ?? []).some(
              (r: any) => r.status === "Approved" || r.status === "Accepted"
            )
            const targetStatus = isApproved ? "Approved" : "Pending"

            await authContext.supabase
              .from("onboarding_forms_assigned")
              .update({
                status: targetStatus,
                current_submission_id: resp.id,
                completed_at: targetStatus === "Approved" ? new Date().toISOString() : null,
              })
              .eq("id", assignedId)

            const { data: assignedRec } = await authContext.supabase
              .from("onboarding_forms_assigned")
              .select("onboarding_id")
              .eq("id", assignedId)
              .maybeSingle()

            if (assignedRec?.onboarding_id) {
              await recalculateOnboardingCounts(authContext.supabase, assignedRec.onboarding_id)
            }
          }
        }

        if (config.table === "onboarding_documents_response") {
          const resp: any = data
          const assignedId = resp.document_assigned_id

          if (assignedId) {
            const { data: allResponses } = await authContext.supabase
              .from("onboarding_documents_response")
              .select("status")
              .eq("document_assigned_id", assignedId)

            const isApproved = (allResponses ?? []).some(
              (r: any) => r.status === "Approved" || r.status === "Accepted"
            )
            const targetStatus = isApproved ? "Approved" : "Pending"

            await authContext.supabase
              .from("onboarding_documents_assigned")
              .update({
                status: targetStatus,
                current_submission_id: resp.id,
                completed_at: targetStatus === "Approved" ? new Date().toISOString() : null,
              })
              .eq("id", assignedId)

            const { data: assignedRec } = await authContext.supabase
              .from("onboarding_documents_assigned")
              .select("onboarding_id")
              .eq("id", assignedId)
              .maybeSingle()

            if (assignedRec?.onboarding_id) {
              await recalculateOnboardingCounts(authContext.supabase, assignedRec.onboarding_id)
            }
          }
        }

        if (config.table === "onboarding_forms_assigned" || config.table === "onboarding_documents_assigned") {
          const assigned: any = data
          if (assigned?.onboarding_id) {
            await recalculateOnboardingCounts(authContext.supabase, assigned.onboarding_id)
          }
        }
      } catch (err) {
        // non-fatal: don't block status update on propagation errors
        console.error("Failed to propagate response status:", err)
      }

      return NextResponse.json({
        [config.responseKey]: data,
      })
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
}

import { NextResponse } from "next/server"

import {
  createItemHandlers,
  requireAuthenticatedRequest,
} from "@/lib/onboardingApi"
import { onboardingClientsConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingClientsConfig)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authContext =
    await requireAuthenticatedRequest(request)

  if (
    authContext.errorResponse ||
    !authContext.supabase
  ) {
    return authContext.errorResponse!
  }

  const { data: onboardingClient, error } =
    await authContext.supabase
      .from("onboarding_clients")
      .select("*")
      .eq("id", id)
      .single()

  if (error || !onboardingClient) {
    return NextResponse.json(
      { error: "onboarding_client not found." },
      { status: 404 }
    )
  }

  const [
    clientResult,
    formsResult,
    documentsResult,
  ] = await Promise.all([
    authContext.supabase
      .from("clients")
      .select("*")
      .eq("id", onboardingClient.client_id)
      .maybeSingle(),
    authContext.supabase
      .from("onboarding_forms_assigned")
      .select("*, form:onboarding_forms_list(*)")
      .eq("onboarding_id", id)
      .order("created_at", { ascending: false }),
    authContext.supabase
      .from("onboarding_documents_assigned")
      .select("*, document:onboarding_documents_list(*)")
      .eq("onboarding_id", id)
      .order("created_at", { ascending: false }),
  ])

  const formIds = (formsResult.data ?? []).map(
    (item) => item.id
  )
  const documentIds = (
    documentsResult.data ?? []
  ).map((item) => item.id)

  const [formResponsesResult, documentResponsesResult] =
    await Promise.all([
      formIds.length
        ? authContext.supabase
            .from("onboarding_forms_response")
            .select("*")
            .in("form_assigned_id", formIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      documentIds.length
        ? authContext.supabase
            .from("onboarding_documents_response")
            .select("*")
            .in("document_assigned_id", documentIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ])

  if (
    clientResult.error ||
    formsResult.error ||
    documentsResult.error ||
    formResponsesResult.error ||
    documentResponsesResult.error
  ) {
    return NextResponse.json(
      {
        error:
          clientResult.error?.message ??
          formsResult.error?.message ??
          documentsResult.error?.message ??
          formResponsesResult.error?.message ??
          documentResponsesResult.error?.message ??
          "Failed to fetch onboarding details.",
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    onboarding_client: onboardingClient,
    client: clientResult.data,
    assigned_forms: formsResult.data ?? [],
    assigned_documents: documentsResult.data ?? [],
    form_responses: formResponsesResult.data ?? [],
    document_responses:
      documentResponsesResult.data ?? [],
  })
}

export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

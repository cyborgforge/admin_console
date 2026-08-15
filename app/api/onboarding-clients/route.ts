import { NextResponse } from "next/server"

import {
  createCollectionHandlers,
  requireAuthenticatedRequest,
} from "@/lib/onboardingApi"
import { onboardingClientsConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingClientsConfig)

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
    const allowed = new Set(["client_id", "status"])

    for (const key of url.searchParams.keys()) {
      if (!allowed.has(key)) {
        throw new Error(
          `Unsupported query parameter: ${key}.`
        )
      }
    }

    let query = authContext.supabase
      .from("onboarding_clients")
      .select(
        "*, client:clients(id, company_name, email, phone, industry, status), onboarding_forms_assigned(id, status), onboarding_documents_assigned(id, status)"
      )

    const client_id =
      url.searchParams.get("client_id")
    const status = url.searchParams.get("status")

    if (client_id) {
      query = query.eq("client_id", client_id)
    }

    if (status) {
      query = query.eq("status", status)
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
            "Failed to fetch onboarding clients.",
        },
        { status: 400 }
      )
    }

    const onboarding_clients = (data ?? []).map((item: any) => {
      const assignedForms = item.onboarding_forms_assigned ?? []
      const assignedDocs = item.onboarding_documents_assigned ?? []

      const forms_total = assignedForms.length
      const forms_filled = assignedForms.filter(
        (f: any) => f.status === "Approved" || f.status === "Accepted"
      ).length

      const documents_total = assignedDocs.length
      const documents_filled = assignedDocs.filter(
        (d: any) => d.status === "Approved" || d.status === "Accepted"
      ).length

      const {
        onboarding_forms_assigned,
        onboarding_documents_assigned,
        ...rest
      } = item

      return {
        ...rest,
        forms_total,
        forms_filled,
        documents_total,
        documents_filled,
      }
    })

    return NextResponse.json({
      onboarding_clients,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch onboarding clients.",
      },
      { status: 500 }
    )
  }
}

export const POST = handlers.POST

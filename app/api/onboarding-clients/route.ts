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
      .select("*, client:clients(id, company_name, email, phone, industry, status)")

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

    return NextResponse.json({
      onboarding_clients: data ?? [],
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

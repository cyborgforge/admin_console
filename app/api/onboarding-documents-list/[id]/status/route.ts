import { NextResponse } from "next/server"

import { requireAuthenticatedRequest } from "@/lib/onboardingApi"

export async function PUT(
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
      (await request.json()) as { is_active?: unknown }

    if (typeof body.is_active !== "boolean") {
      throw new Error("is_active must be a boolean.")
    }

    const { data, error } =
      await authContext.supabase
        .from("onboarding_documents_list")
        .update({ is_active: body.is_active })
        .eq("id", id)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Failed to update document status.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ document: data })
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

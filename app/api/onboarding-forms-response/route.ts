import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingFormsResponseConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingFormsResponseConfig)

export const GET = handlers.GET
export const POST = handlers.POST

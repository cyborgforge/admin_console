import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingFormsListConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingFormsListConfig)

export const GET = handlers.GET
export const POST = handlers.POST

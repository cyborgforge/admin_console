import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsListConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingDocumentsListConfig)

export const GET = handlers.GET
export const POST = handlers.POST

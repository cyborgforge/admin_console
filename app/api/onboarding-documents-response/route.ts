import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsResponseConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingDocumentsResponseConfig)

export const GET = handlers.GET
export const POST = handlers.POST

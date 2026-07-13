import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsAssignedConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingDocumentsAssignedConfig)

export const GET = handlers.GET
export const POST = handlers.POST

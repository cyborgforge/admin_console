import { createCollectionHandlers } from "@/lib/onboardingApi"
import { onboardingFormsAssignedConfig } from "@/lib/onboardingResources"

const handlers = createCollectionHandlers(onboardingFormsAssignedConfig)

export const GET = handlers.GET
export const POST = handlers.POST

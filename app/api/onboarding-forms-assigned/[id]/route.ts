import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingFormsAssignedConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingFormsAssignedConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

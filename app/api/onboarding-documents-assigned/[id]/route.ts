import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsAssignedConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingDocumentsAssignedConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

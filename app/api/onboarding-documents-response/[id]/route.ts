import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsResponseConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingDocumentsResponseConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingDocumentsListConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingDocumentsListConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingFormsListConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingFormsListConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

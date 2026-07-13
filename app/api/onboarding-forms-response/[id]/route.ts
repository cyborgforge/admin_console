import { createItemHandlers } from "@/lib/onboardingApi"
import { onboardingFormsResponseConfig } from "@/lib/onboardingResources"

const handlers = createItemHandlers(onboardingFormsResponseConfig)

export const GET = handlers.GET
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE

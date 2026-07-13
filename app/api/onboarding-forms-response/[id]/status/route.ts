import { createStatusHandler } from "@/lib/onboardingApi"
import { onboardingFormsResponseConfig } from "@/lib/onboardingResources"

export const PUT = createStatusHandler(onboardingFormsResponseConfig)

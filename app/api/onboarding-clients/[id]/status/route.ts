import { createStatusHandler } from "@/lib/onboardingApi"
import { onboardingClientsConfig } from "@/lib/onboardingResources"

export const PUT = createStatusHandler(onboardingClientsConfig)

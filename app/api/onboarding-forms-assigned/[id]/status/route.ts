import { createStatusHandler } from "@/lib/onboardingApi"
import { onboardingFormsAssignedConfig } from "@/lib/onboardingResources"

export const PUT = createStatusHandler(onboardingFormsAssignedConfig)

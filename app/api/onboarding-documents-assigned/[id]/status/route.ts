import { createStatusHandler } from "@/lib/onboardingApi"
import { onboardingDocumentsAssignedConfig } from "@/lib/onboardingResources"

export const PUT = createStatusHandler(onboardingDocumentsAssignedConfig)

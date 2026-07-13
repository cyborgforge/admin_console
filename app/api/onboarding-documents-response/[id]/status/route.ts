import { createStatusHandler } from "@/lib/onboardingApi"
import { onboardingDocumentsResponseConfig } from "@/lib/onboardingResources"

export const PUT = createStatusHandler(onboardingDocumentsResponseConfig)

export type OnboardingStatus =
  | "Pending"
  | "In Progress"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Skipped"

export type OnboardingClient = {
  id: string
  client_id: string
  start_date: string | null
  finish_date: string | null
  status: OnboardingStatus
  forms_filled: number
  forms_total: number
  documents_filled: number
  documents_total: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export type OnboardingFormList = {
  id: string
  form_name: string
  form_description: string | null
  template_version: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type OnboardingFormAssigned = {
  id: string
  form_id: string
  onboarding_id: string
  status: OnboardingStatus
  current_submission_id: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  form?: OnboardingFormList | null
}

export type OnboardingFormResponse = {
  id: string
  form_assigned_id: string
  version_number: number
  status: OnboardingStatus
  response_data: Record<string, unknown>
  submitted_date: string | null
  review_note: string | null
  review_by: string | null
  review_date: string | null
  created_at: string
  updated_at: string
}

export type OnboardingDocumentList = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type OnboardingDocumentAssigned = {
  id: string
  document_id: string
  onboarding_id: string
  status: OnboardingStatus
  current_submission_id: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  document?: OnboardingDocumentList | null
}

export type OnboardingDocumentResponse = {
  id: string
  document_assigned_id: string
  version_number: number
  status: OnboardingStatus
  document_link: string | null
  due_date: string | null
  completed_at: string | null
  submission_count: number
  submitted_date: string | null
  review_note: string | null
  review_by: string | null
  review_date: string | null
  created_at: string
  updated_at: string
}

export type OnboardingClientListItem =
  OnboardingClient & {
    client?: {
      id: string
      company_name: string
      email: string | null
      phone: string | null
      industry: string | null
      status: string | null
    } | null
  }

export type OnboardingClientDetail = {
  onboarding_client: OnboardingClient
  client: OnboardingClientListItem["client"]
  assigned_forms: OnboardingFormAssigned[]
  assigned_documents: OnboardingDocumentAssigned[]
  form_responses: OnboardingFormResponse[]
  document_responses: OnboardingDocumentResponse[]
}

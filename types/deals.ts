export type DealStage =
  | "new"
  | "quote sent"
  | "negotiation"
  | "reviewing"
  | "hold"
  | "won"
  | "lost"

export interface Deal {
  id: string

  deal_name: string

  client_id: string
  //client_name: string | null
  branch_id: string

  primary_contact_id: string | null
  //primary_contact_name: string | null

  stage: DealStage

  expected_value: number | null

  source_lead_id: string | null

  assigned_to: string | null

  description: string | null

  current_quotation_id: string | null

  lost_reason: string | null

  won_date: string | null

  created_at: string
  updated_at: string

  created_by: string | null

  product_module_id: string | null
  product_service_id: string | null

  client : {
    id: string
    company_name: string
  }
   primary_contact:{
    id: string
    name: string
   }
   client_requirement?: string
  offering_summary?: string
  notes?: string
}

export interface CreateDealPayload {
  deal_name: string

  client_id: string
  branch_id: string

  primary_contact_id?: string

  stage?: DealStage

  expected_value?: number

  source_lead_id?: string

  assigned_to?: string

  description?: string

  current_quotation_id?: string

  product_module_id?: string
  product_service_id?: string

  client_requirement?: string
  offering_summary?: string
  note?: string
}

export interface UpdateDealPayload {
  deal_name?: string

  primary_contact_id?: string | null

  stage?: DealStage

  expected_value?: number | null

  source_lead_id?: string | null

  assigned_to?: string | null

  description?: string | null

  current_quotation_id?: string | null

  lost_reason?: string | null

  won_date?: string | null

  product_module_id?: string | null
  product_service_id?: string | null
}

export type DealDraft = {
  deal_name: string

  client_id: string
  branch_id: string

  primary_contact_id: string

  stage: DealStage

  expected_value: string

  assigned_to: string

  description: string

  product_module_id: string
  product_service_id: string
}

export const DEFAULT_DEAL_DRAFT: DealDraft = {
  deal_name: "",

  client_id: "",
  branch_id: "",

  primary_contact_id: "",

  stage: "new",

  expected_value: "",

  assigned_to: "",

  description: "",

  product_module_id: "",
  product_service_id: "",
}
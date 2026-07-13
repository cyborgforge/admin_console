import type { ResourceConfig } from "@/lib/onboardingApi"

export const onboardingClientsConfig: ResourceConfig = {
  table: "onboarding_clients",
  responseKey: "onboarding_client",
  responseListKey: "onboarding_clients",
  fields: {
    client_id: { type: "string", required: true },
    start_date: { type: "string", nullable: true },
    finish_date: { type: "string", nullable: true },
    status: { type: "status", defaultValue: "Pending" },
    forms_filled: { type: "number", defaultValue: 0 },
    forms_total: { type: "number", defaultValue: 0 },
    documents_filled: { type: "number", defaultValue: 0 },
    documents_total: { type: "number", defaultValue: 0 },
  },
  filters: ["client_id", "status"],
  foreignKeys: [{ field: "client_id", table: "clients" }],
}

export const onboardingFormsListConfig: ResourceConfig = {
  table: "onboarding_forms_list",
  responseKey: "form",
  responseListKey: "forms",
  fields: {
    form_name: { type: "string", required: true },
    form_description: { type: "string", nullable: true },
    template_version: { type: "number", defaultValue: 1 },
    is_active: { type: "boolean", defaultValue: true },
  },
  filters: ["is_active"],
}

export const onboardingFormsAssignedConfig: ResourceConfig = {
  table: "onboarding_forms_assigned",
  responseKey: "assigned_form",
  responseListKey: "assigned_forms",
  fields: {
    form_id: { type: "string", required: true },
    onboarding_id: { type: "string", required: true },
    status: { type: "status", defaultValue: "Pending" },
    current_submission_id: { type: "string", nullable: true },
    due_date: { type: "string", nullable: true },
    completed_at: { type: "string", nullable: true },
  },
  filters: ["onboarding_id", "form_id", "status"],
  foreignKeys: [
    { field: "form_id", table: "onboarding_forms_list" },
    { field: "onboarding_id", table: "onboarding_clients" },
    { field: "current_submission_id", table: "onboarding_forms_response" },
  ],
}

export const onboardingFormsResponseConfig: ResourceConfig = {
  table: "onboarding_forms_response",
  responseKey: "form_response",
  responseListKey: "form_responses",
  fields: {
    form_assigned_id: { type: "string", required: true },
    version_number: { type: "number", defaultValue: 1 },
    status: { type: "status", defaultValue: "Pending" },
    response_data: { type: "json", defaultValue: {} },
    submitted_date: { type: "string", nullable: true },
    review_note: { type: "string", nullable: true },
    review_by: { type: "string", nullable: true },
    review_date: { type: "string", nullable: true },
  },
  filters: ["form_assigned_id", "status"],
  foreignKeys: [
    { field: "form_assigned_id", table: "onboarding_forms_assigned" },
  ],
}

export const onboardingDocumentsListConfig: ResourceConfig = {
  table: "onboarding_documents_list",
  responseKey: "document",
  responseListKey: "documents",
  fields: {
    name: { type: "string", required: true },
    description: { type: "string", nullable: true },
    is_active: { type: "boolean", defaultValue: true },
  },
  filters: ["is_active"],
}

export const onboardingDocumentsAssignedConfig: ResourceConfig = {
  table: "onboarding_documents_assigned",
  responseKey: "assigned_document",
  responseListKey: "assigned_documents",
  fields: {
    document_id: { type: "string", required: true },
    onboarding_id: { type: "string", required: true },
    status: { type: "status", defaultValue: "Pending" },
    current_submission_id: { type: "string", nullable: true },
    due_date: { type: "string", nullable: true },
    completed_at: { type: "string", nullable: true },
  },
  filters: ["onboarding_id", "document_id", "status"],
  foreignKeys: [
    { field: "document_id", table: "onboarding_documents_list" },
    { field: "onboarding_id", table: "onboarding_clients" },
    { field: "current_submission_id", table: "onboarding_documents_response" },
  ],
}

export const onboardingDocumentsResponseConfig: ResourceConfig = {
  table: "onboarding_documents_response",
  responseKey: "document_response",
  responseListKey: "document_responses",
  fields: {
    document_assigned_id: { type: "string", required: true },
    version_number: { type: "number", defaultValue: 1 },
    status: { type: "status", defaultValue: "Pending" },
    document_link: { type: "string", nullable: true },
    due_date: { type: "string", nullable: true },
    completed_at: { type: "string", nullable: true },
    submission_count: { type: "number", defaultValue: 1 },
    submitted_date: { type: "string", nullable: true },
    review_note: { type: "string", nullable: true },
    review_by: { type: "string", nullable: true },
    review_date: { type: "string", nullable: true },
  },
  filters: ["document_assigned_id", "status"],
  foreignKeys: [
    { field: "document_assigned_id", table: "onboarding_documents_assigned" },
  ],
}

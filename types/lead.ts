export type LeadStatus = "discovery" | "contacted" | "reviewing" | "closed-won" | "closed-lost"

export type LeadProductInterest = "Pharmacy" | "Hospital" | "Others"

export type Lead = {
  id: string
  leadName: string
  company: string
  jobTitle: string
  email: string
  phone: string
  source: string
  status: LeadStatus
  assignedTo: string
  createdDate: string
  lastActivityDate?: string
  lastActivityName: string
  nextFollowUp?: string
  state: string
  city: string
  tags: string
  productInterest: LeadProductInterest
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export type CreateLeadPayload = {
  leadName: string
  company: string
  jobTitle?: string
  email?: string
  phone?: string
  source?: string
  status?: LeadStatus
  assignedTo?: string
  createdDate?: string
  lastActivityDate?: string
  lastActivityName?: string
  nextFollowUp?: string
  state?: string
  city?: string
  tags?: string
  productInterest?: LeadProductInterest
}

export type UpdateLeadPayload = {
  id: string
  leadName?: string
  company?: string
  jobTitle?: string
  email?: string
  phone?: string
  source?: string
  status?: LeadStatus
  assignedTo?: string
  createdDate?: string
  lastActivityDate?: string
  lastActivityName?: string
  nextFollowUp?: string
  state?: string
  city?: string
  tags?: string
  productInterest?: LeadProductInterest
}

export type DeleteLeadPayload = {
  id: string
}

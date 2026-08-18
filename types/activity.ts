export interface Activity {
  id: string;
  module: "client" | "deal";
  entityId: string;

  type: ActivityType;
  title: string;
  description: string;

  user: {
    id: string;
    name: string;
    avatar?: string;
  };

  timestamp: string;
}

export type ActivityType =
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "DEAL_CREATED"
  | "DEAL_UPDATED"
  | "NOTE_ADDED"
  | "EMAIL_SENT"
  | "PHONE_CALL"
  | "MEETING_SCHEDULED"
  | "TASK_COMPLETED"
  | "STAGE_CHANGED"
  | "QUOTATION_SENT"
  | "PAYMENT_RECEIVED"
  | "DOCUMENT_UPLOADED";
// components/activities/ActivityIcon.tsx

import {
  UserPlus,
  UserCog,
  Briefcase,
  BriefcaseBusiness,
  FileText,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  Receipt,
  CreditCard,
  Upload,
  LucideIcon,
} from "lucide-react";

import { ActivityType } from "@/types/activity";

interface ActivityIconProps {
  type: ActivityType;
  className?: string;
}

/**
 * Returns the corresponding icon for each activity type.
 */
export default function ActivityIcon({
  type,
  className,
}: ActivityIconProps) {
  const iconMap: Record<ActivityType, LucideIcon> = {
    CLIENT_CREATED: UserPlus,
    CLIENT_UPDATED: UserCog,
    DEAL_CREATED: Briefcase,
    DEAL_UPDATED: BriefcaseBusiness,
    NOTE_ADDED: FileText,
    EMAIL_SENT: Mail,
    PHONE_CALL: Phone,
    MEETING_SCHEDULED: Calendar,
    TASK_COMPLETED: CheckCircle2,
    STAGE_CHANGED: ArrowRightLeft,
    QUOTATION_SENT: Receipt,
    PAYMENT_RECEIVED: CreditCard,
    DOCUMENT_UPLOADED: Upload,
  };

  const Icon = iconMap[type];

  return <Icon className={className} />;
}
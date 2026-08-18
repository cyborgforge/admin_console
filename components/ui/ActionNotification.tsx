"use client"

import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react"

export type ActionNotificationType =
  | "success"
  | "info"
  | "warning"
  | "error"

type ActionNotificationProps = {
  title: string
  message?: string
  type?: ActionNotificationType
  onClose: () => void
}

export default function ActionNotification({
  title,
  message,
  type = "success",
  onClose,
}: ActionNotificationProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      iconClass:
        "text-emerald-400",
      iconBackground:
        "bg-emerald-500/10",
      progress:
        "bg-emerald-400",
    },

    info: {
      icon: Info,
      iconClass:
        "text-blue-400",
      iconBackground:
        "bg-blue-500/10",
      progress:
        "bg-blue-400",
    },

    warning: {
      icon: TriangleAlert,
      iconClass:
        "text-amber-400",
      iconBackground:
        "bg-amber-500/10",
      progress:
        "bg-amber-400",
    },

    error: {
      icon: AlertCircle,
      iconClass:
        "text-red-400",
      iconBackground:
        "bg-red-500/10",
      progress:
        "bg-red-400",
    },
  }[type]

  const Icon = config.icon

  return (
    <div className="pointer-events-auto w-full max-w-[370px] overflow-hidden rounded-xl border border-[#303641] bg-[#1b1f27]/95 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start gap-3 px-4 py-3.5">

        {/* Icon */}

        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconBackground}`}
        >
          <Icon
            size={17}
            className={
              config.iconClass
            }
          />
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-[#e7e9ee]">
            {title}
          </p>

          {message && (
            <p className="mt-0.5 break-words text-xs leading-5 text-[#9299a8]">
              {message}
            </p>
          )}
        </div>

        {/* Close */}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="mt-0.5 rounded-md p-1 text-[#69707e] transition hover:bg-white/[0.05] hover:text-[#d9dde5]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Subtle progress indicator */}

      <div className="h-[2px] w-full bg-white/[0.03]">
        <div
          className={`h-full w-full ${config.progress} opacity-70`}
        />
      </div>
    </div>
  )
}
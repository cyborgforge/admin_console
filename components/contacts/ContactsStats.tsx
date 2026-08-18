import {
  Building2,
  CheckCircle2,
  Phone,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"

type ContactsStatsProps = {
  total: number
  reachable: number
  complete: number
  clientsCovered: number
}

function StatCard({
  title,
  value,
  description,
  icon,
  valueClassName = "text-[#e7e9ee]",
}: {
  title: string
  value: number
  description: string
  icon: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl border border-[#2b3039] bg-[#191c23] p-5 transition hover:border-[#3a404d]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#747b8a]">
          {title}
        </span>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-[#747b8a]">
          {icon}
        </div>
      </div>

      <div className={`text-3xl font-bold tracking-tight ${valueClassName}`}>
        {value}
      </div>

      <p className="mt-2 text-xs text-[#777e8d]">
        {description}
      </p>
    </div>
  )
}

export default function ContactsStats({
  total,
  reachable,
  complete,
  clientsCovered,
}: ContactsStatsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Contacts"
        value={total}
        description="Contacts in your CRM"
        icon={<Users size={17} />}
      />

      <StatCard
        title="Reachable"
        value={reachable}
        description="Email or phone available"
        icon={<Phone size={17} />}
        valueClassName="text-amber-400"
      />

      <StatCard
        title="Complete Profiles"
        value={complete}
        description="Profiles ready for CRM use"
        icon={<CheckCircle2 size={17} />}
        valueClassName="text-blue-400"
      />

      <StatCard
        title="Clients Covered"
        value={clientsCovered}
        description="Companies with contacts"
        icon={<Building2 size={17} />}
        valueClassName="text-emerald-400"
      />
    </section>
  )
}
import { ArrowDown, ArrowUp } from "lucide-react"

type QuoteCardProps = {
  label: string
  value: string
  change: string
  trend?: "up" | "down" | "neutral"
  valueClassName?: string
}

export function QuoteCard({
  label,
  value,
  change,
  trend = "up",
  valueClassName,
}: QuoteCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={valueClassName ? `stat-val ${valueClassName}` : "stat-val"}>{value}</div>
      <div className={trend === "down" ? "stat-change down" : trend === "up" ? "stat-change up" : "stat-change"}>
        {trend === "up" ? <ArrowUp size={12} /> : null}
        {trend === "down" ? <ArrowDown size={12} /> : null}
        {change}
      </div>
    </div>
  )
}

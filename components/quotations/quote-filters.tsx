import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { QuotationStatus } from "@/types/quotation"

export type QuoteFilterStatus = "all" | QuotationStatus

type QuoteFiltersProps = {
  query: string
  status: QuoteFilterStatus
  onQueryChange: (value: string) => void
  onStatusChange: (value: QuoteFilterStatus) => void
}

export function QuoteFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
}: QuoteFiltersProps) {
  return (
    <div className="filters">
      <div className="search-box">
        <Search size={14} color="var(--text3)" />
        <Input
          placeholder="Search by client, quote ID..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-auto border-none bg-transparent p-0 text-[13px] shadow-none focus-visible:ring-0"
        />
      </div>

      <Select value={status} onValueChange={(value) => onStatusChange(value as QuoteFilterStatus)}>
        <SelectTrigger className="filter-select w-[150px] border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text2)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="review">In Review</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all-products">
        <SelectTrigger className="filter-select w-[160px] border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text2)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-products">All Products</SelectItem>
          <SelectItem value="pharmacy">Pharmacy Suite</SelectItem>
          <SelectItem value="clinic">Clinic Suite</SelectItem>
          <SelectItem value="retail">Retail Suite</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all-time">
        <SelectTrigger className="filter-select w-[130px] border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text2)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-time">All time</SelectItem>
          <SelectItem value="this-month">This month</SelectItem>
          <SelectItem value="last-3">Last 3 months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

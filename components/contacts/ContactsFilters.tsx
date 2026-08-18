import { Plus, Search } from "lucide-react"

export type PeriodFilter =
  | "all"
  | "30d"
  | "90d"
  | "1y"

type ClientOption = {
  id: string
  company_name: string
}

type ContactsFiltersProps = {
  query: string
  clientFilter: string
  periodFilter: PeriodFilter
  clients: ClientOption[]

  onQueryChange: (value: string) => void
  onClientChange: (value: string) => void
  onPeriodChange: (value: PeriodFilter) => void
  onAddContact: () => void
}

export default function ContactsFilters({
  query,
  clientFilter,
  periodFilter,
  clients,
  onQueryChange,
  onClientChange,
  onPeriodChange,
  onAddContact,
}: ContactsFiltersProps) {
  return (
    <section className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#303541] bg-[#1d2129] px-3">
        <Search
          size={16}
          className="shrink-0 text-[#69707e]"
        />

        <input
          value={query}
          onChange={(event) =>
            onQueryChange(event.target.value)
          }
          placeholder="Search contacts, client, email, phone..."
          className="w-full bg-transparent py-2.5 text-sm text-[#d5d9e2] outline-none placeholder:text-[#555b68]"
        />
      </div>

      <select
        value={clientFilter}
        onChange={(event) =>
          onClientChange(event.target.value)
        }
        className="rounded-lg border border-[#303541] bg-[#1d2129] px-3 py-2.5 text-sm text-[#c8cdd7] outline-none transition focus:border-blue-500"
      >
        <option value="all">
          All Clients
        </option>

        {clients.map((client) => (
          <option
            key={client.id}
            value={client.id}
          >
            {client.company_name}
          </option>
        ))}
      </select>

      <select
        value={periodFilter}
        onChange={(event) =>
          onPeriodChange(
            event.target.value as PeriodFilter
          )
        }
        className="rounded-lg border border-[#303541] bg-[#1d2129] px-3 py-2.5 text-sm text-[#c8cdd7] outline-none transition focus:border-blue-500"
      >
        <option value="all">
          All Time
        </option>

        <option value="30d">
          Last 30 Days
        </option>

        <option value="90d">
          Last 90 Days
        </option>

        <option value="1y">
          Last Year
        </option>
      </select>

      <button
        type="button"
        onClick={onAddContact}
        className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        <Plus size={16} />

        Add Contact
      </button>
    </section>
  )
}
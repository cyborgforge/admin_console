import {
  Building2,
  Eye,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react"

import type { Contact } from "@/types/contacts"

type ContactsTableProps = {
  contacts: Contact[]
  totalContacts: number
  loading: boolean
  clientNameById: Map<string, string>
  onView: (contact: Contact) => void
}

const AVATAR_STYLES = [
  "bg-blue-500/15 text-blue-400",
  "bg-violet-500/15 text-violet-400",
  "bg-pink-500/15 text-pink-400",
  "bg-amber-500/15 text-amber-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-orange-500/15 text-orange-400",
]

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

function formatContactId(id: string) {
  if (!id) return "—"

  if (id.length <= 12) {
    return id
  }

  return `C-${id.slice(0, 8).toUpperCase()}`
}

function formatDate(value?: string) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ContactsTable({
  contacts,
  totalContacts,
  loading,
  clientNameById,
  onView,
}: ContactsTableProps) {
  return (
    <>
      <section className="mt-4 overflow-hidden rounded-xl border border-[#2d323c] bg-[#171a21]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className="bg-[#1f2229]">
              <tr className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#737a88]">
                <th className="px-4 py-3">
                  Contact ID
                </th>

                <th className="px-4 py-3">
                  Contact
                </th>

                <th className="px-4 py-3">
                  Designation
                </th>

                <th className="px-4 py-3">
                  Email
                </th>

                <th className="px-4 py-3">
                  Phone
                </th>

                <th className="px-4 py-3">
                  Client
                </th>

                <th className="px-4 py-3">
                  Added On
                </th>

                <th className="px-4 py-3 text-center">
                  View
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#242932]">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-20"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-[#777e8d]">
                      <Loader2
                        size={24}
                        className="animate-spin text-blue-400"
                      />

                      <span className="text-sm">
                        Loading contacts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-20 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-[#777e8d]">
                        <UserRound size={22} />
                      </div>

                      <h3 className="text-sm font-medium text-[#cdd1d9]">
                        No contacts found
                      </h3>

                      <p className="mt-1 text-xs text-[#707785]">
                        Try changing the filters or add a new contact.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact, index) => {
                  const clientName =
                    contact.clients?.company_name ??
                    clientNameById.get(
                      contact.client_id
                    ) ??
                    "—"

                  const contactPhone =
                    contact.mobile ||
                    contact.phone ||
                    "—"

                  return (
                    <tr
                      key={contact.id}
                      className="group bg-[#171a21] transition hover:bg-[#1d2129]"
                    >
                      <td
                        title={contact.id}
                        className="whitespace-nowrap px-4 py-3 text-xs font-medium text-[#8a919f]"
                      >
                        {formatContactId(
                          contact.id
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              AVATAR_STYLES[
                                index %
                                  AVATAR_STYLES.length
                              ]
                            }`}
                          >
                            {getInitials(
                              contact.name
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-medium text-[#d7dbe3]">
                              {contact.name}
                            </p>

                            <p className="mt-0.5 max-w-[180px] truncate text-xs text-[#737a88]">
                              {contact.department ||
                                clientName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#9ea5b2]">
                        {contact.designation ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex max-w-[210px] items-center gap-2 truncate text-sm text-[#9ea5b2] transition hover:text-blue-400"
                          >
                            <Mail
                              size={13}
                              className="shrink-0"
                            />

                            <span className="truncate">
                              {contact.email}
                            </span>
                          </a>
                        ) : (
                          <span className="text-sm text-[#676e7b]">
                            —
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#9ea5b2]">
                        {contactPhone}
                      </td>

                      <td className="px-4 py-3 text-sm text-[#9ea5b2]">
                        <div className="flex max-w-[180px] items-center gap-2">
                          <Building2
                            size={13}
                            className="shrink-0 text-[#696f7c]"
                          />

                          <span className="truncate">
                            {clientName}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#8e95a3]">
                        {formatDate(
                          contact.created_at
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            title="View contact"
                            onClick={() =>
                              onView(contact)
                            }
                            className="rounded-lg p-2 text-[#777e8d] transition hover:bg-blue-500/10 hover:text-blue-400"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!loading && contacts.length > 0 && (
        <div className="mt-3 text-right text-xs text-[#686f7d]">
          Showing {contacts.length} of{" "}
          {totalContacts} contacts
        </div>
      )}
    </>
  )
}
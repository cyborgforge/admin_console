"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { X } from "lucide-react"

import { getSupabaseClient } from "@/lib/supabaseClient"

import type {
  Contact,
  ContactDraft,
} from "@/types/contacts"

import {
  DEFAULT_CONTACT_DRAFT,
} from "@/types/contacts"

import ContactsStats from "@/components/contacts/ContactsStats"

import ContactsFilters, {
  type PeriodFilter,
} from "@/components/contacts/ContactsFilters"

import ContactsTable from "@/components/contacts/ContactsTable"

import ContactForm, {
  type ContactBranchOption,
  type ContactClientOption,
} from "@/components/contacts/ContactForm"

import ContactDetails from "@/components/contacts/ContactDetails"

import ActionNotification, {
  type ActionNotificationType,
} from "@/components/ui/ActionNotification"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ContactTab =
  | "all"
  | "complete"
  | "incomplete"

type ContactNotification = {
  id: number
  title: string
  message?: string
  type: ActionNotificationType
}

type ContactsResponse = {
  contacts?: Contact[]
  error?: string
}

type ClientsResponse = {
  clients?: ContactClientOption[]
  error?: string
}

type BranchesResponse = {
  branches?: ContactBranchOption[]
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function isContactComplete(
  contact: Contact
) {
  return Boolean(
    contact.name?.trim() &&
      contact.designation?.trim() &&
      contact.email?.trim() &&
      (
        contact.mobile?.trim() ||
        contact.phone?.trim()
      ) &&
      contact.client_id &&
      contact.branch_id
  )
}

function isWithinPeriod(
  createdAt: string,
  period: PeriodFilter
) {
  if (period === "all") {
    return true
  }

  const createdDate =
    new Date(createdAt)

  if (
    Number.isNaN(
      createdDate.getTime()
    )
  ) {
    return false
  }

  const days =
    period === "30d"
      ? 30
      : period === "90d"
        ? 90
        : 365

  const cutoff = new Date()

  cutoff.setDate(
    cutoff.getDate() - days
  )

  return createdDate >= cutoff
}

function contactToDraft(
  contact: Contact
): ContactDraft {
  return {
    name:
      contact.name ?? "",

    designation:
      contact.designation ?? "",

    department:
      contact.department ?? "",

    email:
      contact.email ?? "",

    mobile:
      contact.mobile ?? "",

    phone:
      contact.phone ?? "",

    linkedin:
      contact.linkedin ?? "",

    client_id:
      contact.client_id ?? "",

    branch_id:
      contact.branch_id ?? "",
  }
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function ContactsPage() {
  const [
    contacts,
    setContacts,
  ] =
    useState<Contact[]>([])

  const [
    clients,
    setClients,
  ] =
    useState<
      ContactClientOption[]
    >([])

  const [
    branches,
    setBranches,
  ] =
    useState<
      ContactBranchOption[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const [
    notification,
    setNotification,
  ] =
    useState<
      ContactNotification | null
    >(null)

  const [
    query,
    setQuery,
  ] =
    useState("")

  const [
    clientFilter,
    setClientFilter,
  ] =
    useState("all")

  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState<PeriodFilter>(
      "all"
    )

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ContactTab>(
      "all"
    )

  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(false)

  const [
    createDraft,
    setCreateDraft,
  ] =
    useState<ContactDraft>({
      ...DEFAULT_CONTACT_DRAFT,
    })

  const [
    selectedContact,
    setSelectedContact,
  ] =
    useState<Contact | null>(
      null
    )

  const [
    editDraft,
    setEditDraft,
  ] =
    useState<ContactDraft | null>(
      null
    )

  /* ------------------------------------------------------------------------ */
  /*                              NOTIFICATIONS                               */
  /* ------------------------------------------------------------------------ */

  function showNotification(
    title: string,
    message?: string,
    type: ActionNotificationType =
      "success"
  ) {
    setNotification({
      id: Date.now(),
      title,
      message,
      type,
    })
  }

  useEffect(() => {
    if (!notification) {
      return
    }

    const timer =
      window.setTimeout(
        () => {
          setNotification(null)
        },
        3500
      )

    return () => {
      window.clearTimeout(
        timer
      )
    }
  }, [notification])

  /* ------------------------------------------------------------------------ */
  /*                                  LOOKUPS                                 */
  /* ------------------------------------------------------------------------ */

  const clientNameById =
    useMemo(
      () =>
        new Map(
          clients.map(
            (client) => [
              client.id,
              client.company_name,
            ]
          )
        ),
      [clients]
    )

  const branchNameById =
    useMemo(
      () =>
        new Map(
          branches.map(
            (branch) => [
              branch.id,
              branch.branch_name,
            ]
          )
        ),
      [branches]
    )

  /* ------------------------------------------------------------------------ */
  /*                                   STATS                                  */
  /* ------------------------------------------------------------------------ */

  const stats =
    useMemo(() => {
      const reachable =
        contacts.filter(
          (contact) =>
            contact.email ||
            contact.mobile ||
            contact.phone
        ).length

      const complete =
        contacts.filter(
          isContactComplete
        ).length

      const clientsCovered =
        new Set(
          contacts
            .map(
              (contact) =>
                contact.client_id
            )
            .filter(Boolean)
        ).size

      return {
        total:
          contacts.length,

        reachable,

        complete,

        clientsCovered,
      }
    }, [contacts])

  const tabCounts =
    useMemo(
      () => ({
        all:
          contacts.length,

        complete:
          contacts.filter(
            isContactComplete
          ).length,

        incomplete:
          contacts.filter(
            (contact) =>
              !isContactComplete(
                contact
              )
          ).length,
      }),
      [contacts]
    )

  /* ------------------------------------------------------------------------ */
  /*                                 FILTERING                                */
  /* ------------------------------------------------------------------------ */

  const filteredContacts =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase()

      return contacts.filter(
        (contact) => {
          const clientName =
            contact.clients
              ?.company_name ??
            clientNameById.get(
              contact.client_id
            ) ??
            ""

          const branchName =
            branchNameById.get(
              contact.branch_id
            ) ?? ""

          const searchable =
            [
              contact.id,
              contact.name,
              contact.designation,
              contact.department,
              contact.email,
              contact.mobile,
              contact.phone,
              clientName,
              branchName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()

          const matchesSearch =
            !normalizedQuery ||
            searchable.includes(
              normalizedQuery
            )

          const matchesClient =
            clientFilter ===
              "all" ||
            contact.client_id ===
              clientFilter

          const matchesPeriod =
            isWithinPeriod(
              contact.created_at,
              periodFilter
            )

          const matchesTab =
            activeTab ===
              "all" ||
            (
              activeTab ===
              "complete"
                ? isContactComplete(
                    contact
                  )
                : !isContactComplete(
                    contact
                  )
            )

          return (
            matchesSearch &&
            matchesClient &&
            matchesPeriod &&
            matchesTab
          )
        }
      )
    }, [
      contacts,
      query,
      clientFilter,
      periodFilter,
      activeTab,
      clientNameById,
      branchNameById,
    ])

  /* ------------------------------------------------------------------------ */
  /*                              AUTHENTICATION                              */
  /* ------------------------------------------------------------------------ */

  async function getAccessToken() {
    const supabase =
      getSupabaseClient()

    const {
      data: { session },
    } =
      await supabase.auth.getSession()

    if (
      !session?.access_token
    ) {
      throw new Error(
        "Please sign in to manage contacts."
      )
    }

    return session.access_token
  }

  /* ------------------------------------------------------------------------ */
  /*                               INITIAL DATA                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const token =
          await getAccessToken()

        const headers = {
          Authorization:
            `Bearer ${token}`,
        }

        const [
          contactsResponse,
          clientsResponse,
          branchesResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/contacts",
              {
                headers,
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/clients",
              {
                headers,
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/branches",
              {
                headers,
                cache:
                  "no-store",
              }
            ),
          ])

        const contactsData =
          (await contactsResponse.json()) as ContactsResponse

        const clientsData =
          (await clientsResponse.json()) as ClientsResponse

        const branchesData =
          (await branchesResponse.json()) as BranchesResponse

        if (
          !contactsResponse.ok
        ) {
          throw new Error(
            contactsData.error ??
              "Failed to load contacts."
          )
        }

        if (
          !clientsResponse.ok
        ) {
          throw new Error(
            clientsData.error ??
              "Failed to load clients."
          )
        }

        if (
          !branchesResponse.ok
        ) {
          throw new Error(
            branchesData.error ??
              "Failed to load branches."
          )
        }

        setContacts(
          contactsData.contacts ??
            []
        )

        setClients(
          clientsData.clients ??
            []
        )

        setBranches(
          branchesData.branches ??
            []
        )
      } catch (
        caughtError
      ) {
        console.error(
          caughtError
        )

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Failed to load contacts."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                                  HELPER                                  */
  /* ------------------------------------------------------------------------ */

  function enrichContact(
    contact: Contact,
    clientId:
      string = contact.client_id
  ): Contact {
    const client =
      clients.find(
        (item) =>
          item.id === clientId
      )

    return {
      ...contact,

      clients:
        client
          ? {
              id:
                client.id,

              company_name:
                client.company_name,
            }
          : contact.clients,
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                  CREATE                                  */
  /* ------------------------------------------------------------------------ */

  function openCreate() {
    setError(null)

    setCreateDraft({
      ...DEFAULT_CONTACT_DRAFT,
    })

    setCreateOpen(true)
  }

  function closeCreate() {
    if (saving) {
      return
    }

    setCreateOpen(false)

    setCreateDraft({
      ...DEFAULT_CONTACT_DRAFT,
    })
  }

  async function createContact() {
    if (
      !createDraft.name.trim() ||
      !createDraft.client_id ||
      !createDraft.branch_id
    ) {
      setError(
        "Contact name, client and branch are required."
      )

      return
    }

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const response =
        await fetch(
          "/api/contacts",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                createDraft
              ),
          }
        )

      const data =
        (await response.json()) as {
          contact?: Contact
          error?: string
        }

      if (
        !response.ok ||
        !data.contact
      ) {
        throw new Error(
          data.error ??
            "Failed to create contact."
        )
      }

      const createdContact =
        enrichContact(
          data.contact,
          createDraft.client_id
        )

      setContacts(
        (current) => [
          createdContact,
          ...current,
        ]
      )

      showNotification(
        "Contact created",
        `"${createdContact.name}" was added successfully.`
      )

      setCreateOpen(false)

      setCreateDraft({
        ...DEFAULT_CONTACT_DRAFT,
      })
    } catch (
      caughtError
    ) {
      console.error(
        caughtError
      )

      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to create contact."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                   VIEW                                   */
  /* ------------------------------------------------------------------------ */

  function viewContact(
    contact: Contact
  ) {
    setError(null)

    setEditDraft(null)

    setSelectedContact(
      contact
    )
  }

  function closeContactModal() {
    if (saving) {
      return
    }

    setSelectedContact(null)
    setEditDraft(null)
  }

  /* ------------------------------------------------------------------------ */
  /*                                   EDIT                                   */
  /* ------------------------------------------------------------------------ */

  function startEditing() {
    if (!selectedContact) {
      return
    }

    setEditDraft(
      contactToDraft(
        selectedContact
      )
    )
  }

  async function updateContact() {
    if (
      !selectedContact ||
      !editDraft
    ) {
      return
    }

    if (
      !editDraft.name.trim() ||
      !editDraft.client_id ||
      !editDraft.branch_id
    ) {
      setError(
        "Contact name, client and branch are required."
      )

      return
    }

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const response =
        await fetch(
          `/api/contacts/${selectedContact.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                editDraft
              ),
          }
        )

      const data =
        (await response.json()) as {
          contact?: Contact
          error?: string
        }

      if (
        !response.ok ||
        !data.contact
      ) {
        throw new Error(
          data.error ??
            "Failed to update contact."
        )
      }

      const updatedContact =
        enrichContact(
          data.contact,
          editDraft.client_id
        )

      setContacts(
        (current) =>
          current.map(
            (contact) =>
              contact.id ===
              updatedContact.id
                ? updatedContact
                : contact
          )
      )

      showNotification(
        "Contact updated",
        `"${updatedContact.name}" changes were saved.`
      )

      /*
       * Successful save automatically
       * closes the edit/view modal.
       */
      setSelectedContact(null)
      setEditDraft(null)
    } catch (
      caughtError
    ) {
      console.error(
        caughtError
      )

      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to update contact."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                  DELETE                                  */
  /* ------------------------------------------------------------------------ */

  async function deleteContact() {
    if (!selectedContact) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const response =
        await fetch(
          `/api/contacts/${selectedContact.id}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const data =
        (await response.json()) as {
          error?: string
        }

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to delete contact."
        )
      }

      setContacts(
        (current) =>
          current.filter(
            (contact) =>
              contact.id !==
              selectedContact.id
          )
      )

      showNotification(
        "Contact deleted",
        `"${selectedContact.name}" was removed.`
      )

      setSelectedContact(null)
      setEditDraft(null)
    } catch (
      caughtError
    ) {
      console.error(
        caughtError
      )

      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to delete contact."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* -------------------------------------------------------------- */}
      {/* Enterprise Action Notification                                 */}
      {/* -------------------------------------------------------------- */}

      {notification && (
        <div className="pointer-events-none fixed right-5 top-20 z-[250] w-[calc(100%-2.5rem)] max-w-[370px]">
          <ActionNotification
            key={
              notification.id
            }
            title={
              notification.title
            }
            message={
              notification.message
            }
            type={
              notification.type
            }
            onClose={() =>
              setNotification(
                null
              )
            }
          />
        </div>
      )}

      <main className="min-h-screen bg-[#141416] px-4 py-5 sm:px-6">
        <ContactsStats
          total={
            stats.total
          }
          reachable={
            stats.reachable
          }
          complete={
            stats.complete
          }
          clientsCovered={
            stats.clientsCovered
          }
        />

        {/* Tabs */}

        <div className="mt-6 flex overflow-x-auto border-b border-[#282c34]">
          {(
            [
              [
                "all",
                "All",
              ],
              [
                "complete",
                "Complete",
              ],
              [
                "incomplete",
                "Incomplete",
              ],
            ] as const
          ).map(
            ([
              key,
              label,
            ]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    key
                  )
                }
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab ===
                  key
                    ? "text-[#d9dde5]"
                    : "text-[#777e8d] hover:text-[#b8bdc8]"
                }`}
              >
                {label}

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    activeTab ===
                    key
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-white/[0.04] text-[#747b8a]"
                  }`}
                >
                  {
                    tabCounts[
                      key
                    ]
                  }
                </span>

                {activeTab ===
                  key && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500" />
                )}
              </button>
            )
          )}
        </div>

        {/* Error */}

        {error && (
          <div className="mt-4 flex items-start justify-between rounded-lg border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="ml-4 text-red-400 transition hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <ContactsFilters
          query={
            query
          }
          clientFilter={
            clientFilter
          }
          periodFilter={
            periodFilter
          }
          clients={
            clients
          }
          onQueryChange={
            setQuery
          }
          onClientChange={
            setClientFilter
          }
          onPeriodChange={
            setPeriodFilter
          }
          onAddContact={
            openCreate
          }
        />

        <ContactsTable
          contacts={
            filteredContacts
          }
          totalContacts={
            contacts.length
          }
          loading={
            loading
          }
          clientNameById={
            clientNameById
          }
          onView={
            viewContact
          }
        />
      </main>

      {/* Create */}

      {createOpen && (
        <ContactForm
          title="Add Contact"
          description="Create a new client contact."
          draft={
            createDraft
          }
          clients={
            clients
          }
          branches={
            branches
          }
          saving={
            saving
          }
          submitLabel="Create Contact"
          onChange={
            setCreateDraft
          }
          onSubmit={
            createContact
          }
          onClose={
            closeCreate
          }
        />
      )}

      {/* View */}

      {selectedContact &&
        !editDraft && (
          <ContactDetails
            contact={
              selectedContact
            }
            clientName={
              selectedContact
                .clients
                ?.company_name ??
              clientNameById.get(
                selectedContact.client_id
              ) ??
              ""
            }
            branchName={
              branchNameById.get(
                selectedContact.branch_id
              ) ?? ""
            }
            saving={
              saving
            }
            onClose={
              closeContactModal
            }
            onEdit={
              startEditing
            }
            onDelete={
              deleteContact
            }
          />
        )}

      {/* Edit */}

      {selectedContact &&
        editDraft && (
          <ContactForm
            title="Edit Contact"
            description={
              selectedContact.name
            }
            draft={
              editDraft
            }
            clients={
              clients
            }
            branches={
              branches
            }
            saving={
              saving
            }
            submitLabel="Save Changes"
            onChange={(
              updatedDraft
            ) =>
              setEditDraft(
                updatedDraft
              )
            }
            onSubmit={
              updateContact
            }
            onClose={() => {
              if (!saving) {
                setEditDraft(
                  null
                )
              }
            }}
          />
        )}
    </>
  )
}
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { getSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { CreateClientPayload, Client } from "@/types/client"
import type { CreateQuotationPayload, Quotation, QuotationLineItem, UpdateQuotationPayload } from "@/types/quotation"

type CoreModule = {
  id: string
  name: string
  desc: string
  price: number
  isCore: boolean
}

type SupportItem = {
  id: string
  name: string
  desc: string
  options: { value: string; label: string }[]
  basePrice: number
  enabled: boolean
  selectedOption: string
}

const SUITE_CATALOGUE: Record<string, { core: CoreModule[]; addons: CoreModule[] }> = {
  pharmacy: {
    core: [
      { id: "outlet", name: "Outlet Management", desc: "Multi-outlet setup, branch control", price: 12000, isCore: true },
      { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts, barcode", price: 18000, isCore: true },
      { id: "admin", name: "Admin Panel", desc: "Centralised dashboard & reports", price: 10000, isCore: true },
      { id: "user", name: "User Management", desc: "Roles, permissions, staff login", price: 8000, isCore: true },
      { id: "delivery", name: "Delivery App", desc: "Driver app, route & status tracking", price: 9000, isCore: true },
    ],
    addons: [
      { id: "inventory", name: "Inventory Management", desc: "Stock levels, expiry tracking", price: 14000, isCore: false },
      { id: "online", name: "Online Ordering", desc: "Web & mobile ordering portal", price: 12000, isCore: false },
      { id: "hrms", name: "HRMS", desc: "Attendance, payroll, leaves", price: 10000, isCore: false },
      { id: "loyalty", name: "Loyalty Program", desc: "Points, offers, customer rewards", price: 7000, isCore: false },
      { id: "analytics", name: "Analytics Dashboard", desc: "Sales insights, trend reports", price: 11000, isCore: false },
    ],
  },
  clinic: {
    core: [
      { id: "emr", name: "EMR", desc: "Electronic medical records", price: 15000, isCore: true },
      { id: "appointments", name: "Appointments", desc: "Scheduling & reminders", price: 8000, isCore: true },
      { id: "billing", name: "Billing", desc: "Invoice & payments", price: 10000, isCore: true },
    ],
    addons: [
      { id: "prescription", name: "Digital Prescription", desc: "E-prescriptions, templates", price: 6000, isCore: false },
      { id: "lab", name: "Lab Integration", desc: "Results, reports sync", price: 12000, isCore: false },
      { id: "teleconsult", name: "Teleconsultation", desc: "Video consults", price: 9000, isCore: false },
    ],
  },
  retail: {
    core: [
      { id: "pos", name: "POS & Billing", desc: "Counter sales, receipts", price: 16000, isCore: true },
      { id: "inventory", name: "Inventory Management", desc: "Stock tracking", price: 12000, isCore: true },
    ],
    addons: [
      { id: "online", name: "Online Ordering", desc: "E-commerce portal", price: 14000, isCore: false },
      { id: "loyalty", name: "Loyalty Program", desc: "Points & rewards", price: 8000, isCore: false },
      { id: "analytics", name: "Analytics", desc: "Sales insights", price: 10000, isCore: false },
    ],
  },
}

const DEFAULT_SUPPORT_ITEMS: SupportItem[] = [
  {
    id: "onboard",
    name: "Onboarding & setup",
    desc: "Initial installation, data migration, go-live",
    options: [
      { value: "1", label: "1 session" },
      { value: "2", label: "2 sessions" },
      { value: "3", label: "3 sessions" },
    ],
    basePrice: 5000,
    enabled: true,
    selectedOption: "1",
  },
  {
    id: "training",
    name: "Staff training",
    desc: "On-site / remote training for end users",
    options: [
      { value: "1", label: "1 day" },
      { value: "2", label: "2 days" },
      { value: "3", label: "3 days" },
    ],
    basePrice: 3000,
    enabled: true,
    selectedOption: "1",
  },
  {
    id: "amc",
    name: "AMC — Annual maintenance",
    desc: "Bug fixes, updates, priority support",
    options: [
      { value: "1", label: "1 year" },
      { value: "2", label: "2 years" },
      { value: "3", label: "3 years" },
    ],
    basePrice: 8000,
    enabled: false,
    selectedOption: "1",
  },
  {
    id: "support",
    name: "24/7 support plan",
    desc: "Dedicated helpdesk + SLA response",
    options: [
      { value: "6", label: "6 months" },
      { value: "12", label: "12 months" },
    ],
    basePrice: 6000,
    enabled: false,
    selectedOption: "6",
  },
]

type NewQuoteDialogProps = {
  triggerClassName?: string
  mode?: "create" | "edit"
  open?: boolean
  hideTrigger?: boolean
  quotationToEdit?: Quotation | null
  initialClient?: {
    name: string
    organization: string
    email?: string
    phone?: string
  } | null
  onOpenChange?: (open: boolean) => void
  onSaveEdit?: (quotationId: string, payload: Omit<UpdateQuotationPayload, "id">) => Promise<void> | void
}

function getSuiteKey(productLabel: string) {
  const value = productLabel.toLowerCase()
  if (value.includes("clinic")) return "clinic"
  if (value.includes("retail")) return "retail"
  return "pharmacy"
}

function getProductLabel(suite: string) {
  if (suite === "clinic") return "Clinic Management Suite"
  if (suite === "retail") return "Retail Suite"
  return "Pharmacy Management Suite"
}

function getIndustryLabel(suite: string) {
  if (suite === "clinic") return "Healthcare / Clinic"
  if (suite === "retail") return "Retail"
  return "Pharmacy"
}

function normalizeClientValue(value: string) {
  return value.trim().toLowerCase()
}

export function NewQuoteDialog({
  triggerClassName,
  mode = "create",
  open,
  hideTrigger,
  quotationToEdit,
  initialClient,
  onOpenChange,
  onSaveEdit,
}: NewQuoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [client, setClient] = useState("")
  const [organization, setOrganization] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [product, setProduct] = useState("pharmacy")
  const [expiry, setExpiry] = useState("")
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState("0")

  // Core modules (can be removed)
  const [removedCores, setRemovedCores] = useState<Set<string>>(new Set())
  // Active addons
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())
  // Custom modules
  const [customModules, setCustomModules] = useState<{ name: string; price: number }[]>([])
  const [showCoreRestoreList, setShowCoreRestoreList] = useState(false)
  const [showAddonCatalogue, setShowAddonCatalogue] = useState(false)
  const [showCustomModuleForm, setShowCustomModuleForm] = useState(false)
  const [customModuleName, setCustomModuleName] = useState("")
  const [customModuleSuite, setCustomModuleSuite] = useState("pharmacy")
  const [customModulePrice, setCustomModulePrice] = useState("")
  // Support items
  const [supportItems, setSupportItems] = useState<SupportItem[]>(DEFAULT_SUPPORT_ITEMS.map((s) => ({ ...s })))

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationAttempted, setValidationAttempted] = useState(false)

  const clientSearchTerm = client.trim().toLowerCase()
  const matchedClients = useMemo(() => {
    if (!clientSearchTerm) {
      return [] as Client[]
    }

    const uniqueMatches = new Map<string, Client>()

    for (const clientRecord of clients) {
      const normalizedName = normalizeClientValue(clientRecord.name)
      const normalizedOrganization = normalizeClientValue(clientRecord.organization)
      const normalizedEmail = normalizeClientValue(clientRecord.email)

      if (!normalizedName) {
        continue
      }

      if (
        (normalizedName.includes(clientSearchTerm) ||
          normalizedOrganization.includes(clientSearchTerm) ||
          normalizedEmail.includes(clientSearchTerm)) &&
        !uniqueMatches.has(clientRecord.id)
      ) {
        uniqueMatches.set(clientRecord.id, clientRecord)
      }
    }

    return Array.from(uniqueMatches.values()).slice(0, 5)
  }, [clientSearchTerm, clients])

  const selectedClient = selectedClientId
    ? clients.find((item) => item.id === selectedClientId) ?? null
    : null

  const isOpen = typeof open === "boolean" ? open : internalOpen

  const setSheetOpen = (nextOpen: boolean) => {
    if (typeof open !== "boolean") {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const validateEmail = (emailValue: string) => {
    if (!emailValue.trim()) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue.toLowerCase())
  }

  const validatePhone = (phoneValue: string) => {
    if (!phoneValue.trim()) return false
    const digitsOnly = phoneValue.replace(/\D/g, "")
    return digitsOnly.length >= 10
  }

  const isClientInvalid = validationAttempted && !client.trim()
  const isOrganizationInvalid = validationAttempted && !organization.trim()
  const isEmailInvalid = validationAttempted && !validateEmail(email)
  const isPhoneInvalid = validationAttempted && !validatePhone(phone)
  const isProductInvalid = validationAttempted && !product.trim()
  const isExpiryInvalid = validationAttempted && !expiry.trim()
  const discountValue = Number(discount)
  const isDiscountInvalid = validationAttempted && (discount.trim() === "" || !Number.isFinite(discountValue) || discountValue < 0)

  const suite = SUITE_CATALOGUE[product] || SUITE_CATALOGUE.pharmacy

  const activeCoreModules = suite.core.filter((m) => !removedCores.has(m.id))
  const removedCoreModules = suite.core.filter((m) => removedCores.has(m.id))
  const activeAddonModules = suite.addons.filter((m) => activeAddons.has(m.id))
  const availableAddonModules = suite.addons.filter((m) => !activeAddons.has(m.id))

  const computedTotal = useMemo(() => {
    const coreTotal = activeCoreModules.reduce((sum, m) => sum + m.price, 0)
    const addonTotal = activeAddonModules.reduce((sum, m) => sum + m.price, 0)
    const customTotal = customModules.reduce((sum, m) => sum + m.price, 0)
    const modulesSubtotal = coreTotal + addonTotal + customTotal

    const supportTotal = supportItems
      .filter((s) => s.enabled)
      .reduce((sum, s) => sum + s.basePrice * Number(s.selectedOption), 0)

    const subtotal = modulesSubtotal + supportTotal
    const discountValue = Number(discount) || 0
    const clampedDiscount = Math.max(0, Math.min(subtotal, discountValue))
    const gst = Math.round((subtotal - clampedDiscount) * 0.18)

    return {
      modulesSubtotal,
      supportTotal,
      subtotal,
      gst,
      discount: clampedDiscount,
      total: subtotal - clampedDiscount + gst,
    }
  }, [activeCoreModules, activeAddonModules, customModules, supportItems, discount])

  const loadClients = useCallback(async () => {
    setClientsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) {
        throw new Error("Please sign in to load clients.")
      }

      const response = await fetch("/api/clients", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to load clients.")
      }

      const data = (await response.json()) as { clients?: Client[] }
      setClients(data.clients ?? [])
    } catch {
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }, [])

  const resetForm = () => {
    setClient("")
    setOrganization("")
    setEmail("")
    setPhone("")
    setProduct("pharmacy")
    setExpiry("")
    setNotes("")
    setDiscount("0")
    setRemovedCores(new Set())
    setShowCoreRestoreList(false)
    setActiveAddons(new Set())
    setCustomModules([])
    setShowAddonCatalogue(false)
    setShowCustomModuleForm(false)
    setShowClientDropdown(false)
    setSelectedClientId(null)
    setCustomModuleName("")
    setCustomModuleSuite("pharmacy")
    setCustomModulePrice("")
    setSupportItems(DEFAULT_SUPPORT_ITEMS.map((s) => ({ ...s })))
    setError(null)
    setValidationAttempted(false)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadClients()

    const handleClientChanged = () => {
      void loadClients()
    }

    window.addEventListener("client:changed", handleClientChanged)

    return () => {
      window.removeEventListener("client:changed", handleClientChanged)
    }
  }, [isOpen, loadClients])

  useEffect(() => {
    if (mode !== "edit" || !quotationToEdit || !isOpen) {
      return
    }

    const suiteKey = getSuiteKey(quotationToEdit.product)
    const suiteForEdit = SUITE_CATALOGUE[suiteKey] || SUITE_CATALOGUE.pharmacy
    const existingLineItems = quotationToEdit.lineItems ?? []

    const coreNames = new Set(suiteForEdit.core.map((item) => item.name))
    const addonNames = new Set(suiteForEdit.addons.map((item) => item.name))
    const supportNames = new Set(DEFAULT_SUPPORT_ITEMS.map((item) => item.name))

    const presentItemNames = new Set(existingLineItems.map((item) => item.name))
    const removedCoreIds = suiteForEdit.core
      .filter((item) => !presentItemNames.has(item.name))
      .map((item) => item.id)
    const activeAddonIds = suiteForEdit.addons
      .filter((item) => presentItemNames.has(item.name))
      .map((item) => item.id)

    const mappedSupportItems = DEFAULT_SUPPORT_ITEMS.map((defaultItem) => {
      const matched = existingLineItems.find((line) => line.name === defaultItem.name)
      return {
        ...defaultItem,
        enabled: Boolean(matched),
        selectedOption: matched ? String(matched.quantity) : defaultItem.selectedOption,
      }
    })

    const customLineItems = existingLineItems
      .filter(
        (item) =>
          !coreNames.has(item.name) &&
          !addonNames.has(item.name) &&
          !supportNames.has(item.name),
      )
      .map((item) => ({ name: item.name, price: item.unitPrice }))

    setClient(quotationToEdit.client)
    setOrganization(quotationToEdit.organization)
    setEmail(quotationToEdit.email ?? "")
    setPhone(quotationToEdit.phone ?? "")
    setProduct(suiteKey)
    setExpiry(quotationToEdit.expiry === "-" ? "" : quotationToEdit.expiry)
    setNotes(quotationToEdit.notes ?? "")
    setDiscount(String(quotationToEdit.discount ?? 0))
    setRemovedCores(new Set(removedCoreIds))
    setActiveAddons(new Set(activeAddonIds))
    setCustomModules(customLineItems)
    setSupportItems(mappedSupportItems)
    setShowClientDropdown(false)
    setShowCoreRestoreList(false)
    setShowAddonCatalogue(false)
    setShowCustomModuleForm(false)
    setCustomModuleName("")
    setCustomModuleSuite(suiteKey)
    setCustomModulePrice("")
    setError(null)
    setValidationAttempted(false)
    setSelectedClientId(null)
  }, [isOpen, mode, quotationToEdit])

  useEffect(() => {
    if (mode !== "create" || !isOpen || !initialClient) {
      return
    }

    setClient(initialClient.name)
    setOrganization(initialClient.organization)
    setEmail(initialClient.email ?? "")
    setPhone(initialClient.phone ?? "")
    setShowClientDropdown(false)
    setValidationAttempted(false)
  }, [initialClient, isOpen, mode])

  const applyClientSelection = (clientRecord: Client) => {
    setClient(clientRecord.name)
    setOrganization(clientRecord.organization)
    setEmail(clientRecord.email)
    setPhone(clientRecord.phone)
    setProduct(getSuiteKey(clientRecord.product))
    setSelectedClientId(clientRecord.id)
    setShowClientDropdown(false)
  }

  const handleSuiteChange = (newSuite: string) => {
    setProduct(newSuite)
    setRemovedCores(new Set())
    setShowCoreRestoreList(false)
    setActiveAddons(new Set())
    setShowAddonCatalogue(false)
    setShowCustomModuleForm(false)
    setCustomModuleSuite(newSuite)
  }

  const openCustomModuleForm = () => {
    setShowCustomModuleForm(true)
    setShowAddonCatalogue(false)
    setCustomModuleSuite(product)
  }

  const saveCustomModule = () => {
    const trimmedName = customModuleName.trim()
    const parsedPrice = Number(customModulePrice)

    if (!trimmedName || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return
    }

    setCustomModules((prev) => [...prev, { name: trimmedName, price: parsedPrice }])
    setCustomModuleName("")
    setCustomModulePrice("")
    setShowCustomModuleForm(false)
  }

  const removeCore = (id: string) => {
    setRemovedCores((prev) => new Set([...prev, id]))
  }

  const restoreCore = (id: string) => {
    setRemovedCores((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleAddon = (id: string) => {
    setActiveAddons((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSupportItem = (id: string) => {
    setSupportItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const updateSupportOption = (id: string, value: string) => {
    setSupportItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selectedOption: value } : s))
    )
  }

  const buildClientPayload = (productLabel: string): CreateClientPayload => ({
    name: client.trim(),
    role: "Owner",
    organization: organization.trim(),
    industry: getIndustryLabel(product),
    city: "Chennai",
    email: email.trim(),
    phone: phone.trim(),
    status: "prospect",
    product: productLabel,
    gst: "-",
    notes: notes.trim(),
  })

  async function submitQuotation(status?: "draft" | "sent") {
    setError(null)
    setValidationAttempted(true)

    const trimmedClient = client.trim()
    const trimmedOrganization = organization.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    const trimmedNotes = notes.trim()
    const trimmedExpiry = expiry.trim()
    const trimmedDiscount = discount.trim()
    const numericDiscount = Number(discount)
    const totalLineItems = activeCoreModules.length + activeAddonModules.length + customModules.length + supportItems.filter((item) => item.enabled).length

    if (
      !trimmedClient ||
      !trimmedOrganization ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedExpiry ||
      !product.trim() ||
      trimmedDiscount === "" ||
      !Number.isFinite(numericDiscount) ||
      numericDiscount < 0
    ) {
      setError("All quotation fields are mandatory.")
      return
    }

    if (totalLineItems === 0) {
      setError("Add at least one module or support item.")
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!validatePhone(trimmedPhone)) {
      setError("Please enter a valid phone number (minimum 10 digits).")
      return
    }

    setSubmitting(true)

    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("Please sign in before creating quotations.")
      }

      const productLabel = getProductLabel(product)
      const existingClient = selectedClient ?? clients.find((record) => normalizeClientValue(record.name) === normalizeClientValue(trimmedClient)) ?? null

      if (!existingClient) {
        const clientResponse = await fetch("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(buildClientPayload(productLabel)),
        })

        if (!clientResponse.ok) {
          const clientError = (await clientResponse.json()) as { error?: string }
          throw new Error(clientError.error ?? "Failed to create client from quotation details.")
        }

        const clientData = (await clientResponse.json()) as { client?: Client }
        const createdClient = clientData.client

        if (createdClient) {
          setClients((current) => {
            const filtered = current.filter((record) => record.id !== createdClient.id)
            return [createdClient, ...filtered]
          })
          setSelectedClientId(createdClient.id)
          window.dispatchEvent(new CustomEvent("client:changed", { detail: { client: createdClient } }))
        }
      }

      const lineItems: QuotationLineItem[] = [
        ...activeCoreModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...activeAddonModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...customModules.map((m) => ({ name: m.name, quantity: 1, unitPrice: m.price })),
        ...supportItems
          .filter((s) => s.enabled)
          .map((s) => ({ name: s.name, quantity: Number(s.selectedOption), unitPrice: s.basePrice })),
      ]

      const payload: CreateQuotationPayload = {
        client: trimmedClient,
        organization: trimmedOrganization,
        email: trimmedEmail,
        phone: trimmedPhone,
        product: productLabel,
        status,
        expiry: trimmedExpiry,
        discount: numericDiscount,
        lineItems,
        notes: trimmedNotes || undefined,
      }

      if (mode === "edit") {
        if (!quotationToEdit || !onSaveEdit) {
          throw new Error("Quotation details are missing for edit.")
        }

        const updatePayload: Omit<UpdateQuotationPayload, "id"> = {
          client: payload.client,
          organization: payload.organization,
          email: payload.email,
          phone: payload.phone,
          product: payload.product,
          expiry: payload.expiry,
          discount: payload.discount,
          lineItems: payload.lineItems,
          notes: payload.notes,
        }

        await onSaveEdit(quotationToEdit.id, updatePayload)
        window.dispatchEvent(new CustomEvent("quotation:changed"))
        toast.success("Quotation updated successfully.")
        setSheetOpen(false)
        resetForm()
        return
      }

      if (!status) {
        throw new Error("Status is required to create quotation.")
      }

      payload.status = status

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to create quotation.")
      }

      const createResponse = (await response.json()) as { quotation?: Quotation }

      if (status === "sent") {
        const createdQuotation = createResponse.quotation
        if (!createdQuotation) {
          throw new Error("Quotation created but failed to prepare email payload.")
        }

        const sendResponse = await fetch("/api/quotations/send-to-client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ quotation: createdQuotation }),
        })

        if (!sendResponse.ok) {
          const sendError = (await sendResponse.json()) as { error?: string }
          throw new Error(sendError.error ?? "Quotation created but failed to send email.")
        }
      }

      window.dispatchEvent(new CustomEvent("quotation:changed"))
      toast.success(status === "draft" ? "Quotation saved as draft." : "Quotation sent to client.")
      setSheetOpen(false)
      resetForm()
    } catch (submitError) {
      const message = submitError instanceof Error
        ? submitError.message
        : mode === "edit"
          ? "Failed to update quotation."
          : "Failed to create quotation."
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setSheetOpen(nextOpen)
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      {!hideTrigger ? (
        <SheetTrigger asChild>
          <Button className={triggerClassName}>
            <Plus size={13} />
            New Quote
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent side="right" className="panel quote-composer-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header quote-composer-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">
              {mode === "edit" ? "Edit Quotation" : "New Quotation"}
            </SheetTitle>
            <SheetDescription className="panel-subtitle">
              {mode === "edit" && quotationToEdit ? `${quotationToEdit.id} · ${quotationToEdit.status}` : "QT-2025-049 · Draft"}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close new quotation panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body quote-composer-body">
          {/* Client details */}
          <div>
            <div className="section-heading">Client details</div>
            <div className="form-row">
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">Client name</label>
                <div style={{ position: "relative" }}>
                  <Input
                    className="form-input"
                    placeholder="e.g. Apollo Pharmacy"
                    value={client}
                    onChange={(e) => {
                      setClient(e.target.value)
                      setSelectedClientId(null)
                      setShowClientDropdown(true)
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    style={{
                      borderColor: isClientInvalid ? "#ef4444" : undefined,
                      backgroundColor: isClientInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                    }}
                  />
                  {showClientDropdown && client.trim().length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#1e2229",
                        border: "1px solid #2a3b57",
                        borderTop: "none",
                        borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 50,
                        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {clientsLoading ? (
                        <div style={{ padding: "10px 12px", color: "#94a3b8", fontSize: "12px" }}>
                          Loading clients...
                        </div>
                      ) : matchedClients.length > 0 ? (
                        matchedClients.map((clientRecord) => (
                          <button
                            key={clientRecord.id}
                            type="button"
                            onClick={() => {
                              applyClientSelection(clientRecord)
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              textAlign: "left",
                              background: "transparent",
                              border: "none",
                              borderBottom: "1px solid #2a3b57",
                              color: "#e8eaf0",
                              cursor: "pointer",
                              fontSize: "13px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#252b32"
                              e.currentTarget.style.color = "#3b82f6"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent"
                              e.currentTarget.style.color = "#e8eaf0"
                            }}
                          >
                            <span style={{ display: "block" }}>{clientRecord.name}</span>
                            <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>
                              {clientRecord.organization}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: "10px 12px", color: "#94a3b8", fontSize: "12px" }}>
                          No existing client matches. A new client will be created when you save.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isClientInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Client name is required.
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Organisation</label>
                <Input
                  className="form-input"
                  placeholder="Company or hospital name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  style={{
                    borderColor: isOrganizationInvalid ? "#ef4444" : undefined,
                    backgroundColor: isOrganizationInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                />
                {isOrganizationInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Organisation name is required.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <Input
                  className="form-input"
                  type="email"
                  placeholder="billing@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    borderColor: isEmailInvalid ? "#ef4444" : undefined,
                    backgroundColor: isEmailInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                />
                {isEmailInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Please enter a valid email address.
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <Input
                  className="form-input"
                  placeholder="+91 98xxx xxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    borderColor: isPhoneInvalid ? "#ef4444" : undefined,
                    backgroundColor: isPhoneInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                />
                {isPhoneInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Please enter a valid phone number (minimum 10 digits).
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quote details */}
          <div>
            <div className="section-heading">Quote details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product suite</label>
                <select
                  className="form-input"
                  value={product}
                  onChange={(e) => handleSuiteChange(e.target.value)}
                  style={{
                    borderColor: isProductInvalid ? "#ef4444" : undefined,
                    backgroundColor: isProductInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                >
                  <option value="pharmacy">Pharmacy Management Suite</option>
                  <option value="clinic">Clinic Management Suite</option>
                  <option value="retail">Retail Suite</option>
                </select>
                {isProductInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Product suite is required.
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Valid until</label>
                <Input
                  className="form-input"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  style={{
                    borderColor: isExpiryInvalid ? "#ef4444" : undefined,
                    backgroundColor: isExpiryInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                />
                {isExpiryInvalid ? (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
                    Quote expiry date is required.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Core modules */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Core modules</div>
              <button
                type="button"
                className="add-line-btn addon-action-btn"
                style={{ padding: "4px 10px", fontSize: "11.5px", width: "auto", margin: 0 }}
                onClick={() => setShowCoreRestoreList((prev) => !prev)}
              >
                <Plus size={11} />
                Restore module
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {activeCoreModules.map((mod) => (
                <div
                  key={mod.id}
                  className="line-item"
                  style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                >
                  <div>
                    <div className="line-item-name">{mod.name}</div>
                    <div style={{ fontSize: "11px", color: "#4F5A6A" }}>{mod.desc}</div>
                  </div>
                  <span
                    className="module-badge-core"
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#3B82F61F",
                      color: "#3B82F6",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Core
                  </span>
                  <div className="line-item-price">{fmt(mod.price)}</div>
                  <button type="button" className="remove-item" onClick={() => removeCore(mod.id)} aria-label="Remove module">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {showCoreRestoreList ? (
              <div
                style={{
                  marginTop: "10px",
                  border: "1px solid #2A3B57",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#1E2229",
                }}
              >
                {removedCoreModules.length === 0 ? (
                  <div style={{ padding: "12px", color: "#4F5A6A", fontSize: "12px" }}>
                    All core modules are already in the quote.
                  </div>
                ) : (
                  removedCoreModules.map((mod, idx) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        restoreCore(mod.id)
                      }}
                      style={{
                        width: "100%",
                        border: "none",
                        borderTop: idx === 0 ? "none" : "1px solid #253650",
                        background: "transparent",
                        textAlign: "left",
                        padding: "10px 14px",
                        display: "grid",
                        gridTemplateColumns: "1fr 100px",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <span>
                        <span className="line-item-name" style={{ display: "block" }}>{mod.name}</span>
                        <span style={{ display: "block", fontSize: "11px", color: "#4F5A6A" }}>{mod.desc}</span>
                      </span>
                      <span className="line-item-price" style={{ alignSelf: "center", justifySelf: "end" }}>{fmt(mod.price)}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {/* Add-on modules */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Add-on modules</div>
              <span style={{ fontSize: "11px", color: "#4F5A6A" }}>Optional extras</span>
            </div>

            {/* Active addons */}
            {activeAddonModules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {activeAddonModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="line-item"
                    style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                  >
                    <div>
                      <div className="line-item-name">{mod.name}</div>
                      <div style={{ fontSize: "11px", color: "#4F5A6A" }}>{mod.desc}</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "var(--accent2-dim)",
                        color: "var(--accent2)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      Add-on
                    </span>
                    <div className="line-item-price">{fmt(mod.price)}</div>
                    <button type="button" className="remove-item" onClick={() => toggleAddon(mod.id)} aria-label="Remove module">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeAddonModules.length === 0 && (
              <div style={{ fontSize: "12px", color: "#4F5A6A", padding: "8px 0" }}>
                No add-ons selected yet.
              </div>
            )}

            {showCustomModuleForm ? (
              <div
                style={{
                  marginTop: "8px",
                  border: "1px solid #3B82F6",
                  borderRadius: "8px",
                  background: "#1E2229",
                  padding: "14px",
                }}
              >
                <div style={{ color: "#3B82F6", fontSize: "14px", marginBottom: "10px", fontWeight: 600 }}>
                  New custom module
                </div>
                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 110px", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Module name</label>
                    <Input
                      className="form-input"
                      placeholder="e.g. Loyalty Program"
                      value={customModuleName}
                      onChange={(e) => setCustomModuleName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suite mapping</label>
                    <select
                      className="form-input"
                      value={customModuleSuite}
                      onChange={(e) => setCustomModuleSuite(e.target.value)}
                    >
                      <option value="pharmacy">Pharmacy Management Suite</option>
                      <option value="clinic">Clinic Management Suite</option>
                      <option value="retail">Retail Suite</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (<span style={{ fontSize: "13px" }}>₹</span>)</label>
                    <Input
                      className="form-input quote-custom-price-input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={customModulePrice}
                      onChange={(e) => setCustomModulePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                  <Button
                    type="button"
                    variant="outline"
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowCustomModuleForm(false)
                      setCustomModuleName("")
                      setCustomModulePrice("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveCustomModule}
                    disabled={!customModuleName.trim() || !customModulePrice || Number(customModulePrice) <= 0}
                  >
                    Add module
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Add-on picker buttons */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="add-line-btn addon-action-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowAddonCatalogue((prev) => !prev)
                  setShowCustomModuleForm(false)
                }}
              >
                <Plus size={13} />
                Add from catalogue
              </button>
              <button
                type="button"
                className="add-line-btn addon-action-btn"
                style={{ flex: 1 }}
                onClick={openCustomModuleForm}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Type a custom module
              </button>
            </div>

            {showAddonCatalogue ? (
              <div
                style={{
                  marginTop: "10px",
                  border: "1px solid #2A3B57",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#1E2229",
                }}
              >
                {availableAddonModules.length === 0 ? (
                  <div style={{ padding: "12px", color: "#4F5A6A", fontSize: "12px" }}>
                    All catalogue modules are already added.
                  </div>
                ) : (
                  availableAddonModules.map((mod, idx) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleAddon(mod.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderTop: idx === 0 ? "none" : "1px solid #253650",
                        background: "transparent",
                        textAlign: "left",
                        padding: "10px 14px",
                        display: "grid",
                        gridTemplateColumns: "1fr 100px",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <span>
                        <span className="line-item-name" style={{ display: "block" }}>{mod.name}</span>
                        <span style={{ display: "block", fontSize: "11px", color: "#4F5A6A" }}>{mod.desc}</span>
                      </span>
                      <span className="line-item-price" style={{ alignSelf: "center", justifySelf: "end" }}>{fmt(mod.price)}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {/* Custom modules */}
            {customModules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {customModules.map((mod, idx) => (
                  <div
                    key={`custom-${idx}`}
                    className="line-item"
                    style={{ gridTemplateColumns: "1fr 80px 100px 28px" }}
                  >
                    <div>
                      <div className="line-item-name">{mod.name}</div>
                      <div style={{ fontSize: "11px", color: "#4F5A6A" }}>Custom module</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "var(--warn-dim)",
                        color: "var(--warn)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      Custom
                    </span>
                    <div className="line-item-price">{fmt(mod.price)}</div>
                    <button
                      type="button"
                      className="remove-item"
                      onClick={() => setCustomModules((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove module"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support & training */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Support & training</div>
              <span style={{ fontSize: "11px", color: "#4F5A6A" }}>Optional — recommended</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {supportItems.map((item) => (
                <div
                  key={item.id}
                  className="line-item"
                  style={{
                    gridTemplateColumns: "1fr 100px 110px 28px",
                    background: "#1E2229",
                    borderColor: "#253650",
                  }}
                >
                  <div>
                    <div className="line-item-name">{item.name}</div>
                    <div style={{ fontSize: "11px", color: "#4F5A6A" }}>{item.desc}</div>
                  </div>
                  <select
                    className="form-input"
                    style={{ padding: "4px 8px", fontSize: "12px", height: "32px" }}
                    value={item.selectedOption}
                    onChange={(e) => updateSupportOption(item.id, e.target.value)}
                  >
                    {item.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="line-item-price" style={{ color: item.enabled ? "#10B981" : "#4F5A6A" }}>
                    {fmt(item.basePrice * Number(item.selectedOption))}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => toggleSupportItem(item.id)}
                      style={{ accentColor: "#3B82F6", width: "14px", height: "14px" }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Modules subtotal</span>
              <span style={{ fontFamily: "var(--font-dm-mono)" }}>{fmt(computedTotal.modulesSubtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Support & training</span>
              <span style={{ fontFamily: "var(--font-dm-mono)" }}>{fmt(computedTotal.supportTotal)}</span>
            </div>
            <div className="summary-row">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Discount
                <input
                  className="quote-discount-input"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  style={{
                    width: "70px",
                    padding: "3px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    fontFamily: "var(--font-dm-mono)",
                    borderColor: isDiscountInvalid ? "#ef4444" : undefined,
                    backgroundColor: isDiscountInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                  }}
                />
                <span style={{ fontSize: "13px", color: "#4F5A6A" }}>₹</span>
              </span>
              <span style={{ fontFamily: "var(--font-dm-mono)", color: "#10B981" }}>− {fmt(computedTotal.discount)}</span>
            </div>
            {isDiscountInvalid ? (
              <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                Discount is required and must be zero or greater.
              </div>
            ) : null}
            <div className="summary-row">
              <span>GST (18%)</span>
              <span style={{ fontFamily: "var(--font-dm-mono)" }}>{fmt(computedTotal.gst)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{fmt(computedTotal.total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes to client</label>
            <Textarea
              className="form-input quote-notes"
              rows={3}
              placeholder="Add any terms, conditions or notes…"
              style={{ resize: "vertical" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        </div>

        <SheetFooter className="panel-footer quote-composer-footer">
          <SheetClose asChild>
            <Button className="btn btn-ghost" variant="outline" onClick={resetForm} disabled={submitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="btn btn-ghost quote-draft-btn"
            variant="outline"
            onClick={() => void submitQuotation(mode === "edit" ? undefined : "draft")}
            disabled={submitting}
          >
            {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Save as draft"}
          </Button>
          {mode === "create" ? (
            <Button
              className="btn btn-primary quote-send-btn"
              onClick={() => void submitQuotation("sent")}
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send to client →"}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

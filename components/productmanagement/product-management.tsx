"use client"

import React, {
  useEffect,
  useMemo,
  useState,
} from "react"

import * as Tabs from "@radix-ui/react-tabs"

import {
  Package,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react"

import { getSupabaseClient } from "@/lib/supabaseClient"

import {
  ItemKind,
  ItemStatus,
  ItemType,
  ProductModule,
  ProductService,
  AnyItem,
} from "./types"

import {
  formatINR,
  getInitials,
  typeConfig,
} from "./config"

import {
  StatusBadge,
  TypeBadge,
} from "./badges"

import {
  ColumnDef,
  DataTable,
} from "./data-table"

import { RadixSelect } from "./radix-select"
import { ViewItem } from "./view-item-dialog"
import { ItemFormDialog } from "./item-form-dialog"

import ActionNotification, {
  type ActionNotificationType,
} from "@/components/ui/ActionNotification"

import "./product-management.css"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ModulesResponse = {
  modules?: unknown[]
  module?: unknown
  error?: string
}

type ServicesResponse = {
  services?: unknown[]
  service?: unknown
  error?: string
}

/*
 * Database allows existing type values such as:
 *
 * Software
 * AMC
 * null
 *
 * Existing frontend types.ts only knows:
 *
 * core
 * add_on
 *
 * We therefore keep the ORIGINAL database value separately instead
 * of modifying the team-owned TypeScript types.
 */
type RawTypeMap = Record<string, string>

type ProductNotification = {
  id: number
  title: string
  message?: string
  type: ActionNotificationType
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function asRecord(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object"
  ) {
    return value as Record<
      string,
      unknown
    >
  }

  return {}
}

function asString(
  value: unknown,
  fallback = ""
) {
  return typeof value === "string"
    ? value
    : fallback
}

function asNumber(
  value: unknown,
  fallback = 0
) {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : fallback
}

/*
 * Only values actually supported by existing types.ts
 * are converted directly.
 *
 * Legacy values such as Software / AMC are stored
 * separately in rawTypeMap.
 */
function normalizeItemType(
  value: unknown
): ItemType {
  if (value === "add_on") {
    return "add_on"
  }

  return "core"
}

function normalizeStatus(
  value: unknown
): ItemStatus {
  return value === "inactive"
    ? "inactive"
    : "active"
}

function getDatabaseType(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function isSupportedFrontendType(
  value: string
): value is ItemType {
  return (
    value === "core" ||
    value === "add_on"
  )
}

/* -------------------------------------------------------------------------- */
/*                          DATABASE → FRONTEND                               */
/* -------------------------------------------------------------------------- */

function normalizeProduct(
  value: unknown
): ProductModule {
  const item = asRecord(value)

  return {
    id: asString(item.id),

    /*
     * IMPORTANT:
     * Actual Supabase uses:
     *
     * code
     * name
     *
     * Existing frontend type expects:
     *
     * product_code
     * product_name
     */
    product_code:
      asString(item.code),

    product_name:
      asString(item.name),

    description:
      asString(item.description),

    category:
      asString(item.category),

    type:
      normalizeItemType(
        item.type
      ),

    price:
      asNumber(item.price),

    tax_percentage:
      asNumber(
        item.tax_percentage
      ),

    status:
      normalizeStatus(
        item.status
      ),

    notes:
      asString(item.notes),

    created_at:
      asString(item.created_at),

    updated_at:
      asString(item.updated_at),

    created_by:
      asString(
        item.created_by,
        "—"
      ),
  }
}

function normalizeService(
  value: unknown
): ProductService {
  const item = asRecord(value)

  return {
    id:
      asString(item.id),

    /*
     * Actual Supabase:
     *
     * code
     * name
     *
     * Frontend type:
     *
     * service_code
     * service_name
     */
    service_code:
      asString(item.code),

    service_name:
      asString(item.name),

    description:
      asString(
        item.description
      ),

    category:
      asString(item.category),

    type:
      normalizeItemType(
        item.type
      ),

    /*
     * Existing types.ts contains duration,
     * but current DB does not.
     *
     * Keep empty rather than changing types.ts.
     */
    duration: "",

    price:
      asNumber(item.price),

    tax_percentage:
      asNumber(
        item.tax_percentage
      ),

    status:
      normalizeStatus(
        item.status
      ),

    notes:
      asString(item.notes),

    created_at:
      asString(item.created_at),

    updated_at:
      asString(item.updated_at),

    created_by:
      asString(
        item.created_by,
        "—"
      ),
  }
}

/* -------------------------------------------------------------------------- */
/*                       FRONTEND → UPDATE API                                */
/* -------------------------------------------------------------------------- */

function buildItemPayload(
  kind: ItemKind,
  item: AnyItem,
  originalDatabaseType: string
) {
  const shouldSendType =
    !originalDatabaseType ||
    isSupportedFrontendType(
      originalDatabaseType
    )

  if (kind === "product") {
    const product =
      item as ProductModule

    return {
      product_code:
        product.product_code.trim(),

      product_name:
        product.product_name.trim(),

      description:
        product.description.trim(),

      category:
        product.category.trim(),

      /*
       * Existing records with:
       *
       * Software
       * AMC
       * etc.
       *
       * must NOT accidentally become "core".
       */
      ...(shouldSendType
        ? {
            type:
              product.type,
          }
        : {}),

      price:
        product.price,

      tax_percentage:
        product.tax_percentage,

      status:
        product.status,

      notes:
        product.notes.trim(),
    }
  }

  const service =
    item as ProductService

  return {
    service_code:
      service.service_code.trim(),

    service_name:
      service.service_name.trim(),

    description:
      service.description.trim(),

    category:
      service.category.trim(),

    ...(shouldSendType
      ? {
          type:
            service.type,
        }
      : {}),

    price:
      service.price,

    tax_percentage:
      service.tax_percentage,

    status:
      service.status,

    notes:
      service.notes.trim(),
  }
}

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ProductManagement() {
  const [
    products,
    setProducts,
  ] =
    useState<ProductModule[]>(
      []
    )

  const [
    services,
    setServices,
  ] =
    useState<ProductService[]>(
      []
    )

  /*
   * Holds the actual DB type.
   *
   * Example keys:
   *
   * product:uuid → Software
   * service:uuid → AMC
   */
  const [
    rawTypes,
    setRawTypes,
  ] =
    useState<RawTypeMap>({})

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
      ProductNotification | null
    >(null)

  const [
    activeKind,
    setActiveKind,
  ] =
    useState<ItemKind>(
      "product"
    )

  const [
    productStatusTab,
    setProductStatusTab,
  ] =
    useState<
      "all" | ItemStatus
    >("all")

  const [
    serviceStatusTab,
    setServiceStatusTab,
  ] =
    useState<
      "all" | ItemStatus
    >("all")

  const [
    query,
    setQuery,
  ] =
    useState("")

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      "all" | ItemType
    >("all")

  const [
    viewing,
    setViewing,
  ] =
    useState<{
      kind: ItemKind
      data: AnyItem
    } | null>(null)

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false)

  const [
    editDraft,
    setEditDraft,
  ] =
    useState<
      AnyItem | null
    >(null)

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false)

  const [
    formKind,
    setFormKind,
  ] =
    useState<ItemKind>(
      "product"
    )

  const dataset =
    activeKind === "product"
      ? products
      : services

  /* ------------------------------------------------------------------------ */
  /*                             NOTIFICATIONS                                */
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
  /*                              AUTH TOKEN                                  */
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
        "Please sign in to manage products and services."
      )
    }

    return session.access_token
  }

  /* ------------------------------------------------------------------------ */
  /*                              LOAD DATA                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadItems() {
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
          productsResponse,
          servicesResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/products/modules",
              {
                headers,
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/products/services",
              {
                headers,
                cache:
                  "no-store",
              }
            ),
          ])

        const productsData =
          (await productsResponse.json()) as ModulesResponse

        const servicesData =
          (await servicesResponse.json()) as ServicesResponse

        if (
          !productsResponse.ok
        ) {
          throw new Error(
            productsData.error ??
              "Failed to load products."
          )
        }

        if (
          !servicesResponse.ok
        ) {
          throw new Error(
            servicesData.error ??
              "Failed to load services."
          )
        }

        const productRows =
          productsData.modules ??
          []

        const serviceRows =
          servicesData.services ??
          []

        setProducts(
          productRows.map(
            normalizeProduct
          )
        )

        setServices(
          serviceRows.map(
            normalizeService
          )
        )

        /*
         * Preserve raw DB type values.
         */
        const nextRawTypes:
          RawTypeMap = {}

        productRows.forEach(
          (value) => {
            const row =
              asRecord(value)

            const id =
              asString(row.id)

            if (!id) return

            nextRawTypes[
              `product:${id}`
            ] =
              getDatabaseType(
                row.type
              )
          }
        )

        serviceRows.forEach(
          (value) => {
            const row =
              asRecord(value)

            const id =
              asString(row.id)

            if (!id) return

            nextRawTypes[
              `service:${id}`
            ] =
              getDatabaseType(
                row.type
              )
          }
        )

        setRawTypes(
          nextRawTypes
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
            : "Failed to load product configuration."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadItems()
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                              STATISTICS                                  */
  /* ------------------------------------------------------------------------ */

  const stats =
    useMemo(
      () => ({
        total:
          dataset.length,

        active:
          dataset.filter(
            (item) =>
              item.status ===
              "active"
          ).length,

        inactive:
          dataset.filter(
            (item) =>
              item.status ===
              "inactive"
          ).length,

        core:
          dataset.filter(
            (item) =>
              item.type ===
              "core"
          ).length,
      }),
      [dataset]
    )

  const statusCounts =
    useMemo(
      () => ({
        all:
          dataset.length,

        active:
          dataset.filter(
            (item) =>
              item.status ===
              "active"
          ).length,

        inactive:
          dataset.filter(
            (item) =>
              item.status ===
              "inactive"
          ).length,
      }),
      [dataset]
    )

  /* ------------------------------------------------------------------------ */
  /*                               FILTERS                                    */
  /* ------------------------------------------------------------------------ */

  const filteredProducts =
    useMemo(
      () =>
        products.filter(
          (product) => {
            const searchable =
              `${product.id} ${product.product_name} ${product.product_code} ${product.category}`
                .toLowerCase()

            const matchesQuery =
              searchable.includes(
                query
                  .trim()
                  .toLowerCase()
              )

            const matchesStatus =
              productStatusTab ===
                "all" ||
              product.status ===
                productStatusTab

            const matchesType =
              typeFilter ===
                "all" ||
              product.type ===
                typeFilter

            return (
              matchesQuery &&
              matchesStatus &&
              matchesType
            )
          }
        ),
      [
        products,
        query,
        productStatusTab,
        typeFilter,
      ]
    )

  const filteredServices =
    useMemo(
      () =>
        services.filter(
          (service) => {
            const searchable =
              `${service.id} ${service.service_name} ${service.service_code} ${service.category}`
                .toLowerCase()

            const matchesQuery =
              searchable.includes(
                query
                  .trim()
                  .toLowerCase()
              )

            const matchesStatus =
              serviceStatusTab ===
                "all" ||
              service.status ===
                serviceStatusTab

            const matchesType =
              typeFilter ===
                "all" ||
              service.type ===
                typeFilter

            return (
              matchesQuery &&
              matchesStatus &&
              matchesType
            )
          }
        ),
      [
        services,
        query,
        serviceStatusTab,
        typeFilter,
      ]
    )

  /* ------------------------------------------------------------------------ */
  /*                              VIEW / EDIT                                 */
  /* ------------------------------------------------------------------------ */

  function openView(
    kind: ItemKind,
    data: AnyItem
  ) {
    setError(null)

    setViewing({
      kind,
      data: {
        ...data,
      },
    })

    setIsEditing(false)
    setEditDraft(null)
  }

  function startEdit() {
    if (
      !viewing ||
      saving
    ) {
      return
    }

    setEditDraft({
      ...viewing.data,
    })

    setIsEditing(true)
  }

  function cancelEdit() {
    if (saving) return

    setIsEditing(false)
    setEditDraft(null)
  }

  function closeView() {
    if (saving) return

    setViewing(null)
    setIsEditing(false)
    setEditDraft(null)
  }

  async function saveEdit() {
    if (
      !editDraft ||
      !viewing ||
      saving
    ) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const endpoint =
        viewing.kind ===
        "product"
          ? `/api/products/modules/${viewing.data.id}`
          : `/api/products/services/${viewing.data.id}`

      const originalDatabaseType =
        rawTypes[
          `${viewing.kind}:${viewing.data.id}`
        ] ?? ""

      const response =
        await fetch(
          endpoint,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                buildItemPayload(
                  viewing.kind,
                  editDraft,
                  originalDatabaseType
                )
              ),
          }
        )

      if (
        viewing.kind ===
        "product"
      ) {
        const data =
          (await response.json()) as ModulesResponse

        if (
          !response.ok ||
          !data.module
        ) {
          throw new Error(
            data.error ??
              "Failed to update product."
          )
        }

        const raw =
          asRecord(
            data.module
          )

        const updated =
          normalizeProduct(
            data.module
          )

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        )

        setRawTypes(
          (current) => ({
            ...current,

            [`product:${updated.id}`]:
              getDatabaseType(
                raw.type
              ),
          })
        )

        setViewing({
          kind:
            "product",

          data:
            updated,
        })
      } else {
        const data =
          (await response.json()) as ServicesResponse

        if (
          !response.ok ||
          !data.service
        ) {
          throw new Error(
            data.error ??
              "Failed to update service."
          )
        }

        const raw =
          asRecord(
            data.service
          )

        const updated =
          normalizeService(
            data.service
          )

        setServices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        )

        setRawTypes(
          (current) => ({
            ...current,

            [`service:${updated.id}`]:
              getDatabaseType(
                raw.type
              ),
          })
        )

        setViewing({
          kind:
            "service",

          data:
            updated,
        })
      }

      const updatedName =
        viewing.kind === "product"
          ? (
              editDraft as ProductModule
            ).product_name
          : (
              editDraft as ProductService
            ).service_name

      showNotification(
        viewing.kind === "product"
          ? "Product updated"
          : "Service updated",
        `"${updatedName}" changes were saved.`
      )

      setIsEditing(false)
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
          : "Failed to save changes."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                             STATUS UPDATE                                */
  /* ------------------------------------------------------------------------ */

  async function updateViewStatus(
    status: ItemStatus
  ) {
    if (
      !viewing ||
      saving ||
      viewing.data.status ===
        status
    ) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const endpoint =
        viewing.kind ===
        "product"
          ? `/api/products/modules/${viewing.data.id}`
          : `/api/products/services/${viewing.data.id}`

      /*
       * Send ONLY status.
       *
       * This guarantees legacy DB type
       * values are not modified.
       */
      const response =
        await fetch(
          endpoint,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        )

      if (
        viewing.kind ===
        "product"
      ) {
        const data =
          (await response.json()) as ModulesResponse

        if (
          !response.ok ||
          !data.module
        ) {
          throw new Error(
            data.error ??
              "Failed to update product status."
          )
        }

        const updated =
          normalizeProduct(
            data.module
          )

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        )

        setViewing({
          kind:
            "product",
          data:
            updated,
        })
      } else {
        const data =
          (await response.json()) as ServicesResponse

        if (
          !response.ok ||
          !data.service
        ) {
          throw new Error(
            data.error ??
              "Failed to update service status."
          )
        }

        const updated =
          normalizeService(
            data.service
          )

        setServices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        )

        setViewing({
          kind:
            "service",
          data:
            updated,
        })
      }

      const itemName =
        viewing.kind === "product"
          ? (
              viewing.data as ProductModule
            ).product_name
          : (
              viewing.data as ProductService
            ).service_name

      showNotification(
        "Status updated",
        `"${itemName}" is now ${
          status === "active"
            ? "Active"
            : "Inactive"
        }.`,
        "info"
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
          : "Failed to update status."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                DELETE                                    */
  /* ------------------------------------------------------------------------ */

  async function deleteItem() {
    if (
      !viewing ||
      saving
    ) {
      return
    }

    const itemName =
      viewing.kind ===
      "product"
        ? (
            viewing.data as ProductModule
          ).product_name
        : (
            viewing.data as ProductService
          ).service_name

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const endpoint =
        viewing.kind ===
        "product"
          ? `/api/products/modules/${viewing.data.id}`
          : `/api/products/services/${viewing.data.id}`

      const response =
        await fetch(
          endpoint,
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
          success?: boolean
          error?: string
        }

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to delete item."
        )
      }

      if (
        viewing.kind ===
        "product"
      ) {
        setProducts(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                viewing.data.id
            )
        )
      } else {
        setServices(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                viewing.data.id
            )
        )
      }

      setRawTypes(
        (current) => {
          const next = {
            ...current,
          }

          delete next[
            `${viewing.kind}:${viewing.data.id}`
          ]

          return next
        }
      )

      showNotification(
        viewing.kind === "product"
          ? "Product deleted"
          : "Service deleted",
        `"${itemName}" was removed.`
      )

      setViewing(null)
      setIsEditing(false)
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
          : "Failed to delete item."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                CREATE                                    */
  /* ------------------------------------------------------------------------ */

  function openNewForm(
    kind: ItemKind
  ) {
    setError(null)
    setFormKind(kind)
    setFormOpen(true)
  }

  async function createItem(
    kind: ItemKind,
    payload: Record<
      string,
      unknown
    >
  ) {
    if (saving) return

    try {
      setSaving(true)
      setError(null)

      const token =
        await getAccessToken()

      const isProduct =
        kind === "product"

      const endpoint =
        isProduct
          ? "/api/products/modules"
          : "/api/products/services"

      const apiPayload =
        isProduct
          ? {
              product_code:
                asString(
                  payload.code
                ).trim(),

              product_name:
                asString(
                  payload.name
                ).trim(),

              description:
                asString(
                  payload.description
                ).trim(),

              category:
                asString(
                  payload.category
                ).trim(),

              type:
                asString(
                  payload.type
                ),

              price:
                asNumber(
                  payload.price
                ),

              tax_percentage:
                asNumber(
                  payload.tax_percentage
                ),

              status:
                normalizeStatus(
                  payload.status
                ),

              notes:
                asString(
                  payload.notes
                ).trim(),
            }
          : {
              service_code:
                asString(
                  payload.code
                ).trim(),

              service_name:
                asString(
                  payload.name
                ).trim(),

              description:
                asString(
                  payload.description
                ).trim(),

              category:
                asString(
                  payload.category
                ).trim(),

              type:
                asString(
                  payload.type
                ),

              price:
                asNumber(
                  payload.price
                ),

              tax_percentage:
                asNumber(
                  payload.tax_percentage
                ),

              status:
                normalizeStatus(
                  payload.status
                ),

              notes:
                asString(
                  payload.notes
                ).trim(),
            }

      const response =
        await fetch(
          endpoint,
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
                apiPayload
              ),
          }
        )

      if (isProduct) {
        const data =
          (await response.json()) as ModulesResponse

        if (
          !response.ok ||
          !data.module
        ) {
          throw new Error(
            data.error ??
              "Failed to create product."
          )
        }

        const raw =
          asRecord(
            data.module
          )

        const created =
          normalizeProduct(
            data.module
          )

        setProducts(
          (current) => [
            created,
            ...current,
          ]
        )

        setRawTypes(
          (current) => ({
            ...current,

            [`product:${created.id}`]:
              getDatabaseType(
                raw.type
              ),
          })
        )

        showNotification(
          "Product created",
          `"${created.product_name}" was added successfully.`
        )
      } else {
        const data =
          (await response.json()) as ServicesResponse

        if (
          !response.ok ||
          !data.service
        ) {
          throw new Error(
            data.error ??
              "Failed to create service."
          )
        }

        const raw =
          asRecord(
            data.service
          )

        const created =
          normalizeService(
            data.service
          )

        setServices(
          (current) => [
            created,
            ...current,
          ]
        )

        setRawTypes(
          (current) => ({
            ...current,

            [`service:${created.id}`]:
              getDatabaseType(
                raw.type
              ),
          })
        )

        showNotification(
          "Service created",
          `"${created.service_name}" was added successfully.`
        )
      }

      setFormOpen(false)

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
          : "Failed to create item."
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                         TYPE DISPLAY HELPER                              */
  /* ------------------------------------------------------------------------ */

  function renderType(
    kind: ItemKind,
    item: AnyItem
  ) {
    const raw =
      rawTypes[
        `${kind}:${item.id}`
      ] ?? ""

    if (
      raw &&
      !isSupportedFrontendType(
        raw
      )
    ) {
      return (
        <span className="pm-muted">
          {raw}
        </span>
      )
    }

    return (
      <TypeBadge
        type={item.type}
      />
    )
  }

  /* ------------------------------------------------------------------------ */
  /*                                COLUMNS                                   */
  /* ------------------------------------------------------------------------ */

  const productColumns:
    ColumnDef<ProductModule>[] =
    [
      {
        key: "code",
        label: "CODE",

        render: (item) => (
          <span className="pm-code">
            {item.product_code}
          </span>
        ),
      },

      {
        key: "name",
        label: "NAME",

        render: (item) => (
          <div className="pm-name-cell">
            <div
              className="pm-avatar"
              style={{
                background:
                  `${typeConfig[item.type].color}22`,

                color:
                  typeConfig[item.type].color,
              }}
            >
              {getInitials(
                item.product_name
              )}
            </div>

            <div>
              <div className="pm-name">
                {
                  item.product_name
                }
              </div>

              <div className="pm-sub">
                {item.category ||
                  "—"}
              </div>
            </div>
          </div>
        ),
      },

      {
        key: "type",
        label: "TYPE",

        render: (item) =>
          renderType(
            "product",
            item
          ),
      },

      {
        key: "price",
        label: "PRICE",

        render: (item) => (
          <span className="pm-muted">
            {formatINR(
              item.price
            )}
          </span>
        ),
      },

      {
        key: "tax",
        label: "TAX %",

        render: (item) => (
          <span className="pm-muted">
            {
              item.tax_percentage
            }
            %
          </span>
        ),
      },

      {
        key: "status",
        label: "STATUS",

        render: (item) => (
          <StatusBadge
            status={
              item.status
            }
          />
        ),
      },
    ]

  const serviceColumns:
    ColumnDef<ProductService>[] =
    [
      {
        key: "code",
        label: "CODE",

        render: (item) => (
          <span className="pm-code">
            {item.service_code}
          </span>
        ),
      },

      {
        key: "name",
        label: "NAME",

        render: (item) => (
          <div className="pm-name-cell">
            <div
              className="pm-avatar"
              style={{
                background:
                  `${typeConfig[item.type].color}22`,

                color:
                  typeConfig[item.type].color,
              }}
            >
              {getInitials(
                item.service_name
              )}
            </div>

            <div>
              <div className="pm-name">
                {
                  item.service_name
                }
              </div>

              <div className="pm-sub">
                {item.category ||
                  "—"}
              </div>
            </div>
          </div>
        ),
      },

      {
        key: "type",
        label: "TYPE",

        render: (item) =>
          renderType(
            "service",
            item
          ),
      },

      {
        key: "price",
        label: "PRICE",

        render: (item) => (
          <span className="pm-muted">
            {formatINR(
              item.price
            )}
          </span>
        ),
      },

      {
        key: "tax",
        label: "TAX %",

        render: (item) => (
          <span className="pm-muted">
            {
              item.tax_percentage
            }
            %
          </span>
        ),
      },

      {
        key: "status",
        label: "STATUS",

        render: (item) => (
          <StatusBadge
            status={
              item.status
            }
          />
        ),
      },
    ]

  /* ------------------------------------------------------------------------ */
  /*                                RENDER                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <>
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

      <div className="pm-page-header">
        <h1 className="pm-page-title">
          Product Management
        </h1>

        <div className="pm-header-actions">
          <button
            type="button"
            className="pm-header-btn pm-header-btn-ghost"
            disabled={saving}
            onClick={() =>
              openNewForm(
                "service"
              )
            }
          >
            <Plus size={14} />

            New Service
          </button>

          <button
            type="button"
            className="pm-header-btn"
            disabled={saving}
            onClick={() =>
              openNewForm(
                "product"
              )
            }
          >
            <Plus size={14} />

            New Product
          </button>
        </div>
      </div>

      <div className="pm-content">
        {error && (
          <div className="mb-4 flex items-start justify-between rounded-lg border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="ml-4 text-red-400 hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}

        <div className="pm-stats">
          <div className="pm-stat-card">
            <div className="pm-stat-label">
              {activeKind ===
              "product"
                ? "TOTAL PRODUCTS"
                : "TOTAL SERVICES"}
            </div>

            <div className="pm-stat-val pm-stat-white">
              {stats.total}
            </div>

            <div className="pm-stat-sub">
              Across all categories
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="pm-stat-label">
              ACTIVE
            </div>

            <div className="pm-stat-val pm-stat-green">
              {stats.active}
            </div>

            <div className="pm-stat-change pm-up">
              ↑ Available for sale
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="pm-stat-label">
              INACTIVE
            </div>

            <div className="pm-stat-val pm-stat-amber">
              {stats.inactive}
            </div>

            <div className="pm-stat-sub">
              Hidden from quotes
            </div>
          </div>

          <div className="pm-stat-card">
            <div className="pm-stat-label">
              CORE{" "}
              {activeKind ===
              "product"
                ? "MODULES"
                : "SERVICES"}
            </div>

            <div className="pm-stat-val pm-stat-blue">
              {stats.core}
            </div>

            <div className="pm-stat-sub">
              Not add-ons
            </div>
          </div>
        </div>

        {/* Main Tabs */}

        <Tabs.Root
          value={activeKind}
          onValueChange={(
            value
          ) =>
            setActiveKind(
              value as ItemKind
            )
          }
        >
          <Tabs.List className="pm-main-tabs">
            <Tabs.Trigger
              value="product"
              className="pm-main-tab"
            >
              <Package size={14} />

              Products

              <span className="pm-main-tab-count">
                {
                  products.length
                }
              </span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="service"
              className="pm-main-tab"
            >
              <Wrench size={14} />

              Services

              <span className="pm-main-tab-count">
                {
                  services.length
                }
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Products */}

          <Tabs.Content
            value="product"
            className="pm-tab-content"
          >
            <Tabs.Root
              value={
                productStatusTab
              }
              onValueChange={(
                value
              ) =>
                setProductStatusTab(
                  value as
                    | "all"
                    | ItemStatus
                )
              }
            >
              <Tabs.List className="pm-subtabs">
                <Tabs.Trigger
                  value="all"
                  className="pm-subtab"
                >
                  All

                  <span className="pm-subtab-count">
                    {
                      products.length
                    }
                  </span>
                </Tabs.Trigger>

                <Tabs.Trigger
                  value="active"
                  className="pm-subtab"
                >
                  Active

                  <span className="pm-subtab-count">
                    {
                      products.filter(
                        (item) =>
                          item.status ===
                          "active"
                      ).length
                    }
                  </span>
                </Tabs.Trigger>

                <Tabs.Trigger
                  value="inactive"
                  className="pm-subtab"
                >
                  Inactive

                  <span className="pm-subtab-count">
                    {
                      products.filter(
                        (item) =>
                          item.status ===
                          "inactive"
                      ).length
                    }
                  </span>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div className="pm-filters">
              <div className="pm-search">
                <Search
                  size={13}
                  color="#3d4450"
                />

                <input
                  className="pm-search-input"
                  placeholder="Search by name, code, category..."
                  value={query}
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <RadixSelect
                value={typeFilter}
                onChange={(
                  value
                ) =>
                  setTypeFilter(
                    value as
                      | "all"
                      | ItemType
                  )
                }
                options={[
                  {
                    value:
                      "all",
                    label:
                      "All Types",
                  },
                  {
                    value:
                      "core",
                    label:
                      "Core",
                  },
                  {
                    value:
                      "add_on",
                    label:
                      "Add-on",
                  },
                ]}
                className="pm-select-trigger-w"
              />
            </div>

            <DataTable
              items={
                filteredProducts
              }
              columns={
                productColumns
              }
              onView={(item) =>
                openView(
                  "product",
                  item
                )
              }
              emptyIcon={
                loading
                  ? "⏳"
                  : "📦"
              }
              emptyLabel={
                loading
                  ? "Loading products..."
                  : "No products found"
              }
            />
          </Tabs.Content>

          {/* Services */}

          <Tabs.Content
            value="service"
            className="pm-tab-content"
          >
            <Tabs.Root
              value={
                serviceStatusTab
              }
              onValueChange={(
                value
              ) =>
                setServiceStatusTab(
                  value as
                    | "all"
                    | ItemStatus
                )
              }
            >
              <Tabs.List className="pm-subtabs">
                <Tabs.Trigger
                  value="all"
                  className="pm-subtab"
                >
                  All

                  <span className="pm-subtab-count">
                    {
                      services.length
                    }
                  </span>
                </Tabs.Trigger>

                <Tabs.Trigger
                  value="active"
                  className="pm-subtab"
                >
                  Active

                  <span className="pm-subtab-count">
                    {
                      services.filter(
                        (item) =>
                          item.status ===
                          "active"
                      ).length
                    }
                  </span>
                </Tabs.Trigger>

                <Tabs.Trigger
                  value="inactive"
                  className="pm-subtab"
                >
                  Inactive

                  <span className="pm-subtab-count">
                    {
                      services.filter(
                        (item) =>
                          item.status ===
                          "inactive"
                      ).length
                    }
                  </span>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div className="pm-filters">
              <div className="pm-search">
                <Search
                  size={13}
                  color="#3d4450"
                />

                <input
                  className="pm-search-input"
                  placeholder="Search by name, code, category..."
                  value={query}
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <RadixSelect
                value={typeFilter}
                onChange={(
                  value
                ) =>
                  setTypeFilter(
                    value as
                      | "all"
                      | ItemType
                  )
                }
                options={[
                  {
                    value:
                      "all",
                    label:
                      "All Types",
                  },
                  {
                    value:
                      "core",
                    label:
                      "Core",
                  },
                  {
                    value:
                      "add_on",
                    label:
                      "Add-on",
                  },
                ]}
                className="pm-select-trigger-w"
              />
            </div>

            <DataTable
              items={
                filteredServices
              }
              columns={
                serviceColumns
              }
              onView={(item) =>
                openView(
                  "service",
                  item
                )
              }
              emptyIcon={
                loading
                  ? "⏳"
                  : "🛠️"
              }
              emptyLabel={
                loading
                  ? "Loading services..."
                  : "No services found"
              }
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* View/Edit Dialog */}

      {viewing && (
        <ViewItem
          open={!!viewing}
          kind={
            viewing.kind
          }
          data={
            viewing.data
          }
          databaseType={
            rawTypes[
              `${viewing.kind}:${viewing.data.id}`
            ] ?? ""
          }
          isEditing={
            isEditing
          }
          editDraft={
            editDraft
          }
          saving={
            saving
          }
          onClose={
            closeView
          }
          onStartEdit={
            startEdit
          }
          onCancelEdit={
            cancelEdit
          }
          onSaveEdit={
            saveEdit
          }
          onDelete={
            deleteItem
          }
          onUpdateStatus={
            updateViewStatus
          }
          onDraftChange={(
            patch
          ) =>
            setEditDraft(
              (current) =>
                current
                  ? ({
                      ...current,
                      ...patch,
                    } as AnyItem)
                  : current
            )
          }
        />
      )}

      {/* Create Dialog */}

      {formOpen && (
        <ItemFormDialog
          open={
            formOpen
          }
          kind={
            formKind
          }
          saving={
            saving
          }
          onClose={() =>
            setFormOpen(false)
          }
          onCreate={
            createItem
          }
        />
      )}
    </>
  )
}
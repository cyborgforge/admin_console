"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  getSupabaseClient,
} from "@/lib/supabaseClient"

import type {
  Lead,
} from "@/app/(dashboard)/leads/page"

import type {
  LeadConversionPayload,
} from "@/components/leads/LeadConversionDialog"

type ConversionResponse = {
  success?: boolean

  alreadyConverted?: boolean

  conversion?: {
    clientId?: string
    branchId?: string
    contactId?: string | null
    dealId?: string
  }

  error?: string
}

export function useLeadConversion(
  lead: Lead
) {
  const router =
    useRouter()

  const [
    open,
    setOpen,
  ] =
    useState(false)

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

  function openConversion() {
    if (
      lead.status ===
      "closed-lost"
    ) {
      return
    }

    setError(null)
    setOpen(true)
  }

  function closeConversion() {
    if (saving) {
      return
    }

    setError(null)
    setOpen(false)
  }

  async function convertLead(
    payload:
      LeadConversionPayload
  ) {
    if (saving) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase =
        getSupabaseClient()

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      const token =
        session?.access_token

      if (!token) {
        throw new Error(
          "Please sign in to convert this lead."
        )
      }

      const response =
        await fetch(
          `/api/leads/${lead.id}/convert`,
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
                payload
              ),
          }
        )

      const data =
        (await response.json()) as
          ConversionResponse

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Failed to convert lead."
        )
      }

      const clientId =
        data.conversion
          ?.clientId

      if (!clientId) {
        throw new Error(
          "Lead was converted but no client ID was returned."
        )
      }

      setOpen(false)

      router.push(
        `/clients/${encodeURIComponent(
          clientId
        )}`
      )
    } catch (
      caughtError
    ) {
      console.error(
        "Lead conversion failed:",
        caughtError
      )

      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to convert lead."
      )
    } finally {
      setSaving(false)
    }
  }

  return {
    open,
    saving,
    error,
    openConversion,
    closeConversion,
    convertLead,
  }
}
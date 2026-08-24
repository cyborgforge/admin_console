import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

const LEADS_TABLE =
  process.env.SUPABASE_LEADS_TABLE ?? "leads"

const CLIENTS_TABLE =
  process.env.SUPABASE_CLIENTS_TABLE ?? "clients"

const BRANCHES_TABLE =
  process.env.SUPABASE_BRANCHES_TABLE ?? "branches"

const CONTACTS_TABLE =
  process.env.SUPABASE_CONTACTS_TABLE ?? "contacts"

const DEALS_TABLE =
  process.env.SUPABASE_DEALS_TABLE ?? "deals"

const MAX_NAME_LENGTH = 255

const MAX_EXPECTED_VALUE =
  9_999_999_999_999.99

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ConversionBody = {
  branchName?: unknown
  dealName?: unknown
  expectedValue?: unknown
}

type CreatedRecords = {
  clientId?: string
  branchId?: string
  contactId?: string
  dealId?: string
}

type ConversionDeal = {
  id: string
  client_id: string
  branch_id: string
  primary_contact_id: string | null
  created_at: string | null
}

class RouteError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)
    this.name = "RouteError"
    this.status = status
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readString(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim()
    : ""
}

function readNullableString(
  value: unknown
) {
  const normalized =
    readString(value)

  return normalized || null
}

function isUuid(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(
      value.trim()
    )
  )
}

function assertRequiredText(
  value: unknown,
  label: string,
  maxLength = MAX_NAME_LENGTH
) {
  const normalized =
    readString(value)

  if (!normalized) {
    throw new RouteError(
      422,
      `${label} is required.`
    )
  }

  if (
    [...normalized].length >
    maxLength
  ) {
    throw new RouteError(
      422,
      `${label} must be ${maxLength} characters or fewer.`
    )
  }

  return normalized
}

function parseExpectedValue(
  value: unknown
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null
  }

  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    throw new RouteError(
      422,
      "Expected value must be a valid non-negative amount."
    )
  }

  const raw =
    typeof value === "string"
      ? value.trim()
      : String(value)

  if (!raw) {
    return null
  }

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      raw
    )
  ) {
    throw new RouteError(
      422,
      "Expected value must be a non-negative amount with at most 2 decimal places."
    )
  }

  const amount =
    Number(raw)

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new RouteError(
      422,
      "Expected value must be a valid non-negative amount."
    )
  }

  if (
    amount >
    MAX_EXPECTED_VALUE
  ) {
    throw new RouteError(
      422,
      "Expected value is larger than the supported amount."
    )
  }

  return amount
}

function getAccessToken(
  request: Request
) {
  const authHeader =
    request.headers.get(
      "authorization"
    )

  if (
    !authHeader?.startsWith(
      "Bearer "
    )
  ) {
    return null
  }

  const token =
    authHeader
      .slice(7)
      .trim()

  return token || null
}

function escapeLikePattern(
  value: string
) {
  return value.replace(
    /[\\%_]/g,
    "\\$&"
  )
}

function sameText(
  left: unknown,
  right: string
) {
  return (
    readString(left)
      .toLocaleLowerCase() ===
    right.toLocaleLowerCase()
  )
}

async function readConversionBody(
  request: Request
) {
  let parsed: unknown

  try {
    parsed =
      await request.json()
  } catch {
    throw new RouteError(
      400,
      "Request body must be valid JSON."
    )
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new RouteError(
      400,
      "Request body must be a JSON object."
    )
  }

  return parsed as ConversionBody
}

/* -------------------------------------------------------------------------- */
/* Existing conversion                                                        */
/* -------------------------------------------------------------------------- */

async function loadConversionDeals(
  supabase: SupabaseClient,
  leadId: string
): Promise<ConversionDeal[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(DEALS_TABLE)
      .select(
        `
          id,
          client_id,
          branch_id,
          primary_contact_id,
          created_at
        `
      )
      .eq(
        "source_lead_id",
        leadId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      )
      .order(
        "id",
        {
          ascending: true,
        }
      )
      .limit(3)

  if (error) {
    throw new Error(
      `Failed to inspect existing lead conversion: ${error.message}`
    )
  }

  return (
    data ?? []
  ) as ConversionDeal[]
}

function validateExistingConversion(
  deal: ConversionDeal
) {
  if (
    !readString(deal.id) ||
    !readString(
      deal.client_id
    ) ||
    !readString(
      deal.branch_id
    )
  ) {
    throw new RouteError(
      409,
      "An existing conversion is incomplete. Please resolve the linked deal before converting this lead again."
    )
  }
}

function existingConversionResponse(
  deal: ConversionDeal
) {
  validateExistingConversion(
    deal
  )

  return NextResponse.json({
    success: true,

    alreadyConverted:
      true,

    conversion: {
      clientId:
        deal.client_id,

      branchId:
        deal.branch_id,

      contactId:
        deal.primary_contact_id,

      dealId:
        deal.id,
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Lead status synchronization                                                */
/* -------------------------------------------------------------------------- */

async function syncLeadClosedWon(
  supabase: SupabaseClient,
  leadId: string
) {
  /*
   * IMPORTANT:
   *
   * Leads in the existing CRM are shared authenticated
   * records. Existing GET/PUT/DELETE Lead APIs operate by
   * lead ID and do not restrict records by created_by.
   *
   * Conversion must follow the same contract.
   */

  const {
    data,
    error,
  } =
    await supabase
      .from(LEADS_TABLE)
      .update({
        status:
          "closed-won",
      })
      .eq(
        "id",
        leadId
      )
      .select("id")
      .maybeSingle()

  if (
    error ||
    !data
  ) {
    throw new Error(
      error?.message ??
        "Failed to synchronize the converted lead status."
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Rollback                                                                   */
/* -------------------------------------------------------------------------- */

async function hasReference(
  supabase: SupabaseClient,
  table: string,
  column: string,
  id: string,
  cleanupLabel: string
): Promise<
  boolean | null
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(table)
      .select("id")
      .eq(
        column,
        id
      )
      .limit(1)

  if (error) {
    console.error(
      `Lead conversion rollback: failed to check ${cleanupLabel} references:`,
      error
    )

    return null
  }

  return Boolean(
    data?.length
  )
}

async function cleanupCreatedRecords(
  supabase: SupabaseClient,
  created: CreatedRecords
) {
  if (
    created.dealId
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          DEALS_TABLE
        )
        .delete()
        .eq(
          "id",
          created.dealId
        )

    if (error) {
      console.error(
        "Lead conversion rollback: failed to delete deal:",
        error
      )
    }
  }

  if (
    created.contactId
  ) {
    const contactInUse =
      await hasReference(
        supabase,
        DEALS_TABLE,
        "primary_contact_id",
        created.contactId,
        "contact"
      )

    if (
      contactInUse ===
      false
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            CONTACTS_TABLE
          )
          .delete()
          .eq(
            "id",
            created.contactId
          )

      if (error) {
        console.error(
          "Lead conversion rollback: failed to delete contact:",
          error
        )
      }
    }
  }

  if (
    created.branchId
  ) {
    const branchUsedByDeal =
      await hasReference(
        supabase,
        DEALS_TABLE,
        "branch_id",
        created.branchId,
        "branch/deal"
      )

    const branchUsedByContact =
      await hasReference(
        supabase,
        CONTACTS_TABLE,
        "branch_id",
        created.branchId,
        "branch/contact"
      )

    if (
      branchUsedByDeal ===
        false &&
      branchUsedByContact ===
        false
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            BRANCHES_TABLE
          )
          .delete()
          .eq(
            "id",
            created.branchId
          )

      if (error) {
        console.error(
          "Lead conversion rollback: failed to delete branch:",
          error
        )
      }
    }
  }

  if (
    created.clientId
  ) {
    const clientUsedByDeal =
      await hasReference(
        supabase,
        DEALS_TABLE,
        "client_id",
        created.clientId,
        "client/deal"
      )

    const clientUsedByBranch =
      await hasReference(
        supabase,
        BRANCHES_TABLE,
        "client_id",
        created.clientId,
        "client/branch"
      )

    const clientUsedByContact =
      await hasReference(
        supabase,
        CONTACTS_TABLE,
        "client_id",
        created.clientId,
        "client/contact"
      )

    if (
      clientUsedByDeal ===
        false &&
      clientUsedByBranch ===
        false &&
      clientUsedByContact ===
        false
    ) {
      const {
        error,
      } =
        await supabase
          .from(
            CLIENTS_TABLE
          )
          .delete()
          .eq(
            "id",
            created.clientId
          )

      if (error) {
        console.error(
          "Lead conversion rollback: failed to delete client:",
          error
        )
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/leads/[id]/convert                                               */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  const created:
    CreatedRecords = {}

  let supabase:
    SupabaseClient | null =
    null

  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const accessToken =
      getAccessToken(
        request
      )

    if (
      !accessToken
    ) {
      throw new RouteError(
        401,
        "Missing access token."
      )
    }

    supabase =
      getSupabaseServerClient(
        accessToken
      )

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser(
        accessToken
      )

    if (
      authError ||
      !authData.user
    ) {
      throw new RouteError(
        401,
        "Invalid or expired session."
      )
    }

    const userId =
      authData.user.id

    /* ---------------------------------------------------------------------- */
    /* Request                                                                */
    /* ---------------------------------------------------------------------- */

    const {
      id: leadId,
    } =
      await params

    if (
      !isUuid(leadId)
    ) {
      throw new RouteError(
        400,
        "Invalid lead ID."
      )
    }

    const body =
      await readConversionBody(
        request
      )

    const branchName =
      assertRequiredText(
        body.branchName,
        "Branch name"
      )

    const dealName =
      assertRequiredText(
        body.dealName,
        "Deal name"
      )

    const expectedValue =
      parseExpectedValue(
        body.expectedValue
      )

    /* ---------------------------------------------------------------------- */
    /* Load canonical Lead                                                    */
    /* ---------------------------------------------------------------------- */

    /*
     * Do NOT filter using created_by.
     *
     * Existing Lead APIs expose Leads to authenticated CRM users
     * regardless of which user originally created the Lead.
     *
     * Filtering here would create an inconsistent state where:
     *
     *   GET /api/leads         -> Lead visible
     *   POST /convert          -> Lead not found
     */

    const {
      data: lead,
      error: leadError,
    } =
      await supabase
        .from(
          LEADS_TABLE
        )
        .select(
          `
            id,
            lead_name,
            company,
            job_title,
            email,
            phone,
            source,
            status,
            assigned_to,
            location_state,
            location_city,
            product_interest,
            created_by
          `
        )
        .eq(
          "id",
          leadId
        )
        .maybeSingle()

    if (
      leadError
    ) {
      throw new Error(
        `Failed to load lead: ${leadError.message}`
      )
    }

    if (!lead) {
      throw new RouteError(
        404,
        "Lead not found."
      )
    }

    /* ---------------------------------------------------------------------- */
    /* First idempotency check                                                */
    /* ---------------------------------------------------------------------- */

    const existingDeals =
      await loadConversionDeals(
        supabase,
        leadId
      )

    if (
      existingDeals.length >
      1
    ) {
      throw new RouteError(
        409,
        "Multiple deals are already linked to this lead. Please resolve the duplicate deals before converting it again."
      )
    }

    if (
      existingDeals.length ===
      1
    ) {
      const existingDeal =
        existingDeals[0]

      validateExistingConversion(
        existingDeal
      )

      if (
        lead.status !==
        "closed-won"
      ) {
        await syncLeadClosedWon(
          supabase,
          leadId
        )
      }

      return existingConversionResponse(
        existingDeal
      )
    }

    /* ---------------------------------------------------------------------- */
    /* Business rule                                                          */
    /* ---------------------------------------------------------------------- */

    if (
      lead.status ===
      "closed-lost"
    ) {
      throw new RouteError(
        409,
        "A Not Found lead cannot be converted. Change its status before creating a deal."
      )
    }

    /* ---------------------------------------------------------------------- */
    /* Lead values                                                            */
    /* ---------------------------------------------------------------------- */

    const companyName =
      assertRequiredText(
        lead.company,
        "Company name"
      )

    const contactName =
      assertRequiredText(
        lead.lead_name,
        "Lead name"
      )

    const email =
      readNullableString(
        lead.email
      )

    const phone =
      readNullableString(
        lead.phone
      )

    const city =
      readNullableString(
        lead.location_city
      )

    const state =
      readNullableString(
        lead.location_state
      )

    const assignedTo =
      isUuid(
        lead.assigned_to
      )
        ? lead.assigned_to.trim()
        : null

    /* ---------------------------------------------------------------------- */
    /* Client                                                                 */
    /* ---------------------------------------------------------------------- */

    const escapedCompanyName =
      escapeLikePattern(
        companyName
      )

    const {
      data:
        clientMatchesData,
      error:
        clientLookupError,
    } =
      await supabase
        .from(
          CLIENTS_TABLE
        )
        .select(
          `
            id,
            company_name
          `
        )
        .ilike(
          "company_name",
          escapedCompanyName
        )
        .limit(3)

    if (
      clientLookupError
    ) {
      throw new Error(
        `Failed to inspect clients: ${clientLookupError.message}`
      )
    }

    const clientMatches =
      (
        clientMatchesData ??
        []
      ).filter(
        (client) =>
          sameText(
            client.company_name,
            companyName
          )
      )

    if (
      clientMatches.length >
      1
    ) {
      throw new RouteError(
        409,
        `Multiple clients already exist with the company name "${companyName}". Resolve the duplicate clients before converting this lead.`
      )
    }

    let clientId =
      readString(
        clientMatches[0]?.id
      )

    if (!clientId) {
      const {
        data:
          createdClient,
        error:
          clientError,
      } =
        await supabase
          .from(
            CLIENTS_TABLE
          )
          .insert({
            company_name:
              companyName,

            email,

            phone,

            city,

            state,

            status:
              "prospect",

            /*
             * created_by is audit metadata for the NEW record.
             * It is not used as a Lead visibility boundary.
             */
            created_by:
              userId,
          })
          .select("id")
          .single()

      if (
        clientError ||
        !createdClient
      ) {
        throw new Error(
          clientError?.message ??
            "Failed to create client during conversion."
        )
      }

      clientId =
        readString(
          createdClient.id
        )

      if (!clientId) {
        throw new Error(
          "Client was created without a valid ID."
        )
      }

      created.clientId =
        clientId
    }

    /* ---------------------------------------------------------------------- */
    /* Branch                                                                 */
    /* ---------------------------------------------------------------------- */

    const escapedBranchName =
      escapeLikePattern(
        branchName
      )

    const {
      data:
        branchMatchesData,
      error:
        branchLookupError,
    } =
      await supabase
        .from(
          BRANCHES_TABLE
        )
        .select(
          `
            id,
            branch_name
          `
        )
        .eq(
          "client_id",
          clientId
        )
        .ilike(
          "branch_name",
          escapedBranchName
        )
        .limit(3)

    if (
      branchLookupError
    ) {
      throw new Error(
        `Failed to inspect branches: ${branchLookupError.message}`
      )
    }

    const branchMatches =
      (
        branchMatchesData ??
        []
      ).filter(
        (branch) =>
          sameText(
            branch.branch_name,
            branchName
          )
      )

    if (
      branchMatches.length >
      1
    ) {
      throw new RouteError(
        409,
        `Multiple branches named "${branchName}" already exist for this client. Resolve the duplicate branches before converting this lead.`
      )
    }

    let branchId =
      readString(
        branchMatches[0]?.id
      )

    if (!branchId) {
      const {
        data:
          createdBranch,
        error:
          branchError,
      } =
        await supabase
          .from(
            BRANCHES_TABLE
          )
          .insert({
            client_id:
              clientId,

            branch_name:
              branchName,

            city,

            state,

            created_by:
              userId,
          })
          .select("id")
          .single()

      if (
        branchError ||
        !createdBranch
      ) {
        throw new Error(
          branchError?.message ??
            "Failed to create branch during conversion."
        )
      }

      branchId =
        readString(
          createdBranch.id
        )

      if (!branchId) {
        throw new Error(
          "Branch was created without a valid ID."
        )
      }

      created.branchId =
        branchId
    }

    /* ---------------------------------------------------------------------- */
    /* Primary Contact                                                        */
    /* ---------------------------------------------------------------------- */

    let contactQuery =
      supabase
        .from(
          CONTACTS_TABLE
        )
        .select(
          `
            id,
            name,
            email
          `
        )
        .eq(
          "client_id",
          clientId
        )
        .eq(
          "branch_id",
          branchId
        )

    if (email) {
      contactQuery =
        contactQuery.ilike(
          "email",
          escapeLikePattern(
            email
          )
        )
    } else {
      contactQuery =
        contactQuery.ilike(
          "name",
          escapeLikePattern(
            contactName
          )
        )
    }

    const {
      data:
        contactMatchesData,
      error:
        contactLookupError,
    } =
      await contactQuery.limit(
        3
      )

    if (
      contactLookupError
    ) {
      throw new Error(
        `Failed to inspect contacts: ${contactLookupError.message}`
      )
    }

    const contactMatches =
      (
        contactMatchesData ??
        []
      ).filter(
        (contact) =>
          email
            ? sameText(
                contact.email,
                email
              )
            : sameText(
                contact.name,
                contactName
              )
      )

    if (
      contactMatches.length >
      1
    ) {
      throw new RouteError(
        409,
        email
          ? `Multiple contacts with email "${email}" already exist for this branch. Resolve the duplicate contacts before converting this lead.`
          : `Multiple contacts named "${contactName}" already exist for this branch. Resolve the duplicate contacts before converting this lead.`
      )
    }

    let contactId =
      readString(
        contactMatches[0]?.id
      )

    if (!contactId) {
      const {
        data:
          createdContact,
        error:
          contactError,
      } =
        await supabase
          .from(
            CONTACTS_TABLE
          )
          .insert({
            name:
              contactName,

            designation:
              readNullableString(
                lead.job_title
              ),

            email,

            phone,

            client_id:
              clientId,

            branch_id:
              branchId,

            created_by:
              userId,
          })
          .select("id")
          .single()

      if (
        contactError ||
        !createdContact
      ) {
        throw new Error(
          contactError?.message ??
            "Failed to create contact during conversion."
        )
      }

      contactId =
        readString(
          createdContact.id
        )

      if (!contactId) {
        throw new Error(
          "Contact was created without a valid ID."
        )
      }

      created.contactId =
        contactId
    }

    /* ---------------------------------------------------------------------- */
    /* Second idempotency check                                               */
    /* ---------------------------------------------------------------------- */

    const dealsBeforeInsert =
      await loadConversionDeals(
        supabase,
        leadId
      )

    if (
      dealsBeforeInsert.length >
      1
    ) {
      throw new RouteError(
        409,
        "Multiple deals were linked to this lead while it was being converted. Please resolve the duplicate deals before retrying."
      )
    }

    if (
      dealsBeforeInsert.length ===
      1
    ) {
      const concurrentDeal =
        dealsBeforeInsert[0]

      validateExistingConversion(
        concurrentDeal
      )

      await cleanupCreatedRecords(
        supabase,
        created
      )

      if (
        lead.status !==
        "closed-won"
      ) {
        await syncLeadClosedWon(
          supabase,
          leadId
        )
      }

      return existingConversionResponse(
        concurrentDeal
      )
    }

    /* ---------------------------------------------------------------------- */
    /* Description                                                            */
    /* ---------------------------------------------------------------------- */

    const productInterest =
      readString(
        lead.product_interest
      )

    const leadSource =
      readString(
        lead.source
      )

    const description =
      [
        `Converted from lead ${leadId}.`,

        productInterest
          ? `Product interest: ${productInterest}.`
          : null,

        leadSource
          ? `Lead source: ${leadSource}.`
          : null,
      ]
        .filter(Boolean)
        .join(" ")

    /* ---------------------------------------------------------------------- */
    /* Deal                                                                   */
    /* ---------------------------------------------------------------------- */

    const {
      data:
        createdDeal,
      error:
        dealError,
    } =
      await supabase
        .from(
          DEALS_TABLE
        )
        .insert({
          deal_name:
            dealName,

          client_id:
            clientId,

          branch_id:
            branchId,

          primary_contact_id:
            contactId ||
            null,

          stage:
            "new",

          expected_value:
            expectedValue,

          source_lead_id:
            leadId,

          assigned_to:
            assignedTo,

          description,

          created_by:
            userId,
        })
        .select(
          `
            id,
            client_id,
            branch_id,
            primary_contact_id,
            created_at
          `
        )
        .single()

    if (
      dealError ||
      !createdDeal
    ) {
      throw new Error(
        dealError?.message ??
          "Failed to create deal during conversion."
      )
    }

    const deal =
      createdDeal as ConversionDeal

    created.dealId =
      readString(
        deal.id
      )

    if (
      !created.dealId
    ) {
      throw new Error(
        "Deal was created without a valid ID."
      )
    }

    /* ---------------------------------------------------------------------- */
    /* Post-insert race check                                                 */
    /* ---------------------------------------------------------------------- */

    const dealsAfterInsert =
      await loadConversionDeals(
        supabase,
        leadId
      )

    if (
      dealsAfterInsert.length ===
      0
    ) {
      throw new Error(
        "The converted deal could not be verified after creation."
      )
    }

    const canonicalDeal =
      dealsAfterInsert[0]

    validateExistingConversion(
      canonicalDeal
    )

    if (
      canonicalDeal.id !==
      deal.id
    ) {
      const {
        error:
          duplicateDeleteError,
      } =
        await supabase
          .from(
            DEALS_TABLE
          )
          .delete()
          .eq(
            "id",
            deal.id
          )

      if (
        duplicateDeleteError
      ) {
        throw new Error(
          `A concurrent conversion was detected but the duplicate deal could not be removed: ${duplicateDeleteError.message}`
        )
      }

      created.dealId =
        undefined

      await cleanupCreatedRecords(
        supabase,
        created
      )

      await syncLeadClosedWon(
        supabase,
        leadId
      )

      return existingConversionResponse(
        canonicalDeal
      )
    }

    if (
      dealsAfterInsert.length >
      1
    ) {
      console.warn(
        `Lead conversion race detected for lead ${leadId}. Deal ${deal.id} is the canonical earliest deal.`
      )
    }

    /* ---------------------------------------------------------------------- */
    /* Finalize                                                               */
    /* ---------------------------------------------------------------------- */

    await syncLeadClosedWon(
      supabase,
      leadId
    )

    return NextResponse.json(
      {
        success: true,

        alreadyConverted:
          false,

        conversion: {
          clientId,

          branchId,

          contactId:
            contactId ||
            null,

          dealId:
            deal.id,
        },
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    if (supabase) {
      await cleanupCreatedRecords(
        supabase,
        created
      )
    }

    if (
      error instanceof
      RouteError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        }
      )
    }

    console.error(
      "Lead conversion failed:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Lead conversion failed. Please retry. If the problem continues, check the server logs.",
      },
      {
        status: 500,
      }
    )
  }
}
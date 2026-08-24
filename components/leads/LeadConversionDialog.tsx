"use client"

import {
  useState,
  type FormEvent,
} from "react"

import {
  X,
} from "lucide-react"

import type {
  Lead,
} from "@/app/(dashboard)/leads/page"

export type LeadConversionPayload = {
  branchName: string
  dealName: string
  expectedValue: number | null
}

interface LeadConversionDialogProps {
  lead: Lead
  saving: boolean
  error: string | null
  onClose: () => void

  onConvert: (
    payload: LeadConversionPayload
  ) => Promise<void>
}

export default function LeadConversionDialog({
  lead,
  saving,
  error,
  onClose,
  onConvert,
}: LeadConversionDialogProps) {
  const [
    branchName,
    setBranchName,
  ] = useState("")

  const [
    dealName,
    setDealName,
  ] = useState(
    `${
      lead.company ||
      lead.leadName
    } - Deal`
  )

  const [
    expectedValue,
    setExpectedValue,
  ] = useState("")

  const companyName =
    lead.company.trim()

  const leadName =
    lead.leadName.trim()

  const missingLeadData =
    !companyName ||
    !leadName

  const canSubmit =
    !saving &&
    !missingLeadData &&
    Boolean(
      branchName.trim()
    ) &&
    Boolean(
      dealName.trim()
    )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    const normalizedExpectedValue =
      expectedValue.trim()

    const amount =
      normalizedExpectedValue
        ? Number(
            normalizedExpectedValue
          )
        : null

    if (
      amount !== null &&
      (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      )
    ) {
      return
    }

    await onConvert({
      branchName:
        branchName.trim(),

      dealName:
        dealName.trim(),

      expectedValue:
        amount,
    })
  }

  function handleClose() {
    if (saving) {
      return
    }

    onClose()
  }

  return (
    <div
      className="lp-overlay"
      onClick={
        handleClose
      }
    >
      <div
        className="lp-dialog"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <form
          onSubmit={
            handleSubmit
          }
        >
          {/* Header */}

          <div className="lp-dialog-header">
            <div className="lp-dialog-title">
              Make Deal
            </div>

            <button
              type="button"
              className="lp-dialog-close disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close Make Deal"
              disabled={
                saving
              }
              onClick={
                handleClose
              }
            >
              <X
                size={14}
              />
            </button>
          </div>

          {/* Body */}

          <div className="lp-dialog-body">

            {/* Lead information */}

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#3d4450]">
                Lead Information
              </div>

              <div className="lp-view-grid">

                <div className="lp-view-field">
                  <div className="lp-view-field-label">
                    COMPANY
                  </div>

                  <div className="lp-view-field-val">
                    {
                      lead.company ||
                      "—"
                    }
                  </div>
                </div>

                <div className="lp-view-field">
                  <div className="lp-view-field-label">
                    CONTACT
                  </div>

                  <div className="lp-view-field-val">
                    {
                      lead.leadName ||
                      "—"
                    }
                  </div>
                </div>

                <div className="lp-view-field">
                  <div className="lp-view-field-label">
                    EMAIL
                  </div>

                  <div className="lp-view-field-val">
                    {
                      lead.email ||
                      "—"
                    }
                  </div>
                </div>

                <div className="lp-view-field">
                  <div className="lp-view-field-label">
                    PHONE
                  </div>

                  <div className="lp-view-field-val">
                    {
                      lead.phone ||
                      "—"
                    }
                  </div>
                </div>

              </div>
            </div>

            {/* Deal information */}

            <div className="mt-1">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#3d4450]">
                Deal Information
              </div>

              <div className="lp-field">
                <label
                  htmlFor="conversion-branch-name"
                >
                  Branch Name *
                </label>

                <input
                  id="conversion-branch-name"
                  autoFocus
                  value={
                    branchName
                  }
                  disabled={
                    saving
                  }
                  placeholder="Enter branch name"
                  onChange={(
                    event
                  ) =>
                    setBranchName(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="lp-field">
              <label
                htmlFor="conversion-deal-name"
              >
                Deal Name *
              </label>

              <input
                id="conversion-deal-name"
                value={
                  dealName
                }
                disabled={
                  saving
                }
                placeholder="Enter deal name"
                onChange={(
                  event
                ) =>
                  setDealName(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="lp-field">
              <label
                htmlFor="conversion-expected-value"
              >
                Expected Value
                <span className="ml-1 normal-case tracking-normal text-[#5a6070]">
                  (Optional)
                </span>
              </label>

              <input
                id="conversion-expected-value"
                type="number"
                min="0"
                step="0.01"
                value={
                  expectedValue
                }
                disabled={
                  saving
                }
                placeholder="₹ 0.00"
                onChange={(
                  event
                ) =>
                  setExpectedValue(
                    event.target.value
                  )
                }
              />
            </div>

            {/* Validation */}

            {missingLeadData && (
              <div className="rounded-[8px] border border-[#d3a33566] bg-[#d3a33512] px-3 py-2 text-[12px] text-[#d3a335]">
                Company name and lead name are required before creating a deal.
              </div>
            )}

            {/* Backend error */}

            {error && (
              <div
                role="alert"
                className="rounded-[8px] border border-[#c4606f66] bg-[#c4606f12] px-3 py-2 text-[12px] text-[#c4606f]"
              >
                {error}
              </div>
            )}

          </div>

          {/* Footer */}

          <div className="lp-dialog-footer">
            <button
              type="button"
              className="lp-btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                saving
              }
              onClick={
                handleClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="lp-btn-primary"
              disabled={
                !canSubmit
              }
            >
              {saving
                ? "Creating Deal..."
                : "Convert & Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
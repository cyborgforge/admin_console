"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { createSupportTicket } from "@/components/support/mock-data"
import { useAuth } from "@/hooks/use-auth"
import type { Ticket } from "./types"

interface CreateTicketDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (ticket: Ticket) => void
}

const CATEGORIES: { label: string; value: Ticket["category"] }[] = [
  { label: "Technical", value: "technical" },
  { label: "Bug", value: "bug" },
  { label: "Feature Request", value: "feature_request" },
  { label: "Billing", value: "billing" },
  { label: "Account", value: "account" },
  { label: "Onboarding", value: "onboarding" },
  { label: "Other", value: "other" },
]

const SOURCES: { label: string; value: Ticket["source"] }[] = [
  { label: "Portal", value: "portal" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "Chat", value: "chat" },
  { label: "System", value: "system" },
  { label: "Other", value: "other" },
]

const PRIORITIES: { label: string; value: Ticket["priority"] }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
]

export function CreateTicketDialog({ open, onClose, onCreated }: CreateTicketDialogProps) {
  const { user } = useAuth()

  const [form, setForm] = useState({
    subject: "",
    problem_statement: "",
    product_id: "",
    priority: "medium" as Ticket["priority"],
    category: "technical" as Ticket["category"],
    source: "portal" as Ticket["source"],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) {
      setError("Subject is required.")
      return
    }
    if (!form.problem_statement.trim()) {
      setError("Problem statement is required.")
      return
    }
    if (!form.product_id.trim()) {
      setError("Product ID is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const ticket = await createSupportTicket({
        user_id: user.id,
        product_id: form.product_id.trim(),
        subject: form.subject.trim(),
        problem_statement: form.problem_statement.trim(),
        priority: form.priority,
        category: form.category,
        source: form.source,
      })
      onCreated(ticket)
      // reset form
      setForm({
        subject: "",
        problem_statement: "",
        product_id: "",
        priority: "medium",
        category: "technical",
        source: "portal",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-[#2a3040] bg-[#161920] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#e8eaf0]">New Support Ticket</h3>
            <p className="text-xs text-[#4f5a6a] mt-0.5">Create a ticket and it will be assigned to you.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#2a3040] text-[#4f5a6a] hover:text-[#e8eaf0] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">
              Subject <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief description of the issue"
              value={form.subject}
              onChange={set("subject")}
              className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] placeholder-[#4f5a6a] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Problem Statement */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">
              Problem Statement <span className="text-[#ef4444]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe the problem in detail"
              value={form.problem_statement}
              onChange={set("problem_statement")}
              className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] placeholder-[#4f5a6a] focus:outline-none focus:border-[#3b82f6] resize-none"
            />
          </div>

          {/* Product ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">
              Product ID <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="Related product identifier"
              value={form.product_id}
              onChange={set("product_id")}
              className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] placeholder-[#4f5a6a] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Priority + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">Priority</label>
              <select
                value={form.priority}
                onChange={set("priority")}
                className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] focus:outline-none focus:border-[#3b82f6] cursor-pointer"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">Category</label>
              <select
                value={form.category}
                onChange={set("category")}
                className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] focus:outline-none focus:border-[#3b82f6] cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#4f5a6a] font-mono">Source</label>
            <select
              value={form.source}
              onChange={set("source")}
              className="px-3 py-2 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] focus:outline-none focus:border-[#3b82f6] cursor-pointer"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-ghost text-xs"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary text-xs flex items-center justify-center gap-1.5"
              disabled={saving}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

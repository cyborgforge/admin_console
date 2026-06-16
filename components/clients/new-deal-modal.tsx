"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"

interface NewDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (deal: {
    name: string
    value: number
    stage: "Prospect" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won"
    expectedCloseDate: string
    notes: string
  }) => void
}

export function NewDealModal({ isOpen, onClose, onSave }: NewDealModalProps) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [stage, setStage] = useState<"Prospect" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won">("Prospect")
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [notes, setNotes] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [animationState, setAnimationState] = useState<"hidden" | "entering" | "active" | "leaving">("hidden")

  useEffect(() => {
    if (isOpen) {
      setAnimationState("entering")
      const timer = setTimeout(() => setAnimationState("active"), 10)
      
      // Reset form fields
      setName("")
      setValue("")
      setStage("Prospect")
      setExpectedCloseDate("")
      setNotes("")
      setErrors({})
      setSubmitted(false)

      return () => clearTimeout(timer)
    } else if (animationState !== "hidden") {
      setAnimationState("leaving")
      const timer = setTimeout(() => setAnimationState("hidden"), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    setAnimationState("leaving")
    setTimeout(onClose, 200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = "Deal name is required"
    }

    const valNum = parseFloat(value)
    if (!value.trim()) {
      newErrors.value = "Deal value is required"
    } else if (isNaN(valNum) || valNum < 0) {
      newErrors.value = "Deal value must be a valid positive number"
    }

    if (!stage) {
      newErrors.stage = "Stage is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave({
      name: name.trim(),
      value: valNum,
      stage,
      expectedCloseDate,
      notes: notes.trim(),
    })
    handleClose()
  }

  if (animationState === "hidden") return null

  const overlayOpacity = animationState === "active" ? "opacity-100" : "opacity-0"
  const modalScale = animationState === "active" ? "scale-100 opacity-100" : "scale-95 opacity-0"

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ${overlayOpacity}`}
      onClick={handleClose}
      style={{ transitionProperty: "opacity" }}
    >
      <div
        className={`w-full max-w-lg bg-[#161920] border border-[#2a3040] rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${modalScale}`}
        onClick={(e) => e.stopPropagation()}
        style={{ transitionProperty: "transform, opacity" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2229]">
          <h2 className="text-sm font-semibold text-[#e8eaf0] uppercase tracking-wider font-mono">
            💼 New Deal
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-[#8b95a8] hover:text-[#e8eaf0] bg-transparent hover:bg-white/5 border-0 rounded-md cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Deal Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Deal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Pharmacy Suite Renewal - Bangalore HQ"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (submitted && e.target.value.trim()) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.name
                    return next
                  })
                }
              }}
              className={`bg-[#1e2229] border rounded-md px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4f5a6a] outline-none transition-colors ${
                errors.name ? "border-red-500/80 focus:border-red-500" : "border-[#2a3040] focus:border-[#3b82f6]"
              }`}
            />
            {errors.name && (
              <span className="text-xs text-red-400 mt-0.5">{errors.name}</span>
            )}
          </div>

          {/* Deal Value */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Deal Value (₹)
            </label>
            <input
              type="text"
              placeholder="e.g. 65000"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (submitted && e.target.value.trim() && !isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) >= 0) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.value
                    return next
                  })
                }
              }}
              className={`bg-[#1e2229] border rounded-md px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4f5a6a] outline-none transition-colors ${
                errors.value ? "border-red-500/80 focus:border-red-500" : "border-[#2a3040] focus:border-[#3b82f6]"
              }`}
            />
            {errors.value && (
              <span className="text-xs text-red-400 mt-0.5">{errors.value}</span>
            )}
          </div>

          {/* Stage & Expected Close Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] outline-none focus:border-[#3b82f6] transition-colors cursor-pointer"
              >
                <option value="Prospect">Prospect</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
              </select>
            </div>

            {/* Expected Close Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
                Expected Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add details, next steps, or customer feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4f5a6a] outline-none focus:border-[#3b82f6] resize-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e2229]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-[#2a3040] bg-transparent text-[#8b95a8] hover:text-[#e8eaf0] hover:bg-white/5 rounded-md text-sm font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-md text-sm font-medium border-0 cursor-pointer transition-colors"
            >
              Save Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

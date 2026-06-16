"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: {
    type: "Call" | "Email" | "Meeting" | "Task" | "Note"
    title: string
    description: string
    dateTime: string
    assignedUser: string
  }) => void
}

export function AddActivityModal({ isOpen, onClose, onSave }: AddActivityModalProps) {
  const [type, setType] = useState<"Call" | "Email" | "Meeting" | "Task" | "Note">("Call")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [assignedUser, setAssignedUser] = useState("Sujjeeth")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [animationState, setAnimationState] = useState<"hidden" | "entering" | "active" | "leaving">("hidden")

  useEffect(() => {
    if (isOpen) {
      setAnimationState("entering")
      const timer = setTimeout(() => setAnimationState("active"), 10)
      
      // Reset form fields on open
      setType("Call")
      setTitle("")
      setDescription("")
      setDateTime("")
      setAssignedUser("Sujjeeth")
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
    if (!title.trim()) {
      newErrors.title = "Activity title is required"
    }
    if (!dateTime) {
      newErrors.dateTime = "Date and time are required"
    }
    if (!assignedUser.trim()) {
      newErrors.assignedUser = "Assigned user is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave({
      type,
      title: title.trim(),
      description: description.trim(),
      dateTime,
      assignedUser: assignedUser.trim(),
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
            📞 Add Activity
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
          {/* Activity Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Activity Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] outline-none focus:border-[#3b82f6] transition-colors cursor-pointer"
            >
              <option value="Call">📞 Call</option>
              <option value="Email">📧 Email</option>
              <option value="Meeting">🤝 Meeting</option>
              <option value="Task">☑️ Task</option>
              <option value="Note">📝 Note</option>
            </select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Discussed subscription renewal options"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (submitted && e.target.value.trim()) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.title
                    return next
                  })
                }
              }}
              className={`bg-[#1e2229] border rounded-md px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4f5a6a] outline-none transition-colors ${
                errors.title ? "border-red-500/80 focus:border-red-500" : "border-[#2a3040] focus:border-[#3b82f6]"
              }`}
            />
            {errors.title && (
              <span className="text-xs text-red-400 mt-0.5">{errors.title}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide a detailed description of the activity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4f5a6a] outline-none focus:border-[#3b82f6] resize-none transition-colors"
            />
          </div>

          {/* Date & Time and Assigned User Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => {
                  setDateTime(e.target.value)
                  if (submitted && e.target.value) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.dateTime
                      return next
                    })
                  }
                }}
                className={`bg-[#1e2229] border rounded-md px-3 py-2 text-sm text-[#e8eaf0] outline-none transition-colors ${
                  errors.dateTime ? "border-red-500/80 focus:border-red-500" : "border-[#2a3040] focus:border-[#3b82f6]"
                }`}
              />
              {errors.dateTime && (
                <span className="text-xs text-red-400 mt-0.5">{errors.dateTime}</span>
              )}
            </div>

            {/* Assigned User */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#4f5a6a] uppercase tracking-wider font-mono">
                Assigned User
              </label>
              <select
                value={assignedUser}
                onChange={(e) => {
                  setAssignedUser(e.target.value)
                  if (submitted && e.target.value.trim()) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.assignedUser
                      return next
                    })
                  }
                }}
                className="bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-[#e8eaf0] outline-none focus:border-[#3b82f6] transition-colors cursor-pointer"
              >
                <option value="Sujjeeth">Sujjeeth</option>
                <option value="Hari">Hari</option>
                <option value="Priya">Priya</option>
                <option value="Ramesh Kumar">Ramesh Kumar</option>
              </select>
            </div>
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
              Save Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import React, { useState } from "react"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string) => void
}

export function NewTaskModal({
  isOpen,
  onClose,
  onSave,
}: NewTaskModalProps) {
  const [text, setText] = useState("")

  if (!isOpen) return null

  const handleSave = () => {
    if (!text.trim()) return

    onSave(text.trim())
    setText("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#161920] border border-[#2a3040] rounded-xl p-5 w-full max-w-md">
        <h2 className="text-sm font-semibold mb-4 text-white">
          Add New Task
        </h2>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task description"
          className="w-full bg-[#1e2229] border border-[#2a3040] rounded-md px-3 py-2 text-sm text-white"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="lp-btn-ghost"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="lp-btn-primary"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Lock, Plus, Loader2 } from "lucide-react"
import type { InternalNote } from "./types"

interface SupportInternalNotesProps {
  notes: InternalNote[]
  onAddNote?: (content: string) => Promise<void> | void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function SupportInternalNotes({ notes, onAddNote }: SupportInternalNotesProps) {
  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAddNote = async () => {
    const trimmed = newNote.trim()
    if (!trimmed || !onAddNote) return
    setSaving(true)
    try {
      await onAddNote(trimmed)
      setNewNote("")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleAddNote()
    }
  }

  return (
    <div className="rounded-lg border border-[#2a3040] bg-[#161920] p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
          <Lock size={10} className="text-[#8b95a8]" />
          <span>Internal Notes</span>
        </div>
        <span className="text-[10px] font-mono text-[#4f5a6a]">{notes.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="text-xs text-[#8b95a8] italic">No internal notes yet.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0]"
              >
                <p className="leading-relaxed">{note.content}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[#4f5a6a]">
                  <span className="font-mono">
                    {note.creator?.name ?? note.created_by.slice(0, 8)}
                  </span>
                  <span>·</span>
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            placeholder="Add internal note... (Enter to save)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="flex-1 px-2.5 py-1.5 rounded bg-[#1e2229] border border-[#2a3040] text-xs text-[#e8eaf0] placeholder-[#4f5a6a] focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void handleAddNote()}
            disabled={saving || !newNote.trim()}
            className="p-1.5 rounded bg-[#2a3040] hover:bg-[#35404f] text-[#e8eaf0] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

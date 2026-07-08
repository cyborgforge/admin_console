"use client"

import { useState } from "react"
import { Bold, Italic, Paperclip, Loader2 } from "lucide-react"

interface SupportResponseBoxProps {
  clientName: string
  onSendResponse?: (text: string) => Promise<void> | void
}

export function SupportResponseBox({ clientName, onSendResponse }: SupportResponseBoxProps) {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSendResponse?.(trimmed)
      setText("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 mt-6">
      <div className="text-[10px] font-medium tracking-wider text-[#4f5a6a] uppercase font-mono">
        Write Response
      </div>

      <div className="rounded-lg border border-[#2a3040] bg-[#161920] overflow-hidden focus-within:border-[#3b82f6]/50 transition-colors">
        <textarea
          rows={5}
          placeholder={`Type your response to ${clientName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          className="w-full p-4 bg-transparent border-0 text-[#e8eaf0] placeholder-[#4f5a6a] text-sm focus:outline-none resize-none disabled:opacity-60"
        />

        <div className="flex justify-between items-center px-4 py-3 border-t border-[#2a3040] bg-[#1a1e27]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#252b34] text-[#8b95a8] hover:text-[#e8eaf0] transition-colors cursor-pointer"
              aria-label="Bold text"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#252b34] text-[#8b95a8] hover:text-[#e8eaf0] transition-colors cursor-pointer"
              aria-label="Italic text"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-[#252b34] text-[#8b95a8] hover:text-[#e8eaf0] transition-colors cursor-pointer"
              aria-label="Attach file"
            >
              <Paperclip size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !text.trim()}
            className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] active:translate-y-px rounded text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {sending && <Loader2 size={12} className="animate-spin" />}
            Send &amp; Close Ticket
          </button>
        </div>
      </div>
    </div>
  )
}

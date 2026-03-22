"use client"

import { Button } from "@/components/ui/button"

export default function QuotationsError({ reset }: { reset: () => void }) {
  return (
    <div className="content">
      <div className="table-wrap">
        <div className="empty">
          <div className="empty-text">Something went wrong while loading quotations.</div>
          <Button className="btn btn-primary mt-3" onClick={reset}>Retry</Button>
        </div>
      </div>
    </div>
  )
}

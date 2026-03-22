"use client"

import { useQuotations } from "@/hooks/use-quotations"
import { PipelineBoard } from "@/components/pipeline/pipeline-board"

export default function PipelinePage() {
  const { quotations } = useQuotations()

  return (
    <div className="content" id="section-pipeline">
      <PipelineBoard quotations={quotations} />
    </div>
  )
}

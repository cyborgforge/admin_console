"use client"

import React, { useState } from "react"
import { Plus } from "lucide-react"

export interface Deal {
  id: string
  name: string
  value: number
  stage: "Prospect" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won"
  expectedCloseDate?: string
  notes?: string
  priority?: "high" | "medium" | "low"
  label?: string
}

const STAGES: Deal["stage"][] = ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed Won"]

interface DealPipelineProps {
  deals: Deal[]
  onUpdateDealStage: (dealId: string, newStage: Deal["stage"]) => void
  onOpenNewDealModal: (initialStage: Deal["stage"]) => void
}

export function DealPipeline({ deals, onUpdateDealStage, onOpenNewDealModal }: DealPipelineProps) {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [activeDragOverStage, setActiveDragOverStage] = useState<Deal["stage"] | null>(null)

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.setData("text/plain", dealId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggedDealId(null)
    setActiveDragOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stage: Deal["stage"]) => {
    e.preventDefault()
    if (activeDragOverStage !== stage) {
      setActiveDragOverStage(stage)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only reset if we are leaving to an area outside columns
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    // Check if coordinates are outside the column bounds
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setActiveDragOverStage(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStage: Deal["stage"]) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId
    
    if (dealId) {
      onUpdateDealStage(dealId, targetStage)
    }
    
    setDraggedDealId(null)
    setActiveDragOverStage(null)
  }

  const getPriorityColor = (priority?: string) => {
    if (priority === "high") return "bg-red-500"
    if (priority === "medium") return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className="cd-card">
      {/* Header */}
      <div className="cd-card-header">
        <h2 className="cd-card-title flex items-center gap-1.5 text-sm font-semibold">
          📊 Deal Pipeline
        </h2>
      
      </div>

      {/* Grid of Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-5 overflow-x-auto min-h-[350px]">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage)
          const isDragOver = activeDragOverStage === stage

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex flex-col min-h-[280px] rounded-lg p-2.5 transition-all duration-200 border ${
                isDragOver
                  ? "border-[#3b82f6] bg-[#3b82f6]/5 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]"
                  : "border-[#2a3040] bg-[#1a1e27]/40"
              }`}
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2a3040]">
                <span className="text-[10px] font-semibold text-[#8b95a8] uppercase tracking-wider font-mono">
                  {stage}
                </span>
                <span className="text-[10px] font-mono font-medium text-[#4f5a6a] bg-white/5 px-2 py-0.5 rounded-full">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deals Container */}
              <div className="flex flex-col gap-2.5 flex-1">
                {stageDeals.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-[#2a3040]/50 rounded-md py-6 px-2 text-[10px] text-[#4f5a6a] font-mono text-center">
                    Drag deals here
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isDragging = draggedDealId === deal.id
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-[#1e2229] border border-[#2a3040] rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-[#3b82f6]/50 hover:-translate-y-[1px] transition-all duration-150 relative overflow-hidden ${
                          isDragging ? "opacity-45 scale-[0.98] border-dashed border-[#3b82f6]" : "shadow-md"
                        }`}
                      >
                        {/* Priority Indicator */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-[#8b95a8] leading-none select-none">
                            {deal.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(
                                deal.priority
                              )}`}
                              title={`Priority: ${deal.priority || "medium"}`}
                            />
                            <span className="text-[9px] font-mono text-[#4f5a6a] uppercase">
                              {deal.priority || "medium"}
                            </span>
                          </div>
                        </div>

                        {/* Deal Name */}
                        <div className="text-xs font-medium text-[#e8eaf0] mb-2 group-hover:text-[#3b82f6] transition-colors leading-tight">
                          {deal.name}
                        </div>

                        {/* Deal Value */}
                        <div className="text-[13px] font-semibold text-[#4c7ee1] font-mono">
                          ₹{deal.value.toLocaleString("en-IN")}
                        </div>

                        {/* Expected date or labels */}
                        {deal.expectedCloseDate && (
                          <div className="text-[10px] text-[#4f5a6a] mt-1.5 font-mono">
                            📅 {new Date(deal.expectedCloseDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                        {deal.label && !deal.expectedCloseDate && (
                          <div className="text-[10px] text-[#4f5a6a] mt-1.5 font-mono">
                            🏷️ {deal.label}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Quick Add at bottom */}
              <button
                onClick={() => onOpenNewDealModal(stage)}
                className="mt-3 w-full py-1.5 border border-dashed border-[#2a3040] hover:border-[#3b82f6]/50 bg-transparent text-[10px] font-medium text-[#4f5a6a] hover:text-[#3b82f6] rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={10} /> Add to {stage}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

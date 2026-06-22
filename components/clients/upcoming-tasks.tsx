"use client"

import React, { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"

export interface Task {
  id: number
  text: string
  due: string
  priority: string
  done: boolean
  overdue?: boolean
}

interface UpcomingTasksProps {
  tasks: Task[]
  onToggleTask: (id: number) => void
  onDeleteTask: (id: number) => void
onOpenAddTaskModal: () => void
}

export function UpcomingTasks({
  tasks,
  onToggleTask,
  onDeleteTask,
  onOpenAddTaskModal,
}: UpcomingTasksProps) {
  const handleAddTaskClick = () => {
  onOpenAddTaskModal()
}

  return (
    <div className="cd-card">
      <div className="cd-card-header">
        <h2 className="cd-card-title flex items-center gap-1.5 text-sm font-semibold">
          ☑️ Upcoming Tasks
        </h2>
        <button
          onClick={handleAddTaskClick}
          className="lp-btn-primary cd-sm-btn cursor-pointer"
        >
          <Plus size={12} />
          Add Task
        </button>
      </div>
      <div className="cd-task-list divide-y divide-[#1e2229]">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#4f5a6a]">
            No upcoming tasks. Click Add Task to create one!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`cd-task-row flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 ${
                task.done ? "cd-task-done-row bg-[#141416]/30" : "hover:bg-[#1a1e27]"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(task.id)}
                  className="cd-task-checkbox w-4 h-4 cursor-pointer accent-[#4c7ee1] flex-shrink-0"
                />
                <span
                  className={`cd-priority-dot w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    task.priority === "high"
                      ? "cd-pri-high bg-[#c4606f]"
                      : task.priority === "medium"
                      ? "cd-pri-med bg-[#d3a335]"
                      : "cd-pri-low bg-[#1ead82]"
                  }`}
                />
                <span
                  className={`cd-task-text text-xs text-[#c2c8cc] truncate flex-grow ${
                    task.done ? "cd-task-done-text line-through text-[#4f5a6a]" : ""
                  }`}
                >
                  {task.text}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`cd-task-due text-[11px] text-[#5a6070] whitespace-nowrap ${
                    task.overdue && !task.done ? "cd-task-overdue text-[#c4606f]" : ""
                  }`}
                >
                  {task.due}
                </span>

                {task.done && (
                  <span
                    className="lp-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                      background: "rgba(30,173,130,0.12)",
                      color: "#1ead82",
                      borderColor: "rgba(30,173,130,0.2)",
                    }}
                  >
                    <span className="lp-dot w-1 h-1 rounded-full bg-[#1ead82]" />
                    Completed
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const nextText = window.prompt("Edit task description:", task.text)
                    if (nextText && nextText.trim()) {
                      task.text = nextText.trim()
                      // Trigger a re-render by toggling and toggling back, or let state handle it
                      onToggleTask(task.id)
                      onToggleTask(task.id)
                    }
                  }}
                  className="lp-icon-btn text-[#4f5a6a] hover:text-[#c2c8cc] p-1 bg-transparent border-0 cursor-pointer"
                  aria-label="Edit task"
                >
                  <Edit size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="lp-icon-btn cd-delete-btn text-[#4f5a6a] hover:text-[#c4606f] p-1 bg-transparent border-0 cursor-pointer"
                  aria-label="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

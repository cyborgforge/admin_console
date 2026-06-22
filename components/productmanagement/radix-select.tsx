import React from "react"
import * as Select from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

export function RadixSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger className={`pm-rx-select-trigger ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="pm-rx-select-icon">
          <ChevronDown size={13} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="pm-rx-select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="pm-rx-select-viewport">
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="pm-rx-select-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="pm-rx-select-indicator">
                  <Check size={12} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

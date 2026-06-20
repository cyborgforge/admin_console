import { ItemType, ItemStatus } from "./types"

export const typeConfig: Record<ItemType, { label: string; bg: string; color: string }> = {
  core:   { label: "Core",   bg: "rgba(76,126,225,0.12)", color: "#4c7ee1" },
  add_on: { label: "Add-on", bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
}

export const statusConfig: Record<ItemStatus, { label: string; bg: string; color: string; dot: string }> = {
  active:   { label: "Active",   bg: "rgba(30,173,130,0.12)", color: "#1ead82", dot: "#1ead82" },
  inactive: { label: "Inactive", bg: "rgba(90,96,112,0.12)",  color: "#5a6070", dot: "#5a6070" },
}

export const getInitials = (name: string) =>
  name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`

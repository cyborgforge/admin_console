"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} enableColorScheme={false}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  )
}

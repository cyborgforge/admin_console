"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirectTo = pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""
      router.replace(`/auth/login${redirectTo}`)
    }
  }, [isAuthenticated, loading, pathname, router])

  if (loading) {
    return (
      <div className="content" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ color: "var(--text3)", fontSize: "14px" }}>Checking session...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

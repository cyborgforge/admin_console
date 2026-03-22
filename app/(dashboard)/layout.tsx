import type { ReactNode } from "react"

import { AuthGate } from "@/components/layout/auth-gate"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flux-console">
        <Sidebar />
        <div className="main">
          <Topbar />
          {children}
        </div>
      </div>
    </AuthGate>
  )
}

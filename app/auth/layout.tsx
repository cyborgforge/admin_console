import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 15% 10%, rgba(59,130,246,0.15), transparent 40%), radial-gradient(circle at 90% 90%, rgba(16,185,129,0.12), transparent 35%), #0d0f12",
        padding: "24px",
      }}
    >
      {children}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { isAuthenticated, loading, signInWithPassword } = useAuth()

  const redirectPath = useMemo(() => {
    const raw = params.get("redirect")
    if (!raw || !raw.startsWith("/")) {
      return "/quotations"
    }

    return raw
  }, [params])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectPath)
    }
  }, [isAuthenticated, loading, redirectPath, router])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error("Email and password are required.")
      return
    }

    setSubmitting(true)

    try {
      await signInWithPassword(email.trim(), password)
      toast.success("Login successful.")
      router.replace(redirectPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "430px",
        border: "1px solid #2a3040",
        borderRadius: "14px",
        background: "#161920",
        color: "#e8eaf0",
        boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ padding: "26px 26px 0" }}>
        <h1 style={{ margin: 0, fontSize: "24px", letterSpacing: "-0.3px" }}>Welcome Back</h1>
        <p style={{ marginTop: "8px", color: "#8b95a8", fontSize: "13px" }}>
          Sign in to continue to FluxWorks admin console.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ padding: "20px 26px 26px", display: "grid", gap: "12px" }}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="form-input"
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="form-input"
          autoComplete="current-password"
        />

        <Button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>

        <p style={{ margin: 0, color: "#8b95a8", fontSize: "13px", textAlign: "center" }}>
          No account? <Link href="/auth/signup" style={{ color: "#3b82f6", textDecoration: "none" }}>Create one</Link>
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

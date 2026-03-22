"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, loading, signUpWithPassword } = useAuth()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/quotations")
    }
  }, [isAuthenticated, loading, router])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password || !confirmPassword) {
      toast.error("Email and password are required.")
      return
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const data = await signUpWithPassword(email.trim(), password, fullName)

      if (data.session) {
        toast.success("Account created and logged in.")
        router.replace("/quotations")
      } else {
        toast.success("Account created. Check your email to confirm your account.")
        router.replace("/auth/login")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account."
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
        <h1 style={{ margin: 0, fontSize: "24px", letterSpacing: "-0.3px" }}>Create Account</h1>
        <p style={{ marginTop: "8px", color: "#8b95a8", fontSize: "13px" }}>
          Start managing quotations with your team account.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ padding: "20px 26px 26px", display: "grid", gap: "12px" }}>
        <Input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="form-input"
          autoComplete="name"
        />
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
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="form-input"
          autoComplete="new-password"
        />

        <Button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </Button>

        <p style={{ margin: 0, color: "#8b95a8", fontSize: "13px", textAlign: "center" }}>
          Already have an account? <Link href="/auth/login" style={{ color: "#3b82f6", textDecoration: "none" }}>Sign in</Link>
        </p>
      </form>
    </div>
  )
}

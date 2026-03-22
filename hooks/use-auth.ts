"use client"

import { useEffect, useMemo, useState } from "react"

import { getSupabaseClient } from "@/lib/supabaseClient"

type AppUser = {
  id: string
  name: string
  role: string
  initials: string
}

const guestUser: AppUser = {
  id: "guest",
  name: "Guest User",
  role: "Admin",
  initials: "GU",
}

function mapSessionUser(email: string | undefined, rawName: unknown, id: string): AppUser {
  const baseName = typeof rawName === "string" && rawName.trim() ? rawName.trim() : (email ?? "User").split("@")[0]
  const initials =
    String(baseName)
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US"

  return {
    id,
    name: baseName,
    role: "Admin",
    initials,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser>(guestUser)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  async function recoverFromInvalidRefreshToken(errorMessage?: string) {
    if (!errorMessage || !/refresh token/i.test(errorMessage)) {
      return false
    }

    const supabase = getSupabaseClient()
    await supabase.auth.signOut({ scope: "local" })
    return true
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    async function hydrateSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        await recoverFromInvalidRefreshToken(error.message)
        setIsAuthenticated(false)
        setUser(guestUser)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(
          mapSessionUser(session.user.email, session.user.user_metadata?.name, session.user.id),
        )
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setUser(guestUser)
      }

      setLoading(false)
    }

    void hydrateSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(
          mapSessionUser(session.user.email, session.user.user_metadata?.name, session.user.id),
        )
        setIsAuthenticated(true)
        setLoading(false)
        return
      }

      setIsAuthenticated(false)
      setUser(guestUser)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithPassword(email: string, password: string) {
    const supabase = getSupabaseClient()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      throw error
    }

    if (data.user) {
      setUser(mapSessionUser(data.user.email, data.user.user_metadata?.name, data.user.id))
      setIsAuthenticated(true)
    }

    setLoading(false)
    return data
  }

  async function signUpWithPassword(email: string, password: string, name?: string) {
    const supabase = getSupabaseClient()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name?.trim() || email.split("@")[0],
        },
      },
    })

    if (error) {
      setLoading(false)
      throw error
    }

    setLoading(false)
    return data
  }

  async function signOut() {
    const supabase = getSupabaseClient()
    setLoading(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      if (await recoverFromInvalidRefreshToken(error.message)) {
        setIsAuthenticated(false)
        setUser(guestUser)
        setLoading(false)
        return
      }

      setLoading(false)
      throw error
    }

    setIsAuthenticated(false)
    setUser(guestUser)
    setLoading(false)
  }

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [isAuthenticated, loading, user],
  )
}

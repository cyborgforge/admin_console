import { createClient } from "@supabase/supabase-js"

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const key = serviceRoleKey ?? publishableKey

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.")
  }

  return { url, key }
}

export function getSupabaseServerClient(accessToken?: string) {
  const { url, key } = getSupabaseConfig()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  })
}

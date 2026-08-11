import { createClient } from "@supabase/supabase-js"

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

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

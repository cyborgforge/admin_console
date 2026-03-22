import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables.")
  }

  return { url, publishableKey }
}

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient
  }

  const { url, publishableKey } = getSupabaseConfig()
  browserClient = createClient(url, publishableKey)
  return browserClient
}

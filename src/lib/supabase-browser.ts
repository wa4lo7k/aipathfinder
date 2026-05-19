'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables')
  }
  return createBrowserClient(url, key)
}

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ── Browser client (Client Components) ───────────────────────────────────────
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables')
  }
  return createBrowserClient(url, key)
}

// ── Server client (Server Components / API Routes / Middleware) ──────────────
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables')
  }

  const cookieStore = cookies()
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...(options as any) })
        } catch {
          // ignore if called from a Server Component where cookies() is read-only
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...(options as any) })
        } catch {
          // ignore if called from a Server Component where cookies() is read-only
        }
      },
    },
  })
}

// ── Middleware client (returns cookie-aware response) ──────────────────────────
export function createMiddlewareSupabaseClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables')
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value, ...(options as any) })
        response.cookies.set({ name, value, ...(options as any) })
      },
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value: '', ...(options as any) })
        response.cookies.set({ name, value: '', ...(options as any) })
      },
    },
  })
}

// ── Admin client (service role — server only) ────────────────────────────────
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables')
  }

  return createServerClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      get() { return undefined },
      set() {},
      remove() {},
    },
  })
}

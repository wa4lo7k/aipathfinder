import { createBrowserClient, createServerClient } from '@supabase/ssr'
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
      remove(_name: string, _options: Record<string, unknown>) {
        // no-op — API routes must never clear auth cookies.
        // Clearing them here would send a Set-Cookie header in the API response
        // that can log the user out when parallel requests race on token refresh.
      },
    },
  })
}

// ── API Route client (reliable cookie propagation to response) ──────────────
// Use this in Route Handlers (API routes) to ensure cookie mutations from
// Supabase auth (e.g. token refresh) are reliably propagated to the response.
// Usage:
//   const { supabase, applyCookies } = createApiSupabaseClient(request)
//   ...
//   return applyCookies(NextResponse.json({ data }))
export function createApiSupabaseClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables')
  }

  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        pendingCookies.push({ name, value, options })
        request.cookies.set({ name, value, ...(options as any) })
      },
      remove(_name: string, _options: Record<string, unknown>) {
        // no-op — API routes must never clear auth cookies
      },
    },
  })

  function applyCookies(response: NextResponse): NextResponse {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set({ name, value, ...(options as any) })
    }
    return response
  }

  return { supabase, applyCookies }
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

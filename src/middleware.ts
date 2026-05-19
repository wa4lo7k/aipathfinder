import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareSupabaseClient(request, response)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicPaths = ['/', '/auth']
  const isPublicPath =
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/api/webhooks/')

  // Protected paths
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/'))

  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    response.headers.set('x-user-id', user.id)
  }

  return response
}

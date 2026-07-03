import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Race the session update against a 4-second timeout.
    // If Supabase takes too long (cold start, network hiccup), we let the
    // request through rather than returning a 504 to the user.
    const timeout = new Promise<NextResponse>((resolve) =>
      setTimeout(() => resolve(NextResponse.next({ request })), 4000)
    )
    return await Promise.race([updateSession(request), timeout])
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

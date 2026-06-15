import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Guard: Prevent crash if Supabase URL or Anon key is missing/invalid
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are missing or invalid in middleware.")
      return supabaseResponse
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Use getSession() instead of getUser() in middleware.
    // getSession() reads from the cookie (no network call) so it never times out on Edge.
    // Actual token verification (getUser) still happens in Server Components / API routes.
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthed = !!session

    if (
      !isAuthed &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/signup') &&
      !request.nextUrl.pathname.startsWith('/onboarding') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/api/diagnose')
    ) {
      // For API requests, return 401 instead of redirecting to the HTML login page
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // No session — redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware Error caught gracefully:", error)
    return NextResponse.next({
      request,
    })
  }
}

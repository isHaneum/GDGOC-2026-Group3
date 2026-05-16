import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const routeRedirects: Record<string, string> = {
  '/': '/signin',
  '/signup': '/signup/onboarding',
  '/community': '/community/posts',
  '/employee': '/employee/companies',
  '/employer': '/employer/postings',
  '/apply': '/employee/portfolio',
  '/companies': '/employee/companies',
  '/developer': '/employee/companies',
  '/developer/coach': '/employee/portfolio',
  '/developer/register': '/signup/profile',
  '/employer/register': '/signup/profile',
  '/forums': '/community/posts',
  '/get-started': '/signup/onboarding',
  '/onboarding': '/signup/onboarding',
  '/signal-lab': '/signin',
}

const allowedRoutePrefixes = [
  '/api',
  '/data',
  '/signin',
  '/signup',
  '/account',
  '/community/posts',
  '/employee',
  '/employer',
  '/not-found',
]

function redirectTo(request: NextRequest, destination: string) {
  return NextResponse.redirect(new URL(destination, request.url))
}

function isAllowedRoute(pathname: string) {
  return allowedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const normalizedRedirect = routeRedirects[pathname]
  if (normalizedRedirect) {
    return redirectTo(request, normalizedRedirect)
  }

  const legacyCommunityMatch = pathname.startsWith('/community/posts') ? null : pathname.match(/^\/community\/([^/]+)$/)
  if (legacyCommunityMatch) {
    return redirectTo(request, `/community/posts/${encodeURIComponent(legacyCommunityMatch[1])}`)
  }

  const legacyApplicantMatch = pathname.match(/^\/employer\/applicants\/applicant\/([^/]+)\/profile$/)
  if (legacyApplicantMatch) {
    return redirectTo(request, `/employer/applicants/${encodeURIComponent(legacyApplicantMatch[1])}/portfolio`)
  }

  if (!isAllowedRoute(pathname)) {
    return redirectTo(request, '/signin')
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

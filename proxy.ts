import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import {
  defaultLocale,
  getLocaleFromPathname,
  isAppLocale,
  localizePathname,
  stripLocaleFromPathname,
  type AppLocale
} from './i18n/routing'

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

function isPassThroughRoute(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/data' || pathname.startsWith('/data/')
}

function localizedDestination(destination: string, locale: AppLocale) {
  return localizePathname(destination, locale)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const passThroughRoute = isPassThroughRoute(pathname)
  const locale = getLocaleFromPathname(pathname)
  const activeLocale = locale ?? defaultLocale
  const normalizedPathname = stripLocaleFromPathname(pathname)

  if (!passThroughRoute && normalizedPathname === '/signal-lab') {
    const role = request.nextUrl.searchParams.get('role')
    if (role === 'developer') {
      return redirectTo(request, localizedDestination('/employee/recommends', activeLocale))
    }
    if (role === 'employer') {
      return redirectTo(request, localizedDestination('/employer/applicants', activeLocale))
    }
  }

  const normalizedRedirect = passThroughRoute ? null : routeRedirects[normalizedPathname]
  if (normalizedRedirect) {
    return redirectTo(request, localizedDestination(normalizedRedirect, activeLocale))
  }

  const legacyCommunityMatch = passThroughRoute || normalizedPathname.startsWith('/community/posts')
    ? null
    : normalizedPathname.match(/^\/community\/([^/]+)$/)
  if (legacyCommunityMatch) {
    return redirectTo(request, localizedDestination(`/community/posts/${encodeURIComponent(legacyCommunityMatch[1])}`, activeLocale))
  }

  const legacyApplicantMatch = passThroughRoute
    ? null
    : normalizedPathname.match(/^\/employer\/applicants\/applicant\/([^/]+)\/profile$/)
  if (legacyApplicantMatch) {
    return redirectTo(request, localizedDestination(`/employer/applicants/${encodeURIComponent(legacyApplicantMatch[1])}/portfolio`, activeLocale))
  }

  if (!passThroughRoute && !locale && normalizedPathname !== '/') {
    if (isAllowedRoute(normalizedPathname)) {
      return redirectTo(request, localizedDestination(normalizedPathname, defaultLocale))
    }
    return redirectTo(request, localizedDestination('/signin', defaultLocale))
  }

  if (!passThroughRoute && locale && !isAllowedRoute(normalizedPathname)) {
    return redirectTo(request, localizedDestination('/signin', locale))
  }

  if (!passThroughRoute && (!locale || !isAppLocale(locale))) {
    return redirectTo(request, localizedDestination('/signin', defaultLocale))
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

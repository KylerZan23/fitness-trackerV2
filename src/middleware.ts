import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseServerConfig, isDevelopment } from '@/lib/env'

// Get validated Supabase configuration
const { url: validatedSupabaseUrl, anonKey: validatedSupabaseAnonKey } = getSupabaseServerConfig()

// Add console logs to verify env vars on server start/middleware run (development only)
if (isDevelopment()) {
  console.log('MIDDLEWARE ENV URL:', validatedSupabaseUrl?.substring(0, 20) + '...') // Log prefix only
  console.log('MIDDLEWARE ENV KEY:', validatedSupabaseAnonKey?.substring(0, 10) + '...') // Log prefix only
}

// Cookie name for Supabase auth - this might change based on your project ID
const SUPABASE_AUTH_COOKIE = 'sb-oimcnjdkcqwdltdpkmnu-auth-token'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(validatedSupabaseUrl, validatedSupabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Step 1: Update request.cookies (as per guideline)
        // The guideline does: cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        // However, request.cookies.set might not accept options or behave as expected for mutation for Supabase internal client.
        // The key is that supabaseResponse, which is returned, must have the cookies.
        // The guideline's approach is to update request.cookies AND THEN update supabaseResponse.

        // Let's follow the guideline structure strictly:
        cookiesToSet.forEach(({ name, value }) => {
          // Options not used in this first part per guideline example
          request.cookies.set(name, value)
        })

        // Step 2: Re-initialize supabaseResponse and set cookies on it (as per guideline)
        supabaseResponse = NextResponse.next({
          // This creates a new response object
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options) // Set with options on the new supabaseResponse
        })
      },
    },
  })

  // IMPORTANT: DO NOT REMOVE auth.getUser() or move code between createServerClient and it.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Define path types
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/program') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/workout')
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')

  console.log(
    `Middleware: Processing ${request.nextUrl.pathname}, isProtected: ${isProtectedRoute}, isAuth: ${isAuthRoute}, isOnboarding: ${isOnboardingRoute}`
  )

  // --- Authentication Logic ---

  if (userError) {
    console.error('Middleware: Error fetching user:', userError.message)
    // Treat errors as unauthenticated for protected routes
    if (isProtectedRoute) {
      console.log('Middleware: Redirecting to login due to user fetch error on protected route.')
      return redirectToLogin(request) // Use your helper
    }
    // For non-protected routes (including onboarding), allow if there's a user fetch error, but log it.
    // Ensure to return supabaseResponse to keep cookie context
    return supabaseResponse
  }

  // User IS NOT logged in
  if (!user) {
    console.log('Middleware: User is NOT authenticated.')
    if (isProtectedRoute) {
      console.log(
        `Middleware: Redirecting unauthenticated user from ${request.nextUrl.pathname} to login.`
      )
      return redirectToLogin(request) // Use your helper
    }
    // Allow access to auth routes, onboarding, or public routes if not logged in.
    // Return supabaseResponse to keep cookie context
    console.log(`Middleware: Allowing unauthenticated access to ${request.nextUrl.pathname}.`)
    return supabaseResponse
  }

  // User IS logged in
  if (user) {
    console.log(`Middleware: User ${user.id} IS authenticated.`)
    const bypassAuth = request.nextUrl.searchParams.get('bypass') === 'true'

    if (isAuthRoute && !bypassAuth) {
      console.log('Middleware: Redirecting authenticated user from auth route to program.')
      // Construct a new response for redirection, but copy cookies from supabaseResponse
      const redirectResponse = NextResponse.redirect(new URL('/program', request.url))
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Check subscription status for premium route protection and read-only mode
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, trial_ends_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        const now = new Date()
        const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
        const isTrialActive = trialEndsAt ? trialEndsAt > now : false
        const hasActiveAccess = profile.is_premium || isTrialActive
        
        // Define premium routes that require active subscription
        const premiumRoutes = ['/ai-coach']
        const isPremiumRoute = premiumRoutes.some(route => request.nextUrl.pathname.startsWith(route))
        
        // Redirect expired users from premium routes to pricing page
        if (!hasActiveAccess && isPremiumRoute) {
          console.log(`Middleware: User ${user.id} trial expired, redirecting from ${request.nextUrl.pathname} to pricing`)
          const redirectResponse = NextResponse.redirect(
            new URL(`/pricing?expired=true&feature=${encodeURIComponent(request.nextUrl.pathname.substring(1))}`, request.url)
          )
          supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
          })
          return redirectResponse
        }
        
        // Set read-only mode header if user has no active access
        if (!hasActiveAccess) {
          console.log(`Middleware: User ${user.id} trial expired, setting read-only mode`)
          supabaseResponse.headers.set('x-read-only-mode', 'true')
          supabaseResponse.headers.set('x-trial-expired', 'true')
        } else {
          supabaseResponse.headers.set('x-read-only-mode', 'false')
          if (isTrialActive && trialEndsAt) {
            const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            supabaseResponse.headers.set('x-trial-days-remaining', daysRemaining.toString())
          }
        }
      }
    } catch (error) {
      console.error('Middleware: Error checking subscription status:', error)
      // Default to allowing access if there's an error checking subscription
    }

    // Allow access to protected routes, onboarding, or other public routes if logged in
    console.log(`Middleware: Allowing authenticated access to ${request.nextUrl.pathname}.`)
    // Add user info to headers for downstream use, onto supabaseResponse
    supabaseResponse.headers.set('x-user-id', user.id)
    supabaseResponse.headers.set('x-user-email', user.email ?? '')
    return supabaseResponse
  }

  // Fallback (should ideally not be reached if logic is exhaustive)
  console.warn(
    'Middleware: Fallback reached, allowing request through but returning supabaseResponse for session safety.'
  )
  return supabaseResponse
}

// Helper function to handle login redirections (keep force_login)
function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url)
  if (!request.nextUrl.pathname.startsWith('/login')) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  }
  redirectUrl.searchParams.set('force_login', 'true')
  console.log('Middleware: Redirecting to URL:', redirectUrl.toString())
  // When redirecting, we create a new response. It doesn't need to carry over prior request cookies
  // unless specifically needed for the redirect target, which is usually not the case for login.
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/program/:path*',
    '/profile/:path*',
    '/workout/:path*',
    '/ai-coach/:path*',
    '/progress/:path*',
    '/community/:path*',
    '/pricing/:path*',
    '/login',
    '/signup',
    '/onboarding',
  ],
}

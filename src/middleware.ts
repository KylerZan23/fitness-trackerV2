import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Add console logs to verify env vars on server start/middleware run
console.log('MIDDLEWARE ENV URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...') // Log prefix only
console.log(
  'MIDDLEWARE ENV KEY:',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
) // Log prefix only

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
}

// After validation, we can safely assert these are strings
const validatedSupabaseUrl: string = supabaseUrl
const validatedSupabaseAnonKey: string = supabaseAnonKey

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
    request.nextUrl.pathname.startsWith('/dashboard') ||
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
      console.log('Middleware: Redirecting authenticated user from auth route to dashboard.')
      // Construct a new response for redirection, but copy cookies from supabaseResponse
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
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
    '/dashboard/:path*',
    '/profile/:path*',
    '/workout/:path*',
    '/login',
    '/signup',
    '/onboarding',
  ],
}

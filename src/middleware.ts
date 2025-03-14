import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/utils/supabase/middleware'

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
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Helper function to check if a path is protected
  function checkProtectedPath(req: NextRequest) {
    return req.nextUrl.pathname.startsWith('/dashboard') || 
           req.nextUrl.pathname.startsWith('/profile') ||
           req.nextUrl.pathname.startsWith('/workout')
  }

  try {
    // Debug cookie information
    const allCookies = request.cookies.getAll()
    const cookieString = allCookies.map(c => `${c.name}=${c.value?.substring(0, 10)}...`).join('; ')
    console.log(`Middleware cookies [${request.nextUrl.pathname}]:`, cookieString)

    // Check for special query parameters
    const isForceLogin = request.nextUrl.searchParams.get('force_login') === 'true'
    const bypassAuth = request.nextUrl.searchParams.get('bypass') === 'true'
    
    // If force_login is true and we're on a login page, clear the auth cookie and allow access
    if (isForceLogin && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      console.log('Force login parameter detected, bypassing authentication check')
      
      // Clear the auth cookie to ensure a fresh login
      response.cookies.delete(SUPABASE_AUTH_COOKIE)
      
      return response
    }

    // Create Supabase client using the middleware helper
    const supabase = createMiddlewareClient(request, response)
    
    // Get the session - this will refresh the session if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Check if session exists and is valid (not expired)
    const isValidSession = session && 
                          session.access_token && 
                          session.expires_at && 
                          (session.expires_at * 1000) > Date.now()
    
    // Define path types
    const isProtectedPath = checkProtectedPath(request)
    const isAuthPath = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/signup')

    // Handle invalid sessions
    if (sessionError || !isValidSession) {
      console.log('Invalid or expired session detected')
      
      // Clear the auth cookie to prevent authentication loops
      response.cookies.delete(SUPABASE_AUTH_COOKIE)
      
      // If this is a protected path, redirect to login
      if (isProtectedPath) {
        console.log('Protected path with invalid session, redirecting to login')
        return redirectToLogin(request)
      }
      
      // For auth paths with invalid session, just continue (they're trying to log in)
      if (isAuthPath) {
        console.log('Auth path with invalid session, allowing access')
        return response
      }
      
      // For other paths with invalid session, just continue
      return response
    }

    // At this point, we have a valid session

    // Handle protected routes with valid session
    if (isProtectedPath) {
      console.log(`Authenticated access to ${request.nextUrl.pathname} for user ${session.user.id}`)
      
      // Add user info to headers
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email ?? '')
      
      return response
    }

    // Handle auth routes when user is already logged in
    if (isAuthPath) {
      // If bypass is set, allow access to auth pages even when logged in
      if (bypassAuth) {
        console.log('Auth bypass enabled, allowing access to login page while authenticated')
        return response
      }
      
      // Otherwise redirect to dashboard
      console.log('User is authenticated, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // For all other routes with valid session, just continue
    return response
  } catch (err) {
    console.error('Middleware error:', err)
    
    // If there's an error in the middleware, we should clear the auth cookie
    // to prevent authentication loops
    const response = NextResponse.redirect(new URL('/login?force_login=true', request.url))
    
    // Clear the auth cookie
    response.cookies.delete(SUPABASE_AUTH_COOKIE)
    
    return response
  }
}

// Helper function to handle login redirections
function redirectToLogin(request: NextRequest) {
  // Store the original URL to redirect back after login
  const redirectUrl = new URL('/login', request.url)
  if (!request.nextUrl.pathname.startsWith('/login')) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  }
  // Add force_login parameter to ensure we can access the login page
  redirectUrl.searchParams.set('force_login', 'true')
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/workout/:path*', '/login', '/signup']
} 
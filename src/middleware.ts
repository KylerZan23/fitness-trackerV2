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

    // Create Supabase client using the middleware helper
    const supabase = createMiddlewareClient(request, response)

    // IMPORTANT: Auth operations must happen immediately after creating the client
    // to avoid issues with session refresh
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message)
      
      // If this is a protected path, redirect to login
      if (checkProtectedPath(request)) {
        return redirectToLogin(request)
      }
      
      // Otherwise allow the request to continue
      return response
    }

    // Define path types
    const isProtectedPath = checkProtectedPath(request)
    const isAuthPath = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/signup')

    // Handle protected routes
    if (isProtectedPath) {
      if (!session) {
        console.log('No session found, redirecting to login')
        return redirectToLogin(request)
      }

      // Debug log successful auth for protected routes
      console.log(`Authenticated access to ${request.nextUrl.pathname} for user ${session.user.id}`)
      
      // Add session info to headers
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email ?? '')
    }

    // Handle auth routes when user is already logged in
    if (isAuthPath && session) {
      // Check for a bypass parameter to allow access to login/signup even when authenticated
      const bypassAuth = request.nextUrl.searchParams.get('bypass') === 'true'
      
      if (!bypassAuth) {
        console.log('User is authenticated, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      console.log('Auth bypass enabled, allowing access to login page while authenticated')
    }

    return response
  } catch (err) {
    console.error('Middleware error:', err)
    return redirectToLogin(request)
  }
}

// Helper function to handle login redirections
function redirectToLogin(request: NextRequest) {
  // Store the original URL to redirect back after login
  const redirectUrl = new URL('/login', request.url)
  if (!request.nextUrl.pathname.startsWith('/login')) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  }
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/workout/:path*', '/login', '/signup']
} 
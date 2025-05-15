import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/utils/supabase/middleware'

// Add console logs to verify env vars on server start/middleware run
console.log("MIDDLEWARE ENV URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'); // Log prefix only
console.log("MIDDLEWARE ENV KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'); // Log prefix only

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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createMiddlewareClient(request, response)

  // IMPORTANT: Use getUser to validate the session against Supabase
  const {
    data: { user },
    error: userError // Capture potential error from getUser
  } = await supabase.auth.getUser()

  // Define path types
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/workout');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup');

  // --- Authentication Logic --- 

  if (userError) {
      console.error("Error fetching user in middleware:", userError.message);
      // Treat errors during user fetch as unauthenticated, redirect if needed
      if (isProtectedRoute) {
          console.log("Redirecting to login due to user fetch error on protected route.");
          return redirectToLogin(request);
      }
      // Allow access to non-protected routes even if user fetch failed
      return response;
  }

  // If user IS NOT logged in
  if (!user) {
    console.log('Middleware: User is NOT authenticated.');
    // If trying to access a protected route, redirect to login
    if (isProtectedRoute) {
      console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to login.`);
      return redirectToLogin(request);
    }
    // Allow access to auth routes or public routes if not logged in
    console.log(`Allowing unauthenticated access to ${request.nextUrl.pathname}.`);
    return response;
  }

  // If user IS logged in
  if (user) {
    console.log(`Middleware: User ${user.id} IS authenticated.`);
    // If logged-in user tries to access login/signup page, redirect to dashboard
    // (Unless they are explicitly bypassing, e.g., for account switching - keep bypass logic if needed)
    const bypassAuth = request.nextUrl.searchParams.get('bypass') === 'true';
    if (isAuthRoute && !bypassAuth) {
      console.log('Redirecting authenticated user from auth route to dashboard.');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Allow access to protected routes or other public routes if logged in
    console.log(`Allowing authenticated access to ${request.nextUrl.pathname}.`);
    // Optionally add user info to headers if needed downstream (e.g., in Server Components)
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email ?? '');
    return response;
  }

  // Fallback (shouldn't be reached ideally)
  console.warn("Middleware fallback reached, allowing request through.")
  return response;

  // Removed old try/catch and complex session checks as getUser handles validation
}

// Helper function to handle login redirections (keep force_login)
function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url);
  if (!request.nextUrl.pathname.startsWith('/login')) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  }
  redirectUrl.searchParams.set('force_login', 'true'); // Keep force_login to ensure login page access
  console.log("Redirecting to URL:", redirectUrl.toString());
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/workout/:path*', '/login', '/signup']
} 
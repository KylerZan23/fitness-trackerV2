import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Add console logs to verify env vars on server start/middleware run
console.log("MIDDLEWARE ENV URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'); // Log prefix only
console.log("MIDDLEWARE ENV KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'); // Log prefix only

// Validate environment variables
const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrlFromEnv) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKeyFromEnv) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (supabaseUrlFromEnv) {
  try {
    new URL(supabaseUrlFromEnv);
  } catch (error) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }
}

// After validation, we can safely assert these are strings
const supabaseUrl = supabaseUrlFromEnv
const supabaseAnonKey = supabaseAnonKeyFromEnv

// Cookie name for Supabase auth - this might change based on your project ID
const SUPABASE_AUTH_COOKIE = 'sb-oimcnjdkcqwdltdpkmnu-auth-token'

export async function middleware(request: NextRequest) {
  // ---- START DEBUGGING SECTION FOR ROOT PATH ----
  if (request.nextUrl.pathname === '/') {
    console.log('MIDDLEWARE: Root path (/) detected, explicitly passing through for debugging.');
    return NextResponse.next(); // Pass through without any Supabase interaction for root
  }
  // ---- END DEBUGGING SECTION FOR ROOT PATH ----

  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Middleware cannot operate correctly.");
    return supabaseResponse; 
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/workout');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup');

  if (userError) {
      console.error("Error fetching user in middleware:", userError.message);
      if (isProtectedRoute) {
          console.log("Redirecting to login due to user fetch error on protected route.");
          return redirectToLogin(request);
      }
      return supabaseResponse; 
  }

  if (!user) {
    console.log('Middleware: User is NOT authenticated.');
    if (isProtectedRoute) {
      console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to login.`);
      return redirectToLogin(request);
    }
    console.log(`Allowing unauthenticated access to ${request.nextUrl.pathname}.`);
    return supabaseResponse;
  }

  if (user) {
    console.log(`Middleware: User ${user.id} IS authenticated.`);
    const bypassAuth = request.nextUrl.searchParams.get('bypass') === 'true';
    if (isAuthRoute && !bypassAuth) {
      console.log('Redirecting authenticated user from auth route to dashboard.');
      const dashboardUrl = new URL('/dashboard', request.url)
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
    
    console.log(`Allowing authenticated access to ${request.nextUrl.pathname}.`);
    supabaseResponse.headers.set('x-user-id', user.id);
    supabaseResponse.headers.set('x-user-email', user.email ?? '');
    return supabaseResponse;
  }

  console.warn("Middleware fallback reached, allowing request through.")
  return supabaseResponse;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const redirectUrl = new URL('/login', request.url);
  if (!request.nextUrl.pathname.startsWith('/login')) {
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  }
  console.log("Redirecting to URL:", redirectUrl.toString());
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',
  ],
} 
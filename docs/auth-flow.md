# Authentication Flow

## Overview

FitnessTracker uses Supabase for authentication with cookie-based session handling. The authentication flow is controlled through middleware that protects routes and manages redirections based on the user's authentication status.

## Route Protection

The middleware (`src/middleware.ts`) handles the following:

1. **Protected Routes**: Routes under `/dashboard`, `/profile`, and `/workout` require authentication.
2. **Auth Routes**: Routes like `/login` and `/signup` are redirected to the dashboard if the user is already authenticated.
3. **Session Management**: The middleware checks the session status and handles proper redirections.

## Authentication Bypass

When a user is already logged in and tries to access the login page, they are automatically redirected to the dashboard. However, there may be cases where a user wants to:

- Log in with a different account
- Troubleshoot login issues
- Force a re-authentication

For these scenarios, the application supports an authentication bypass feature:

- Appending `?bypass=true` to the login URL (e.g., `/login?bypass=true`) allows accessing the login page even when already authenticated.
- The login page will show a notice when accessed in bypass mode, offering options to:
  - Continue with the current session
  - Sign out and use a different account

## Logout Process

Users can log out in two ways:

1. From the dashboard via the logout button in the header
2. From the login page when accessed in bypass mode

Both methods properly clear the user's session and redirect to the login page.

## Implementation Details

The middleware implements the bypass feature by checking for a `bypass=true` parameter in the URL:

```javascript
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
```

## Session Security

- Authentication uses PKCE flow for enhanced security
- Sessions are stored in HTTP-only cookies
- The middleware adds user information to headers for protected routes
- The application correctly refreshes sessions and handles expired tokens

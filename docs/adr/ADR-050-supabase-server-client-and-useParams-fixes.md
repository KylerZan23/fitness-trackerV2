# ADR-050: Supabase Server Client and useParams Hook Fixes

## Status

Accepted

## Date

2024-12-19

## Context

Following the successful fix of the Neural program generation, the application was still failing when attempting to fetch and display the program. The root cause was traced to two framework-level issues: one on the server-side with Supabase cookie handling, and one on the client-side with an outdated Next.js pattern.

### Issue 1: Critical Server-Side Crash

- **Error**: `TypeError: store.getAll is not a function`
- **Location**: `src/utils/supabase/server.ts`
- **Root Cause**: The Supabase server client's cookie handling was not compatible with the Next.js App Router's API Routes. It was attempting to call a `getAll()` method on a cookie store object that doesn't exist in that context, causing the `/api/programs/[id]` route to crash.

### Issue 2: Client-Side `useParams` Warning

- **Error**: `A param property was accessed directly with \`params.id\``
- **Location**: `src/app/programs/[id]/page.tsx`
- **Root Cause**: The component was accessing the route parameter `id` directly from its props (`params.id`). This is a deprecated pattern in recent versions of Next.js and was causing console warnings and potential rendering inconsistencies.

## Decision

Implement comprehensive fixes for both the Supabase server client utility and the client-side page to align with modern Next.js and Supabase best practices.

### 1. Supabase Server Client Fix

The `src/utils/supabase/server.ts` file was refactored to use the official recommended pattern from the Supabase documentation. This new implementation is robust and works seamlessly across Server Components, Server Actions, and API Routes without modification.

```typescript
// src/utils/supabase/server.ts (New Implementation)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
// ...

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore errors in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore errors in Server Components
        }
      },
    },
  })
}
```

### 2. Client Page `useParams` Fix

The `src/app/programs/[id]/page.tsx` component was updated to exclusively use the `useParams` hook from `next/navigation` to retrieve the route parameter. The component no longer accepts `params` as a prop.

```typescript
// src/app/programs/[id]/page.tsx (New Implementation)
import { useParams, useRouter } from 'next/navigation'
// ...

export default function ProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = useMemo(() => params.id, [params.id]) as string;
  // ... rest of the component
}
```

## Consequences

### Positive
- ✅ **Server-Side Crash Resolved**: The API route for fetching programs is now stable and correctly authenticates users.
- ✅ **Client-Side Code Modernized**: The program display page now follows Next.js best practices, eliminating warnings and improving reliability.
- ✅ **Improved Maintainability**: The Supabase server client is now implemented using the official, recommended pattern, which will be easier to maintain and less prone to breaking with future framework updates.
- ✅ **End-to-End Functionality**: The entire user flow, from sign-up to viewing a program, is now functional.

### Negative
- None.

### Neutral
- This refactoring brings a critical piece of the application's infrastructure (Supabase server-side auth) in line with current standards.

## Implementation Status

- ✅ Supabase server client fix implemented and validated.
- ✅ Client-side `useParams` fix implemented and validated.
- ✅ This ADR documents the critical framework-level changes.
- ✅ All related files (`/api/programs/[id]/route.ts`) were updated to use the new `createClient()` function.

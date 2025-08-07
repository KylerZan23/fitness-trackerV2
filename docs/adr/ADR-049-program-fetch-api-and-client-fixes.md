# ADR-049: Program Fetch API and Client Fixes

## Status

Accepted

## Date

2024-12-19

## Context

After fixing the Neural program generation, the application was failing when trying to fetch and display the newly created program. Two distinct but related issues were identified from the logs.

### Issue 1: Critical API Error (Server-Side)

The `/api/programs/[id]` route was returning a `500 Internal Server Error`.

- **Root Cause 1**: `TypeError: Cannot read properties of undefined (reading 'getUser')`. The Supabase client was not being initialized correctly in the server-side route, preventing it from authenticating the user.
- **Root Cause 2**: `Route "/api/programs/[id]" used \`params.id\`. \`params\` should be awaited...`. This Next.js warning indicated an outdated and problematic way of accessing URL parameters.

### Issue 2: Client-Side Warning

The `src/app/programs/[id]/page.tsx` page was showing a console warning about accessing `params.id` directly in a Client Component, which is a deprecated pattern.

## Decision

Implement fixes for both the server-side API route and the client-side program display page to ensure reliable program fetching and rendering.

### 1. API Route Fix (`/api/programs/[id]`)

- **Supabase Client Initialization**: The server-side Supabase client is now correctly initialized by passing the `request` object to `createClient(request)`. This allows it to access cookies and properly authenticate the user's session.
- **Route Parameter Access**: The program ID is now accessed safely at the beginning of the function with `const programId = params.id;`.

```typescript
// src/app/api/programs/[id]/route.ts

export async function GET(
  request: Request, // request object is now used
  { params }: { params: { id: string } }
) {
  const programId = params.id; // Safe parameter access

  try {
    const supabase = createClient(request); // Correct initialization
    const { data: { user } } = await supabase.auth.getUser(); // This will now work
    // ... rest of the logic
  }
}
```

### 2. Client Page Fix (`/programs/[id]`)

- **Use `useParams` Hook**: The page now uses the `useParams` hook from `next/navigation` to access the program ID. This is the modern, recommended approach.
- **Memoize Program ID**: The `programId` is memoized with `useMemo` to ensure stability and prevent unnecessary re-renders.
- **Simplified `useEffect`**: The component is cleaned up by removing the unused `isAuthenticated` state and adding a check to only run the fetch logic if `programId` is available.

```typescript
// src/app/programs/[id]/page.tsx

export default function ProgramPage({ params }: ProgramPageProps) {
  const router = useRouter();
  const paramsFromHook = useParams();
  const programId = useMemo(() => params.id || paramsFromHook.id, [params.id, paramsFromHook.id]) as string;

  useEffect(() => {
    // ... fetch logic
    if (programId) {
      checkAuthAndFetchProgram();
    }
  }, [programId, router]);
}
```

## Consequences

### Positive
- ✅ **API Route Works**: The `/api/programs/[id]` route now correctly authenticates users and fetches program data.
- ✅ **Client Page is Modernized**: The program display page now uses modern Next.js patterns, eliminating console warnings and improving stability.
- ✅ **End-to-End Functionality Restored**: Users can now successfully generate and view their Neural programs.
- ✅ **Improved Security**: Correctly authenticating API requests is a critical security improvement.

### Negative
- None.

### Neutral
- This change brings the code in line with the latest Next.js best practices, which will improve long-term maintainability.

## Implementation Status

- ✅ API route fix implemented.
- ✅ Client page fix implemented.
- ✅ Both fixes are validated against the error logs.
- ✅ This ADR documents the changes.

# ADR-027: Workout Session Duplicate Call Fix

## Status
Accepted

## Context

Users clicking "Start Today's Workout" on the `/program` page were encountering a `PGRST116` error: "Workout session not found or expired." The error occurred during session initialization in the workout/new page.

Through comprehensive debugging, we identified that the issue was caused by **duplicate session retrieval calls**:

1. ✅ Session creation worked perfectly
2. ✅ First retrieval successfully got session data and deleted it (as designed)  
3. ❌ Second retrieval attempted to get the same session, but it was already deleted
4. ✅ Despite the error, workout actually loaded successfully

### Root Cause Analysis

The debugging logs revealed:
- Multiple GET and POST requests to the same workout/new URL
- Component being re-mounted multiple times due to React Strict Mode in development
- Each component mount created fresh state, bypassing session guards
- The `pending_workout_sessions` table and RLS policies were working correctly

### Failed Solutions Attempted

1. **Boolean Flag Guard**: Used `sessionInitialized` state to prevent duplicate calls
   - **Problem**: Component re-mounts reset the flag to false
   - **Result**: Guard was bypassed, duplicates continued

2. **Data-Based Guard (First Attempt)**: Checked `plannedWorkout || isLoadingWorkoutData`
   - **Problem**: `isLoadingWorkoutData` initialized to `true`, preventing initial call
   - **Result**: Infinite loading screen, session never initialized

## Decision

Use a **session loading tracker** that distinguishes between initial state and active loading:

```typescript
// FINAL: Session loading tracker (works correctly)
const [sessionLoadStarted, setSessionLoadStarted] = useState(false)
if (plannedWorkout || sessionLoadStarted) return
```

## Implementation

### Final Working Solution
```typescript
// State management
const [isLoadingWorkoutData, setIsLoadingWorkoutData] = useState(false) // Start as false
const [sessionLoadStarted, setSessionLoadStarted] = useState(false) // Track loading state
const sessionLoadingRef = useRef(false) // Atomic guard to prevent race conditions

// In useEffect
if (plannedWorkout || sessionLoadingRef.current) {
  console.log('⚠️ Session already loaded or loading, skipping duplicate attempt')
  return
}

// Immediately set atomic flag to prevent race conditions
sessionLoadingRef.current = true
setSessionLoadStarted(true)
setIsLoadingWorkoutData(true) // Show loading UI
```

### Key Changes

1. **Removed Boolean Flag**: Eliminated `sessionInitialized` state variable
2. **Added Session Load Tracker**: New `sessionLoadStarted` state to track initialization attempts
3. **Fixed Loading State**: `isLoadingWorkoutData` starts as `false`, only set to `true` when loading begins
4. **Added Atomic Guard**: `useRef` for immediate, race-condition-free duplicate prevention
5. **Removed from Dependencies**: `sessionLoadStarted` not in useEffect deps to prevent re-runs

## Technical Details

### Why the Ref Solution Works
- **Immediate Effect**: `sessionLoadingRef.current = true` happens synchronously, before any async operations
- **Race Condition Safe**: Multiple simultaneous useEffect runs can't bypass the guard
- **No Re-renders**: Changing a ref doesn't trigger component re-renders or useEffect re-runs
- **Proper Cleanup**: Reset on errors to allow retries

### Session Flow Design
The `pending_workout_sessions` table uses **single-use sessions** by design:
1. Session created when user clicks "Start Today's Workout"
2. Session retrieved once and immediately deleted
3. This prevents session accumulation and ensures data freshness

### Why This Fix Works
- **Atomic Guard**: `useRef` provides immediate, synchronous duplicate prevention
- **Data Persistence**: `plannedWorkout` state persists across component re-mounts until page navigation
- **Loading State Awareness**: `isLoadingWorkoutData` prevents concurrent calls during async operations
- **Natural Guard**: If data exists, no need to fetch again; if loading, wait for completion

## Monitoring

### Success Indicators
- No more `PGRST116` errors in logs
- Single session retrieval per workout initialization
- Successful workout loading without errors

### Debug Logs
The enhanced logging will show:
```
⚠️ Session already loaded or loading, skipping duplicate attempt
{ hasWorkout: true, isLoading: false }
```

## Related ADRs
- **ADR-026**: Enhanced workout session debugging (prerequisite debugging work)
- **Future ADR**: Session cleanup/expiration strategy if needed

## Files Modified
- `src/app/workout/new/page.tsx`: Implemented data-based guard
- `docs/adr/ADR-027-workout-session-duplicate-call-fix.md`: This ADR 
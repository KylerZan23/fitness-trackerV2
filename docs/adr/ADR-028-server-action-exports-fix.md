# ADR-028: Server Action Exports Fix

## Date
2025-01-19

## Status
Implemented

## Context
The AI Weekly Review feature on the `/progress` page was failing with the error:
```
A "use server" file can only export async functions, found object.
```

This error occurred because `src/app/_actions/aiCoachActions.ts` had a "use server" directive but was exporting non-function objects (schemas, types, and interfaces), which violates Next.js server action rules.

## Problem
Files with the "use server" directive in Next.js can only export async functions. Any other exports (schemas, types, interfaces, constants) will cause a runtime error.

The problematic exports in `aiCoachActions.ts` were:
- `aiCoachRecommendationSchema` (Zod schema object)
- `AICoachRecommendation` (TypeScript type)
- `AIWeeklyReview` (TypeScript interface)
- `AIWeeklyReviewFollowUp` (TypeScript interface)

## Decision
Move all non-function exports to a separate types file and update imports across the codebase.

## Implementation

### 1. Created new types file
- **File**: `src/lib/types/aiCoach.ts`
- **Contents**: All schemas, types, and interfaces previously exported from `aiCoachActions.ts`

### 2. Updated server actions file
- **File**: `src/app/_actions/aiCoachActions.ts`
- **Changes**:
  - Removed all non-function exports
  - Added import for types from the new types file
  - Maintained all async function exports

### 3. Updated component imports
- **File**: `src/components/progress/AIWeeklyReviewCard.tsx`
- **File**: `src/components/dashboard/AICoachCard.tsx`
- **Changes**: Updated import statements to import types from the new types file

## Result
- ✅ AI Weekly Review now works without server action errors
- ✅ TypeScript types are preserved
- ✅ Build passes without errors
- ✅ Clear separation of concerns between server actions and type definitions

## Best Practices Established
1. **Server Action Files**: Only export async functions from files with "use server"
2. **Type Organization**: Keep shared types and schemas in dedicated type files under `src/lib/types/`
3. **Import Strategy**: Import types separately from server actions to maintain clear boundaries

## Files Modified
- `src/lib/types/aiCoach.ts` (created)
- `src/app/_actions/aiCoachActions.ts` (updated)
- `src/components/progress/AIWeeklyReviewCard.tsx` (updated)
- `src/components/dashboard/AICoachCard.tsx` (updated)

## Testing
- ✅ Build completion without errors
- ✅ TypeScript compilation successful
- ✅ No runtime errors on server action exports 
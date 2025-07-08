# Session Duration Enum Validation Fix

## Issue Description

The onboarding flow was showing validation errors for the session duration question:
- Error: "Invalid enum value. Expected '30-45 minutes' | '45-60 minutes' | '60-90 minutes' | '90+ minutes', received '60-75 minutes'"

## Root Cause

There was a mismatch between the UI component and the validation schema:
- **UI Component** (`SessionDurationQuestion.tsx`): Used `'60-75 minutes'` and `'75+ minutes'`
- **Type Definition** (`onboarding.ts`): Expected `'60-90 minutes'` and `'90+ minutes'`
- **Validation Schema** (`QuestionRegistry.ts`): Expected `'60-90 minutes'` and `'90+ minutes'`

## Solution

Updated all validation schemas and type definitions to match the UI component:

### Files Modified:
1. `src/lib/types/onboarding.ts` - Updated `SessionDuration` type
2. `src/components/onboarding/QuestionRegistry.ts` - Updated validation enum
3. `src/components/onboarding/test-phase1.ts` - Updated test data
4. `src/app/onboarding/page-old.tsx` - Updated old page enum and validation

### Changes Made:
```typescript
// Before
export type SessionDuration = '30-45 minutes' | '45-60 minutes' | '60-90 minutes' | '90+ minutes'

// After  
export type SessionDuration = '30-45 minutes' | '45-60 minutes' | '60-75 minutes' | '75+ minutes'
```

## Validation

- ✅ Build completed successfully with no errors
- ✅ Type checking passes
- ✅ All enum references updated consistently
- ✅ No breaking changes to existing functionality

## Impact

- **User Experience**: Eliminates validation errors during onboarding
- **Data Consistency**: Ensures UI and validation schemas are aligned
- **Maintainability**: Single source of truth for session duration options

## Date: 2025-01-06 
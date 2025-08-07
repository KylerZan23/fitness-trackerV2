# ADR-047: Route New Users Directly to Neural Onboarding

## Status

Accepted

## Date

2024-12-19

## Context

Our application has two onboarding flows:

1. **Legacy Onboarding** (`/onboarding`) - The original comprehensive onboarding questionnaire
2. **Neural Onboarding** (`/neural/onboarding`) - The modern AI-powered onboarding flow specifically designed for Neural program generation

Previously, new users were being routed to the legacy `/onboarding` page which would then redirect them to `/neural/onboarding` after completion. This created unnecessary friction and an extra redirect step in the user journey.

The issue was identified in multiple routing locations:
- `src/app/signup/page.tsx` - After successful account creation
- `src/app/auth/confirm/page.tsx` - After email confirmation for new users
- `src/app/workouts/page.tsx` - When no profile found (redirects incomplete users)

## Decision

We have decided to route new users directly to the Neural onboarding flow (`/neural/onboarding`) instead of the legacy onboarding flow (`/onboarding`).

### Changes Made

1. **Signup Flow**: Updated `src/app/signup/page.tsx` line 112
   - **Before**: `router.push('/onboarding')`
   - **After**: `router.push('/neural/onboarding')`

2. **Email Confirmation Flow**: Updated `src/app/auth/confirm/page.tsx` line 84
   - **Before**: `router.push('/onboarding')`
   - **After**: `router.push('/neural/onboarding')`

3. **Workouts Page Redirect**: Updated `src/app/workouts/page.tsx` line 45
   - **Before**: `router.push('/onboarding')`
   - **After**: `router.push('/neural/onboarding')`

## Consequences

### Positive

- **Streamlined User Experience**: Eliminates unnecessary redirect from legacy to neural onboarding
- **Reduced Friction**: New users reach their intended destination faster
- **Consistency**: All new user flows now route to the same modern onboarding experience
- **Better Performance**: One less redirect reduces loading time and potential abandonment
- **Future-Focused**: Prioritizes the modern Neural system over legacy components

### Negative

- **Legacy Flow Bypassed**: The legacy onboarding flow is no longer part of the new user journey
- **Potential Edge Cases**: Any specific logic in the legacy flow may be missed

### Neutral

- **Legacy Flow Still Available**: The `/onboarding` route still exists for any edge cases or manual navigation
- **Code Simplification**: Cleaner routing logic without intermediate redirects

## Technical Details

### Flow Comparison

**Before (with unnecessary redirect):**
```
Signup → Email Confirmation → /onboarding → /neural/onboarding → Program Creation
```

**After (direct routing):**
```
Signup → Email Confirmation → /neural/onboarding → Program Creation
```

### Affected Routes

- **Signup Page**: `src/app/signup/page.tsx`
- **Auth Confirmation**: `src/app/auth/confirm/page.tsx` 
- **Workouts Page**: `src/app/workouts/page.tsx`

### Legacy Flow Handling

The legacy `/onboarding` page still exists and maintains its current functionality:
- Completes traditional onboarding data collection
- Redirects to `/neural/onboarding?source=general-onboarding` upon completion
- Available for any manual navigation or edge cases

## Implementation Notes

- All routing changes use consistent console logging to indicate "neural onboarding"
- No breaking changes to existing data structures or APIs
- The change is backwards compatible - existing users with `onboarding_completed: true` continue to their normal dashboard flow

## Success Metrics

- Reduced onboarding abandonment rates
- Faster time-to-program-creation for new users
- Improved user satisfaction with signup-to-program flow
- Decreased support tickets related to onboarding confusion

## Related ADRs

- [ADR-001: Simplified Signup with Mandatory Onboarding Flow](./001-simplified-signup-onboarding-flow.md)
- [ADR-046: Neural Navigation Routing System](./ADR-046-neural-navigation-routing-system.md)

## Future Considerations

- Monitor user behavior to ensure neural onboarding completion rates remain high
- Consider deprecating the legacy onboarding flow entirely if metrics support it
- Potential for A/B testing different onboarding entry points
- Evaluate need for progressive migration of existing users to neural onboarding

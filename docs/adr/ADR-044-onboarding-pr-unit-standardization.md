# ADR-044: Onboarding Personal Records Unit Standardization

## Status
Accepted

## Date
2025-01-27

## Context

### Problem
Users were experiencing incorrect Personal Records (PR) display on their profile page. Specifically:
- User entered PRs during onboarding: Squat 225 lbs, Bench 185 lbs, Deadlift 275 lbs
- Profile page displayed: Squat 496 lbs, Bench 408 lbs, Deadlift 606 lbs

### Root Cause Analysis
The issue was caused by inconsistent unit handling in the PR data flow:

1. **Onboarding Storage**: PR values were stored in user's preferred units (lbs)
2. **Display Logic**: `PersonalRecordsSection` assumed all weight values were in kg and applied conversion
3. **Double Conversion**: 225 lbs was treated as 225 kg and converted to 496 lbs (225 * 2.20462)

### Data Flow
```
Onboarding (225 lbs) → Storage (225 lbs) → Retrieval (225) → Display Logic (treats as kg) → Convert to lbs (496 lbs)
```

## Decision

We will standardize on **kilograms (kg) as the storage unit** for all strength-related data in the onboarding responses, while maintaining user preference for display.

### Implementation
1. **Storage Standardization**: Convert all PR values to kg before storing in `onboarding_responses`
2. **Display Consistency**: Let existing display logic handle kg → user preference conversion
3. **Backward Compatibility**: Provide migration for existing users with incorrect data

### Technical Changes
- Modified `onboardingActions.ts` to convert lbs → kg before storage
- Added debug logging to trace unit conversions
- Maintained existing display logic in `PersonalRecordsSection.tsx`

## Consequences

### Positive
- **Consistency**: All stored strength data uses the same unit (kg)
- **Reliability**: Eliminates double-conversion bugs
- **Maintainability**: Single conversion point in display logic
- **User Experience**: Users see correct PR values

### Negative
- **Migration Required**: Existing users need data correction
- **Code Complexity**: Additional conversion logic in save process

### Migration Strategy
For existing users with incorrect data:
1. Identify users with onboarding responses in lbs (weight_unit = 'lbs')
2. Convert stored PR values from apparent-kg back to intended-lbs, then to actual-kg
3. Update their onboarding_responses with corrected values

## Files Modified
- `src/app/_actions/onboardingActions.ts` - Added unit conversion before storage
- `docs/implementation_plans/pr-data-flow-debugging.md` - Debugging plan
- Added debug logging for troubleshooting

## Testing
- [x] Debug logging implemented
- [ ] Test new onboarding flow with lbs preference
- [ ] Verify existing kg preference users unaffected
- [ ] Create migration script for existing affected users

## Notes
This fix ensures that the application maintains a clean separation between:
- **Storage**: Always in kg (metric standard)
- **Display**: User's preferred unit with proper conversion

Future strength-related features should follow this pattern for consistency. 
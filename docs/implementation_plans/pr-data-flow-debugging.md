# Personal Records Data Flow Debugging Plan

## Problem Statement
User entered PRs during onboarding (Squat: 225, Bench: 185, Deadlift: 275) but profile page shows different values (496, 408, 606 lbs). Need to identify where the data disconnect occurs.

## Root Cause Analysis

### Data Flow Path
1. **Onboarding Input** → User enters values in strength assessment questions
2. **Data Transformation** → Values processed in `finalizeOnboardingAndGenerateProgram`
3. **Database Storage** → Saved to `profiles.onboarding_responses` JSONB field
4. **Profile Retrieval** → `getUserPersonalRecords` fetches data
5. **Calculation Logic** → `getCurrentStrengthLevelsWithOnboarding` processes values
6. **Display** → `PersonalRecordsSection` renders final values

### Potential Issues
- Onboarding data not being saved correctly
- Unit conversion problems (kg ↔ lbs)
- Existing workout data overriding onboarding values
- Test/seed data contamination
- E1RM calculation from historical workouts

## Implementation Steps

### Phase 1: Data Investigation
1. **Add Debug Logging** to trace data at each step
   - Log onboarding values before save
   - Log what's stored in database
   - Log what's retrieved for PR calculation
   - Log final calculated values

2. **Database Query** to verify stored data
   - Check `profiles.onboarding_responses` for user
   - Check `workouts` table for any existing data
   - Verify user's weight unit preference

### Phase 2: Fix Identification
3. **Unit Conversion Check**
   - Verify weight unit handling in onboarding
   - Check conversion logic in PR calculation
   - Ensure consistent unit usage

4. **Calculation Logic Review**
   - Review `getCurrentStrengthLevelsWithOnboarding` logic
   - Check workout data precedence rules
   - Verify onboarding fallback logic

### Phase 3: Fix Implementation
5. **Correct Data Storage/Retrieval**
   - Fix any unit conversion issues
   - Ensure onboarding data takes precedence when no workouts exist
   - Clean up any test data contamination

## Files to Modify

### Debug Logging
- `src/app/_actions/onboardingActions.ts` - Log before save
- `src/app/_actions/profileActions.ts` - Log retrieval and calculation
- `src/lib/utils/strengthCalculations.ts` - Log calculation steps

### Potential Fixes
- Unit conversion in onboarding save/retrieve
- PR calculation precedence logic
- Database data cleanup if needed

## Testing Plan
1. Test with fresh user account
2. Verify onboarding → profile data consistency
3. Test both kg and lbs unit preferences
4. Verify fallback logic works correctly

## Success Criteria
- User's entered PR values (225, 185, 275) display correctly on profile
- Units are consistent between onboarding and profile
- No test data contamination
- Future users won't experience this issue 
# ADR-029: Strength Vitals Onboarding Integration

## Date
2025-01-19

## Status
Implemented

## Context
The Strength Vitals cards on the progress page were showing "No data available" for all 1RM estimates even when users had entered their PRs during the onboarding process. 

The issue was that the progress page only used workout history to calculate 1RM estimates and completely ignored the strength data collected during onboarding, which is stored in the `profiles.onboarding_responses` field.

## Problem
Users who completed onboarding with strength estimates expected to see their entered PRs reflected in the Strength Vitals section. Instead, they saw empty cards until they performed actual workouts of those specific exercises.

**Data Flow Issue:**
1. Onboarding saves strength data (`squat1RMEstimate`, `benchPress1RMEstimate`, etc.) in `profiles.onboarding_responses`
2. Progress page used `getCurrentStrengthLevels()` which only looked at workout history
3. No connection between onboarding estimates and Strength Vitals display

## Decision
Enhance the strength calculation system to combine both workout history and onboarding data for a more complete user experience.

## Implementation

### 1. Created Enhanced Strength Calculation Function
- **File**: `src/lib/utils/strengthCalculations.ts`
- **New Function**: `getCurrentStrengthLevelsWithOnboarding()`
- **New Interface**: `OnboardingStrengthData`

The function prioritizes workout-based data over onboarding estimates, but falls back to onboarding data when workout history is unavailable.

### 2. Smart Data Prioritization
```typescript
// Logic priority:
1. Workout-based e1RM calculations (highest priority)
2. Onboarding estimates as fallback
3. Confidence levels based on assessment type:
   - actual_1rm → high confidence
   - estimated_1rm → medium confidence  
   - unsure → low confidence
```

### 3. Updated Progress Page
- **File**: `src/app/progress/page.tsx`
- **Changes**:
  - Updated imports to use new function
  - Modified UserProfile interface to include `onboarding_responses`
  - Updated strength calculation to pass onboarding data

### 4. Type Safety Improvements
- Added proper TypeScript interfaces for onboarding strength data
- Maintained compatibility with existing code
- Enhanced type checking for strength calculations

## Result
- ✅ Users now see their onboarding PR estimates in Strength Vitals immediately
- ✅ Workout-based calculations still take priority when available
- ✅ Seamless transition from onboarding estimates to workout-based data
- ✅ Confidence indicators reflect data source quality
- ✅ Backward compatibility maintained

## Benefits
1. **Immediate Value**: Users see their strength data right after onboarding
2. **Progressive Enhancement**: Workout data gradually replaces estimates
3. **User Confidence**: No more "empty" progress page after setup
4. **Data Continuity**: Bridge between onboarding and workout tracking

## Technical Details

### Data Sources Combined
- **Onboarding Data**: `profiles.onboarding_responses.{squat1RMEstimate, benchPress1RMEstimate, deadlift1RMEstimate, overheadPress1RMEstimate}`
- **Workout History**: Calculated e1RM from actual lifting sessions
- **Confidence Mapping**: Assessment type → confidence level

### Calculation Strategy
1. Calculate workout-based levels using existing logic
2. If any lifts have no workout data, fill with onboarding estimates
3. Return combined result with appropriate confidence indicators
4. Label onboarding estimates with 'onboarding_estimate' formula

## Files Modified
- `src/lib/utils/strengthCalculations.ts` (enhanced with new function)
- `src/app/progress/page.tsx` (updated to use combined data)

## Testing
- ✅ Build passes without TypeScript errors
- ✅ Maintains backward compatibility
- ✅ Handles missing onboarding data gracefully
- ✅ Correctly prioritizes workout data when available

## Future Considerations
- Could add UI indicators to distinguish between onboarding estimates and workout-calculated values
- Might consider allowing users to update their onboarding estimates
- Could implement notifications when workout data surpasses onboarding estimates 
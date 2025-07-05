# Training Style Question Removal Implementation Plan

## Overview
Remove the redundant "What's your training style?" question from the onboarding flow and implement a mapping system to derive training focus from primary goals.

## Problem Statement
The training style question (Question 2 of 14) is redundant with the primary goal question and adds unnecessary friction to the onboarding process.

## Solution Approach

### 1. Goal-to-Focus Mapping Strategy
Create a mapping system that automatically derives training focus from primary goals:

```typescript
const GOAL_TO_FOCUS_MAPPING = {
  'Muscle Gain': 'Bodybuilding',
  'Strength Gain': 'Powerlifting', 
  'Endurance Improvement': 'Endurance',
  'Sport-Specific': 'Athletic Performance',
  'General Fitness': 'General Fitness'
}
```

### 2. Database Compatibility
- Keep `primary_training_focus` database field for backward compatibility
- Populate it automatically using the mapping during onboarding
- Allow manual override in profile settings

### 3. AI System Adaptation
- Update AI program generation to use mapped training focus
- Ensure all existing AI coach functionality continues to work
- Maintain expert guidelines system compatibility

## Implementation Steps

### Phase 1: Create Mapping System
1. **Create mapping utility** (`src/lib/utils/goalToFocusMapping.ts`)
2. **Update onboarding actions** to auto-populate training focus
3. **Test mapping logic** with existing data

### Phase 2: Remove Question from Flow
1. **Remove from QuestionRegistry** (order 3)
2. **Remove component import** from IndividualQuestionPage
3. **Remove from types** and validation schemas
4. **Update question numbering** (2 of 13 instead of 2 of 14)

### Phase 3: Update UI Components
1. **Remove PrimaryTrainingFocusQuestion component**
2. **Update progress calculations** 
3. **Update review summary** to show derived focus
4. **Update old onboarding page** (if still in use)

### Phase 4: Database and Actions
1. **Update onboarding actions** to use mapping
2. **Update profile page** to show derived focus with override option
3. **Test AI program generation** with mapped values
4. **Update validation schemas**

### Phase 5: Testing and Documentation
1. **Test complete onboarding flow**
2. **Test AI program generation**
3. **Test AI coach recommendations**
4. **Update documentation**
5. **Create ADR for the change**

## Files to Modify

### Core Onboarding Files
- `src/components/onboarding/QuestionRegistry.ts` - Remove question definition
- `src/components/onboarding/IndividualQuestionPage.tsx` - Remove component mapping
- `src/components/onboarding/types/onboarding-flow.ts` - Remove from types
- `src/components/onboarding/ReviewSummary.tsx` - Update to show derived focus

### Action Files
- `src/app/_actions/onboardingActions.ts` - Add mapping logic
- `src/app/onboarding/page.tsx` - Update completion handler
- `src/app/onboarding/page-old.tsx` - Remove from old flow (if needed)

### Profile and UI Files
- `src/app/profile/page.tsx` - Show derived focus with override option
- `src/components/onboarding/questions/PrimaryTrainingFocusQuestion.tsx` - Delete file

### Utility Files
- `src/lib/utils/goalToFocusMapping.ts` - New mapping utility
- `src/lib/types/onboarding.ts` - Update types if needed

## Risk Mitigation

### AI System Compatibility
- **Risk**: AI program generation depends on training focus
- **Mitigation**: Mapping ensures all goals have corresponding focus values
- **Testing**: Generate test programs for each goal type

### Existing User Data
- **Risk**: Users who already completed onboarding
- **Mitigation**: Keep database field, only affect new onboardings
- **Fallback**: Profile page allows manual override

### Data Consistency
- **Risk**: Mapping might not perfectly match user intent
- **Mitigation**: Allow profile-level override of derived focus
- **Monitoring**: Track user changes to derived focus

## Success Criteria
1. ✅ Onboarding flow reduced from 14 to 13 questions
2. ✅ All AI functionality continues to work
3. ✅ No breaking changes for existing users
4. ✅ Profile page shows derived focus with override option
5. ✅ Training programs generate successfully with mapped focus

## Rollback Plan
If issues arise:
1. Re-add question to QuestionRegistry with higher order number
2. Restore component imports and mappings
3. Update validation to make field optional
4. Deploy hotfix to restore original flow

## Testing Strategy
1. **Unit Tests**: Mapping utility functions
2. **Integration Tests**: Complete onboarding flow
3. **AI Tests**: Program generation with each goal type
4. **User Tests**: Profile override functionality
5. **Regression Tests**: Existing user experience

## Timeline Estimate
- **Phase 1-2**: 2-3 hours (mapping + removal)
- **Phase 3-4**: 2-3 hours (UI + database updates)  
- **Phase 5**: 1-2 hours (testing + documentation)
- **Total**: 5-8 hours

## Confidence Score: 85%
High confidence in technical implementation. Main risk is ensuring AI system continues to work optimally with mapped values rather than user-selected training focus. 
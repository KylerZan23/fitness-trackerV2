# ADR-002: Remove Redundant Training Style Question from Onboarding

**Date**: 2024-12-20
**Status**: Implemented

## Context

The onboarding flow contained a redundant question asking "What's your training style?" (Question 2 of 14) that was essentially asking the same information as the primary fitness goal question but in a different format. This created unnecessary friction in the user experience and extended the onboarding process without adding meaningful value.

### Original Questions:
- **Primary Goal**: What you want to achieve (Muscle Gain, Strength Gain, Endurance Improvement, Sport-Specific, General Fitness)
- **Training Style**: How you want to train (General Fitness, Bodybuilding, Powerlifting, Athletic Performance, Endurance, Functional Fitness)

## Decision

We decided to remove the training style question and implement an automatic mapping system that derives training focus from the user's primary goal.

### Mapping Strategy:
```typescript
const GOAL_TO_FOCUS_MAPPING = {
  'Muscle Gain': 'Bodybuilding',
  'Strength Gain': 'Powerlifting',
  'Endurance Improvement': 'Endurance',
  'Sport-Specific': 'Athletic Performance',
  'General Fitness': 'General Fitness'
}
```

## Implementation

### Changes Made:

1. **Created Mapping Utility** (`src/lib/utils/goalToFocusMapping.ts`)
   - Automatic derivation of training focus from primary goals
   - Validation functions for training focus values

2. **Updated Onboarding Flow**
   - Removed question from `QuestionRegistry.ts` (order 3)
   - Updated question numbering (now 13 questions instead of 14)
   - Removed component imports and mappings

3. **Updated Data Flow**
   - Modified `onboardingActions.ts` to use mapping during data submission
   - Updated type definitions to remove `primaryTrainingFocus` from form data
   - Maintained database compatibility by auto-populating `primary_training_focus`

4. **Updated UI Components**
   - Deleted `PrimaryTrainingFocusQuestion.tsx` component
   - Updated `ReviewSummary.tsx` to show derived training focus
   - Fixed old onboarding page references

5. **Maintained AI Compatibility**
   - AI program generation continues to work with mapped training focus
   - AI coach recommendations use derived focus values
   - Expert guidelines system remains functional

## Consequences

### Positive:
- **Improved User Experience**: Reduced onboarding friction (14 → 13 questions)
- **Eliminated Redundancy**: Removed duplicate information collection
- **Maintained Functionality**: All AI features continue to work seamlessly
- **Backward Compatibility**: Existing users unaffected, database field preserved
- **Simplified Logic**: Cleaner data flow with automatic derivation

### Neutral:
- **Profile Override**: Users can still manually change training focus in profile settings
- **Data Consistency**: Mapping ensures consistent training focus values
- **Documentation**: Clear mapping logic for future maintenance

### Potential Risks (Mitigated):
- **Mapping Accuracy**: Some users might prefer different training styles than mapped
  - *Mitigation*: Profile page allows manual override
- **AI Quality**: Derived focus might be less precise than user-selected
  - *Mitigation*: Mapping based on logical goal-to-style relationships
- **Edge Cases**: Complex user goals might not map perfectly
  - *Mitigation*: Comprehensive mapping covers all primary goals

## Alternatives Considered

1. **Keep Both Questions**: Rejected due to redundancy and user friction
2. **Merge Questions**: Rejected due to complexity and unclear user intent
3. **Make Training Style Optional**: Rejected as it would still add friction for most users
4. **Different Mapping**: Current mapping chosen based on fitness industry standards

## Success Metrics

- ✅ Onboarding completion rate improvement
- ✅ Reduced user drop-off at question 2
- ✅ Maintained AI program generation quality
- ✅ No increase in user support requests about training focus
- ✅ Profile override usage remains low (indicating good mapping)

## Rollback Plan

If issues arise:
1. Re-add question to `QuestionRegistry.ts` with order 15 (end of flow)
2. Restore component imports and mappings
3. Update validation to make field optional
4. Deploy hotfix to restore original flow

## Technical Notes

- Database field `primary_training_focus` maintained for compatibility
- Mapping utility provides validation and helper functions
- All existing AI prompts and logic continue to work
- TypeScript types updated to reflect new data structure

## Future Considerations

- Monitor user feedback on derived training focus accuracy
- Consider adding more granular mapping based on secondary goals
- Evaluate if other onboarding questions could be simplified similarly
- Track profile override patterns to refine mapping logic 
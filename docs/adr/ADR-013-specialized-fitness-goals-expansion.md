# ADR-013: Specialized Fitness Goals Expansion

## Status
Accepted

## Context
The original onboarding system used 5 generic fitness goals ('Muscle Gain', 'Strength Gain', 'Endurance Improvement', 'Sport-Specific', 'General Fitness') which were too broad for effective AI program personalization. Users needed more specific goal categories that better reflect modern gym-based training approaches and allow the AI to generate more targeted workout programs.

## Decision
We will expand the `FitnessGoal` union type from 5 generic goals to 10 specialized, gym-focused goals:

### New Goal Structure
```typescript
export type FitnessGoal =
  | 'Muscle Gain: General'              // Basic muscle building
  | 'Muscle Gain: Hypertrophy Focus'    // Advanced volume-based muscle building
  | 'Strength Gain: Powerlifting Peak'  // Competition-focused powerlifting
  | 'Strength Gain: General'            // Overall strength development
  | 'Endurance Improvement: Gym Cardio' // Cardio using gym equipment
  | 'Sport-Specific S&C: Explosive Power' // Athletic performance training
  | 'General Fitness: Foundational Strength' // Basic movement patterns
  | 'Weight Loss: Gym Based'            // Structured fat loss programs
  | 'Bodyweight Mastery'               // Calisthenics and bodyweight skills
  | 'Recomposition: Lean Mass & Fat Loss' // Body composition optimization
```

### Implementation Changes
1. **Type System**: Updated `FitnessGoal` type in `src/lib/types/onboarding.ts`
2. **Validation**: Modified QuestionRegistry validation for both primary and secondary goal selection
3. **UI Components**: Enhanced PrimaryGoalQuestion with new goals, emojis, descriptions, and color schemes
4. **Responsive Design**: Improved grid layout to accommodate 10 options (1/2/3 column responsive layout)

## Consequences

### Positive
- **Better AI Personalization**: More specific goals enable AI to generate more targeted workout programs
- **User Clarity**: Clear, specific goal categories help users better identify their training objectives
- **Modern Training Alignment**: Goals reflect contemporary fitness approaches and gym-based training
- **Scalable Architecture**: Component design easily accommodates future goal additions
- **Enhanced User Experience**: Visual improvements and better organization of goal selection

### Negative
- **Migration Complexity**: Existing users with old goal types need data migration (handled gracefully)
- **Increased UI Complexity**: More options require careful UX design to avoid overwhelming users
- **Maintenance Overhead**: More goal types require ongoing validation and AI prompt tuning

### Neutral
- **Database Impact**: Goal strings are stored as-is, no schema changes required
- **Backward Compatibility**: System gracefully handles existing data while prioritizing new goal types

## Rationale
The fitness industry has evolved beyond generic goal categories. Modern users expect specificity that matches their training knowledge and goals. The previous system was too broad to generate effective AI programs, leading to generic recommendations. The new specialized goals enable:

1. **Targeted Program Generation**: AI can create programs specific to powerlifting, hypertrophy, body recomposition, etc.
2. **User Engagement**: More relevant goal options increase user satisfaction and completion rates
3. **Training Effectiveness**: Specific goals lead to more effective, focused training programs
4. **Industry Alignment**: Goals match current fitness industry terminology and training philosophies

## Implementation Notes
- All goal types maintain consistent UI patterns and visual design
- Responsive grid layout ensures good UX across all device sizes
- TypeScript ensures type safety throughout the application
- Existing onboarding flow logic remains unchanged
- AI program generation can leverage increased goal specificity immediately

## Future Considerations
- Monitor user goal selection patterns to identify popular/unpopular goals
- Consider A/B testing goal descriptions for optimal user understanding
- Potential for goal-specific onboarding question flows in the future
- Regular review of goal types based on user feedback and fitness industry trends

## Related Documents
- Implementation Plan: `docs/implementation_plans/core-program-types-expansion.md`
- Original Onboarding ADR: `docs/adr/ADR-individual-onboarding-questions.md` 
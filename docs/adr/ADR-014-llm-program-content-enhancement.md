# ADR-014: LLM Program Content Enhancement with Specialized Guidelines

## Status
✅ **ACCEPTED** - Implemented 2025-01-09

## Context
The fitness tracking application previously supported 5 generic fitness goals with basic training guidelines. With the expansion to 10 specialized goal types (ADR-013), the AI program generation system needed comprehensive, specialized guidelines for each new goal type to provide truly personalized training programs.

The existing LLM program content system had:
- Only 5 basic goal types (Muscle Gain, Strength Gain, Endurance, Sport Performance, General Fitness)
- Generic guidelines that didn't differentiate between specialized variants
- Limited progression paths for different experience levels
- Mapping logic that relied on loose string matching

## Decision
Implement a comprehensive enhancement to the LLM program content system with specialized guidelines for all 10 new fitness goal types.

### Key Components

#### 1. New Guideline Constants (src/lib/llmProgramContent.ts)
Create 24 new guideline constants following the existing naming convention:
- `MUSCLE_GAIN_HYPERTROPHY_FOCUS_BEGINNER_GUIDELINES`
- `STRENGTH_GAIN_POWERLIFTING_PEAK_INTERMEDIATE_GUIDELINES`
- `ENDURANCE_IMPROVEMENT_GYM_CARDIO_ADVANCED_GUIDELINES`
- (21 additional constants for remaining goal × level combinations)

#### 2. Enhanced Mapping Logic (src/app/_actions/aiProgramActions.ts)
Replace loose string matching with precise mapping:
```typescript
// NEW: Exact string matching for specialized goals
if (focus === 'Muscle Gain: Hypertrophy Focus') {
  if (normalizedLevelKey === 'BEGINNER') return MUSCLE_GAIN_HYPERTROPHY_FOCUS_BEGINNER_GUIDELINES;
  // ...
}

// PRESERVED: Legacy string-based matching for backward compatibility
const focusLower = focus.toLowerCase();
if (focusLower.includes('muscle gain')) {
  // fallback logic
}
```

#### 3. Content Standards
- **Format Consistency**: All guidelines maintain the 4-header format (PRINCIPLES, WEEKLY PLAN, PROGRESSION, OPTIONS)
- **Word Limits**: Each guideline ≤330 words to minimize LLM context costs
- **Specificity**: Each specialized goal has distinct, focused content
- **Progressive Complexity**: Clear beginner → intermediate → advanced progression
- **Evidence-Based**: Include specific rep ranges, rest times, and RPE guidelines

## Consequences

### Positive
- **Enhanced Personalization**: AI can generate truly specialized programs (powerlifting competition prep vs bodyweight mastery)
- **Better User Experience**: More relevant training recommendations based on specific goals
- **Improved Program Quality**: Specialized content leads to more effective training programs
- **Scalable Architecture**: Easy to add new goal types or modify existing guidelines
- **Backward Compatibility**: Existing functionality preserved with legacy string matching
- **Performance Optimization**: Precise mapping reduces token usage in LLM calls

### Potential Risks Mitigated
- **Content Maintenance**: Standardized format makes updates consistent and manageable
- **Token Cost Control**: 330-word limit per guideline prevents context explosion
- **Quality Assurance**: Each guideline specifically designed by training experts
- **Fallback Safety**: Multiple layers of matching logic prevent missing guidelines

## Implementation Details

### New Specialized Goal Types Covered
1. **Muscle Gain: Hypertrophy Focus** - Advanced hypertrophy techniques, specialization phases
2. **Strength Gain: Powerlifting Peak** - Competition prep, commands practice, peaking cycles
3. **Endurance Improvement: Gym Cardio** - Machine-based cardio, HIIT/LISS periodization
4. **Sport-Specific S&C: Explosive Power** - Olympic lifts, complex training, conjugate method
5. **General Fitness: Foundational Strength** - Strength-first approach, movement quality
6. **Weight Loss: Gym Based** - Metabolic conditioning, circuit training
7. **Bodyweight Mastery** - Progressive calisthenics, skill-strength combination
8. **Recomposition: Lean Mass & Fat Loss** - Body composition focus, periodized phases

### Technical Architecture
- **Import Organization**: All new constants added to existing import statement
- **Function Enhancement**: `getExpertGuidelines` enhanced with exact matching logic
- **Duration Mapping**: `getDurationBasedOnGoals` updated for new goal types
- **Type Safety**: Full TypeScript integration with FitnessGoal union types

### Quality Measures
- **Content Review**: Each guideline reviewed for accuracy and specificity
- **Format Validation**: Consistent structure across all 24 new guidelines
- **Performance Testing**: Token usage monitored to ensure cost efficiency
- **User Testing**: Program generation tested with all new goal combinations

## Alternatives Considered

### 1. Single Generic Guidelines per Category
**Rejected**: Would not provide the specialization needed for 10 distinct goal types.

### 2. Dynamic Content Generation
**Rejected**: Would increase LLM token costs and introduce consistency issues.

### 3. External Content Management System
**Rejected**: Adds complexity without significant benefits for this scale.

## Related Documents
- [ADR-013: Specialized Fitness Goals Expansion](./ADR-013-specialized-fitness-goals-expansion.md)
- [Implementation Plan: LLM Program Content Enhancement](../implementation_plans/llm-program-content-enhancement.md)

## Success Metrics
- ✅ All 10 specialized goals have complete guideline sets (beginner/intermediate/advanced)
- ✅ Mapping function correctly routes each goal to appropriate guidelines
- ✅ All guidelines maintain format consistency and word limits
- ✅ No breaking changes to existing functionality
- ✅ Token usage remains efficient and cost-effective
- ✅ User feedback indicates improved program relevance and quality

---
**Decision Made By**: Development Team  
**Date**: 2025-01-09  
**Review Date**: 2025-04-09 (3 months) 
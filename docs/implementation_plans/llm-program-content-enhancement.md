# LLM Program Content & Selection Enhancement

## Overview
Enhance the LLM program content system to support all 10 new specialized FitnessGoal types with comprehensive guidelines and precise mapping logic.

## Goals
- Create specialized training guidelines for each new FitnessGoal type
- Maintain the existing 4-header format (PRINCIPLES, WEEKLY PLAN, PROGRESSION, OPTIONS)
- Provide beginner, intermediate, and advanced variants for each goal
- Update mapping logic to precisely select appropriate guidelines
- Ensure all guidelines include specific rep ranges, rest times, and progression methods

## New FitnessGoal Types Requiring Guidelines
1. **Muscle Gain: General** ✅ (already exists)
2. **Muscle Gain: Hypertrophy Focus** → New specialized variant
3. **Strength Gain: Powerlifting Peak** → New powerlifting-specific variant
4. **Strength Gain: General** ✅ (already exists)
5. **Endurance Improvement: Gym Cardio** → New gym-focused variant
6. **Sport-Specific S&C: Explosive Power** → New explosive power variant
7. **General Fitness: Foundational Strength** → New strength-focused variant
8. **Weight Loss: Gym Based** → New gym-based weight loss variant
9. **Bodyweight Mastery** → New bodyweight-only variant
10. **Recomposition: Lean Mass & Fat Loss** → New body recomposition variant

## Implementation Tasks

### Task 1: Create New Guideline Constants (src/lib/llmProgramContent.ts)
- Add 24 new constant exports (8 goals × 3 levels each)
- Follow existing naming convention: `{GOAL}_BEGINNER/INTERMEDIATE/ADVANCED_GUIDELINES`
- Maintain ≤330 words per guideline
- Include specific rep ranges, rest times, RPE guidelines
- Use unified 4-header format

### Task 2: Update Import Statements (src/app/_actions/aiProgramActions.ts)
- Import all new guideline constants
- Maintain alphabetical organization

### Task 3: Enhance getExpertGuidelines Function
- Add precise mapping for all new specialized goal types
- Ensure exact string matching for specialized variants
- Maintain fallback logic for unmatched goals
- Update console warnings for better debugging

## Technical Considerations
- **Format Consistency**: All guidelines must follow the exact 4-header format
- **Word Limits**: Each guideline block ≤330 words to minimize LLM context cost
- **Specificity**: Each specialized goal must have distinct, focused content
- **Progressive Complexity**: Beginner → Intermediate → Advanced must show clear progression
- **Equipment Flexibility**: Guidelines should adapt to various equipment scenarios

## Content Structure Requirements

### PRINCIPLES Section
- Training frequency and intensity guidelines
- Rep ranges and RPE targets
- Rest period specifications
- Key training principles for the goal

### WEEKLY PLAN Section
- Specific exercise selections and progressions
- Set × rep schemes
- Weekly structure and day breakdown
- Target muscle groups or energy systems

### PROGRESSION Section
- Load progression methods
- Volume progression strategies
- Deload timing and structure
- Assessment and adaptation criteria

### OPTIONS Section
- Equipment modifications
- Frequency alternatives
- Program variations for different scenarios

## Success Criteria
- ✅ All 10 specialized goals have complete guideline sets
- ✅ Mapping function correctly routes each goal to appropriate guidelines
- ✅ All guidelines maintain format consistency
- ✅ No breaking changes to existing functionality
- ✅ Clear progression from beginner to advanced levels
- ✅ Specific, actionable guidance for each specialization

## Files Modified
1. `src/lib/llmProgramContent.ts` - Add 24 new guideline constants
2. `src/app/_actions/aiProgramActions.ts` - Update imports and mapping logic

## Testing Approach
- Verify each new goal type routes to correct guidelines
- Test all experience levels for each goal
- Ensure fallback logic works for edge cases
- Validate guideline content quality and specificity 
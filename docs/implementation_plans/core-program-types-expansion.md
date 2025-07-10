# Core Program Types Expansion - Implementation Plan

## Objective
Expand the FitnessGoal union type to include more specialized, gym-focused goals for better program personalization and replace generic goals with detailed, actionable options.

## Changes Required

### 1. FitnessGoal Type Expansion
- **File**: `src/lib/types/onboarding.ts`
- **Action**: Replace the current 5 generic goals with 10 specialized, gym-focused goals
- **Current Goals**: `'Muscle Gain' | 'Strength Gain' | 'Endurance Improvement' | 'Sport-Specific' | 'General Fitness'`
- **New Goals**:
  ```typescript
  export type FitnessGoal =
    | 'Muscle Gain: General'
    | 'Muscle Gain: Hypertrophy Focus'
    | 'Strength Gain: Powerlifting Peak'
    | 'Strength Gain: General'
    | 'Endurance Improvement: Gym Cardio'
    | 'Sport-Specific S&C: Explosive Power'
    | 'General Fitness: Foundational Strength'
    | 'Weight Loss: Gym Based'
    | 'Bodyweight Mastery'
    | 'Recomposition: Lean Mass & Fat Loss';
  ```

### 2. Question Registry Update
- **File**: `src/components/onboarding/QuestionRegistry.ts`
- **Action**: Update validation arrays for primaryGoal and secondaryGoal questions
- **Lines to Change**: Both primaryGoal (line ~17) and secondaryGoal (line ~33) validation enums

### 3. Primary Goal Component Update
- **File**: `src/components/onboarding/questions/PrimaryGoalQuestion.tsx`
- **Action**: Update FITNESS_GOALS array with new specialized goals
- **Requirements**: 
  - Maintain visual design and interaction patterns
  - Add appropriate emojis and descriptions for each new goal
  - Update color schemes to accommodate more options
  - Ensure responsive grid layout works with 10 options

## New Goal Specifications

| Goal | Emoji | Description | Color Theme |
|------|-------|-------------|-------------|
| Muscle Gain: General | 💪 | Build lean muscle mass and increase size | Blue |
| Muscle Gain: Hypertrophy Focus | 🏗️ | Advanced muscle building with volume focus | Indigo |
| Strength Gain: Powerlifting Peak | 🏋️‍♂️ | Maximize strength in squat, bench, deadlift | Red |
| Strength Gain: General | ⚡ | Increase overall strength and power | Orange |
| Endurance Improvement: Gym Cardio | 🏃‍♀️ | Improve cardio fitness using gym equipment | Green |
| Sport-Specific S&C: Explosive Power | ⚽ | Athletic performance and power development | Purple |
| General Fitness: Foundational Strength | 🌟 | Build basic strength and movement patterns | Yellow |
| Weight Loss: Gym Based | 🔥 | Fat loss through structured gym workouts | Pink |
| Bodyweight Mastery | 🤸‍♀️ | Master bodyweight movements and skills | Teal |
| Recomposition: Lean Mass & Fat Loss | ⚖️ | Simultaneous muscle gain and fat loss | Slate |

## Implementation Strategy
1. Update type definition first to establish new contract
2. Update validation in QuestionRegistry to match new types
3. Update PrimaryGoalQuestion component with new options and visual design
4. Test compilation and ensure no TypeScript errors
5. Verify responsive layout with increased number of options

## Success Criteria
- [x] FitnessGoal type expanded to 10 specialized goals
- [x] QuestionRegistry validation updated for both primary and secondary goals
- [x] PrimaryGoalQuestion component displays all 10 new options
- [x] Responsive grid layout maintained with new options (1 col mobile, 2 col tablet, 3 col desktop)
- [x] TypeScript compilation successful with no errors
- [x] Visual design consistency maintained across all goal options

## Assumptions
- Existing onboarding flow logic will handle new goal types automatically
- AI program generation can utilize more specific goal information
- Database schema can store the new goal strings without modification
- Secondary goal selection should use same expanded options

## Confidence Level: 9/10
High confidence due to straightforward type expansion with clear specifications and existing component patterns to follow. 
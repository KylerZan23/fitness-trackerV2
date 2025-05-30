# Unit Preference Question Implementation Plan

## Overview
Add a new onboarding question that asks users to select their preferred weight unit (kg or lbs). This will be used throughout the application for displaying weights and collecting strength data.

## ✅ Implementation Completed

### 1. ✅ Updated Type Definitions
- Added `weightUnit` field to `OnboardingData` type in `src/lib/types/onboarding.ts`
- Added `WeightUnit` type with 'kg' | 'lbs' options
- Updated validation schemas to include weight unit

### 2. ✅ Created UnitPreferenceQuestion Component
- Created `src/components/onboarding/questions/UnitPreferenceQuestion.tsx`
- Beautiful visual design with country flags and examples
- Clear explanations of each unit system
- Interactive selection with visual feedback
- Unit-specific weight examples (kg: 100kg squat vs lbs: 225lbs squat)

### 3. ✅ Updated Question Registry
- Added unit preference question with order 6 (after experience level, before training frequency)
- Set as required question with proper validation
- Updated all subsequent question orders

### 4. ✅ Updated Question Renderer
- Added `UnitPreferenceQuestion` import and case to `IndividualQuestionPage.tsx`
- Updated strength questions to use selected weight unit dynamically
- Added unit-specific placeholders and step values
- Updated weight display labels throughout strength assessments

### 5. ✅ Updated Data Flow
- Modified `onboardingActions.ts` to handle `weightUnit` field
- Separated `weightUnit` from onboarding responses and saved to `weight_unit` column
- Updated main onboarding page to include `weightUnit` in data transformation
- Fixed old onboarding page with default 'lbs' value

### 6. ✅ Enhanced User Experience
- Strength questions now show unit-specific examples and calculations
- Training weight recommendations adapt to selected unit
- Step values for inputs (2.5kg vs 5lbs increments)
- Consistent unit display throughout the flow

## Technical Implementation Details

### Question Component Features
- **Visual Design**: Country flags (🌍 for kg, 🇺🇸 for lbs) with color-coded cards
- **Interactive Selection**: Hover effects, selection indicators, and smooth transitions
- **Educational Content**: Examples of typical weights in each unit system
- **Real-time Feedback**: Shows confirmation message when unit is selected
- **Accessibility**: Proper focus states and keyboard navigation

### Data Integration
- **Database Storage**: `weight_unit` column in profiles table
- **Type Safety**: Proper TypeScript types throughout the flow
- **Validation**: Zod schema validation for unit selection
- **Backward Compatibility**: Default 'lbs' for existing users

### Dynamic Strength Questions
- **Unit-Aware Placeholders**: Different examples based on selected unit
- **Calculation Updates**: Training percentages shown in correct unit
- **Input Validation**: Appropriate step values for each unit system
- **Visual Consistency**: Unit labels update throughout all strength inputs

## Files Modified
1. `src/lib/types/onboarding.ts` - Added WeightUnit type and weightUnit field
2. `src/components/onboarding/questions/UnitPreferenceQuestion.tsx` - New component
3. `src/components/onboarding/QuestionRegistry.ts` - Added question definition
4. `src/components/onboarding/IndividualQuestionPage.tsx` - Updated renderer and strength questions
5. `src/app/_actions/onboardingActions.ts` - Updated data handling
6. `src/app/onboarding/page.tsx` - Updated data transformation
7. `src/app/onboarding/page-old.tsx` - Added default value
8. `README.md` - Updated feature documentation

## Build Verification
- ✅ TypeScript compilation successful
- ✅ No new linting errors introduced
- ✅ Bundle size impact minimal (19.5kB for onboarding page)
- ✅ All existing functionality preserved

## Next Steps
The unit preference question is now fully integrated into the onboarding flow. Users will be asked to select their preferred weight unit, and this preference will be used throughout the application for:

- Strength assessment inputs
- Training program weight displays
- Workout logging interfaces
- Progress tracking charts
- Any other weight-related features

The implementation is production-ready and maintains backward compatibility with existing users. 
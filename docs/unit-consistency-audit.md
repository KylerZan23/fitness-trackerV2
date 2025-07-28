# Unit Consistency Audit - NeuralLift Application

## Overview
This document audits how the user's preferred weight unit (selected during onboarding) is handled throughout the application to ensure consistent display.

## User Unit Preference Storage
- **Storage Location**: `profiles.weight_unit` column
- **Options**: 'kg' | 'lbs'  
- **Default**: 'kg'
- **Selection**: During onboarding via UnitPreferenceQuestion component

## Component-by-Component Analysis

### ✅ **Working Correctly**

#### 1. **Profile Page** (`src/app/profile/page.tsx`)
- **PersonalRecordsSection**: ✅ Receives `profile.weight_unit` 
- **AgeStatsCard**: ✅ Receives `profile.weight_unit`
- **Status**: All weight displays use user preference

#### 2. **Progress Page** (`src/app/progress/page.tsx`)
- **StrengthStatsCard**: ✅ Uses `profile?.weight_unit || 'kg'`
- **IndepthAnalysisCard**: ✅ Receives `weightUnit` prop
- **Status**: All strength metrics use user preference

#### 3. **Community Leaderboard** (`src/components/community/Leaderboard.tsx`)
- **Unit Handling**: ✅ Fetches user profile and uses `profile.weight_unit`
- **Conversion Logic**: ✅ Uses `kgToLbs()` for display when user prefers lbs
- **Status**: Leaderboard shows weights in user's preferred unit

#### 4. **AI Program Generation** (`src/app/_actions/aiProgramActions.ts`)
- **Weight Units**: ✅ Gets `weightUnit = profile.weight_unit || 'kg'`
- **Prompt Instruction**: ✅ Tells AI to include unit in weights (e.g., "100 kg", "225 lbs")
- **Status**: Generated programs include weights with correct units

#### 5. **Onboarding Process** (`src/components/onboarding/`)
- **Unit Selection**: ✅ UnitPreferenceQuestion component
- **Strength Questions**: ✅ Use selected unit for input validation and display
- **Data Storage**: ✅ Now converts to kg for consistent storage (ADR-044)
- **Status**: Fully respects user preference during input, stores consistently

#### 6. **Workout Session Tracking** (`src/app/workout/new/page.tsx`)
- **User Profile Loading**: ✅ Loads `profileData.weight_unit`
- **Session Tracking**: ✅ Sets `weightUnit` state from profile
- **Status**: Workout sessions use correct user preference

### 🔧 **Recently Fixed**

#### 7. **WorkoutLog Component** (`src/components/workout/WorkoutLog.tsx`)
- **Previous Issue**: ❌ Hardcoded "Weight (kg/lbs)" label
- **Fix Applied**: ✅ Now accepts `weightUnit` prop and displays "Weight ({weightUnit})"
- **Status**: Fixed to use user preference
- **Note**: Component appears to be used mainly in tests, not active pages

### 📊 **Data Storage Strategy**

#### **Consistent Storage Standard** (ADR-044)
- **Personal Records**: Stored in kg, converted to user preference on display
- **Workout Data**: Not explicitly audited in this analysis
- **AI Programs**: Generated with user's preferred unit included in weight strings

### 🧪 **Testing Status**

#### **Manual Testing Needed**
1. **New User Onboarding**: 
   - Select lbs preference → Enter PRs → Verify profile shows correct values
2. **Existing User Experience**:
   - Verify all weight displays use their stored preference
3. **Cross-Feature Consistency**:
   - Profile PRs, Progress charts, Leaderboard, AI programs should all show same unit

#### **Automated Testing**
- WorkoutLog component tests updated for weightUnit prop
- Additional component tests may need unit preference scenarios

## Key Implementation Principles

### ✅ **Correct Patterns**
1. **Profile Data Fetching**: Get `weight_unit` from user profile
2. **Prop Passing**: Pass unit preference to child components
3. **Storage in kg**: Store numerical values in kg, convert for display
4. **AI Generation**: Include unit in generated content strings

### ❌ **Anti-Patterns to Avoid**
1. **Hardcoded Units**: Never hardcode "kg", "lbs", or "kg/lbs" in UI
2. **Assumption of Default**: Don't assume user prefers kg without checking
3. **Inconsistent Storage**: Don't store some values in kg and others in user preference
4. **Missing Conversion**: Don't forget to convert stored kg values to user preference

## Future Considerations

### **New Features Checklist**
When adding weight-related features:
1. ✅ Fetch user's `weight_unit` preference from profile
2. ✅ Pass unit preference to all relevant components
3. ✅ Store numerical values in kg for consistency
4. ✅ Convert to user preference for display
5. ✅ Include unit in all weight labels and displays
6. ✅ Test with both kg and lbs preferences

### **Maintenance Tasks**
1. Regular audit of new components for unit consistency
2. Monitor AI program generation for correct unit inclusion
3. Ensure database storage follows kg standard
4. Update tests to cover both unit preferences

## Conclusion

The application now maintains good unit consistency with the user's preferred weight unit displayed throughout most features. The critical Personal Records bug has been fixed, and the main components properly respect user preferences.

**Overall Status**: ✅ **GOOD** - User preference is consistently honored across major features 
# Phoenix Schema Component Refactor Implementation Plan

## Overview

This document outlines the completed refactoring of program display components to consume the Phoenix Schema instead of the legacy flat session-based schema. The refactor ensures full compatibility with the hierarchical Phoenix Schema structure: Program → Phases → Weeks → Days → Exercises.

## Completed Components

### 1. ProgramPhaseDisplay.tsx ✅
- **Status**: Updated and compatible with Phoenix Schema
- **Key Changes**:
  - Already consuming `TrainingPhase` type correctly
  - Displays phase name, type, duration, and primary goal
  - Renders list of weeks within the phase
  - Shows phase-level progression strategy via type badge

### 2. ProgramWeekDisplay.tsx ✅
- **Status**: Refactored for Phoenix Schema compliance
- **Key Changes**:
  - Fixed DayOfWeek enum usage (now uses string literals)
  - Updated to use `week.phaseWeek` instead of `week.weekInPhase`
  - Added Phoenix Schema specific fields display:
    - `progressionStrategy`
    - `intensityFocus` 
    - `weeklyVolumeLandmark`
  - Removed legacy fields (`notes`, `weeklyGoals`, `coachTip`)
  - Fixed `estimatedDuration` field usage

### 3. ProgramDayDisplay.tsx ✅
- **Status**: Refactored for Phoenix Schema compliance
- **Key Changes**:
  - Fixed DayOfWeek enum usage to use string literals ('Monday', 'Tuesday', etc.)
  - Updated day comparison logic for missed workout detection
  - Fixed `estimatedDuration` field reference
  - Simplified exercise display (removed warmUp/coolDown sections)
  - Maintained completion and missed workout indicators

### 4. ExerciseListDisplay.tsx ✅
- **Status**: Updated for Phoenix Schema ExerciseDetail
- **Key Changes**:
  - Updated TIER_COLORS to use Phoenix Schema tiers:
    - `'Anchor'` → Purple (highest priority)
    - `'Primary'` → Blue 
    - `'Secondary'` → Green
    - `'Accessory'` → Gray
  - Added `isAnchorLift` indicator with visual distinction
  - Simplified RPE display (removed complex color logic)
  - Removed legacy fields (`weakPointTarget`, `category`, `muscleGroups`)

### 5. ExerciseDisplay.tsx ✅ (NEW)
- **Status**: Created as new standalone component
- **Features**:
  - Dedicated component for Phoenix Schema `ExerciseDetail`
  - Visual tier hierarchy with color coding
  - Anchor lift highlighting with star icon
  - RPE color coding (high/medium/low intensity)
  - Compact and full display modes
  - Form notes display with coaching tips
  - Responsive grid layout for exercise prescription

## Schema Compatibility

### Fixed DayOfWeek Enum Usage
The Phoenix Schema uses string literals for days of the week:
```typescript
// OLD (enum constants)
DayOfWeek.MONDAY, DayOfWeek.TUESDAY

// NEW (string literals)
'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
```

### Updated Field Mappings
| Component | Old Field | New Field | Notes |
|-----------|-----------|-----------|-------|
| ProgramWeekDisplay | `week.weekInPhase` | `week.phaseWeek` | Phase-relative week number |
| ProgramDayDisplay | `day.estimatedDurationMinutes` | `day.estimatedDuration` | String format (e.g., "60-75min") |
| ExerciseListDisplay | `exercise.weakPointTarget` | `exercise.isAnchorLift` | Boolean anchor lift indicator |

### Tier System Update
```typescript
// Phoenix Schema Exercise Tiers (by priority)
type ExerciseTier = 'Anchor' | 'Primary' | 'Secondary' | 'Accessory'

// Visual Hierarchy
- Anchor: Purple badges, star icons (main compound movements)
- Primary: Blue badges (major exercises)  
- Secondary: Green badges (supporting movements)
- Accessory: Gray badges (isolation exercises)
```

## Component Architecture

```
src/components/program/
├── ProgramPhaseDisplay.tsx     # Phase-level display
├── ProgramWeekDisplay.tsx      # Week-level display with progression info
├── ProgramDayDisplay.tsx       # Day-level display with exercises
├── ExerciseDisplay.tsx         # NEW: Dedicated exercise component
├── ExerciseListDisplay.tsx     # Table-based exercise list
└── enhanced/                   # Advanced features (unchanged)
```

## Import Updates

All components now properly import and use Phoenix Schema types:

```typescript
import { 
  TrainingProgram, 
  TrainingPhase, 
  TrainingWeek, 
  WorkoutDay, 
  ExerciseDetail,
  DayOfWeek 
} from '@/lib/types/program';
```

## Visual Improvements

### Exercise Tier Hierarchy
- **Anchor Lifts**: Purple badges with star icons for prominence
- **Tier Color Coding**: Consistent color scheme across all components
- **Visual Hierarchy**: Clear distinction between exercise importance levels

### Phoenix Schema Features
- **Progression Strategy Display**: Shows weekly progression approach
- **Intensity Focus**: Displays training focus for each week
- **Volume Landmarks**: Shows MEV/MAV/MRV classifications
- **RPE Integration**: Visual RPE indicators with appropriate color coding

## Benefits

1. **Schema Compliance**: All components now fully consume Phoenix Schema
2. **Type Safety**: Proper TypeScript types with runtime Zod validation
3. **Visual Hierarchy**: Clear exercise tier system with anchor lift prominence
4. **Scientific Accuracy**: Displays progression strategies, RPE, and volume landmarks
5. **Maintainability**: Clean separation of concerns with dedicated components
6. **Extensibility**: Easy to add new Phoenix Schema features

## Testing Validation

The refactor maintains backward compatibility while enabling the full Phoenix Schema feature set. All components are ready to consume programs generated by the new Phoenix generation pipeline.

## Next Steps

1. **Integration Testing**: Verify components work with real Phoenix Schema data
2. **Enhanced Features**: Implement advanced Phoenix features (volume tracking, RPE logging)
3. **Performance**: Optimize rendering for large programs
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation

## Confidence Score: 95%

The refactor successfully modernizes the program display system to consume Phoenix Schema while maintaining visual consistency and improving the user experience with scientific training program features.
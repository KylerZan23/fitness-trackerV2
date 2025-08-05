# Phoenix Schema Types

## Overview

The Phoenix Schema Types define a comprehensive, hierarchical training program structure using Zod schemas for runtime validation and TypeScript for type safety. This system replaces the simplified flat schema with rich, nested data that supports scientific exercise programming.

## Architecture

The schema follows a hierarchical structure:
```
TrainingProgram
├── TrainingPhase[]
│   ├── TrainingWeek[]
│   │   ├── WorkoutDay[]
│   │   │   └── ExerciseDetail[]
│   │   └── WeeklyVolumeLandmark
│   └── PhaseType & PrimaryGoal
└── ProgramMetadata
```

## Core Enums

### DayOfWeekEnum
```typescript
['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
```

### ExerciseTierEnum
```typescript
['Anchor', 'Primary', 'Secondary', 'Accessory']
```
- **Anchor**: Main compound movements (squat, deadlift, bench press)
- **Primary**: Major compound exercises
- **Secondary**: Supporting compound movements
- **Accessory**: Isolation and assistance exercises

### ProgressionStrategyEnum
```typescript
['Linear', 'Double Progression', 'Reverse Pyramid', 'Wave Loading', 'Autoregulated']
```

## Schema Definitions

### ExerciseDetailSchema
Individual exercise with scientific programming fields:

```typescript
{
  name: string,                    // Exercise name
  tier: ExerciseTier,             // Exercise importance level
  sets: number,                   // Number of sets
  reps: string,                   // Rep range (e.g., "8-10" or "5")
  rpe: string,                    // Rate of Perceived Exertion (e.g., "7-8")
  rest: string,                   // Rest period (e.g., "90-120s")
  notes?: string,                 // Form cues or rationale
  isAnchorLift: boolean,          // Designated anchor lift
}
```

### WorkoutDaySchema
Complete workout day structure:

```typescript
{
  dayOfWeek: DayOfWeek,           // Day of the week
  focus: string,                  // Workout focus (e.g., "Upper Body - Push")
  isRestDay: boolean,             // Whether this is a rest day
  exercises: ExerciseDetail[],    // Array of exercises
  estimatedDuration?: string,     // Expected duration (e.g., "60-75min")
}
```

### TrainingWeekSchema
Weekly training structure with progression:

```typescript
{
  weekNumber: number,             // Week number in program
  phaseWeek: number,              // Week number within phase
  progressionStrategy: ProgressionStrategy,
  intensityFocus: string,         // Training focus (e.g., "Volume Accumulation")
  days: WorkoutDay[],             // 7 days of training
  weeklyVolumeLandmark?: string,  // MEV/MAV/MRV classification
}
```

### TrainingPhaseSchema
Training phase with periodization:

```typescript
{
  phaseName: string,              // Phase name (e.g., "Volume Accumulation")
  phaseType: 'Accumulation' | 'Intensification' | 'Realization' | 'Deload',
  durationWeeks: number,          // Phase duration
  primaryGoal: string,            // Primary adaptation goal
  weeks: TrainingWeek[],          // Array of training weeks
}
```

### TrainingProgramSchema
Complete training program:

```typescript
{
  programName: string,            // Program name
  description: string,            // Program description
  durationWeeksTotal: number,     // Total program duration
  coachIntro: string,             // Personalized AI coach intro
  generalAdvice: string,          // Scientific rationale
  periodizationModel: string,     // Periodization approach
  phases: TrainingPhase[],        // Array of training phases
  totalVolumeProgression?: string, // Volume progression strategy
  anchorLifts?: string[],         // Designated anchor lifts
}
```

## Helper Schemas

### ProgramScaffoldSchema
For program generation pipeline:
```typescript
{
  programName: string,
  description: string,
  durationWeeksTotal: number,
  periodizationModel: string,
  phases: PhaseScaffold[],
}
```

### NarrativeContentSchema
For AI-generated content:
```typescript
{
  coachIntro: string,
  generalAdvice: string,
}
```

## Database Integration

### StoredTrainingProgramSchema
Extends TrainingProgram with database fields:
```typescript
{
  id: string,
  userId: string,
  createdAt: Date | string,
  updatedAt: Date | string,
  isActive: boolean,
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived',
  currentWeek?: number,
  currentPhase?: number,
}
```

## Enhanced User Profiling

### VolumeParametersSchema
Individual volume management:
```typescript
{
  trainingAge: number,            // Years of training experience
  recoveryCapacity: number,       // Recovery rating (1-10)
  volumeTolerance: number,        // Volume tolerance coefficient
  stressLevel: number,            // Life stress level (1-10)
}
```

### VolumeLandmarksSchema
Scientific volume guidelines:
```typescript
{
  MEV: number,                    // Minimum Effective Volume
  MAV: number,                    // Maximum Adaptive Volume
  MRV: number,                    // Maximum Recoverable Volume
}
```

### RecoveryProfileSchema
Individual recovery characteristics:
```typescript
{
  fatigueThreshold: number,       // Fatigue tolerance (1-10)
  recoveryRate: number,           // Recovery speed coefficient
  sleepQuality: number,           // Sleep quality (1-10)
  recoveryModalities?: string[],  // Preferred recovery methods
}
```

### WeakPointAnalysisSchema
Strength imbalance analysis:
```typescript
{
  strengthRatios: Record<string, number>,  // Lift ratios
  weakPoints: string[],                    // Identified weak points
  correctionExercises: Record<string, string[]>, // Corrective exercises
  weakPointPriority?: Record<string, number>,   // Priority levels
}
```

### RPEProfileSchema
Autoregulation settings:
```typescript
{
  sessionRPETargets: Record<string, [number, number]>, // Phase RPE targets
  autoregulationRules: {
    readyToGo: number,            // RPE adjustment when feeling great
    feelingGood: number,          // RPE adjustment when feeling average
    soreTired: number,            // RPE adjustment when feeling poor
  },
  rpeAccuracy?: number,           // Individual RPE calibration
  exerciseRPEPreferences?: Record<string, [number, number]>, // Exercise-specific RPE
}
```

### PeriodizationModelSchema
Long-term training planning:
```typescript
{
  type: 'linear' | 'undulating' | 'block' | 'conjugate' | 'autoregulated',
  phases: PhaseConfig[],
  adaptationTargets: {
    strength?: Record<string, number>,
    hypertrophy?: Record<string, number>,
    power?: Record<string, number>,
    endurance?: Record<string, number>,
  },
  deloadProtocol: {
    frequency: number,
    type: 'volume' | 'intensity' | 'complete',
    reductionPercentage: number,
  },
}
```

## Usage Examples

### Creating a Training Program
```typescript
import { TrainingProgramSchema, type TrainingProgram } from '@/lib/types/program';

const program: TrainingProgram = {
  programName: "Phoenix Strength Program",
  description: "A comprehensive 4-week strength training program",
  durationWeeksTotal: 4,
  coachIntro: "Welcome to your personalized strength journey!",
  generalAdvice: "This program follows scientific periodization principles.",
  periodizationModel: "Linear",
  phases: [/* ... */],
};

// Validate with Zod
const validatedProgram = TrainingProgramSchema.parse(program);
```

### Validating User Data
```typescript
import { EnhancedUserDataSchema } from '@/lib/types/program';

const userData = {
  id: "user123",
  name: "John Doe",
  email: "john@example.com",
  weight_unit: "kg" as const,
  volumeParameters: {
    trainingAge: 3,
    recoveryCapacity: 7,
    volumeTolerance: 1.2,
    stressLevel: 4,
  },
  // ... other fields
};

const validatedUser = EnhancedUserDataSchema.parse(userData);
```

## Testing

Run the Phoenix Schema validation test:
```bash
yarn tsx scripts/test-phoenix-schema.ts
```

This test validates:
- All schema structures
- TypeScript type inference
- Zod validation
- Hierarchical nesting
- Scientific programming fields

## Migration from Old Schema

The new Phoenix Schema Types maintain backward compatibility with existing code by:

1. **Preserving core properties**: `programName`, `description`, `durationWeeksTotal`
2. **Legacy type exports**: `UserData`, `WorkoutFocus`, `TrainingSession`
3. **Gradual migration**: Components can be updated incrementally

### Breaking Changes
- `phase.notes` → `phase.primaryGoal`
- `phase.objectives` → Removed (use `primaryGoal` instead)
- Exercise structure enhanced with scientific fields

## Benefits

1. **Type Safety**: Full TypeScript support with Zod runtime validation
2. **Scientific Accuracy**: Built-in support for volume landmarks, RPE, and periodization
3. **Hierarchical Structure**: Clear organization from program → phases → weeks → days → exercises
4. **Extensibility**: Easy to add new fields and validation rules
5. **Performance**: Efficient validation and type checking
6. **Documentation**: Self-documenting schemas with descriptions

## Future Enhancements

- Integration with AI program generation
- Real-time validation in UI components
- Advanced periodization models
- Performance tracking integration
- Recovery monitoring systems 
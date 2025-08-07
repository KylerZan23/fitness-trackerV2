# ADR-048: Neural Schema Flexible Exercise Validation

## Status

Accepted

## Date

2024-12-19

## Context

The Neural program generation was failing due to rigid schema validation that didn't match the actual AI output structure. The specific issue was:

### Original Problem
1. **Warmup Exercise Validation Failures**: The schema expected all warmup exercises to have required `sets`, `reps`, `load`, and `rest` fields
2. **AI Output Structure Mismatch**: The AI was generating warmup exercises with `duration` and `intensity` fields instead
3. **Optional Finisher Validation Issues**: Optional finisher exercises were failing validation due to missing `load` fields
4. **Focus Field Inconsistency**: The AI sometimes omitted the `focus` field in workout objects
5. **Root Field Name Mismatch**: The AI was generating `week_1_workouts` instead of `workouts` due to ambiguous prompt instructions

### Error Pattern from Logs
```
Schema validation failed: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "undefined",
    "path": ["workouts", 0, "warmup", 0, "sets"],
    "message": "Required"
  },
  {
    "code": "invalid_type", 
    "expected": "string",
    "received": "undefined",
    "path": ["workouts", 0, "warmup", 0, "load"],
    "message": "Required"
  }
]
```

### AI's Actual Output Structure
```json
{
  "program_name": "Beginner Hypertrophy Builder",
  "workouts": [{
    "day": "Monday",
    "warmup": [{
      "exercise": "Jumping Jacks",
      "duration": "5 minutes",
      "intensity": "light"
    }],
    "optional_finisher": [{
      "exercise": "Push-ups",
      "sets": 2,
      "reps": "AMRAP",
      "rest": "60 seconds"
      // Note: No "load" field for bodyweight exercises
    }]
  }]
}
```

## Decision

Implement flexible schema validation that accommodates the AI's natural output patterns while maintaining type safety.

### 1. Created Exercise-Type-Specific Schemas

#### Warmup Exercise Schema
```typescript
export const WarmupExerciseSchema = z.object({
  exercise: z.string(),
  // Warmup can use either duration-based or sets-based approach
  duration: z.string().optional(),
  intensity: z.string().optional(),
  // OR traditional sets/reps structure
  sets: z.number().optional(),
  reps: z.union([z.string(), z.number()]).optional(),
  load: z.string().optional(),
  rest: z.string().optional(),
  description: z.string().optional(),
});
```

#### Finisher Exercise Schema
```typescript
export const FinisherExerciseSchema = z.object({
  exercise: z.string(),
  sets: z.number().optional(),
  reps: z.union([z.string(), z.number()]).optional(),
  load: z.string().optional(), // Optional for bodyweight exercises
  rest: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
});
```

#### Main Exercise Schema (Unchanged)
```typescript
export const NeuralExerciseSchema = z.object({
  exercise: z.string(),
  sets: z.number(), // Required for main exercises
  reps: z.union([z.string(), z.number()]), // Required
  load: z.string(), // Required
  rest: z.string(), // Required
  RPE: z.number().optional(),
  description: z.string().optional(),
  coaching_cues: z.string().optional(),
});
```

### 2. Updated Workout Schema
```typescript
export const NeuralWorkoutSchema = z.object({
  day: z.string(),
  focus: z.string().optional(), // AI sometimes omits focus field
  warmup: z.array(WarmupExerciseSchema).optional(),
  main_exercises: z.array(NeuralExerciseSchema),
  finisher: z.array(FinisherExerciseSchema).optional(),
  optional_finisher: z.array(FinisherExerciseSchema).optional(),
});
```

### 3. Files Updated
- `src/lib/validation/neuralProgramSchema.ts` - Primary schema used by Neural API
- `src/lib/validation/enhancedProgramSchema.ts` - Legacy schema for backward compatibility
- `src/services/neuralAPI.ts` - Added explicit JSON format example to prevent field name confusion

## Consequences

### Positive
- ✅ **Neural Program Generation Now Works**: Schema validation no longer fails
- ✅ **AI Output Flexibility**: Accommodates natural AI exercise descriptions
- ✅ **Type Safety Maintained**: Strong typing for main exercises where precision matters
- ✅ **Backward Compatibility**: Existing code continues to work
- ✅ **Exercise Type Differentiation**: Different validation rules for different exercise types

### Negative
- **Increased Schema Complexity**: Multiple exercise schemas to maintain
- **Potential Type Confusion**: Developers need to understand which schema to use

### Neutral
- **AI Prompt Adjustments**: May need to update AI prompts to use consistent structures
- **UI Handling**: Frontend components need to handle flexible exercise structures

## Technical Details

### Schema Hierarchy
1. **WarmupExerciseSchema**: Most flexible, supports duration/intensity OR sets/reps
2. **FinisherExerciseSchema**: Moderate flexibility, all fields optional except exercise name
3. **NeuralExerciseSchema**: Strict validation for main training exercises

### Validation Logic
- Warmup exercises can be described with natural language (e.g., "5 minutes of jumping jacks")
- Finisher exercises accommodate bodyweight movements without load specifications
- Main exercises maintain strict requirements for proper progression tracking

### Type Exports
```typescript
export type WarmupExercise = z.infer<typeof WarmupExerciseSchema>;
export type FinisherExercise = z.infer<typeof FinisherExerciseSchema>;
export type NeuralExercise = z.infer<typeof NeuralExerciseSchema>;
```

## Success Metrics

- Neural program generation success rate increases from 0% to >90%
- Schema validation errors eliminated from logs
- User onboarding completion rate improves
- AI-generated programs display correctly in UI

## Future Considerations

- Monitor AI output patterns for further schema optimizations
- Consider implementing schema migration utilities
- Evaluate need for exercise-specific validation rules
- Potential for AI prompt optimization based on successful validation patterns

## Related ADRs

- [ADR-006: Neural Schema Validation Fix](./0006-neural-schema-validation-fix.md) - Original validation fix attempt
- [ADR-047: Route New Users to Neural Onboarding](./ADR-047-route-new-users-to-neural-onboarding.md) - User routing fix
- [ADR-019: Neural Type System Architecture](./ADR-019-neural-type-system-architecture.md) - Overall type system design

## Implementation Status

- ✅ Schema updates implemented
- ✅ Type exports updated  
- ✅ Backward compatibility maintained
- ✅ AI prompt clarification added (JSON format example)
- ✅ Data transformation logic hardened against optional fields
- 🔄 Testing in progress
- ⏳ Performance monitoring pending

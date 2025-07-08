# e1RM Calculation System

## Overview

This system provides reliable estimated 1-rep max (e1RM) calculations using the Brzycki formula, which is widely recognized for its accuracy across different rep ranges.

## Formula Used

**Brzycki Formula**: `weight / (1.0278 - 0.0278 × reps)`

This formula is more accurate than simpler alternatives and provides reliable estimates for rep ranges from 1-12.

## Components

### TypeScript Library (`src/lib/metrics/strength.ts`)

#### Core Functions

```typescript
// Basic e1RM calculation
calculateE1RM(weight: number, reps: number): number

// e1RM with confidence level
calculateE1RMWithConfidence(weight: number, reps: number): {
  e1rm: number
  confidence: 'high' | 'medium' | 'low'
}

// Find best e1RM from multiple workouts
getBestE1RM(workouts: Array<{weight: number, reps: number}>): {
  e1rm: number
  confidence: 'high' | 'medium' | 'low'
  source: {weight: number, reps: number}
} | null
```

#### Confidence Levels

- **High Confidence** (1-3 reps): Most accurate, closest to actual 1RM
- **Medium Confidence** (4-8 reps): Good reliability for moderate rep ranges
- **Low Confidence** (9-12 reps): Less reliable but still useful

#### Helper Functions

```typescript
// Validate workout data
isValidForE1RM(weight: number, reps: number): boolean

// Calculate training percentages
getTrainingPercentages(e1rm: number): {
  light: number,      // 65% - 12-15 reps
  moderate: number,   // 75% - 8-12 reps
  heavy: number,      // 85% - 3-6 reps
  maxEffort: number   // 95% - 1-3 reps
}

// Track improvement over time
calculateImprovement(currentE1RM: number, previousE1RM: number): number
```

### SQL Functions (`supabase/migrations/20250708130212_create_e1rm_function.sql`)

#### Core SQL Functions

```sql
-- Basic e1RM calculation
calculate_e1rm(weight_lifted NUMERIC, reps_done INT) RETURNS NUMERIC

-- Confidence level determination
get_e1rm_confidence(reps_done INT) RETURNS TEXT

-- Input validation
is_valid_for_e1rm(weight_lifted NUMERIC, reps_done INT) RETURNS BOOLEAN

-- Comprehensive calculation with metadata
calculate_e1rm_with_confidence(weight_lifted NUMERIC, reps_done INT) RETURNS JSON
```

#### Integration with RPC Function

The `get_user_activity_summary` RPC function has been enhanced to include e1RM data:

```json
{
  "dynamic_exercise_progression": [
    {
      "exercise_name": "Bench Press",
      "last_sessions": [
        {
          "date": "2025-01-08",
          "performance": "3x5@100kg",
          "notes": "Felt strong today",
          "e1rm": 112.5,
          "e1rm_confidence": "high"
        }
      ]
    }
  ]
}
```

## Usage Examples

### Frontend Integration

```typescript
import { calculateE1RM, getBestE1RM } from '@/lib/metrics/strength'

// Calculate e1RM for a single workout
const e1rm = calculateE1RM(100, 5) // Returns ~112.5

// Find best e1RM from workout history
const workouts = [
  { weight: 100, reps: 5 },
  { weight: 95, reps: 3 },
  { weight: 105, reps: 8 }
]
const best = getBestE1RM(workouts)
// Returns the 95kg x 3 workout (high confidence)
```

### Database Queries

```sql
-- Calculate e1RM for a workout
SELECT calculate_e1rm(100, 5); -- Returns 112.5

-- Get comprehensive e1RM data
SELECT calculate_e1rm_with_confidence(100, 5);
-- Returns: {"e1rm": 112.5, "confidence": "high", "valid": true, ...}

-- Find best e1RM from user's bench press workouts
SELECT 
  exercise_name,
  weight,
  reps,
  calculate_e1rm(weight, reps) as e1rm,
  get_e1rm_confidence(reps) as confidence
FROM workouts 
WHERE user_id = $1 
  AND exercise_name ILIKE '%bench%'
  AND is_valid_for_e1rm(weight, reps)
ORDER BY calculate_e1rm(weight, reps) DESC
LIMIT 1;
```

## Edge Cases and Limitations

### Input Validation

- **Weight**: Must be > 0
- **Reps**: Must be > 0 and ≤ 20 (capped at 12 for calculations)
- **Invalid inputs**: Functions will throw errors or return null/false

### Formula Limitations

- **Most accurate**: 1-5 reps
- **Good accuracy**: 6-8 reps  
- **Less reliable**: 9-12 reps
- **Not recommended**: 13+ reps (formula becomes unreliable)

### Safety Features

- Reps are automatically capped at 12 for reliability
- Division by zero protection with conservative fallbacks
- Input validation prevents invalid calculations
- Confidence scoring helps users understand reliability

## Testing

### TypeScript Tests

```bash
npm test -- src/lib/metrics/__tests__/strength.test.ts
```

### SQL Tests

Run `test_e1rm_functions.sql` in your Supabase SQL editor to verify all functions work correctly.

## Migration

To deploy the SQL functions:

1. Apply the migration: `supabase migration up`
2. Verify functions exist: `SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%e1rm%';`
3. Test with sample data using `test_e1rm_functions.sql`

## Best Practices

1. **Always check confidence levels** - Use high-confidence estimates when possible
2. **Validate inputs** - Use `isValidForE1RM()` before calculations
3. **Consider rep ranges** - Lower rep ranges provide more accurate estimates
4. **Track trends** - Use `calculateImprovement()` to monitor progress over time
5. **Use appropriate percentages** - Apply `getTrainingPercentages()` for program design

## Performance

- All SQL functions are marked as `IMMUTABLE` for optimization
- TypeScript functions use efficient algorithms with O(1) complexity
- Caching is recommended for frequently accessed e1RM calculations
- Database functions include proper indexing considerations 
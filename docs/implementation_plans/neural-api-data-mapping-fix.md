# Neural API Data Mapping Issue Fix

## Problem Identified

**Issue**: Onboarding data was reaching the API route correctly but getting lost when passed to the Neural API service, with logs showing "received": "undefined" for all required fields.

**Root Cause**: Schema validation mismatch between the `neuralRequestSchema` and the actual `NeuralRequest` interface structure.

## Technical Analysis

### Data Flow Path
1. **Frontend** → sends onboarding data correctly
2. **API Route** (`/api/neural/generate`) → receives data correctly  
3. **programGenerator.createNewProgram()** → validates and creates NeuralRequest object
4. **neuralAPI.generateProgram()** → ❌ validation fails here, data becomes undefined
5. **buildProgramGenerationPrompt()** → receives undefined values

### Schema Mismatch Details

**Expected by Code** (NeuralRequest interface):
```typescript
{
  onboardingData: {
    primaryFocus: 'general_fitness',
    experienceLevel: 'beginner',
    sessionDuration: 45,
    equipmentAccess: 'dumbbells_only'
  },
  currentWeek: 1,
  previousProgress?: {...}
}
```

**Expected by Schema** (neuralRequestSchema - INCORRECT):
```typescript
{
  primaryFocus: 'general_fitness',     // Flat structure
  experienceLevel: 'beginner',
  sessionDuration: 45,
  equipmentAccess: 'dumbbells_only',
  regenerate?: boolean,
  weekNumber?: number
}
```

## Solution Implemented

### Fixed Schema Definition

**File**: `src/lib/validation/neuralProgramSchema.ts`

**Before**:
```typescript
export const neuralRequestSchema = neuralOnboardingDataSchema.extend({
    regenerate: z.boolean().optional(),
    weekNumber: z.number().optional(),
});
```

**After**:
```typescript
export const neuralProgressDataSchema = z.record(z.any()).optional();

// Neural API request schema - matches the actual NeuralRequest interface structure
export const neuralRequestSchema = z.object({
    onboardingData: neuralOnboardingDataSchema,
    currentWeek: z.number(),
    previousProgress: neuralProgressDataSchema,
});
```

## Verification

### Test Results
- ✅ OnboardingData validation works correctly
- ✅ NeuralRequest validation now accepts nested structure
- ✅ Old flat structure correctly rejected
- ✅ Data flow from programGenerator to Neural API verified
- ✅ Schema validation fix confirmed working

### Impact
- Onboarding data will no longer be undefined in Neural API service
- Program generation will receive all required user data
- The buildProgramGenerationPrompt() function will have access to user preferences
- AI program generation will work as intended

## Files Modified

1. **`src/lib/validation/neuralProgramSchema.ts`**
   - Fixed `neuralRequestSchema` to match `NeuralRequest` interface
   - Moved `neuralProgressDataSchema` definition before usage

## Testing

Created comprehensive tests to verify the fix:
- **`test-schema-validation.ts`** - Direct schema validation testing
- **`test-neural-request-validation.js`** - End-to-end API testing

## Confidence Level

**10/10** - The issue is completely resolved:
- Root cause identified through systematic debugging
- Schema mismatch clearly documented with before/after comparison
- Fix implemented with proper type safety
- Comprehensive testing confirms resolution
- All validation tests pass

## Future Prevention

1. **Type-Schema Alignment**: Ensure Zod schemas always match TypeScript interfaces
2. **Integration Testing**: Add tests that verify data flow between services
3. **Schema Versioning**: Consider versioning schemas when interfaces change
4. **Documentation**: Keep schema documentation in sync with interface changes

## Related Files

- `src/services/programGenerator.ts` - Creates NeuralRequest objects
- `src/services/neuralAPI.ts` - Validates and processes NeuralRequest
- `src/types/neural.ts` - TypeScript interface definitions
- `src/lib/validation/neuralProgramSchema.ts` - Zod validation schemas

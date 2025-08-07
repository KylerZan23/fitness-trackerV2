# ADR-050: Transactional Integrity for Program Generation

## Status

Accepted

## Date

2025-01-16

## Context

During the program generation workflow fix, a critical transactional integrity issue was identified:

**Problem**: The program generation API was returning success responses before confirming database persistence, creating race conditions where:
1. Frontend receives success response with program data
2. User redirects to program display page
3. Database save operation may still be pending or failed
4. Program fetch fails with "JSON object requested, multiple (or no) rows returned"

**Original Flawed Logic**:
```typescript
// Generate program
const program = await generateProgram();

// Try to save (but treat as optional)
try {
  await saveToDatabase(program);
} catch (error) {
  // Log error but continue - WRONG!
}

// Return success regardless of database state - WRONG!
return { success: true, program };
```

This violates **ACID** transaction principles and creates unreliable user experiences.

## Decision

Implement **true transactional integrity** where:

1. **Database persistence is MANDATORY** - not optional
2. **Success response ONLY after confirmed database commit**
3. **Comprehensive validation** of database operation results
4. **Fail-fast error handling** for any persistence failures

## Implementation

### Database Access Layer Enhancement

```typescript
export async function saveNeuralProgram(data: CreateNeuralProgramData) {
  // 1. Pre-validation
  if (!data.user_id || !data.program_content) {
    throw new Error('TRANSACTIONAL_INTEGRITY: Required data missing');
  }

  // 2. Atomic database operation
  const { data: result, error } = await supabase.from('neural_programs').insert(data);
  
  if (error) {
    throw new Error(`TRANSACTIONAL_INTEGRITY: Database commit failed - ${error.message}`);
  }

  // 3. Post-validation
  if (!result?.id || result.user_id !== data.user_id) {
    throw new Error('TRANSACTIONAL_INTEGRITY: Invalid database response');
  }

  // 4. Commit confirmed
  return result;
}
```

### Program Generation Service Update

```typescript
// OLD: Optional database save
try {
  await saveNeuralProgram(data);
} catch (error) {
  // Continue anyway - WRONG!
}
return success;

// NEW: Mandatory database commit
const saveResult = await saveNeuralProgram(data);
if (!saveResult?.id) {
  throw new Error('Database commit failed');
}
// Only return success after confirmed commit
return success;
```

### Error Handling

- **Database failure** → Entire operation fails
- **Invalid response** → Entire operation fails  
- **Validation error** → Entire operation fails
- **Only complete success** → Success response sent

## Benefits

1. **✅ Eliminates Race Conditions**: No timing issues between API response and database state
2. **✅ Guarantees Data Consistency**: Database state matches API response guarantees
3. **✅ Reliable User Experience**: Users only see success for operations that actually succeeded
4. **✅ Clear Error Feedback**: Database failures provide immediate, actionable error messages
5. **✅ Maintainable Code**: Clear success/failure paths with explicit validation
6. **✅ Production Reliability**: Reduces mysterious "program not found" errors

## Trade-offs

### Pros
- **Data Integrity**: Guarantees consistency between API and database
- **User Trust**: Success responses are reliable indicators of completion
- **Debugging**: Clear error messages with TRANSACTIONAL_INTEGRITY prefixes
- **Maintenance**: Simpler mental model - success means "fully complete"

### Cons
- **Slightly Higher Latency**: Must wait for database commit before response
- **Stricter Error Handling**: Database issues now fail the entire operation
- **More Complex Code**: Additional validation and error checking

**Decision**: The benefits far outweigh the minimal costs. Data integrity is non-negotiable.

## Implementation Details

### Log Messages
```
✅ SUCCESS: "TRANSACTIONAL_INTEGRITY: Database commit confirmed before success response"
❌ FAILURE: "TRANSACTIONAL_INTEGRITY: Cannot return success without database commit"
```

### Error Types
- `DATABASE_ERROR`: Database operation failures
- `VALIDATION_FAILED`: Pre/post validation failures
- `INTERNAL_ERROR`: Unexpected system errors

### Validation Steps
1. **Pre-validation**: Required fields present
2. **Database operation**: Atomic insert with error handling
3. **Post-validation**: Returned data integrity check
4. **Commit confirmation**: Valid ID and matching user_id

## Expected Workflow After Implementation

```
1. User submits onboarding ✅
2. Generate program via Neural API ✅
3. Enhance program with user data ✅
4. 🔒 CRITICAL: Save to database (MANDATORY)
5. ✅ Verify database commit with returned ID
6. ✅ Log: "Database commit confirmed"
7. ✅ Return success response
8. Frontend receives reliable success + program data ✅
```

## Monitoring and Verification

### Success Metrics
- Zero "program not found" errors after generation
- Database save success rate: 99.9%+
- Consistent program availability post-generation

### Error Metrics
- Clear categorization of database vs. generation failures
- Reduced mystery errors in production logs
- Faster debugging with TRANSACTIONAL_INTEGRITY log prefixes

## Related ADRs

- **ADR-049**: Program Fetch API and Client Fixes
- **ADR-021**: Standardized Error Handling Types
- **ADR-006**: Neural Schema Validation Fix

## Files Modified

- `src/services/programGenerator.ts` - Made database save mandatory
- `src/lib/data/neural-programs.ts` - Enhanced validation and error handling
- `src/lib/errors/types.ts` - Added DATABASE_ERROR code
- `docs/adr/ADR-050-transactional-integrity-program-generation.md` - This ADR

## Conclusion

This implementation ensures **true transactional integrity** where success responses guarantee complete operation success, including confirmed database persistence. This eliminates race conditions and provides a reliable foundation for the program generation workflow.

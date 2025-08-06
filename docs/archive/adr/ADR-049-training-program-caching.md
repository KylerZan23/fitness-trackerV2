# ADR-049: Training Program Generation Caching

**Status:** Accepted

**Date:** 2025-01-08

## Context

The `generateTrainingProgram` function in `aiProgramActions.ts` generates personalized training programs by making calls to a Large Language Model (LLM). These calls can:

1. Introduce significant latency (5-15 seconds), affecting user experience
2. Incur substantial operational costs with each API request
3. Put load on the LLM service
4. Generate identical programs for users with unchanged profile data

User data relevant to program generation (onboarding responses, subscription status) might not change frequently within short timeframes (e.g., 24 hours). Re-generating identical programs when underlying data is static is inefficient and costly.

## Decision

Implement a caching layer for training program generation using the existing `ai_coach_cache` table, extending the caching pattern already established for AI Coach recommendations.

**Cache Implementation Details:**

1. **Cache Key Generation:**
   - Create signature object: `{ onboarding_responses, hasPaidAccess }`
   - Sort keys for stable JSON stringification
   - JSON.stringify the sorted object
   - Create Base64 hash of the string
   - Format key: `program:u${userId}:paid${hasPaidAccess}:d${hashedOnboardingData}`

2. **Cache Check (Before LLM Generation):**
   - Query `ai_coach_cache` table using generated cache key
   - Check for valid (non-expired) entry
   - If valid cache found:
     - Log "Cache hit" message
     - Parse cached program from JSONB
     - **Crucially**: Save cached program to `training_programs` table as new entry
     - Return cached program with success response

3. **Cache Write (After Successful Generation):**
   - Set expiration to 24 hours from generation time
   - Upsert program to `ai_coach_cache` table with:
     - Generated cache key
     - User ID
     - Validated program in JSONB format
     - Hashed onboarding data
     - Expiration timestamp

4. **Error Handling:**
   - Cache read errors logged as warnings but don't stop generation
   - Cache write errors logged as warnings but don't affect program return
   - Database errors during cached program save handled gracefully

## Rationale

This approach leverages the existing `ai_coach_cache` infrastructure, minimizing additional complexity while providing significant performance and cost benefits. The cache key includes both user profile data and subscription status, ensuring that changes to either will trigger cache invalidation.

**Key Benefits:**
- **Performance Improvement**: Reduces latency from 5-15 seconds to <1 second for cache hits
- **Cost Reduction**: Significantly fewer LLM API calls for identical requests
- **System Load Reduction**: Less demand on external LLM service
- **Data Consistency**: Cached programs are still saved to training_programs table, maintaining accurate program history

**Cache Duration Rationale:**
- 24 hours provides good balance between performance and data freshness
- User onboarding data typically doesn't change frequently
- Automatic cache invalidation via expiration timestamp
- Manual cache clearing possible by deleting expired entries

## Consequences

### Positive

- **Faster Response Times**: Cache hits return programs in <1 second vs 5-15 seconds
- **Reduced API Costs**: Fewer LLM calls for identical requests
- **Improved User Experience**: Faster program generation for users with unchanged data
- **System Scalability**: Reduced load on LLM service
- **Data Integrity**: Cached programs still create proper training_programs entries

### Negative

- **Data Staleness**: Programs can be up to 24 hours old if user data changes
- **Storage Overhead**: Additional database storage for cached programs
- **Implementation Complexity**: Added cache logic to generation pipeline
- **Cache Management**: Need to monitor cache hit rates and storage usage

## Alternatives Considered

1. **No Caching:**
   - Pros: Always fresh data, simpler logic
   - Cons: Higher latency, higher costs, increased LLM load
   - Rejected due to performance and cost implications

2. **Shorter Cache Duration (e.g., 1 hour):**
   - Pros: More frequent data freshness
   - Cons: Reduced cache effectiveness, still high costs
   - Rejected as 24 hours provides good balance

3. **Longer Cache Duration (e.g., 7 days):**
   - Pros: Maximum cache effectiveness
   - Cons: Potential data staleness issues
   - Rejected due to user data change frequency

4. **Separate Cache Table:**
   - Pros: Dedicated schema for program caching
   - Cons: Additional infrastructure complexity
   - Rejected in favor of reusing existing ai_coach_cache table

## Implementation

- **Migration:** `20250801125657_create_ai_coach_cache_table.sql`
- **Modified File:** `src/app/_actions/aiProgramActions.ts`
- **Documentation:** `docs/implementation_plans/training-program-caching-implementation.md`

## Monitoring

- Monitor cache hit rates to validate effectiveness
- Track storage usage of ai_coach_cache table
- Monitor LLM API call reduction
- Watch for any cache-related errors in logs 
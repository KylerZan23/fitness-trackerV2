# Training Program Caching Implementation

**Date:** 2025-01-08

## Overview

Added a caching mechanism to the `generateTrainingProgram` function in `aiProgramActions.ts` to improve performance and reduce LLM API costs by reusing existing AI-generated training programs when user data hasn't changed.

## Database Schema

### New Migration: `20250801125657_create_ai_coach_cache_table.sql`

Created the `ai_coach_cache` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.ai_coach_cache (
    cache_key TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation JSONB NOT NULL,
    hashed_data_input TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
```

**Indexes:**
- `idx_ai_coach_cache_user_id_expires_at` on (user_id, expires_at)
- `idx_ai_coach_cache_hashed_data_input` on (hashed_data_input)

**RLS Policy:** Users can only access their own cache entries

## Implementation Details

### Cache Key Generation

The cache key is generated using a stable signature based on:
- User ID
- Subscription status (hasPaidAccess)
- Complete onboarding responses

**Process:**
1. Create signature object: `{ onboarding_responses, hasPaidAccess }`
2. Sort keys for stable JSON stringification
3. JSON.stringify the sorted object
4. Create Base64 hash of the string
5. Format key: `program:u${userId}:paid${hasPaidAccess}:d${hashedOnboardingData}`

### Cache Check Logic

Before executing the main generation pipeline:
1. Generate cache key using user profile and subscription data
2. Query `ai_coach_cache` table for valid entry (not expired)
3. If valid cache found:
   - Log "Cache hit" message
   - Parse cached program from JSONB
   - **Crucially**: Save cached program to `training_programs` table as new entry
   - Return cached program with success response

### Cache Write Logic

After successful program generation and validation:
1. Set expiration to 24 hours from now
2. Upsert program to `ai_coach_cache` table with:
   - Generated cache key
   - User ID
   - Validated program in JSONB format
   - Hashed onboarding data
   - Expiration timestamp

### Error Handling

- Cache read errors are logged as warnings but don't stop generation
- Cache write errors are logged as warnings but don't affect program return
- Database errors during cached program save are handled gracefully

## Benefits

1. **Performance Improvement**: Reduces latency for users with unchanged data
2. **Cost Reduction**: Fewer LLM API calls for identical requests
3. **System Load Reduction**: Less demand on external LLM service
4. **Data Consistency**: Cached programs are still saved to training_programs table

## Cache Duration

- **24 hours**: Provides good balance between performance and data freshness
- Cache invalidation happens automatically via expiration timestamp
- Manual cache clearing possible by deleting expired entries

## Files Modified

1. `supabase/migrations/20250801125657_create_ai_coach_cache_table.sql` - New migration
2. `src/app/_actions/aiProgramActions.ts` - Added caching logic to both function signatures

## Testing Considerations

- Verify cache hits work correctly for identical requests
- Ensure cache misses trigger full generation pipeline
- Test cache expiration functionality
- Validate that cached programs are properly saved to training_programs table
- Check error handling for cache operations

## Future Enhancements

- Consider implementing cache warming for popular user profiles
- Add cache analytics to monitor hit rates
- Implement cache invalidation on user profile changes
- Consider different cache durations based on user tier 
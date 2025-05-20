# ADR-002: AI Coach Recommendation Caching

**Status:** Accepted

**Date:** 2024-07-27

## Context

The AI Coach feature in `src/app/_actions/aiCoachActions.ts` generates personalized fitness recommendations by making calls to a Large Language Model (LLM). These calls can:
1.  Introduce latency, affecting user experience.
2.  Incur operational costs with each API request.
3.  Put load on the LLM service.

User data relevant to recommendations (profile, goals, recent activity summary) might not change frequently within short timeframes (e.g., 30 minutes). Re-generating recommendations when underlying data is static is inefficient.

## Decision

Implement a caching layer for AI Coach recommendations using a dedicated Supabase table: `public.ai_coach_cache`.

The schema for this table is:
```sql
CREATE TABLE IF NOT EXISTS public.ai_coach_cache (
    cache_key TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation JSONB NOT NULL,
    hashed_data_input TEXT, -- Hash of the input data used to generate the recommendation
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL -- Timestamp for when the cache entry should be considered stale
);
CREATE INDEX IF NOT EXISTS idx_ai_coach_cache_user_id_expires_at ON public.ai_coach_cache (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_coach_cache_hashed_data_input ON public.ai_coach_cache (hashed_data_input);
ALTER TABLE public.ai_coach_cache ENABLE ROW LEVEL SECURITY;
```

**Caching Logic in `getAICoachRecommendation` function:**
1.  **Cache Duration:** A constant `AI_COACH_CACHE_DURATION_MINUTES` (e.g., 30 minutes) defines the cache validity period.
2.  **Cache Key Generation:**
    *   A `dataSignatureObject` is created containing key pieces of user data that influence the recommendation (fitness goals, Strava connection status, workout summaries, active goals string).
    *   This object is stably stringified (sorted keys) and then hashed (Base64) to create `hashedDataInput`.
    *   The `cacheKey` is a combination of `aiCoach:u{userId}:d{hashedDataInput}`.
3.  **Cache Check (Before LLM Call):**
    *   The system queries `ai_coach_cache` using the `cacheKey`.
    *   If a valid (non-expired) entry is found, its `recommendation` is returned directly.
4.  **Cache Write (After Successful LLM Call):**
    *   If no valid cache entry exists and a new recommendation is fetched from the LLM:
        *   The new recommendation, along with `userId`, `cacheKey`, `hashedDataInput`, and calculated `created_at`, `expires_at` timestamps, is upserted into `ai_coach_cache`.
        *   The `onConflict: 'cache_key'` clause handles updates if an entry with the same key somehow exists.

## Rationale

This approach leverages the existing Supabase infrastructure, minimizing the need for additional services. The `hashed_data_input` in the cache key ensures that if significant input data changes, a new cache entry will be used/created, providing reasonably fresh recommendations while still benefiting from caching for users with stable data.

The primary benefits are:
*   **Improved Performance:** Reduced latency for users when a cached recommendation is available.
*   **Cost Reduction:** Fewer calls to the LLM service.
*   **Reduced System Load:** Less demand on the LLM.

The chosen cache duration (30 minutes) offers a balance between data freshness and caching effectiveness.

## Consequences

### Positive
*   Faster response times for AI Coach recommendations for users with unchanged relevant data.
*   Reduced API costs associated with the LLM.
*   Decreased load on the third-party LLM service.

### Negative
*   **Data Staleness:** Recommendations can be up to `AI_COACH_CACHE_DURATION_MINUTES` out of date. However, the `hashed_data_input` component of the cache key mitigates this by forcing a cache miss if core inputs change.
*   **Increased Database Usage:** Minor increase in Supabase database storage and read/write operations for the `ai_coach_cache` table.
*   **Implementation Complexity:** Added logic within the `getAICoachRecommendation` server action to manage cache reads, writes, and key generation.

## Alternatives Considered

1.  **No Caching:**
    *   Pros: Always fresh data. Simpler logic.
    *   Cons: Higher latency, higher LLM costs, increased LLM load. Rejected due to performance and cost implications.
2.  **In-Memory Caching (Server-Side):**
    *   Pros: Very fast reads for cached data.
    *   Cons: Not persistent across server restarts or multiple server instances (if not using a distributed in-memory cache). Cache would be cold on new instances. State management complexity. Rejected for lack of persistence and scalability concerns in a serverless/multi-instance environment.
3.  **Dedicated Caching Service (e.g., Redis, Memcached):**
    *   Pros: Highly optimized for caching, feature-rich.
    *   Cons: Introduces another piece of infrastructure to manage and pay for. Potentially overkill for the current scale and requirements of this specific feature. Rejected for added operational complexity compared to leveraging the existing Supabase setup.

## Attachments
*   `src/app/_actions/aiCoachActions.ts` (modified function)
*   DDL for `public.ai_coach_cache` (included in "Decision" section) 
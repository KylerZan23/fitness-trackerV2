# ADR-051: Client-Side Intelligent Retry Logic

## Status

Accepted

## Date

2025-01-16

## Context

Even with robust transactional integrity and full object return mechanisms in place, edge cases can still cause temporary program fetch failures:

1. **Network latency**: Request arrives before database replication completes
2. **Database read replicas**: Potential lag between write and read replicas 
3. **Transient server errors**: Temporary service disruptions (500, 502, 503)
4. **Network timeouts**: Intermittent connectivity issues

**User's Insight**: "As a workaround, make the front-end retry the fetch request a few times if it receives a 404 error. This gives the database the extra milliseconds it needs to catch up."

## Decision

Implement **intelligent client-side retry logic** as a **defense-in-depth** layer that:

1. **Retries transient failures** with exponential backoff
2. **Avoids infinite loops** for permanent errors
3. **Provides excellent UX** with minimal perceived latency
4. **Enhances monitoring** with detailed retry logging

## Implementation

### Core Retry Utility

Created `src/lib/utils/retryFetch.ts` with:

```typescript
export async function retryFetch<T>(
  url: string,
  fetchOptions: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<RetryResult<T>>
```

**Features**:
- ✅ Exponential backoff with jitter (prevents thundering herd)
- ✅ Configurable retry parameters per use case
- ✅ Intelligent status code filtering
- ✅ Custom retry logic support
- ✅ Comprehensive error reporting
- ✅ Development logging for debugging

### Specialized Program Fetch

```typescript
export async function retryProgramFetch(programId: string): Promise<RetryResult<any>>
```

**Optimized for program generation scenarios**:
- **Max Attempts**: 4 (vs 3 for general use)
- **Initial Delay**: 750ms (vs 500ms for general use)
- **Retryable Codes**: [404, 500, 502, 503] (includes 404 for new programs)
- **Custom Logic**: Special handling for 404s in program generation context

### Application Integration

Applied retry logic to all program fetch locations:
1. **Program Display Page** (`/programs/[id]`)
2. **Weekly Program View** (`/programs/[id]/week/[week]`)
3. **Programs List Page** (`/programs`)

## Retry Parameters

### Program Fetch (New Program Scenario)
- **Max Attempts**: 4
- **Timing**: 750ms → 1.5s → 3s → 3s (≈10s total)
- **Retryable**: 404, 500, 502, 503
- **Rationale**: 404s might be database lag after generation

### Programs List (General Fetching)
- **Max Attempts**: 3  
- **Timing**: 500ms → 1s → 2s (≈4s total)
- **Retryable**: 500, 502, 503, 504 (no 404s)
- **Rationale**: 404s for lists indicate permanent API issues

### Error Handling Strategy

```typescript
// Permanent errors (no retry)
- 401: Authentication required → Redirect to login
- 403: Permission denied → Clear error message
- 404: Resource not found (after retries) → Detailed error with attempt count

// Transient errors (retry with backoff)
- 404: For new program fetches only (database lag)
- 500: Internal server error
- 502: Bad gateway
- 503: Service unavailable
- Network timeouts and connection errors
```

## Benefits

### User Experience
1. **✅ Reduced Error Visibility**: Transient issues resolved automatically
2. **✅ Fast Recovery**: Most issues resolve within 1-2 seconds
3. **✅ Clear Feedback**: Detailed error messages when retries exhausted
4. **✅ No Infinite Loops**: Smart limits prevent poor UX

### Developer Experience  
1. **✅ Enhanced Debugging**: Retry logs with timing and attempt counts
2. **✅ Monitoring Insights**: Success/failure patterns visible in logs
3. **✅ Flexible Configuration**: Easy to tune per endpoint/use case
4. **✅ Consistent Interface**: Single utility for all retry needs

### System Reliability
1. **✅ Defense in Depth**: Additional protection layer
2. **✅ Graceful Degradation**: Handles edge cases not covered by other layers
3. **✅ Network Resilience**: Handles transient connectivity issues
4. **✅ Database Lag Buffer**: Provides time for replication/transactions

## Defense-in-Depth Strategy

The retry logic complements existing protection layers:

```
🔒 Layer 1: Transactional Integrity
   ↓ No success without confirmed database commit

📦 Layer 2: Full Object Return  
   ↓ Eliminates fetch dependency for new programs

💾 Layer 3: SessionStorage Bypass
   ↓ Immediate data access for fresh programs

🔄 Layer 4: Client-Side Retries ← THIS ADR
   ↓ Handles edge cases and network issues

🛡️ Layer 5: Graceful Error Handling
   ↓ Clear feedback when all layers fail
```

## Example Scenarios

### Successful Retry (Database Lag)
```
[Time] Program generation completed with DB commit ✅
[Time] User redirects to /programs/123
[Time] Attempt 1: 404 (database read replica lag)
[Time] Wait 750ms, retry...
[Time] Attempt 2: 200 ✅ Program loaded
[Log] ✅ Program loaded after 2 attempts in 1s
```

### Permanent Failure (Real 404)
```
[Time] User tries to access /programs/invalid-id
[Time] Attempt 1: 404 
[Time] Wait 750ms, retry...
[Time] Attempt 2: 404
[Time] Wait 1.5s, retry...
[Time] Attempt 3: 404  
[Time] Wait 3s, retry...
[Time] Attempt 4: 404
[Error] ❌ Program not found (attempted 4 times over 6s)
```

### Auth Error (No Retry)
```
[Time] User session expired
[Time] Attempt 1: 401 Unauthorized
[Action] → Redirect to login (no retry attempted)
```

## Monitoring and Metrics

### Success Metrics
```typescript
// Development logs
console.log(`[ProgramFetch] ✅ Program loaded after ${attempts} attempts in ${time}s`)

// Production telemetry  
- retry_success_rate: Percentage of retries that eventually succeed
- average_retry_count: Mean attempts needed for success
- retry_timing_distribution: Time to success histogram
```

### Error Metrics
```typescript
// Detailed error messages
setError(`Program not found (attempted ${attempts} times over ${Math.round(totalTime/1000)}s)`)

// Monitoring insights
- permanent_404_rate: True 404s after exhausting retries
- transient_error_rate: Issues resolved by retries  
- network_timeout_frequency: Connection issue patterns
```

## Trade-offs

### Pros
- **Better UX**: Fewer user-visible errors from transient issues
- **System Resilience**: Handles edge cases and network problems
- **Debugging**: Rich retry context in logs and error messages
- **Flexible**: Easy to tune parameters per use case

### Cons  
- **Slightly Higher Latency**: Max 10s for exhaustive retries (rare)
- **Complexity**: Additional retry logic and error handling
- **Resource Usage**: Extra network requests for failed attempts

**Decision**: The significant UX improvements outweigh the minimal costs.

## Implementation Details

### Files Created
- `src/lib/utils/retryFetch.ts` - Core retry utility

### Files Modified  
- `src/app/programs/[id]/page.tsx` - Program display with retry
- `src/app/programs/[id]/week/[week]/page.tsx` - Weekly view with retry
- `src/app/programs/page.tsx` - Programs list with retry

### Configuration Examples
```typescript
// Aggressive retry for critical new program fetches
retryProgramFetch(programId) // 4 attempts, includes 404s

// Conservative retry for general API calls
retryFetch('/api/data', {}, { 
  maxAttempts: 2,
  retryableStatusCodes: [500, 502, 503]
})
```

## Related ADRs

- **ADR-050**: Transactional Integrity for Program Generation
- **ADR-049**: Program Fetch API and Client Fixes
- **ADR-021**: Standardized Error Handling Types

## Conclusion

Client-side intelligent retry logic provides a robust final layer of protection that gracefully handles edge cases while maintaining excellent user experience. Combined with transactional integrity and full object return, this creates a bulletproof program generation and access system.

The implementation is flexible, configurable, and provides rich debugging information while avoiding the pitfalls of naive retry strategies.

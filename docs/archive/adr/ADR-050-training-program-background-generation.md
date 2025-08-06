# ADR-050: Training Program Background Generation Architecture

## Status
Accepted

## Context
The existing training program generation system processes complex AI-driven program creation synchronously within server actions, leading to several issues:

1. **Poor User Experience**: Users wait 30-60 seconds for program generation with no feedback
2. **Blocking Operations**: The entire UI becomes unresponsive during generation
3. **Scalability Issues**: Can't handle multiple concurrent generations efficiently
4. **Error Handling**: Limited visibility into generation failures
5. **Resource Inefficiency**: Server resources are tied up during long-running operations

The current system requires users to wait for the entire LLM processing pipeline to complete before getting any response, which includes:
- Enhanced user data processing
- Scientific analysis (volume landmarks, weak point analysis)
- LLM API calls with retry logic
- Program validation and enhancement
- Database storage with scientific metadata

## Decision
We will re-architect the training program generation flow to use background processing with the following components:

### 1. Database Status Tracking
- Add `generation_status` and `generation_error` columns to `training_programs` table
- Track generation progress: `pending` → `processing` → `completed`/`failed`

### 2. Shared Library (`src/lib/ai/programGenerator.ts`)
- Extract core generation logic into reusable `runProgramGenerationPipeline(programId)` function
- Centralize all scientific processing, LLM calls, validation, and error handling
- Enable reuse across different execution contexts

### 3. Supabase Edge Function (`supabase/functions/generate-program/index.ts`)
- HTTP-triggered function for background processing
- Secure authentication and authorization
- Async execution of generation pipeline
- Proper error handling and status updates

### 4. Lightweight Server Action
- Refactor `generateTrainingProgram` to be a trigger-only function
- Create database entry with `pending` status
- Call Edge Function and return immediately
- Provide instant user feedback

## Consequences

### Positive
1. **Improved User Experience**
   - Instant response (< 1 second vs 30-60 seconds)
   - Non-blocking UI during generation
   - Real-time status updates
   - Clear error messages and recovery options

2. **Enhanced Scalability**
   - Multiple concurrent generations supported
   - Edge Functions can scale independently
   - Better resource utilization
   - Cost-efficient compute usage

3. **Better Architecture**
   - Separation of concerns between UI and computation
   - Centralized generation logic
   - Improved testability and maintainability
   - Comprehensive error handling and monitoring

4. **Technical Benefits**
   - Reusable generation pipeline
   - Proper status tracking
   - Detailed error logging
   - Future extensibility for queuing systems

### Negative
1. **Increased Complexity**
   - Additional components to maintain
   - More complex deployment process
   - Requires status polling on frontend

2. **Eventual Consistency**
   - Users must wait for completion notification
   - Requires frontend changes to handle async flow
   - Need to handle edge cases (zombie processes, timeouts)

### Neutral
1. **Development Overhead**
   - One-time migration effort
   - Frontend updates required
   - New monitoring and alerting needs

## Implementation
The implementation consists of four parts:

1. **Database Migration**: Add status tracking columns
2. **Shared Library**: Extract and centralize generation logic
3. **Edge Function**: Create secure background processor
4. **Server Action**: Refactor to lightweight trigger

All components include proper error handling, authentication, and monitoring capabilities.

## Alternatives Considered

### Alternative 1: Queue System (Redis/PostgreSQL)
- **Pros**: More robust job management, better scalability
- **Cons**: Additional infrastructure, increased complexity
- **Decision**: Defer to future enhancement, Edge Functions sufficient for current needs

### Alternative 2: Streaming Responses
- **Pros**: Real-time progress updates
- **Cons**: Complex implementation, requires WebSocket infrastructure
- **Decision**: Consider for future enhancement

### Alternative 3: Client-Side Generation
- **Pros**: No server processing required
- **Cons**: Security concerns, API key exposure, limited compute resources
- **Decision**: Rejected due to security and performance concerns

## Related ADRs
- ADR-019: Structured AI Program Output
- ADR-032: Environment Variable Validation
- ADR-049: Training Program Caching (superseded by this architecture)

## Notes
This architectural change enables future enhancements such as:
- Real-time progress notifications via WebSockets
- Priority queues for different user tiers
- Batch generation capabilities
- Advanced monitoring and alerting
- Integration with external job queue systems

The new architecture maintains backward compatibility while providing a foundation for scalable growth.
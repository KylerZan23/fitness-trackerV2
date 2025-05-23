# ADR-003: AI Training Program Generation Architecture

## Status
Accepted

## Date
2024-12-20

## Context
FitnessTracker V2 requires the ability to generate personalized training programs using AI/LLM technology. The system needs to:

1. Collect comprehensive user onboarding data
2. Generate structured training programs via LLM
3. Store and manage programs in the database
4. Provide type-safe data validation
5. Integrate seamlessly with the existing application architecture

## Decision

### LLM Integration Architecture
- **Provider**: OpenAI GPT-4o-mini
- **Response Format**: Structured JSON with `response_format: { "type": "json_object" }`
- **Configuration**: Environment variable `LLM_API_KEY` (required), optional `LLM_API_ENDPOINT` (defaults to OpenAI)
- **Error Handling**: Comprehensive retry logic and graceful degradation

### Prompt Engineering Strategy
- **TypeScript Interface Inclusion**: Full interface definitions provided in prompt text
- **Structured Instructions**: Clear generation rules for exercise selection, progressive overload, and program structure
- **Equipment-Based Selection**: Strict adherence to user's available equipment
- **Experience-Level Adaptation**: Complexity and volume adjusted based on user experience

### Data Validation Architecture
- **Runtime Validation**: Zod schemas mirroring TypeScript interfaces
- **Type Safety**: Full TypeScript integration with discriminated union responses
- **Error Recovery**: Validation failures handled gracefully with user feedback

### Database Schema Design
- **JSONB Storage**: Complete program stored as JSONB in `program_details` column
- **Extracted Fields**: Key fields extracted for efficient querying (`program_name`, `total_duration_weeks`)
- **Audit Trail**: `onboarding_data_snapshot` preserves generation context
- **Triggers**: Automatic field extraction via database triggers
- **RLS Security**: Row-level security for user data protection

### Integration Patterns
- **Server Actions**: Next.js server actions for type-safe API calls
- **Onboarding Flow**: Automatic program generation after onboarding completion
- **Error Boundaries**: Clear separation between onboarding success and program generation failures

## Technical Implementation

### Core Components
```typescript
// Server Action with full pipeline
generateTrainingProgram(userIdToGenerateFor?: string): Promise<ProgramGenerationResponse>

// Zod validation schemas
TrainingProgramSchema, TrainingPhaseSchema, TrainingWeekSchema, WorkoutDaySchema, ExerciseDetailSchema

// LLM integration
constructLLMPrompt(), callLLMAPI(), getTypeScriptInterfaceDefinitions()
```

### Database Schema
```sql
CREATE TABLE training_programs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  program_details JSONB NOT NULL,
  program_name TEXT,
  total_duration_weeks INTEGER,
  ai_model_version TEXT,
  onboarding_data_snapshot JSONB,
  -- Additional fields...
);
```

### Response Types
```typescript
type ProgramGenerationResponse = 
  | { program: TrainingProgram; success: true }
  | { error: string; success: false }
```

## Consequences

### Positive
- **Type Safety**: Full TypeScript integration ensures compile-time safety
- **Reliability**: Zod validation prevents runtime errors from malformed LLM responses
- **Scalability**: JSONB storage allows flexible program structures without schema migrations
- **Audit Trail**: Complete generation context preserved for debugging and regeneration
- **Performance**: Extracted fields enable efficient queries without JSONB parsing
- **Security**: RLS ensures proper data isolation between users

### Negative
- **Complexity**: Multi-layer validation and error handling increases codebase complexity
- **LLM Dependency**: System reliability depends on external LLM service availability
- **Cost**: Per-request LLM usage costs scale with user adoption
- **Response Time**: LLM generation adds latency to onboarding completion

### Risks
- **LLM Service Outages**: Fallback mechanisms needed for service disruptions
- **Prompt Drift**: LLM model updates may affect response quality
- **Token Limits**: Large programs may exceed LLM context or response limits
- **Cost Management**: Need monitoring and limits for LLM usage costs

## Alternative Considered

### Template-Based Generation
- **Pros**: Predictable, fast, no external dependencies
- **Cons**: Limited personalization, requires manual template maintenance
- **Decision**: Rejected in favor of AI flexibility and personalization

### Local LLM Deployment
- **Pros**: No external costs, full control, privacy
- **Cons**: Infrastructure complexity, model quality limitations, resource requirements
- **Decision**: Deferred to future consideration

### Hybrid Approach
- **Pros**: Combines AI flexibility with template reliability
- **Cons**: Increased complexity, potential inconsistencies
- **Decision**: Reserved for future enhancement if needed

## Implementation Notes

### Environment Configuration
```env
LLM_API_KEY=sk-your-openai-api-key
# Optional - defaults to standard OpenAI endpoint
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

### Error Handling Strategy
1. Authentication validation
2. Profile data verification
3. LLM API communication
4. JSON parsing and validation
5. Database operation handling
6. Graceful degradation (onboarding succeeds even if generation fails)

### Future Considerations
- **Model Versioning**: Track AI model versions for program regeneration
- **Program Customization**: Allow user modifications to generated programs
- **Progress Integration**: Adapt programs based on user performance data
- **Alternative LLM Providers**: Abstract LLM calls for provider flexibility

## Related ADRs
- ADR-001: User Profile Schema and Data Structure
- ADR-002: Training Program Data Structure (referenced interfaces) 
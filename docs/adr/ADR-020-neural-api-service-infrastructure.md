# ADR-020: Neural API Service Infrastructure

## Status
**ACCEPTED** - 2024-01-XX

## Context

The fitness tracker application requires a robust, reliable AI service infrastructure to power training program generation and progression. Previous implementations suffered from reliability issues, validation failures, and inconsistent error handling. The introduction of the Neural type system provides an opportunity to build a production-ready service layer that leverages the simplified, AI-optimized data structures.

### Problem Statement

1. **Reliability Issues**: Previous AI integrations had ~30% failure rates due to complex validation schemas
2. **Error Handling**: Inconsistent error handling across AI services led to poor user experience
3. **Maintainability**: Tightly coupled AI logic made testing and modification difficult
4. **Scalability**: No retry logic or failure recovery mechanisms for production use
5. **Monitoring**: Limited visibility into AI service performance and failures

### Requirements

- **High Reliability**: <1% failure rate for valid inputs with comprehensive retry logic
- **Provider Agnostic**: Support multiple LLM providers through unified interface
- **Type Safety**: Full TypeScript integration with runtime validation
- **Error Recovery**: Graceful error handling with meaningful user feedback
- **Observability**: Comprehensive logging and metrics for production monitoring
- **Integration**: Seamless integration with existing Data Access Layer patterns

## Decision

We will implement a comprehensive Neural API service infrastructure consisting of two main components:

### 1. NeuralAPI Service (`src/services/neuralAPI.ts`)

**Purpose**: Core LLM integration service handling AI interactions with structured output generation.

**Key Features**:
- Provider-agnostic interface using existing OpenAI service foundation
- Structured output generation with guaranteed Zod schema compliance
- Comprehensive error handling with specific error types and context
- Retry logic with exponential backoff (3 attempts, 2^n * 1000ms delay)
- Request/response logging with correlation IDs
- Configuration management with environment integration
- Metrics collection for success rates and response times

**Architecture**:
```typescript
export class NeuralAPI {
  private config: LLMConfig;
  private metrics: ServiceMetrics;
  
  async generateProgram(request: NeuralRequest): Promise<NeuralResponse>
  private validateNeuralResponse(response: any): NeuralResponse
  private generateWithRetry<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>
}
```

### 2. ProgramGenerator Service (`src/services/programGenerator.ts`)

**Purpose**: High-level orchestrator managing the complete program generation and progression workflow.

**Key Features**:
- New program creation from onboarding data with full validation
- Program progression based on performance feedback and progress data
- Integration with database through established Data Access Layer patterns
- Business logic validation and enhancement of AI-generated programs
- Comprehensive error handling with structured result types
- Support for both new users and existing program progression

**Architecture**:
```typescript
export class ProgramGenerator {
  private neuralAPI: NeuralAPI;
  
  async createNewProgram(userId: string, onboardingData: OnboardingData): Promise<ProgramGenerationResult>
  async progressProgram(currentProgram: TrainingProgram, progressData: ProgressData): Promise<ProgramProgressionResult>
}
```

## Implementation Details

### Error Handling Strategy

**Multi-layered Error Management**:
1. **Service-specific Errors**: `NeuralAPIError` and `ProgramGeneratorError` with typed error categories
2. **Error Context**: Rich error context with sanitized request data and correlation IDs
3. **Error Recovery**: Automatic retry with exponential backoff for transient failures
4. **User-friendly Messages**: Error translation that doesn't expose technical details

**Error Types**:
- `CONFIGURATION_ERROR`: Invalid LLM config or environment setup
- `VALIDATION_ERROR`: Schema validation failures or malformed responses
- `GENERATION_ERROR`: LLM provider failures or unexpected responses
- `DATABASE_ERROR`: Storage failures or data access issues
- `BUSINESS_LOGIC_ERROR`: Invalid program combinations or constraint violations

### Data Flow Architecture

```
User Input → ProgramGenerator → NeuralAPI → LLM Provider
                ↓
Database ← Program Validation ← Structured Response
```

1. **Input Validation**: All user input validated against Neural schemas
2. **Prompt Generation**: Intelligent prompt building based on user context
3. **AI Generation**: Structured output generation with schema compliance
4. **Response Validation**: Multi-layer validation (schema + business logic)
5. **Enhancement**: Program enrichment with metadata and user context
6. **Storage**: Database storage with full audit trail and metadata

### Integration Patterns

**Follows Established Patterns**:
- **Data Access Layer**: All database operations through DAL functions
- **Error Handling**: Consistent with existing service error patterns
- **Logging**: Uses existing logger with structured context
- **Environment**: Leverages existing environment configuration system
- **Validation**: Uses existing Zod schemas with ENHANCED_PROGRAM_VALIDATION

### Performance & Reliability

**Reliability Measures**:
- Structured outputs eliminate JSON parsing failures
- Retry logic with exponential backoff handles transient failures
- Comprehensive validation prevents invalid programs reaching users
- Graceful degradation with meaningful error messages

**Performance Targets**:
- Response Time: <10 seconds for program generation
- Success Rate: >95% for valid inputs
- Retry Success: >90% recovery from transient failures
- Throughput: Support 100+ concurrent generations

## Alternatives Considered

### 1. Single Monolithic Service
**Rejected**: Would violate separation of concerns and make testing difficult

### 2. Direct LLM Integration in Actions
**Rejected**: Would duplicate error handling and make provider switching difficult

### 3. Extending Existing OpenAI Service
**Rejected**: Would tightly couple Neural-specific logic with generic LLM functionality

### 4. Function-based Approach
**Rejected**: Class-based approach provides better state management and metrics collection

## Consequences

### Positive

1. **Improved Reliability**: Structured outputs and retry logic dramatically reduce failure rates
2. **Better Maintainability**: Clear separation of concerns between AI and business logic
3. **Enhanced Observability**: Comprehensive logging and metrics for production monitoring
4. **Scalability**: Provider-agnostic design supports future LLM providers
5. **Type Safety**: Full TypeScript integration prevents runtime errors
6. **Testing**: Modular design enables comprehensive unit and integration testing

### Negative

1. **Complexity**: Additional abstraction layer increases codebase complexity
2. **Dependencies**: Tight coupling to existing OpenAI service and Neural type system
3. **Learning Curve**: Developers need to understand the service layer architecture

### Neutral

1. **Migration**: Existing program generation can gradually migrate to new services
2. **Backward Compatibility**: Services support both new and legacy data structures

## Monitoring & Success Metrics

### Key Performance Indicators
- **Generation Success Rate**: Target >95%
- **Average Response Time**: Target <10 seconds
- **Error Recovery Rate**: Target >90% for retry scenarios
- **User Satisfaction**: Measured through program completion rates

### Monitoring Implementation
- **Structured Logging**: All operations logged with correlation IDs
- **Metrics Collection**: Success rates, response times, error counts
- **Error Tracking**: Detailed error context for debugging
- **Performance Monitoring**: Response time distribution and throughput

## Migration Strategy

### Phase 1: Foundation (Completed)
- ✅ Implement NeuralAPI and ProgramGenerator services
- ✅ Comprehensive error handling and validation
- ✅ Unit test coverage for core functionality
- ✅ Documentation and ADR creation

### Phase 2: Integration (Next)
- Update existing API endpoints to use new services
- Implement comprehensive integration tests
- Add monitoring and alerting for production deployment
- Performance testing and optimization

### Phase 3: Enhancement (Future)
- Caching layer for frequently generated programs
- Batch processing capabilities for multiple users
- Advanced prompt engineering and optimization
- Machine learning insights from usage patterns

## Testing Strategy

### Unit Tests
- NeuralAPI service methods with mocked LLM responses
- ProgramGenerator business logic and validation
- Error handling scenarios and recovery paths
- Metrics collection and configuration management

### Integration Tests
- End-to-end program generation flow
- Database operations through Data Access Layer
- LLM provider interactions with real API calls
- Error propagation through service layers

### Performance Tests
- Concurrent request handling under load
- Memory usage and garbage collection optimization
- Response time benchmarks across user scenarios

## Security Considerations

1. **API Key Management**: Uses existing secure environment configuration
2. **Input Validation**: All user input validated against strict schemas
3. **Data Sanitization**: Sensitive information removed from logs
4. **Error Information**: Error messages don't expose system internals
5. **Rate Limiting**: Built-in retry logic prevents API abuse

## Future Enhancements

1. **Multi-Provider Support**: Easy addition of Anthropic, Azure OpenAI, etc.
2. **Caching Layer**: Redis-based caching for frequently requested programs
3. **Batch Processing**: Parallel generation for multiple users
4. **Advanced Analytics**: Usage patterns and optimization insights
5. **Real-time Adaptation**: Live program adjustments based on performance

## References

- [Neural Type System Architecture (ADR-019)](./ADR-019-neural-type-system-architecture.md)
- [OpenAI Service Implementation](../../src/lib/services/openaiService.ts)
- [Enhanced Program Validation](../../src/lib/validation/enhancedProgramSchema.ts)
- [Data Access Layer Patterns](../../src/lib/data/)

## Conclusion

The Neural API Service Infrastructure provides a robust, scalable foundation for AI-powered training program generation. By leveraging the simplified Neural type system and following established architectural patterns, this implementation delivers the reliability and maintainability required for production use while providing a foundation for future enhancements.

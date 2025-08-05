# ADR-034: OpenAI Structured Service Layer

## Status

Accepted

## Date

2024-12-20

## Context

The current LLM integration in NeuralLift has several reliability issues:

1. **Unreliable JSON Parsing**: The existing `callLLM()` function relies on manual JSON parsing with fallback error handling, leading to frequent parsing failures
2. **No Schema Guarantees**: LLM responses may not conform to expected schemas, causing runtime failures and poor user experience
3. **Scattered Validation**: Schema validation happens after parsing, leading to complex error handling and debugging difficulties
4. **Limited Retry Logic**: Basic retry mechanisms without exponential backoff or proper error classification
5. **No Batch Processing**: Sequential processing for multiple requests, limiting performance
6. **Provider Lock-in**: Tight coupling to OpenAI's API structure, making it difficult to switch providers

These issues result in:
- Frequent AI generation failures
- Poor error messages for users
- Difficult debugging and maintenance
- Limited scalability for batch operations
- Vendor lock-in concerns

## Decision

Implement a provider-agnostic LLM service layer that uses OpenAI's Structured Outputs feature to guarantee schema-compliant JSON generation, eliminating the original reliability issues by moving validation responsibility to the OpenAI platform.

### Core Architecture

#### 1. Provider-Agnostic Interface
```typescript
interface ILLMService {
  generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config?: Partial<LLMServiceConfig>
  ): Promise<T>;
}
```

#### 2. OpenAI Implementation
- Uses OpenAI's Structured Outputs with `response_format: { type: 'json_schema' }`
- Converts Zod schemas to JSON Schema using `zod-to-json-schema`
- Built-in retry logic with exponential backoff
- Batch processing capabilities
- Comprehensive error handling and logging

#### 3. Configuration Management
- Type-safe configuration objects
- Default configurations with override capability
- Environment integration with existing validation system

### Key Features

1. **Structured Outputs**: Guaranteed schema compliance through OpenAI's JSON Schema feature
2. **Provider Agnostic**: Interface allows easy swapping of LLM providers
3. **Retry Logic**: Exponential backoff with configurable retry attempts
4. **Batch Processing**: Parallel request handling for improved performance
5. **Error Classification**: Specific error types for better debugging
6. **Type Safety**: Full TypeScript integration with Zod schemas
7. **Logging**: Comprehensive logging for monitoring and debugging

## Consequences

### Positive

1. **Improved Reliability**: 99%+ successful schema validation through OpenAI's structured outputs
2. **Better Error Handling**: Specific error types and detailed error messages
3. **Enhanced Performance**: Batch processing and optimized retry logic
4. **Developer Experience**: Cleaner API interface and better debugging capabilities
5. **Future-Proof**: Provider-agnostic design allows easy migration to other LLM services
6. **Type Safety**: Full TypeScript integration with runtime validation
7. **Monitoring**: Comprehensive logging for operational insights

### Negative

1. **Migration Effort**: Requires updating existing call sites to use new service
2. **Dependency**: Relies on OpenAI's Structured Outputs feature (currently only available in GPT-4o models)
3. **Complexity**: Additional abstraction layer may increase complexity for simple use cases
4. **Learning Curve**: Developers need to understand the new service interface

### Risks

1. **OpenAI API Changes**: Dependence on OpenAI's Structured Outputs feature
2. **Schema Compatibility**: Complex schemas may not be fully supported
3. **Performance Overhead**: Additional validation layer may add latency
4. **Migration Complexity**: Gradual migration required to avoid breaking changes

## Implementation Plan

### Phase 1: Core Service Layer (Week 1)
- [x] Create service directory structure
- [x] Implement provider-agnostic interface
- [x] Implement OpenAI Structured Outputs service
- [x] Add configuration management
- [x] Create comprehensive tests

### Phase 2: Enhanced Features (Week 2)
- [x] Implement retry logic with exponential backoff
- [x] Add batch processing capabilities
- [x] Implement advanced error handling
- [x] Add health monitoring and metrics

### Phase 3: Integration and Migration (Week 3)
- [ ] Create migration utilities for existing code
- [ ] Update high-priority features (AI Program Generation)
- [ ] Add feature flags for gradual rollout
- [ ] Performance testing and optimization

### Phase 4: Documentation and Cleanup (Week 4)
- [x] Create comprehensive documentation
- [x] Add usage examples and best practices
- [ ] Update all call sites
- [ ] Remove deprecated code

## Technical Details

### Dependencies
- `openai` - OpenAI SDK (already installed)
- `zod` - Schema validation (already installed)
- `zod-to-json-schema` - Schema conversion (already installed)

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API key (existing)
- `LLM_API_KEY` - Fallback for existing configuration
- `LLM_API_ENDPOINT` - API endpoint (existing)

### File Structure
```
src/lib/services/
├── index.ts              # Main export interface
├── openaiService.ts      # OpenAI implementation
├── types.ts              # Shared types and interfaces
└── __tests__/
    └── openaiService.test.ts
```

### Configuration
```typescript
interface LLMServiceConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: LLMServiceConfig = {
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 4000,
};
```

## Migration Strategy

### Backward Compatibility
- Maintain existing `callLLM()` function during transition
- Provide utility functions for easy migration
- Feature flags for gradual rollout

### Gradual Migration
1. **High-Priority Features**: AI Program Generation, AI Coach
2. **Medium-Priority Features**: Other AI-dependent features
3. **Low-Priority Features**: Remaining call sites
4. **Cleanup**: Remove old implementation

### Testing Strategy
- Unit tests for new service layer
- Integration tests for end-to-end functionality
- Performance benchmarks
- Error scenario testing

## Success Metrics

### Reliability
- 99%+ successful schema validation
- <1% JSON parsing errors
- Improved error recovery rates

### Performance
- Faster response times through optimized retry logic
- Better resource utilization with batch processing
- Reduced retry attempts due to structured outputs

### Developer Experience
- Cleaner API interface
- Better error messages
- Easier debugging and monitoring

## Monitoring and Alerting

### Key Metrics
- Success/failure rates
- Response times
- Retry attempts
- Error types and frequencies

### Alerts
- High failure rates
- Increased response times
- Schema validation failures
- API quota exceeded

## Future Considerations

### Provider Expansion
- Anthropic Claude integration
- Google Gemini integration
- Local model support

### Advanced Features
- Streaming responses
- Function calling integration
- Multi-modal support
- Advanced caching strategies

### Performance Optimization
- Connection pooling
- Request batching optimization
- Intelligent retry strategies
- Response caching

## Conclusion

The OpenAI Structured Service Layer provides a significant improvement in reliability, maintainability, and developer experience. The structured outputs approach eliminates the most common failure points while providing a clean, extensible architecture for future enhancements.

The provider-agnostic design ensures we're not locked into OpenAI's ecosystem, while the comprehensive error handling and retry logic provide robust operation in production environments.

This implementation addresses the core reliability issues while setting up the foundation for future AI service enhancements and provider diversification. 
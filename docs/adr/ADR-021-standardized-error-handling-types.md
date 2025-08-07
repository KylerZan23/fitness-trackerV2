# ADR-021: Standardized Error Handling Types System

## Status
Accepted

## Context

Our application has grown with inconsistent error handling patterns across different components:

1. **Multiple Validation Error Interfaces**: Different files defined `ValidationError` with varying structures
2. **Inconsistent API Error Responses**: API routes used different error response formats
3. **No Type Safety**: Error handling relied on thrown exceptions rather than type-safe discriminated unions
4. **Poor Developer Experience**: No consistent error codes or structured error details
5. **Debugging Challenges**: Lack of standardized context and tracing information

### Current Patterns Found
- `ValidationError` interface in onboarding components
- `APIErrorResponse` interface in API routes
- `ProgramGeneratorError` class in services
- `NeuralAPIError` class in external services
- Environment-specific `ValidationError` in validation utilities

## Decision

We have implemented a comprehensive standardized error handling system with the following principles:

### 1. Core Type System (`src/lib/errors/types.ts`)

#### Error Code Constants
```typescript
export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NEURAL_API_ERROR: 'NEURAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  // ... 25+ comprehensive error codes
} as const;
```

#### Field Validation Errors
```typescript
export interface FieldValidationError {
  field: string;
  message: string;
  code: ErrorCode;
  context?: Record<string, unknown>;
}
```

#### API Error Interface
```typescript
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  code: ErrorCode;
  timestamp: string;
  requestId?: string;
  details?: FieldValidationError[] | null;
  context?: Record<string, unknown>;
  stack?: string; // Development only
}
```

#### Service Result Discriminated Union
```typescript
export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };
```

### 2. Type-Safe Error Classes

#### Base Application Error
```typescript
export abstract class BaseApplicationError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly statusCode: number;
  
  toApiError(requestId?: string): ApiError;
  protected abstract getErrorCategory(): string;
}
```

#### Specific Error Types
- `FieldValidationError` - For input validation failures
- `AuthenticationError` - For auth failures
- `NotFoundError` - For missing resources  
- `BusinessLogicError` - For domain rule violations
- `ExternalServiceError` - For third-party API failures
- `DatabaseError` - For database operation failures

### 3. Backward Compatibility

#### Alias for Existing Interfaces
```typescript
// Maintains compatibility with existing ValidationError usage
export type ValidationError = FieldValidationError;
export const ValidationError = FieldValidationError;
```

#### Seamless Migration
- All existing error interfaces continue to work
- New types can be adopted gradually
- No breaking changes to existing API contracts

### 4. Utility Functions

#### Type-Safe Result Creation
```typescript
export const createSuccessResult = <T>(data: T): ServiceResult<T>;
export const createErrorResult = <T>(error: unknown): ServiceResult<T>;
```

#### Zod Error Conversion
```typescript
export const createValidationErrorsFromZod = (zodError: unknown): FieldValidationError[];
```

#### Type Guards
```typescript
export const isFieldValidationError = (error: unknown): error is FieldValidationError;
export const isNotFoundError = (error: unknown): error is NotFoundError;
// ... other type guards
```

## Benefits

### 1. Type Safety
- Discriminated unions prevent runtime errors
- TypeScript compiler catches error handling mistakes
- IntelliSense provides better developer experience

### 2. Consistency
- Uniform error responses across all APIs
- Standardized field names and structures
- Consistent status code mapping

### 3. Debugging
- Rich context with user IDs, operation names, and request IDs
- Structured error details for validation failures
- Stack traces in development mode
- Correlation IDs for tracing across services

### 4. Developer Experience
- Constants prevent error code typos
- Type guards enable safe error handling
- Utility functions reduce boilerplate
- Comprehensive documentation and examples

### 5. Maintainability
- Centralized error type definitions
- Easy to extend with new error types
- Backward compatibility ensures smooth migration
- Clear patterns for new development

## Implementation Examples

### API Route Error Handling
```typescript
export async function POST(request: Request) {
  try {
    const result = await processRequest(data);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      const apiError = error.toApiError(requestId);
      return NextResponse.json(apiError, { status: apiError.statusCode });
    }
    return NextResponse.json(createErrorResult(error));
  }
}
```

### Service Method Pattern
```typescript
async function createProgram(data: ProgramData): Promise<ServiceResult<Program>> {
  try {
    const program = await processProgram(data);
    return createSuccessResult(program);
  } catch (error) {
    return createErrorResult(error);
  }
}
```

### Frontend Error Handling
```typescript
const result = await createProgram(data);
if (result.success) {
  // TypeScript knows result.data is Program
  showSuccess('Program created!');
} else {
  // TypeScript knows result.error is ApiError
  if (result.error.details) {
    // Handle validation errors
    result.error.details.forEach(fieldError => {
      setFieldError(fieldError.field, fieldError.message);
    });
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Completed)
- ✅ Create comprehensive type definitions
- ✅ Ensure backward compatibility
- ✅ Create implementation documentation

### Phase 2: New Development
- Use standardized types for all new API routes
- Implement ServiceResult pattern in new services
- Apply error handling patterns to new components

### Phase 3: Gradual Migration
- Update existing API routes one at a time
- Migrate service methods to use ServiceResult
- Update frontend components to use type-safe error handling

### Phase 4: Cleanup
- Remove deprecated error interfaces
- Update documentation
- Performance optimization

## Consequences

### Positive
- **Type Safety**: Eliminates entire classes of runtime errors
- **Consistency**: Uniform error handling across the application
- **Developer Experience**: Better tooling support and clearer APIs
- **Debugging**: Rich context and structured error information
- **Maintainability**: Centralized error types and clear patterns

### Neutral
- **Learning Curve**: Developers need to learn new patterns
- **File Size**: Additional type definitions increase bundle size slightly

### Negative
- **Migration Effort**: Existing code needs gradual migration
- **Complexity**: More sophisticated than simple string errors

## Monitoring

### Error Tracking
- All errors include correlation IDs for tracing
- Structured logging with error codes and context
- Integration with monitoring services (e.g., Sentry)

### Metrics
- Error rate by error code
- API endpoint error distribution
- Validation error patterns
- Service failure rates

## Related Decisions

- **ADR-010**: Standardized Error Handling System (baseline error handling)
- **ADR-019**: Neural Type System Architecture (related type safety patterns)
- **ADR-020**: Modern Onboarding Types Architecture (validation patterns)

## References

- [Implementation Guide](../implementation_plans/standardized-error-handling-implementation.md)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Error Handling Best Practices](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines#error-handling)

# Standardized Error Handling Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the new standardized error handling system defined in `src/lib/errors/types.ts`. The system provides type-safe error handling with discriminated unions, structured validation details, and consistent HTTP status code mapping.

## Core Components

### 1. Error Code Constants

```typescript
import { ErrorCodes } from '@/lib/errors/types';

// Usage examples
const validationError = ErrorCodes.VALIDATION_FAILED;
const userNotFound = ErrorCodes.USER_NOT_FOUND;
const neuralApiError = ErrorCodes.NEURAL_API_ERROR;
```

### 2. Field Validation Errors

```typescript
import { FieldValidationError } from '@/lib/errors/types';

// Create field validation errors
const fieldErrors: FieldValidationError[] = [
  {
    field: 'email',
    message: 'Invalid email format',
    code: ErrorCodes.INVALID_FORMAT,
    context: { received: 'not-an-email', expected: 'valid email address' }
  },
  {
    field: 'personalRecords.squat',
    message: 'Squat weight must be a positive number',
    code: ErrorCodes.INVALID_TYPE,
    context: { received: -100, expected: 'positive number' }
  }
];
```

### 3. API Error Responses

```typescript
import { ApiError, HTTP_STATUS_CODES } from '@/lib/errors/types';

// Create consistent API error responses
const apiError: ApiError = {
  error: 'Validation failed',
  message: 'The provided data contains validation errors',
  statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  code: ErrorCodes.VALIDATION_FAILED,
  timestamp: new Date().toISOString(),
  requestId: 'req_123456',
  details: fieldErrors,
  context: { userId: 'user_123', operation: 'createProgram' }
};
```

### 4. Service Results (Discriminated Unions)

```typescript
import { ServiceResult, createSuccessResult, createErrorResult } from '@/lib/errors/types';

// Service method with type-safe error handling
async function createProgram(data: ProgramData): Promise<ServiceResult<Program>> {
  try {
    // Validate input
    const validationResult = validateProgramData(data);
    if (!validationResult.success) {
      const error = new FieldValidationError(
        'Program data validation failed',
        validationResult.errors
      );
      return createErrorResult(error);
    }

    // Process the program
    const program = await processProgram(validationResult.data);
    return createSuccessResult(program);

  } catch (error) {
    return createErrorResult(error);
  }
}

// Usage with type-safe handling
const result = await createProgram(programData);
if (result.success) {
  // TypeScript knows result.data is Program
  console.log('Program created:', result.data.id);
} else {
  // TypeScript knows result.error is ApiError
  console.error('Failed to create program:', result.error.message);
  if (result.error.details) {
    // Handle validation errors
    result.error.details.forEach(fieldError => {
      console.error(`Field ${fieldError.field}: ${fieldError.message}`);
    });
  }
}
```

## API Route Implementation

### Standard Error Handling Pattern

```typescript
import { NextResponse } from 'next/server';
import { 
  ApiError, 
  ErrorCodes, 
  HTTP_STATUS_CODES,
  createValidationErrorsFromZod 
} from '@/lib/errors/types';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      const validationErrors = createValidationErrorsFromZod(validationResult.error);
      const apiError: ApiError = {
        error: 'Validation failed',
        message: 'The request data contains validation errors',
        statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
        code: ErrorCodes.VALIDATION_FAILED,
        timestamp: new Date().toISOString(),
        requestId,
        details: validationErrors
      };
      
      return NextResponse.json(apiError, { status: apiError.statusCode });
    }
    
    // Process request
    const result = await processRequest(validationResult.data);
    
    return NextResponse.json({
      data: result,
      message: 'Request processed successfully',
      timestamp: new Date().toISOString(),
      requestId
    });
    
  } catch (error) {
    // Handle unexpected errors
    const apiError: ApiError = {
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      code: ErrorCodes.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
      requestId,
      context: { 
        operation: 'POST /api/example',
        error: error instanceof Error ? error.message : String(error)
      }
    };
    
    return NextResponse.json(apiError, { status: apiError.statusCode });
  }
}
```

## Custom Error Classes

### Creating Application-Specific Errors

```typescript
import { 
  BaseApplicationError, 
  ErrorCodes, 
  HTTP_STATUS_CODES, 
  ErrorContext 
} from '@/lib/errors/types';

// Custom error for program generation
export class ProgramGenerationError extends BaseApplicationError {
  readonly statusCode = HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;

  constructor(
    message: string,
    public readonly programType: string,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, context, originalError);
  }

  get code() {
    return ErrorCodes.BUSINESS_RULE_VIOLATION;
  }

  protected getErrorCategory(): string {
    return 'Program generation failed';
  }
}

// Usage
try {
  await generateProgram(data);
} catch (error) {
  throw new ProgramGenerationError(
    'Unable to generate program with current parameters',
    'neural_program',
    { userId: 'user_123', operation: 'generateProgram' },
    error instanceof Error ? error : undefined
  );
}
```

### Using Existing Error Classes

```typescript
import { 
  NotFoundError,
  AuthenticationError,
  ExternalServiceError,
  DatabaseError 
} from '@/lib/errors/types';

// User not found
throw new NotFoundError('User', userId, { operation: 'getUserProfile' });

// Authentication required
throw new AuthenticationError('Session expired', { userId, operation: 'createProgram' });

// External service failure
throw new ExternalServiceError(
  'Neural API',
  'Service temporarily unavailable',
  { requestId, operation: 'generateProgram' }
);

// Database error
throw new DatabaseError(
  'Failed to save program',
  { userId, operation: 'saveProgram' },
  originalError
);
```

## Frontend Error Handling

### API Response Handling

```typescript
import { ApiError, FieldValidationError } from '@/lib/errors/types';

// Type-safe error handling in React components
const handleSubmit = async (data: FormData) => {
  try {
    const response = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      
      // Handle specific error types
      switch (errorData.code) {
        case ErrorCodes.VALIDATION_FAILED:
          // Show field-specific errors
          if (errorData.details) {
            errorData.details.forEach((fieldError: FieldValidationError) => {
              setFieldError(fieldError.field, fieldError.message);
            });
          }
          break;
          
        case ErrorCodes.UNAUTHORIZED:
          // Redirect to login
          router.push('/login');
          break;
          
        case ErrorCodes.NEURAL_API_ERROR:
          // Show service unavailable message
          showError('AI service temporarily unavailable. Please try again later.');
          break;
          
        default:
          // Generic error message
          showError(errorData.message);
      }
      return;
    }

    // Handle success
    const result = await response.json();
    showSuccess('Program created successfully');
    
  } catch (error) {
    // Network or parsing errors
    showError('Network error. Please check your connection and try again.');
  }
};
```

### Form Validation Error Display

```typescript
import { FieldValidationError, ErrorCodes } from '@/lib/errors/types';

// Convert API validation errors to form state
const processValidationErrors = (errors: FieldValidationError[]) => {
  const fieldErrors: Record<string, string> = {};
  
  errors.forEach(error => {
    // Map field paths to form field names
    const fieldMap: Record<string, string> = {
      'personalRecords.squat': 'squatPR',
      'personalRecords.bench': 'benchPR',
      'personalRecords.deadlift': 'deadliftPR'
    };
    
    const fieldName = fieldMap[error.field] || error.field;
    
    // Create user-friendly error messages
    let message = error.message;
    if (error.code === ErrorCodes.INVALID_TYPE) {
      message = `Please enter a valid ${fieldName}`;
    } else if (error.code === ErrorCodes.MISSING_REQUIRED_FIELD) {
      message = `${fieldName} is required`;
    }
    
    fieldErrors[fieldName] = message;
  });
  
  return fieldErrors;
};
```

## Migration from Existing Patterns

### Backward Compatibility

The new error system maintains full backward compatibility:

```typescript
// Existing ValidationError interface usage still works
import { ValidationError } from '@/lib/errors/types'; // Maps to FieldValidationError

// Existing error handling patterns are preserved
interface APIErrorResponse {
  error: string;
  message: string;
  details: ValidationError[] | null; // Still works
  timestamp: string;
  requestId?: string;
}
```

### Gradual Migration Strategy

1. **Phase 1**: Import new types alongside existing ones
2. **Phase 2**: Update new API routes to use standardized patterns
3. **Phase 3**: Migrate existing routes one at a time
4. **Phase 4**: Update frontend components to use new error handling
5. **Phase 5**: Remove deprecated patterns

### Migration Example

```typescript
// Before (existing pattern)
if (error instanceof ProgramGeneratorError) {
  switch (error.type) {
    case ProgramGeneratorErrorType.VALIDATION_ERROR:
      statusCode = 400;
      errorMessage = 'Validation failed';
      break;
    // ... other cases
  }
}

// After (standardized pattern)
if (error instanceof FieldValidationError) {
  const apiError = error.toApiError(requestId);
  return NextResponse.json(apiError, { status: apiError.statusCode });
}
```

## Best Practices

### 1. Always Use Type-Safe Error Handling

```typescript
// ✅ Good: Type-safe discriminated union
const result = await serviceMethod();
if (result.success) {
  // TypeScript knows result.data exists
  return result.data;
} else {
  // TypeScript knows result.error exists
  throw new Error(result.error.message);
}

// ❌ Bad: Throwing exceptions
try {
  return await serviceMethod();
} catch (error) {
  // No type safety
  throw error;
}
```

### 2. Use Specific Error Codes

```typescript
// ✅ Good: Specific error codes
throw new NotFoundError('Program', programId);

// ❌ Bad: Generic error codes
throw new Error('Program not found');
```

### 3. Include Context for Debugging

```typescript
// ✅ Good: Rich context
const context = {
  userId,
  operation: 'createProgram',
  requestId,
  programType: 'neural',
  duration: Date.now() - startTime
};

throw new ProgramGenerationError('Validation failed', 'neural', context);

// ❌ Bad: No context
throw new Error('Validation failed');
```

### 4. Use Error Type Guards

```typescript
import { isFieldValidationError, isNotFoundError } from '@/lib/errors/types';

// ✅ Good: Type-safe error handling
if (isFieldValidationError(error)) {
  // TypeScript knows error is FieldValidationError
  console.log('Validation errors:', error.validationErrors);
} else if (isNotFoundError(error)) {
  // TypeScript knows error is NotFoundError
  console.log('Resource not found');
}
```

### 5. Consistent Error Response Format

```typescript
// ✅ Good: Consistent API response
return NextResponse.json({
  error: 'Validation failed',
  message: 'The request contains invalid data',
  statusCode: 400,
  code: ErrorCodes.VALIDATION_FAILED,
  timestamp: new Date().toISOString(),
  requestId,
  details: validationErrors
}, { status: 400 });

// ❌ Bad: Inconsistent response
return NextResponse.json({
  success: false,
  msg: 'Bad data'
}, { status: 400 });
```

## Testing Error Handling

### Unit Tests

```typescript
import { 
  createErrorResult, 
  createSuccessResult, 
  FieldValidationError,
  ErrorCodes 
} from '@/lib/errors/types';

describe('Error handling', () => {
  it('should create success result', () => {
    const result = createSuccessResult({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should create error result', () => {
    const error = new FieldValidationError('Test error');
    const result = createErrorResult(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCodes.VALIDATION_FAILED);
    }
  });
});
```

### Integration Tests

```typescript
describe('API error responses', () => {
  it('should return structured validation errors', async () => {
    const response = await request(app)
      .post('/api/programs')
      .send({ invalidData: true })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Validation failed',
      statusCode: 400,
      code: ErrorCodes.VALIDATION_FAILED,
      details: expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          message: expect.any(String),
          code: expect.any(String)
        })
      ])
    });
  });
});
```

## Monitoring and Logging

### Error Tracking

```typescript
import { BaseApplicationError, ErrorContext } from '@/lib/errors/types';

// Enhanced error logging
const logError = (error: BaseApplicationError, additionalContext?: Record<string, any>) => {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    context: error.context,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  // Send to monitoring service
  logger.error('Application error occurred', logData);
  
  // Track error metrics
  trackErrorMetric(error.code, error.statusCode);
};
```

### Error Analytics

```typescript
// Track error patterns for monitoring
const trackErrorMetric = (errorCode: string, statusCode: number) => {
  analytics.track('error_occurred', {
    error_code: errorCode,
    status_code: statusCode,
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  });
};
```

## Conclusion

The standardized error handling system provides:

1. **Type Safety**: Discriminated unions prevent runtime errors
2. **Consistency**: Uniform error responses across all APIs
3. **Debugging**: Rich context and structured error details
4. **Backward Compatibility**: Seamless migration from existing patterns
5. **Extensibility**: Easy to add new error types and codes

Use this system consistently across all new development and gradually migrate existing code for a robust, maintainable error handling strategy.

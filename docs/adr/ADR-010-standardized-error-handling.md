# ADR-010: Standardized Error Handling System

## Status
Accepted

## Context
Our application previously exposed database schema issues and raw error messages to users through components like the "Fix Database" button in ProfilePictureUpload.tsx. This created several problems:

1. **Security Risk**: Raw database errors exposed internal system details to users
2. **Poor UX**: Technical error messages confused non-technical users
3. **Inconsistent Error Handling**: Different server actions returned different error formats
4. **Anti-pattern**: UI components were attempting to fix database schema issues

## Decision
We have implemented a comprehensive standardized error handling system with the following principles:

### 1. Remove User-Facing Database Fixes
- Eliminated the "Fix Database" button and related functionality from ProfilePictureUpload.tsx
- Components now assume proper database schema exists
- Database issues are handled server-side only

### 2. Standardized Error Response Format
All server actions now return consistent error responses:
```typescript
type StandardResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### 3. Comprehensive Try-Catch Blocks
- Every exported server action is wrapped in a top-level try-catch block
- Detailed errors are logged to console for developer debugging
- Generic, user-friendly error messages are returned to clients

### 4. Generic User-Facing Error Messages
Standard error messages include:
- "Authentication required. Please log in again."
- "An unexpected error occurred. Please try again."
- "Failed to load your data. Please try again later."
- "Unable to generate recommendations at this time. Please try again later."

### 5. Detailed Server-Side Logging
All server actions log comprehensive error information including:
- Full error objects with stack traces
- User context (anonymized user IDs)
- Function names and operation context
- Database error codes and messages (server-side only)

## Implementation Details

### Updated Components
- **ProfilePictureUpload.tsx**: Removed schema fix functionality, added robust error handling
- **All Server Actions**: Standardized error handling and response format

### Updated Server Actions
- `feedbackActions.ts`: Standardized all functions
- `onboardingActions.ts`: Standardized all functions  
- `stravaActions.ts`: Standardized all functions
- `workoutFeedbackActions.ts`: Standardized all functions
- `aiCoachActions.ts`: Standardized main function
- `aiProgramActions.ts`: Standardized key functions

### Error Handling Pattern
```typescript
export async function exampleServerAction(): Promise<StandardResponse<DataType>> {
  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error in exampleServerAction:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    // Business logic with detailed error logging
    const result = await performOperation()
    
    if (operationError) {
      console.error('Operation failed:', operationError)
      return { success: false, error: 'Failed to complete operation. Please try again.' }
    }

    return { success: true, data: result }
    
  } catch (error) {
    console.error('Unexpected error in exampleServerAction:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
```

## Consequences

### Positive
- **Enhanced Security**: No internal system details exposed to users
- **Improved UX**: Clear, actionable error messages for users
- **Better Debugging**: Comprehensive server-side error logging
- **Consistent API**: Standardized error response format across all actions
- **Maintainability**: Clear error handling patterns for future development

### Negative
- **Less Specific Errors**: Users receive generic messages instead of specific technical details
- **Debugging Complexity**: Developers must check server logs for detailed error information

### Neutral
- **Code Volume**: Slightly increased code due to comprehensive error handling
- **Development Overhead**: Developers must follow error handling patterns consistently

## Monitoring
- Server logs contain detailed error information for debugging
- Error patterns can be monitored through log aggregation
- User-facing error rates can be tracked through application metrics

## Related Decisions
- This builds upon our authentication and authorization patterns
- Complements our database schema management practices
- Supports our overall security and UX principles 
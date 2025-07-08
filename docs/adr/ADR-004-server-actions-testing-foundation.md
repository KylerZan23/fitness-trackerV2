# ADR-004: Server Actions Testing Foundation

## Status
Accepted

## Date
2024-01-10

## Context

The application's critical business logic in `src/app/_actions/` was completely untested, creating significant risk for regressions and making it difficult to refactor or enhance server actions with confidence. Server actions handle authentication, data fetching, and AI recommendations - core functionality that requires comprehensive testing.

## Problem

1. **Zero Test Coverage**: No tests existed for any server actions
2. **Complex Dependencies**: Server actions depend on Supabase clients, LLM services, and database functions
3. **Authentication Logic**: Complex authentication flows were untested
4. **Mock Challenges**: Proper mocking strategy needed for server-side dependencies
5. **TypeScript Integration**: Strong typing required for reliable test assertions

## Decision

We will establish a comprehensive testing foundation for server actions using Jest with proper mocking strategies.

### Testing Architecture

1. **Test Organization**
   - Create `src/__tests__/actions/` directory for server action tests
   - One test file per action file (e.g., `aiCoachActions.test.ts`)
   - Consistent naming convention and structure

2. **Mocking Strategy**
   - Mock all external dependencies at module level
   - Use typed mocks for better TypeScript integration
   - Create reusable mock factories for common objects
   - Type assertions (`as any`) for complex Supabase return types

3. **Test Patterns**
   - **Authentication Tests**: Verify proper handling of authenticated/unauthenticated users
   - **Error Handling Tests**: Test all error scenarios (DB failures, API failures, etc.)
   - **Success Path Tests**: Verify complete success scenarios
   - **Edge Cases**: Handle missing data gracefully

### Mock Dependencies

- `@/utils/supabase/server`: Supabase server client creation
- `@/lib/llmService`: LLM API calls
- `@/lib/db/*`: Database access functions
- `next/headers`: Cookie management

### Test Data Factories

Create standardized factory functions for:
- User objects
- User profiles
- Goals with progress
- Training programs
- AI coach recommendations
- Supabase client responses

## Implementation

### Phase 1: Foundation (Completed)
✅ Created `src/__tests__/actions/aiCoachActions.test.ts`
✅ Established mock patterns for all dependencies
✅ Implemented first authentication test case
✅ Created comprehensive mock data factories
✅ Verified test runs and catches real issues

### Test Results - Issues Found

The testing foundation immediately uncovered several issues in the production code:

1. **Authentication Error Messages**: Inconsistent error message format
2. **Missing Supabase Mock Chaining**: Database queries fail due to incomplete mock setup
3. **Error Handling Inconsistencies**: Different error message formats across scenarios

### Next Steps

1. **Fix Supabase Mock Chain**: Complete the mock implementation for chained database calls
2. **Standardize Error Messages**: Create consistent error response format
3. **Add More Test Coverage**: Extend tests to other server actions
4. **Integration with CI/CD**: Ensure tests run in continuous integration

## Benefits

1. **Risk Reduction**: Critical business logic is now tested
2. **Refactoring Confidence**: Changes can be made safely with test coverage
3. **Bug Detection**: Testing immediately found production issues
4. **Documentation**: Tests serve as living documentation of expected behavior
5. **Development Speed**: Faster iteration with immediate feedback

## Alternatives Considered

1. **Integration Tests Only**: Rejected due to complexity and slower feedback
2. **Manual Testing**: Rejected due to time cost and human error
3. **End-to-End Tests Only**: Rejected due to brittleness and slow execution

## Consequences

### Positive
- Immediate bug detection in production code
- Foundation for testing all server actions
- Improved code quality and maintainability
- Better error handling patterns established

### Negative  
- Additional TypeScript complexity with mocking
- Need to maintain mock implementations alongside real code
- Initial setup time investment

## Pattern for Future Server Action Tests

```typescript
// 1. Mock all dependencies at module level
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/llmService')

// 2. Create typed mock references
const mockCreateSupabaseServerClient = createClient as jest.MockedFunction<typeof createClient>

// 3. Use factory functions for test data
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  // ... other properties
})

// 4. Test authentication scenarios first
describe('actionName', () => {
  it('should return error if user not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    } as any)
    
    const result = await actionName()
    expect(result).toEqual({ error: 'User not authenticated.' })
  })
})
```

This foundation establishes the pattern and infrastructure for testing all server actions in the application. 
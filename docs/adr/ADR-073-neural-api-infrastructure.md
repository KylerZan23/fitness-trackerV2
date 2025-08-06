# ADR-073: Neural API Infrastructure

## Status
Accepted

## Context
Coach Neural requires a comprehensive API infrastructure to support program generation, progression, and management. The existing `/api/neural/generate-program` endpoint was functional but lacked the structure, validation, and features needed for a production-ready Neural coach system.

### Requirements
1. **Program Generation**: Streamlined endpoint for creating Neural-powered training programs
2. **Program Progression**: Week-to-week advancement logic based on performance data
3. **Program Management**: Full CRUD operations with proper authorization
4. **Program Sharing**: Ability to share programs between users with different permission levels
5. **Data Access Layer**: Consistent patterns following project conventions
6. **Type Safety**: Comprehensive validation and TypeScript integration
7. **Security**: Multi-level authorization and audit logging
8. **Scalability**: Design for future enhancements and rate limiting

## Decision

We implemented a complete Neural API infrastructure with the following architecture:

### 1. API Endpoints Structure

#### Neural Generation API
- **POST** `/api/neural/generate` - Program creation endpoint
- **GET** `/api/neural/generate` - Status and existing programs check
- Simplified interface compared to legacy generate-program
- Enhanced validation and error handling
- Conflict detection with regeneration support

#### Program Progression API
- **POST** `/api/neural/progress` - Week-to-week advancement
- Neural-powered progression analysis
- Performance data integration (fatigue, motivation, completion rate)
- Automatic load/volume adjustments based on strength progress
- Support for automatic, manual, and deload progression types

#### Program Management API
- **GET** `/api/programs` - List user programs with pagination
- **GET** `/api/programs/[id]` - Retrieve specific program
- **PUT** `/api/programs/[id]` - Update program
- **DELETE** `/api/programs/[id]` - Delete program
- **POST** `/api/programs/[id]/share` - Share program
- **GET** `/api/programs/[id]/share` - Get sharing info
- **DELETE** `/api/programs/[id]/share` - Unshare program

### 2. Data Access Layer
Created `src/lib/data/programs.ts` following established DAL patterns:
- `getProgramById()` - Retrieve with authorization
- `updateProgram()` - Update with ownership verification
- `getUserPrograms()` - List with filtering and pagination
- `deleteProgram()` - Delete with authorization
- `shareProgram()` / `unshareProgram()` - Sharing management
- Consistent error handling with `{ success, data?, error? }` pattern

### 3. Validation System
Comprehensive Zod schemas in `src/lib/validation/neuralApiSchemas.ts`:
- Request/response validation for all endpoints
- Query parameter validation with type coercion
- TypeScript type exports for client integration
- Standardized error response helpers

### 4. Security & Authorization
- **Authentication**: Supabase user session verification on all endpoints
- **Authorization**: Multi-level checks for resource ownership
- **Sharing Permissions**: View/copy permission levels
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Logging**: Complete request tracking with correlation IDs

### 5. Error Handling & Logging
- Standardized error responses with request IDs
- Comprehensive logging using project logger
- Performance tracking with request duration
- User-friendly error messages
- Stack trace logging for debugging

## Implementation Details

### Authentication Pattern
```typescript
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
}

if (user.id !== userId) {
  return NextResponse.json({ success: false, error: 'Forbidden: User ID mismatch' }, { status: 403 });
}
```

### Validation Pattern
```typescript
const validation = validateRequest(NeuralGenerateRequestSchema, body);
if (!validation.success) {
  return createValidationErrorResponse(validation.errors, requestId);
}
```

### DAL Integration
```typescript
const result = await getProgramById(programId, userId);
if (!result.success) {
  const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
  return NextResponse.json({ success: false, error: result.error }, { status: statusCode });
}
```

### Logging Pattern
```typescript
logger.info('Neural program generation requested', {
  operation: 'neuralGenerate',
  component: 'neuralAPI',
  requestId,
  userId,
  primaryFocus: onboardingData.primaryFocus
});
```

## Benefits

1. **Consistency**: All endpoints follow the same patterns for auth, validation, and error handling
2. **Type Safety**: Full TypeScript integration with exported types
3. **Security**: Multi-level authorization with comprehensive audit logging
4. **Scalability**: Clean architecture supports future enhancements
5. **Developer Experience**: Clear patterns and comprehensive documentation
6. **Maintainability**: Separation of concerns with DAL pattern
7. **Observability**: Complete request tracking and performance monitoring

## Future Considerations

1. **Rate Limiting**: API key-based rate limiting for external access
2. **Caching**: Response caching for expensive operations
3. **Webhook System**: Event notifications for program updates
4. **API Versioning**: Version management for backward compatibility
5. **Batch Operations**: Bulk program operations for efficiency
6. **Real-time Updates**: WebSocket integration for live program updates

## Files Created/Modified

- `src/app/api/neural/generate/route.ts` - Neural generation endpoint
- `src/app/api/neural/progress/route.ts` - Program progression endpoint
- `src/app/api/programs/route.ts` - Programs list endpoint
- `src/app/api/programs/[id]/route.ts` - Program CRUD operations
- `src/app/api/programs/[id]/share/route.ts` - Program sharing management
- `src/lib/data/programs.ts` - Data Access Layer functions
- `src/lib/validation/neuralApiSchemas.ts` - Validation schemas
- `docs/implementation_plans/neural-api-infrastructure.md` - Implementation plan
- `README.md` - Updated with API documentation

## Dependencies

- Existing Neural services (`neuralAPI`, `programGenerator`)
- Supabase authentication and database
- Zod validation library
- Project logging infrastructure
- TypeScript type system

This infrastructure provides a solid foundation for Coach Neural's API needs while maintaining consistency with existing project patterns and ensuring security, scalability, and maintainability.

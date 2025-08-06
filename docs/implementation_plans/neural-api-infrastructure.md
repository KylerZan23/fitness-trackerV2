# Neural API Infrastructure Implementation Plan

## Overview
Create comprehensive API infrastructure for Coach Neural with three key endpoints following Next.js 13+ App Router patterns and existing project conventions.

## Analysis of Existing Patterns

### Authentication Patterns
- **Supabase Auth**: `createClient()` from `@/utils/supabase/server` for user authentication
- **API Keys**: Existing system in `src/lib/auth/apiKeys.ts` with rate limiting and scope-based permissions
- **Authorization Checks**: Verify user owns resources and has appropriate permissions

### API Structure Patterns
- **Route Files**: `src/app/api/[...]/route.ts` format following App Router conventions
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Standardized error responses with NextResponse.json
- **Logging**: Comprehensive logging using `@/lib/logging` logger

### Data Access Layer
- **Pattern**: All database operations go through functions in `src/lib/data/`
- **Server Actions**: Delegate to DAL functions, never use Supabase client directly
- **Error Handling**: Consistent `{ success: boolean; data?: T; error?: string }` pattern

### Rate Limiting
- **Implementation**: Built into API key validation system
- **Headers**: X-RateLimit-* headers in responses
- **Middleware**: `withApiKeyAuth` function for API key endpoints

## Implementation Plan

### 1. Data Access Layer Functions (`src/lib/data/programs.ts`)
Create functions following project DAL patterns:
- `getProgramById(programId: string, userId: string)`
- `updateProgram(programId: string, userId: string, updates: Partial<TrainingProgram>)`
- `getUserPrograms(userId: string, limit?: number)`
- `deleteProgram(programId: string, userId: string)`

### 2. Validation Schemas (`src/lib/validation/neuralApiSchemas.ts`)
Create Zod schemas for:
- Neural generate request/response
- Program progression request/response  
- Program CRUD operations

### 3. API Endpoints

#### `/api/neural/generate/route.ts`
- **POST**: Generate new Neural program
- **Authentication**: Supabase user auth + user ID verification
- **Rate Limiting**: Consider implementing per-user rate limiting
- **Integration**: Use existing `programGenerator.createNewProgram()`
- **Validation**: Onboarding data validation

#### `/api/neural/progress/route.ts`
- **POST**: Progress existing program to next week
- **Authentication**: Supabase user auth
- **Logic**: Week-to-week advancement with performance data
- **Integration**: Use `programGenerator.progressProgram()` (extend if needed)

#### `/api/programs/[id]/route.ts`
- **GET**: Retrieve program by ID with authorization
- **PUT**: Update program with authorization
- **Authentication**: Supabase user auth + ownership verification
- **Authorization**: Ensure user owns the program
- **Sharing**: Implement program sharing capabilities

### 4. Error Handling & Logging
- Follow existing patterns from `src/app/api/neural/generate-program/route.ts`
- Use `logger` from `@/lib/logging` for comprehensive logging
- Standardized error responses with proper HTTP status codes
- Request ID tracking for debugging

### 5. Security Considerations
- User authentication on all endpoints
- Resource ownership verification
- Input validation and sanitization
- Rate limiting per user
- No sensitive data in logs

## Implementation Notes

### Confidence Level: 9/10
The existing codebase has excellent patterns and infrastructure. Implementation will follow established conventions closely.

### Assumptions
1. Existing `programGenerator` service supports progression (may need extension)
2. Database schema supports program sharing (may need migration)
3. Rate limiting per user is desired (vs. just API key based)

### Dependencies
- Existing Neural services and types
- Supabase database with programs table
- Current authentication system
- Logging infrastructure

## Next Steps
1. Implement DAL functions for program management
2. Create validation schemas
3. Implement the three API endpoints following existing patterns
4. Add comprehensive error handling and logging
5. Test endpoints for security and functionality

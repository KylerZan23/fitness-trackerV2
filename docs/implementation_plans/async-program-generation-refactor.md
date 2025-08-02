# Asynchronous Program Generation Refactor Implementation Plan

## Overview
Refactor the training program generation system from synchronous to asynchronous background processing based on ADR-050.

## Current State Analysis
- ✅ Database schema has required columns (`generation_status`, `generation_error`)
- ✅ Shared library exists (`runProgramGenerationPipeline`)
- ✅ Frontend has polling logic and async UI states
- ✅ Server action creates pending records
- ❌ Edge Function processes synchronously within HTTP request
- ❌ Edge Function doesn't use shared library properly

## Implementation Tasks

### 1. Fix Edge Function Architecture ⚠️ CRITICAL
**File**: `supabase/functions/generate-program/index.ts`
- **Issue**: Currently processes synchronously within HTTP request
- **Fix**: Return 202 immediately, process in background with setTimeout
- **Changes**:
  - Move generation logic to background async function
  - Return 202 Accepted immediately after validation
  - Use shared library `runProgramGenerationPipeline`
  - Add proper error handling for background process

### 2. Update Edge Function to Use Shared Library
**Files**: 
- `supabase/functions/generate-program/index.ts`
- Create `supabase/functions/generate-program/deps.ts` for shared imports
- **Issue**: Edge Function has duplicated logic
- **Fix**: Import and use `runProgramGenerationPipeline`
- **Challenges**: Edge Functions can't use TypeScript path aliases
- **Solution**: Create dependency injection pattern

### 3. Enhance Error Handling
- Ensure all error states update database correctly
- Add timeout handling for long-running processes
- Implement retry logic for failed generations

### 4. Frontend Notification System
**File**: `src/app/program/page.tsx`
- ✅ Already has polling logic
- Add success notification when generation completes
- Improve error handling and retry mechanisms

### 5. Testing Strategy
- Test async flow end-to-end
- Test error scenarios (timeouts, failures)
- Test concurrent generation prevention
- Verify database state consistency

## Technical Challenges

### Challenge 1: Edge Function Import Limitations
Edge Functions can't use TypeScript path aliases (`@/...`), so we can't directly import the shared library.

**Solution**: Create a hybrid approach:
1. Extract core logic into dependency-free functions
2. Create Edge Function-compatible version
3. Maintain shared interfaces and types

### Challenge 2: Background Processing in Edge Functions
Deno/Edge Functions need careful handling of background processes.

**Solution**: Use proper async patterns with setTimeout for background execution.

## Success Criteria
1. ✅ User triggers generation → immediate response (< 1 second)
2. ✅ UI shows "generating" state with polling
3. ✅ Background processing completes successfully
4. ✅ User receives notification when ready
5. ✅ Error states handled gracefully with retry options
6. ✅ Multiple concurrent generations prevented
7. ✅ Database state remains consistent

## Risk Mitigation
- Keep existing synchronous path as fallback initially
- Implement comprehensive error handling
- Add logging for debugging background processes
- Test thoroughly before removing old code
# ADR-031: Remove Sentry Integration

## Status
Implemented

## Context
The application had incomplete Sentry error tracking integration that was causing build failures. The main issue was in `src/instrumentation.ts` which was importing non-existent Sentry configuration files (`../sentry.server.config` and `../sentry.edge.config`), causing the development server to fail to start.

Additionally, the Sentry integration was not fully configured and was causing:
- Module not found errors during build
- Incomplete error tracking setup
- Unnecessary complexity for the current development phase

## Decision
Remove all Sentry-related code and configuration from the NeuralLift application to resolve build errors and simplify the error handling architecture.

### Removed Components
1. **Instrumentation Files**:
   - `src/instrumentation.ts` - Main cause of build failure
   - `src/instrumentation-client.ts` - Client-side Sentry setup

2. **Test/Example Files**:
   - `src/app/sentry-example-page/page.tsx` - Sentry testing page
   - `src/app/api/sentry-example-api/route.ts` - Sentry testing API

3. **Error Handling Integration**:
   - Removed Sentry imports and calls from `src/app/global-error.tsx`
   - Removed Sentry integration from `src/pages/_error.tsx`
   - Cleaned up `src/components/ErrorBoundary.tsx` to remove Sentry dependencies

4. **Configuration**:
   - Removed Sentry environment variables from `src/lib/env/schemas.ts`

## Implementation Details

### Error Handling Strategy
Replaced Sentry error tracking with:
- **Console logging** for development debugging
- **Structured logging** via existing `@/lib/logging` system
- **Simplified error boundaries** without external dependencies
- **Basic error reporting** for user-facing errors

### Files Modified
- ✅ `src/app/global-error.tsx` - Simplified to use console.error
- ✅ `src/pages/_error.tsx` - Added proper TypeScript types, removed Sentry
- ✅ `src/components/ErrorBoundary.tsx` - Streamlined error boundary without Sentry integration
- ✅ `src/lib/env/schemas.ts` - Removed Sentry environment variables
- ✅ `next.config.js` - **CRITICAL FIX**: Removed `withSentryConfig` wrapper causing warnings
- ✅ `.gitignore` - Removed Sentry config file references

### Files Removed
- ✅ `src/instrumentation.ts`
- ✅ `src/instrumentation-client.ts`  
- ✅ `src/app/sentry-example-page/page.tsx`
- ✅ `src/app/api/sentry-example-api/route.ts`
- ✅ `docs/OBSERVABILITY-SETUP.md` - Removed outdated Sentry documentation

### Package Management
- ✅ **Complete dependency cleanup**: Removed `node_modules` and `yarn.lock`
- ✅ **Fresh install**: Regenerated dependencies without any Sentry packages
- ✅ **Warning eliminated**: No more "Could not find Next.js instrumentation file" messages

## Consequences

### Positive
- **Build Success**: Development server now starts without module resolution errors
- **Simplified Architecture**: Reduced external dependencies and complexity
- **Faster Development**: No Sentry configuration overhead during development
- **Clean Error Handling**: Streamlined error boundaries focused on user experience

### Trade-offs
- **No Error Tracking**: Lost centralized error monitoring capabilities
- **Reduced Observability**: No automatic error reporting to external service
- **Manual Debugging**: Reliance on console logs and manual error investigation

### Future Considerations
- **Re-evaluate for Production**: May want to add proper error tracking before production deployment
- **Alternative Solutions**: Consider simpler error tracking solutions (LogRocket, Rollbar, etc.)
- **Gradual Implementation**: Can be added back with proper configuration when needed

## Monitoring and Validation

### Success Criteria
- ✅ Development server starts without errors
- ✅ Application loads successfully at localhost:3000
- ✅ Error boundaries still function correctly
- ✅ No broken imports or missing dependencies

### Post-Implementation
- Build process completes successfully
- All error handling components work without Sentry dependencies
- Application maintains proper error user experience
- Development workflow is unblocked

## Related ADRs
- ADR-030: NeuralLift Rebranding - This cleanup supports the clean application state
- Future ADR: Error Monitoring Strategy - When implementing production error tracking

## Date
January 2025 
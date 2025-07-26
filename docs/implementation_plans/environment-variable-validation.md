# Environment Variable Management & Validation Implementation Plan

## Overview

Implement robust environment variable management using Zod validation to prevent runtime configuration issues and ensure application reliability across all environments.

## Current State Analysis

### Identified Environment Variables

Based on codebase analysis, the following environment variables are currently used:

**Required (Core Application):**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `LLM_API_KEY` - OpenAI/LLM service API key

**Optional (Extended Features):**

- `LLM_API_ENDPOINT` - Custom LLM endpoint (defaults to OpenAI)
- `NEXT_PUBLIC_STRAVA_CLIENT_ID` - Strava integration client ID
- `STRAVA_CLIENT_SECRET` - Strava integration client secret
- `NEXT_PUBLIC_STRAVA_REDIRECT_URI` - Strava OAuth redirect URI

**System/Runtime:**

- `NODE_ENV` - Environment (development/production/test)
- `CI` - CI environment indicator

### Current Issues

1. **No Runtime Validation**: App can start with missing/invalid environment variables
2. **Inconsistent Error Handling**: Some files throw errors, others fail silently
3. **No Type Safety**: Environment variables are not typed
4. **Scattered Validation**: Ad-hoc validation in multiple files
5. **Insecure Defaults**: Some variables use non-null assertion operators without validation

## Implementation Strategy

### Phase 1: Zod Schema Definition

Create comprehensive schemas for all environments with proper validation rules.

### Phase 2: Runtime Validation System

Implement startup validation that prevents application launch with invalid configuration.

### Phase 3: Type-Safe Environment Utilities

Create utilities that provide type-safe access to validated environment variables.

### Phase 4: Codebase Integration

Update all existing code to use the validated environment system.

### Phase 5: Development Workflow

Integrate validation with development tools and CI/CD pipeline.

## Technical Implementation

### 1. Environment Schema Design

```typescript
// Core application requirements
const BaseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100), // Anon keys are typically long
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100).optional(), // Only needed server-side

  // AI/LLM Configuration (Required for AI features)
  LLM_API_KEY: z.string().min(20),
  LLM_API_ENDPOINT: z.string().url().default('https://api.openai.com/v1/chat/completions'),

  // Strava Integration (Optional)
  NEXT_PUBLIC_STRAVA_CLIENT_ID: z.string().optional(),
  STRAVA_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRAVA_REDIRECT_URI: z.string().url().optional(),

  // CI/Testing
  CI: z
    .string()
    .optional()
    .transform(val => val === 'true'),
})

// Environment-specific schemas
const DevelopmentSchema = BaseEnvironmentSchema
const ProductionSchema = BaseEnvironmentSchema.required({
  SUPABASE_SERVICE_ROLE_KEY: true,
})
const TestSchema = BaseEnvironmentSchema.partial({
  LLM_API_KEY: true, // Optional in tests
})
```

### 2. Runtime Validation Architecture

```typescript
// Validation occurs at:
1. Application startup (Next.js startup)
2. Server action initialization
3. API route handling
4. Middleware execution

// Failure modes:
- Development: Warning + detailed error message
- Production: Fail fast with secure error message
- Test: Allow missing non-critical variables
```

### 3. Type Safety Implementation

```typescript
// Generate TypeScript types from Zod schemas
type Environment = z.infer<typeof BaseEnvironmentSchema>

// Provide typed access
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Environment {}
  }
}
```

### 4. Validation Levels

**Level 1: Critical (App won't start)**

- Supabase URL and keys
- Basic configuration

**Level 2: Feature-specific (Graceful degradation)**

- LLM API key (AI features disabled)
- Strava credentials (Integration disabled)

**Level 3: Optional (Default values)**

- Custom endpoints
- Debug flags

## Security Considerations

### Secret Management Best Practices

1. **Environment Separation**: Different secrets per environment
2. **Secure Storage**: Use Vercel Environment Variables or similar
3. **No Git Commits**: Never commit production secrets
4. **Rotation**: Regular secret rotation procedures
5. **Minimal Exposure**: Limit access to necessary secrets only

### Validation Security

1. **Error Messages**: Avoid exposing secret values in error messages
2. **Logging**: Sanitize logs to prevent secret leakage
3. **Client-side**: Validate public environment variables only
4. **Server-side**: Full validation including private keys

## File Structure

```
src/
├── lib/
│   ├── env/
│   │   ├── index.ts              # Main exports
│   │   ├── schemas.ts            # Zod schemas
│   │   ├── validation.ts         # Runtime validation
│   │   ├── client.ts             # Client-side env access
│   │   ├── server.ts             # Server-side env access
│   │   └── types.ts              # TypeScript definitions
│   └── ...
scripts/
├── validate-env.ts               # Standalone validation script
└── setup-env.ts                 # Development environment setup
```

## Development Workflow Integration

### 1. Development Setup

```bash
# Validate environment on startup
yarn dev:validate  # Check environment before starting dev server
yarn dev          # Start with automatic validation
```

### 2. CI/CD Integration

```yaml
# Add to CI pipeline
- name: Validate Environment Variables
  run: yarn validate:env
```

### 3. Pre-commit Hooks

```bash
# Validate environment before commits
husky add .husky/pre-commit "yarn validate:env:development"
```

## Error Handling Strategy

### Development Environment

```typescript
// Detailed error messages with suggestions
"❌ LLM_API_KEY is missing or invalid

  Required for AI program generation features.

  Setup instructions:
  1. Get API key from https://platform.openai.com/api-keys
  2. Add to .env.local: LLM_API_KEY=sk-your-key-here
  3. Restart development server

  Current value: undefined"
```

### Production Environment

```typescript
// Secure error messages
'Environment configuration error. Please check deployment settings.'
```

### Test Environment

```typescript
// Allow missing optional variables with warnings
'⚠️ LLM_API_KEY not set - AI features will be mocked in tests'
```

## Gradual Migration Strategy

### Phase 1: Add Validation (Non-breaking)

- Create validation system alongside existing code
- Add warnings for invalid configurations
- No changes to existing functionality

### Phase 2: Update Core Files (Low risk)

- Update `src/lib/supabase.ts`
- Update `src/middleware.ts`
- Update API routes

### Phase 3: Update Application Code (Medium risk)

- Update server actions
- Update utilities
- Remove ad-hoc validation

### Phase 4: Enforce Validation (High impact)

- Make validation mandatory
- Remove fallback handling
- Clean up deprecated code

## Success Metrics

### Reliability Metrics

- Zero startup failures due to misconfiguration
- 100% of environment variables validated
- Clear error messages for all configuration issues

### Developer Experience Metrics

- < 30 seconds to identify environment issues
- Self-service environment setup
- Comprehensive documentation coverage

### Security Metrics

- No secrets exposed in error messages
- All environments properly isolated
- Audit trail for environment changes

## Testing Strategy

### Unit Tests

- Schema validation edge cases
- Error message generation
- Type safety verification

### Integration Tests

- End-to-end environment loading
- CI/CD pipeline validation
- Multiple environment configurations

### Security Tests

- Secret exposure prevention
- Error message sanitization
- Environment isolation verification

## Documentation Deliverables

1. **Developer Setup Guide**: Step-by-step environment configuration
2. **Deployment Guide**: Production environment setup
3. **Troubleshooting Guide**: Common issues and solutions
4. **Security Guide**: Best practices for secret management
5. **Migration Guide**: Updating existing deployments

## Risk Mitigation

### Configuration Risks

- **Startup Failures**: Comprehensive validation with clear error messages
- **Feature Degradation**: Graceful fallbacks for optional features
- **Security Exposure**: Sanitized logging and error handling

### Migration Risks

- **Breaking Changes**: Gradual rollout with backward compatibility
- **Production Issues**: Staging validation before production deployment
- **Team Confusion**: Comprehensive documentation and training

## Timeline

- **Week 1**: Schema design and validation system
- **Week 2**: Runtime integration and type safety
- **Week 3**: Codebase migration and testing
- **Week 4**: Documentation and CI/CD integration

## Future Enhancements

1. **Dynamic Configuration**: Runtime environment variable updates
2. **Configuration UI**: Admin interface for environment management
3. **Monitoring**: Environment configuration drift detection
4. **Automation**: Automated secret rotation and management

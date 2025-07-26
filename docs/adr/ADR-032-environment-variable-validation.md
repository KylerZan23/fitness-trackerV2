# ADR-032: Environment Variable Management & Validation

## Status

Accepted

## Context

NeuralLift's codebase had several issues with environment variable management:

1. **No Runtime Validation**: Application could start with missing/invalid environment variables, leading to runtime failures
2. **Inconsistent Error Handling**: Ad-hoc validation scattered across multiple files with inconsistent error messages
3. **No Type Safety**: Environment variables accessed as untyped `process.env` with non-null assertions
4. **Security Risks**: No separation between client-safe and server-only variables
5. **Poor Developer Experience**: Difficult to diagnose configuration issues and set up development environment

These issues posed significant risks for application reliability, security, and developer productivity.

## Decision

Implement a comprehensive environment variable management system using Zod validation with the following components:

### Runtime Validation System

- **Zod Schemas**: Type-safe validation schemas for all environment variables
- **Environment-Specific Validation**: Different requirements for development/production/test
- **Startup Validation**: Application refuses to start with invalid configuration
- **Detailed Error Messages**: User-friendly error messages with setup instructions

### Type-Safe Access Layer

- **Client-Side Utilities**: Safe access to public environment variables only
- **Server-Side Utilities**: Full access to all validated environment variables
- **Feature Detection**: Runtime checking of optional feature availability
- **Configuration Objects**: Structured configuration objects for services

### Developer Experience

- **Validation Scripts**: Standalone scripts to check environment configuration
- **Package.json Integration**: New yarn scripts for environment validation
- **Comprehensive Documentation**: Setup guides and troubleshooting information
- **CI/CD Integration**: Automated validation in build pipelines

## Technical Implementation

### File Structure

```
src/lib/env/
├── index.ts              # Main exports and utilities
├── schemas.ts            # Zod validation schemas
├── validation.ts         # Runtime validation logic
├── client.ts             # Client-side environment access
├── server.ts             # Server-side environment access
└── types.ts              # TypeScript type definitions
```

### Environment Schemas

```typescript
// Environment-specific schemas with appropriate validation
const DevelopmentEnvironmentSchema = BaseEnvironmentSchema.extend({
  LLM_API_KEY: z.string().optional(), // Optional in development
})

const ProductionEnvironmentSchema = BaseEnvironmentSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100), // Required in production
  NODE_ENV: z.literal('production'),
})
```

### Validation Features

- **Format Validation**: URL format, API key format, JWT token validation
- **Environment-Specific Requirements**: Different validation rules per environment
- **Graceful Degradation**: Optional features disable gracefully when not configured
- **Security Validation**: Separate client-safe vs server-only variable validation

### Error Handling Strategy

```typescript
// Development: Detailed error messages with setup instructions
"❌ LLM_API_KEY is missing or invalid
  Required for AI program generation features.
  Setup: Get API key from https://platform.openai.com/api-keys"

// Production: Secure error messages
"Environment configuration error. Please check deployment settings."
```

## Migration Strategy

### Phase 1: Non-Breaking Implementation

- ✅ Created validation system alongside existing code
- ✅ Added validation utilities without changing existing functionality
- ✅ Provided warnings for invalid configurations without breaking the app

### Phase 2: Core Integration

- ✅ Updated core Supabase clients (`src/lib/supabase.ts`, `src/utils/supabase/server.ts`)
- ✅ Updated middleware for validated environment access
- ✅ Updated LLM service to use validated configuration

### Phase 3: Tooling Integration

- ✅ Added validation scripts to package.json
- ✅ Integrated validation into CI/CD pipeline
- ✅ Created comprehensive documentation

### Phase 4: Full Enforcement (Future)

- Migrate remaining files to use validated environment access
- Remove legacy ad-hoc validation
- Enforce validation in all environments

## Benefits

### Reliability

- **Zero Configuration Failures**: Application won't start with broken configuration
- **Early Error Detection**: Configuration issues discovered at startup, not runtime
- **Consistent Validation**: Single source of truth for environment requirements

### Security

- **Client/Server Separation**: Clear distinction between public and private variables
- **Secret Protection**: Server-only variables never exposed on client-side
- **Sanitized Logging**: Secret values never logged or exposed in error messages

### Developer Experience

- **Self-Service Setup**: Developers can diagnose and fix configuration issues independently
- **Fast Feedback**: Immediate validation feedback with actionable error messages
- **Type Safety**: Full TypeScript support for environment variable access

### Operations

- **CI/CD Integration**: Automated validation prevents deployment of misconfigured applications
- **Environment Health**: Real-time monitoring of configuration completeness
- **Documentation**: Comprehensive setup and troubleshooting guides

## Consequences

### Positive

- **Improved Reliability**: Eliminates entire class of runtime configuration errors
- **Enhanced Security**: Proper separation of client and server-side environment variables
- **Better Developer Experience**: Clear error messages and self-service configuration
- **Operational Confidence**: Validated deployments with health monitoring

### Negative

- **Initial Setup Complexity**: Developers must configure environment variables correctly
- **Breaking Changes**: Future migration may require updates to existing code
- **Validation Overhead**: Slight startup cost for environment validation

### Risk Mitigation

- **Comprehensive Documentation**: Detailed setup guides reduce configuration complexity
- **Gradual Migration**: Non-breaking implementation allows incremental adoption
- **Validation Caching**: Runtime validation cached after initial check

## Required Changes

### New Package Scripts

```json
{
  "validate:env": "tsx scripts/validate-env.ts",
  "validate:env:development": "NODE_ENV=development yarn validate:env",
  "validate:env:production": "NODE_ENV=production yarn validate:env",
  "dev:validate": "yarn validate:env && yarn dev"
}
```

### CI/CD Integration

```yaml
- name: Validate Environment Variables
  run: yarn validate:env
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING }}
    # ... other environment variables
```

### Required GitHub Secrets

- Staging environment variables (13 secrets)
- Production environment variables (13 secrets)
- Optional feature-specific variables

## Success Metrics

### Reliability Metrics

- Zero startup failures due to misconfiguration
- 100% of environment variables validated before use
- Elimination of runtime configuration errors

### Developer Experience Metrics

- < 30 seconds to identify and resolve configuration issues
- Self-service environment setup for new developers
- Reduced support requests for configuration problems

### Security Metrics

- No client-side exposure of server-only secrets
- All environment access properly validated
- Comprehensive audit trail for configuration changes

## Future Enhancements

### Immediate (Next Sprint)

- Complete migration of remaining files to validated environment access
- Add environment variable health checks to monitoring dashboard
- Implement automatic secret rotation procedures

### Medium Term

- Environment variable management UI for easier configuration
- Automated testing of different environment configurations
- Integration with external secret management services

### Long Term

- Dynamic environment variable updates without restart
- Configuration drift detection and alerting
- Automated environment provisioning for new deployments

## Validation

### Unit Tests

- ✅ Schema validation with edge cases
- ✅ Error message generation and formatting
- ✅ Feature availability checking

### Integration Tests

- Environment validation in different scenarios
- CI/CD pipeline validation
- End-to-end configuration testing

### Security Testing

- Client/server variable separation verification
- Secret exposure prevention testing
- Error message sanitization validation

## Documentation

### Developer Guides

- ✅ **Environment Setup Guide**: Complete configuration instructions
- ✅ **Troubleshooting Guide**: Common issues and solutions
- ✅ **API Documentation**: Type-safe environment access patterns

### Operational Guides

- **Deployment Guide**: Production environment configuration
- **Security Guide**: Best practices for secret management
- **Migration Guide**: Updating existing deployments

## Date

2025-01-19

## Participants

- Development Team
- DevOps Team
- Security Team

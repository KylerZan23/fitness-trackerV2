# ADR-072: Trainer API Endpoint System

## Status
Accepted

## Context
We need to provide external access to our AI program generation capabilities for fitness professionals, trainers, and integrated applications. This requires a secure, scalable API system that can authenticate users, enforce rate limits, and provide programmatic access to our core training program generation engine.

### Requirements
1. **Secure Authentication**: API key-based authentication separate from user sessions
2. **Rate Limiting**: Configurable per-key rate limits to prevent abuse
3. **Program Generation**: Leverage existing AI program generation engine
4. **Scalability**: Support multiple concurrent requests
5. **Documentation**: Comprehensive API documentation for developers
6. **Monitoring**: Usage tracking and analytics
7. **Admin Management**: Tools for creating and managing API keys

## Decision

We will implement a new `/api/v1/trainer/generate-program` endpoint with the following architecture:

### 1. API Key Authentication System
- **Database Schema**: New `api_keys` and `api_key_usage` tables
- **Key Format**: `neurallift_sk_[64_character_hex]` format for security
- **Scope-based Permissions**: Granular permissions (`program:generate`, `program:read`, etc.)
- **Secure Storage**: SHA-256 hashed keys in database, plain keys only returned once

### 2. Rate Limiting
- **Two-tier Limits**: Hourly and daily rate limits per API key
- **Configurable**: Custom limits per key based on subscription/agreement
- **Headers**: Standard rate limit headers in responses
- **Cleanup**: Automatic cleanup of old usage records (30-day retention)

### 3. API Endpoint Structure
```
/api/v1/trainer/generate-program
├── POST   - Generate program (requires program:generate scope)
├── GET    - API documentation
├── OPTIONS - CORS preflight
└── Other methods return 405
```

### 4. Request/Response Validation
- **Zod Schemas**: Runtime validation of all inputs and outputs
- **Error Handling**: Standardized error response format
- **Type Safety**: Full TypeScript support with inferred types

### 5. Integration with Existing System
- **Reuse Core Engine**: Leverage existing `callEnhancedLLMAPI` and `processEnhancedUserData`
- **Data Transformation**: Convert API format to internal `OnboardingData` format
- **Validation**: Use existing `ENHANCED_PROGRAM_VALIDATION` schema

## Implementation Details

### Database Schema
```sql
-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '["program:generate"]'::jsonb,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  -- ... other fields
);

-- Usage tracking table
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  endpoint TEXT NOT NULL,
  response_status INTEGER,
  -- ... other fields
);
```

### API Key Lifecycle
1. **Creation**: Admin creates key with specific scopes and limits
2. **Distribution**: Key shared securely with client (only shown once)
3. **Usage**: Client includes key in `Authorization` or `X-API-Key` headers
4. **Validation**: Middleware validates key, checks scopes, enforces rate limits
5. **Deactivation**: Admin can deactivate keys immediately

### Security Measures
- **Key Hashing**: SHA-256 hashing for secure storage
- **HTTPS Only**: All API communications over TLS
- **Scope Enforcement**: Fine-grained permission checking
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Audit Logging**: Track all API key operations
- **CORS Support**: Controlled cross-origin access

### Error Handling
Standardized error response format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional context
  },
  "meta": {
    "request_id": "req_uuid",
    "timestamp": "ISO_8601_timestamp"
  }
}
```

## Alternatives Considered

### 1. Session-based Authentication
**Rejected**: Would require trainers to have user accounts and manage sessions, adding complexity for API consumers.

### 2. JWT-based Authentication
**Rejected**: More complex to implement and manage, especially for revocation. API keys are simpler and more appropriate for server-to-server communication.

### 3. OAuth 2.0
**Rejected**: Overkill for this use case. OAuth is designed for user authorization scenarios, while we need simple machine-to-machine authentication.

### 4. Shared Secret Authentication
**Rejected**: Less secure and harder to manage multiple clients with different access levels.

## Consequences

### Positive
- **Developer Experience**: Simple API key authentication is familiar to developers
- **Security**: Separate authentication system isolates API access from user sessions
- **Scalability**: Rate limiting prevents abuse and ensures fair resource usage
- **Flexibility**: Scope-based permissions allow granular access control
- **Monitoring**: Usage tracking enables analytics and billing
- **Documentation**: Comprehensive docs improve adoption

### Negative
- **Additional Complexity**: New authentication system to maintain
- **Storage Overhead**: Usage tracking creates significant data volume
- **Rate Limit Management**: Need admin tools to adjust limits based on usage patterns
- **Key Management**: Secure distribution and rotation of API keys

### Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API key leakage | High | Short key prefixes for identification, immediate deactivation capability |
| Rate limit bypass | Medium | Multiple validation layers, IP-based backup limits |
| Database growth from usage logs | Medium | Automatic cleanup of old records, efficient indexing |
| Performance impact | Medium | Caching of key validation, optimized database queries |

## Implementation Plan

### Phase 1: Foundation (Week 1)
- ✅ Database schema and migrations
- ✅ Core API key utilities (generation, validation, hashing)
- ✅ Authentication middleware
- ✅ Request/response validation schemas

### Phase 2: API Endpoint (Week 1)
- ✅ Main `/api/v1/trainer/generate-program` endpoint
- ✅ Integration with existing program generation engine
- ✅ Error handling and CORS support
- ✅ Environment variable validation

### Phase 3: Management Tools (Week 2)
- ⏳ Admin interface for API key management
- ⏳ CLI tools for key creation and management
- ⏳ Usage analytics dashboard
- ⏳ Audit logging system

### Phase 4: Documentation and Testing (Week 2)
- ✅ Comprehensive API documentation
- ⏳ Integration tests for API endpoints
- ⏳ Performance testing and optimization
- ⏳ Security audit and penetration testing

### Phase 5: Deployment and Monitoring (Week 3)
- ⏳ Production deployment with feature flags
- ⏳ Monitoring and alerting setup
- ⏳ Load testing with real-world scenarios
- ⏳ Documentation for internal team

## Success Metrics

1. **API Adoption**: Number of active API keys and requests per day
2. **Performance**: Average response time < 5 seconds for program generation
3. **Reliability**: 99.9% uptime for API endpoints
4. **Security**: Zero security incidents related to API key compromise
5. **Developer Experience**: Positive feedback from early API consumers

## Future Considerations

1. **Additional Endpoints**: Extend API with more functionality (user management, progress tracking)
2. **Webhooks**: Event-driven notifications for program completion
3. **SDK Development**: Official client libraries for popular languages
4. **Enterprise Features**: Advanced analytics, custom rate limits, dedicated support
5. **API Versioning**: Structured approach to API evolution and backwards compatibility

## References

- [API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [REST API Authentication Methods](https://blog.restcase.com/restful-api-authentication-basics/)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Date**: January 28, 2024  
**Author**: AI Assistant  
**Reviewers**: TBD  
**Status**: Implemented (Phase 1-2 Complete)
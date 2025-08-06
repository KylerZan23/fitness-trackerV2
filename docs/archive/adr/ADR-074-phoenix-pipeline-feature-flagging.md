# ADR-074: Phoenix Pipeline Feature Flagging System

## Status

Accepted

## Context

NeuralLift is implementing a new Phoenix generation pipeline to replace the existing legacy program generation system. This new pipeline includes:

- Enhanced validation with Guardian layer
- Improved Phoenix schema support  
- Better error handling and monitoring
- More sophisticated program generation logic

However, deploying this system directly to all users poses significant risks:

1. **Unknown Performance Impact**: The new pipeline may have different performance characteristics
2. **Validation Logic Changes**: New validation rules might affect existing user flows
3. **Potential Bugs**: New code paths could introduce unforeseen issues
4. **Rollback Complexity**: If issues arise, rolling back would require code deployment

We need a safe, controlled way to gradually migrate users from the legacy system to the Phoenix pipeline with the ability to quickly rollback if problems occur.

## Decision

Implement a comprehensive database-driven feature flagging system with the following capabilities:

### Core Feature Flag System

1. **Database Storage**: Store feature flag configurations in Supabase with full audit trail
2. **Hierarchical Resolution**: User overrides > Admin overrides > Percentage rollout > Global setting
3. **Percentage Rollout**: Consistent hash-based percentage distribution for gradual rollouts
4. **Caching**: In-memory caching with TTL to reduce database load
5. **Admin Interface**: Web-based admin panel for real-time flag management

### Dual Pipeline Architecture

1. **Routing Logic**: Feature flag determines which pipeline to use for each user
2. **Graceful Fallback**: Phoenix pipeline failures automatically fallback to legacy system
3. **Consistent Interface**: Both pipelines use the same `ProgramGenerationResult` interface
4. **Monitoring**: Separate tracking for each pipeline's success/failure rates

### Rollout Strategy

1. **Internal Testing (0.1%)**: Start with core team members
2. **Limited Beta (5%)**: Expand to selected beta users  
3. **Gradual Expansion (25%, 50%)**: Increase based on success metrics
4. **Full Rollout (100%)**: Complete migration after validation

### Safety Measures

1. **Emergency Rollback**: One-click disable for all users
2. **User-Specific Rollback**: Individual user override capability
3. **Fail-Safe Defaults**: Unknown flags default to disabled
4. **Error Handling**: Database errors default to legacy pipeline

## Technical Implementation

### Database Schema

```sql
-- Feature flag configurations
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  admin_override_enabled BOOLEAN DEFAULT NULL,
  admin_override_disabled BOOLEAN DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific overrides
CREATE TABLE user_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flag_name)
);
```

### Service Layer

```typescript
// Core service functions
export async function isFeatureEnabled(userId: string, flagName: string): Promise<boolean>
export async function getFeatureFlagStatus(userId: string, flagName: string): Promise<FeatureFlagStatus>
export async function updateFeatureFlagConfig(flagName: string, updates: object): Promise<Result>
export async function emergencyRollback(flagName: string, reason: string): Promise<Result>
```

### Server Action Integration

```typescript
export async function generateTrainingProgram(userId: string, onboardingData: any): Promise<ProgramGenerationResult> {
  const phoenixEnabled = await isFeatureEnabled(userId, FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED);
  
  if (phoenixEnabled) {
    return await generateWithPhoenixPipeline(userId, onboardingData);
  } else {
    return await generateWithLegacyPipeline(userId, onboardingData);
  }
}
```

### Admin Interface

- **Real-time Flag Management**: Update rollout percentages, admin overrides
- **User Override Management**: Add/remove user-specific overrides
- **Emergency Controls**: One-click rollback with reason tracking
- **Analytics Dashboard**: Usage statistics and performance metrics

## Benefits

1. **Risk Mitigation**: Gradual rollout minimizes blast radius of potential issues
2. **Quick Recovery**: Instant rollback capability without code deployment
3. **Data-Driven Decisions**: Real-time metrics guide rollout decisions
4. **User Experience**: Seamless transition for users between systems
5. **Operational Control**: Fine-grained control over feature availability
6. **Audit Trail**: Complete history of flag changes and reasons

## Drawbacks

1. **Complexity**: Additional infrastructure and code paths to maintain
2. **Database Load**: Additional queries for feature flag resolution
3. **Testing Burden**: Must test both pipelines and flag combinations
4. **Cache Management**: Cache invalidation and consistency concerns

## Alternatives Considered

### Environment Variable Based Flags

**Pros**: Simpler implementation, no database dependency
**Cons**: Requires deployment for changes, no user-specific controls, no gradual rollout

### Third-Party Services (LaunchDarkly, Split.io)

**Pros**: Enterprise-grade features, advanced analytics
**Cons**: Additional vendor dependency, cost, data privacy concerns

### Code-Level Toggles

**Pros**: No external dependencies, simple implementation
**Cons**: Requires code deployment for changes, no runtime control

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Database migration for feature flags tables
- [ ] Core feature flag service implementation  
- [ ] Unit tests for flag resolution logic
- [ ] Basic integration with server actions

### Phase 2: Admin Interface (Week 2)
- [ ] Admin dashboard for flag management
- [ ] API routes for flag CRUD operations
- [ ] Emergency rollback functionality
- [ ] User override management

### Phase 3: Monitoring & Rollout (Week 3)
- [ ] Analytics integration for pipeline metrics
- [ ] Gradual rollout to internal team (0.1%)
- [ ] Performance monitoring and validation
- [ ] Documentation and runbooks

### Phase 4: Production Rollout (Week 4)
- [ ] Expand to beta users (5%)
- [ ] Monitor success metrics and user feedback
- [ ] Gradual expansion (25%, 50%, 100%)
- [ ] Legacy system deprecation planning

## Success Criteria

### Technical Metrics
- Feature flag resolution time < 10ms (p95)
- Zero downtime during rollout phases
- Phoenix pipeline error rate ≤ legacy system error rate
- Cache hit rate > 80% for flag queries

### Business Metrics
- User satisfaction maintained or improved
- Support ticket volume unchanged
- Successful migration of 100% of users
- Zero critical rollbacks due to Phoenix pipeline issues

## Monitoring & Alerting

### Key Metrics
- Pipeline usage distribution (Phoenix vs Legacy)
- Error rates by pipeline type
- Feature flag resolution latency
- Admin override frequency

### Alert Conditions
- Phoenix pipeline error rate > 5%
- Feature flag service downtime
- Unusual rollback activity
- High cache miss rates

## Risk Assessment

### High Risk
- **Database failure affecting flag resolution**: Mitigated by fail-safe defaults
- **Phoenix pipeline critical bug**: Mitigated by automatic fallback and emergency rollback

### Medium Risk  
- **Performance degradation**: Mitigated by gradual rollout and monitoring
- **Cache inconsistency**: Mitigated by short TTL and manual cache invalidation

### Low Risk
- **Admin interface bugs**: Limited impact, alternative CLI tools available
- **Flag configuration errors**: Mitigated by validation and audit logs

## Future Enhancements

1. **A/B Testing Framework**: Extend for general experimentation capabilities
2. **Segment-Based Targeting**: User cohort and demographic targeting
3. **Scheduled Rollouts**: Automated time-based rollout schedules
4. **Integration APIs**: External service integration for flag management
5. **Advanced Analytics**: Detailed user journey and conversion tracking

## Conclusion

The database-driven feature flagging system provides a robust, safe mechanism for rolling out the Phoenix pipeline while maintaining operational control and minimizing risk. The hierarchical resolution system, combined with emergency controls and gradual rollout capabilities, ensures a smooth transition path with multiple safety nets.

This approach balances the need for innovation (Phoenix pipeline) with operational stability (legacy system) while providing the tools necessary for confident, data-driven decision making during the migration process.
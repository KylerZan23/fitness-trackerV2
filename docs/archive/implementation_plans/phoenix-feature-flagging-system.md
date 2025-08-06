# Phoenix Pipeline Feature Flagging System Implementation Plan

## Overview
Implement a comprehensive feature flagging system to safely roll out the new Phoenix generation pipeline alongside the existing legacy system with gradual user migration and easy rollback capabilities.

## Current State Analysis

### Existing Systems
1. **Phoenix Pipeline** (`src/lib/ai/generationPipeline.ts`):
   - New modern system using `generateProgram()` function
   - Full validation, Guardian layer integration
   - Phoenix schema support with enhanced features
   - Used in `src/app/_actions/aiProgramActions.ts`

2. **Legacy Pipeline** (`src/lib/ai/programGenerator.ts`):
   - Existing system using `runProgramGenerationPipeline()`
   - Background processing via database triggers
   - Used in `src/app/_actions/training-programs/generate-training-program/`

### Integration Points
- Primary entry: `src/app/_actions/aiProgramActions.ts:generateTrainingProgram()`
- Legacy entry: `src/app/_actions/training-programs/generate-training-program/action.ts`

## Implementation Strategy

### Phase 1: Database-Based Feature Flags System

#### Database Schema
```sql
-- Feature flags table
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

-- User-specific feature flag overrides
CREATE TABLE user_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Feature Flag Service
```typescript
// src/lib/featureFlags.ts
export interface FeatureFlagConfig {
  flagName: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  adminOverrideEnabled?: boolean;
  adminOverrideDisabled?: boolean;
  metadata?: Record<string, any>;
}

export async function isFeatureEnabled(
  userId: string, 
  flagName: string
): Promise<boolean>

export async function getFeatureFlagConfig(
  flagName: string
): Promise<FeatureFlagConfig | null>

export async function setUserFeatureOverride(
  userId: string,
  flagName: string,
  isEnabled: boolean,
  reason?: string,
  expiresAt?: Date
): Promise<void>
```

### Phase 2: Dual Pipeline Support

#### Modified Server Actions
```typescript
// src/app/_actions/aiProgramActions.ts
export async function generateTrainingProgram(
  userId: string,
  onboardingData: any
): Promise<ProgramGenerationResult> {
  const usePhoenixPipeline = await isFeatureEnabled(userId, 'phoenix_pipeline_enabled');
  
  if (usePhoenixPipeline) {
    console.log(`[generateTrainingProgram] Using Phoenix pipeline for user ${userId}`);
    return generateWithPhoenixPipeline(userId, onboardingData);
  } else {
    console.log(`[generateTrainingProgram] Using legacy pipeline for user ${userId}`);
    return generateWithLegacyPipeline(userId, onboardingData);
  }
}
```

### Phase 3: Gradual Rollout Strategy

#### Rollout Stages
1. **Internal Testing (0.1%)**: Core team members only
2. **Limited Beta (5%)**: Selected beta users
3. **Expanded Beta (25%)**: Broader user base
4. **Majority Rollout (50%)**: Half of all users
5. **Full Rollout (100%)**: All users

#### Rollback Mechanism
- Instant rollback via admin override
- User-specific rollback for problematic cases
- Automatic rollback on error rate thresholds

### Phase 4: Admin Interface

#### Admin Dashboard Features
- View current rollout status
- Modify rollout percentages
- Emergency rollback button
- User override management
- Feature flag analytics

### Phase 5: Monitoring & Analytics

#### Metrics to Track
- Success/failure rates per pipeline
- Performance metrics comparison
- User satisfaction scores
- Error rates and types
- Rollback frequency and reasons

## Technical Implementation Details

### Feature Flag Resolution Logic
1. Check user-specific overrides first
2. Check admin global overrides
3. Apply percentage-based rollout logic
4. Default to disabled for safety

### Percentage Rollout Algorithm
```typescript
function isUserInRollout(userId: string, percentage: number): boolean {
  const hash = createHash('sha256').update(userId + 'phoenix_pipeline_salt').digest('hex');
  const userValue = parseInt(hash.substring(0, 8), 16) % 100;
  return userValue < percentage;
}
```

### Error Handling & Fallbacks
- Phoenix pipeline failure → Automatic fallback to legacy
- Feature flag service failure → Default to legacy pipeline
- Database connection issues → Use cached flag values

## Risk Mitigation

### Safety Measures
1. **Default Disabled**: New flags start disabled
2. **Gradual Rollout**: Never jump percentage levels
3. **Monitoring**: Real-time error tracking
4. **Automatic Rollback**: On high error rates
5. **Manual Overrides**: Admin and user-level controls

### Testing Strategy
1. **Unit Tests**: Feature flag logic and pipeline routing
2. **Integration Tests**: End-to-end generation flows
3. **Load Tests**: Performance comparison between systems
4. **Canary Deployment**: Small percentage validation

## Implementation Order

### Week 1: Foundation
- [ ] Create database migrations
- [ ] Implement core feature flag service
- [ ] Add basic unit tests

### Week 2: Integration
- [ ] Modify server actions for dual pipeline support
- [ ] Implement pipeline routing logic
- [ ] Add monitoring and logging

### Week 3: UI & Controls
- [ ] Create admin interface
- [ ] Implement user override system
- [ ] Add emergency rollback controls

### Week 4: Testing & Deployment
- [ ] Comprehensive testing
- [ ] Documentation updates
- [ ] Initial rollout to internal users

## Success Criteria

### Technical Metrics
- Zero downtime during rollout
- < 1% increase in error rates
- Phoenix pipeline performance ≥ legacy system
- Feature flag response time < 10ms

### Business Metrics
- User satisfaction maintained or improved
- No increase in support tickets
- Successful migration of 100% users
- Zero rollbacks due to critical issues

## Rollback Plan

### Immediate Rollback (< 1 minute)
1. Set admin override disabled = true
2. All new requests use legacy pipeline
3. Monitor for stabilization

### User-Specific Rollback
1. Add user override with disabled = true
2. User immediately routed to legacy system
3. Track issue for investigation

### Emergency Procedures
1. Database-level flag disable
2. Code-level feature flag override
3. Emergency deployment rollback

## Monitoring & Alerting

### Key Alerts
- Phoenix pipeline error rate > 5%
- Feature flag service downtime
- Rollout percentage unauthorized changes
- High rollback frequency

### Dashboards
- Real-time pipeline usage split
- Error rates by pipeline
- Feature flag status overview
- User override activity

## Documentation Requirements

### Technical Documentation
- [ ] Feature flag service API documentation
- [ ] Pipeline routing logic documentation
- [ ] Admin interface user guide
- [ ] Monitoring and alerting setup

### Operational Documentation
- [ ] Rollout procedures
- [ ] Rollback procedures
- [ ] Troubleshooting guide
- [ ] Emergency response procedures
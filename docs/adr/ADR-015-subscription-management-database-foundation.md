# ADR-015: Subscription Management Database Foundation

## Status
**Accepted** - Implemented 2025-01-09

## Context
Following the addition of pricing tiers to the landing page, we need to implement the database foundation for subscription management and trial tracking. This enables the transition from a free application to a freemium model with 7-day trials and premium subscriptions.

## Decision
Implement a simplified subscription management system using boolean flags and timestamp columns in the existing profiles table, with supporting utility functions for subscription status checking.

### Database Schema Changes
Added two columns to the `profiles` table:
- `is_premium` (BOOLEAN): Simple flag for premium subscription status
- `trial_ends_at` (TIMESTAMPTZ): Timestamp when free trial expires

### Implementation Approach
- **MVP Simplicity**: Boolean approach rather than complex status enums
- **Automatic Trial Start**: New signups automatically get 7-day trial
- **Backward Compatibility**: Existing users granted trial period during migration
- **Server-Side Functions**: Database functions for subscription checking

## Technical Implementation

### Migration: `20250709214850_add_premium_status_to_profiles.sql`
```sql
-- Core columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Helper functions
CREATE FUNCTION has_active_access(user_id UUID) RETURNS BOOLEAN
CREATE FUNCTION start_user_trial(user_id UUID) RETURNS VOID

-- Grant trial to existing users
UPDATE profiles SET trial_ends_at = NOW() + INTERVAL '7 days' 
WHERE trial_ends_at IS NULL AND is_premium = FALSE;
```

### Utility Module: `src/lib/subscription.ts`
```typescript
// Core functions
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>
export async function hasActiveAccess(userId: string): Promise<boolean>
export async function startTrial(userId: string): Promise<boolean>
export async function upgradeToPremium(userId: string): Promise<boolean>
export async function cancelPremium(userId: string): Promise<boolean>
export function getSubscriptionMessage(status: SubscriptionStatus): string
```

### Signup Flow Enhancement
- Automatic trial start for new users in profile creation
- Updated UI messaging to emphasize 7-day free trial
- Trial end date calculation at signup time

## Decision Drivers

### 1. Simplicity Over Complexity
**Chosen**: Boolean `is_premium` flag
**Alternative**: Complex status enum (`trial`, `active`, `past_due`, `canceled`, `expired`)
**Reasoning**: MVP approach prioritizes implementation speed and reduces complexity

### 2. Trial Management
**Chosen**: Timestamp-based trial tracking with automatic start
**Alternative**: Manual trial activation or trial status flags
**Reasoning**: Provides precise trial expiration tracking and automatic trial grants

### 3. Backward Compatibility
**Chosen**: Grant trials to all existing users during migration
**Alternative**: Only new users get trials
**Reasoning**: Maintains user experience continuity and provides value to existing users

### 4. Performance Optimization
**Chosen**: Database indexes on subscription fields
**Alternative**: No optimization
**Reasoning**: Subscription checks will be frequent operations requiring fast lookups

## Consequences

### Positive
- **Fast Implementation**: Simple boolean approach enables rapid development
- **Clear User Experience**: Automatic trial start removes friction from signup
- **Performance**: Indexed columns ensure fast subscription checking
- **Backward Compatibility**: No disruption to existing users
- **Foundation Ready**: Structure supports future payment integration

### Negative
- **Limited Granularity**: Boolean approach lacks complex subscription states
- **Manual Payment Integration**: Future Stripe integration requires additional work
- **Trial Limitations**: No built-in trial extension or grace period logic

### Migration Impact
- All existing users automatically receive 7-day trial
- Database helper functions available for immediate use
- Signup flow seamlessly starts trials for new users

## Monitoring & Success Metrics

### Technical Metrics
- Subscription status query performance
- Trial expiration accuracy
- Database function usage patterns

### Business Metrics (Future)
- Trial-to-paid conversion rates
- Trial engagement patterns
- Feature usage during trial periods

## Future Considerations

### Payment Integration
- Stripe webhook integration for subscription updates
- Subscription lifecycle management (billing, renewals, cancellations)
- Grace period handling for failed payments

### Feature Access Control
- Middleware for route protection based on subscription status
- Component-level access control for premium features
- Usage-based limitations during trial period

### Enhanced Trial Management
- Trial extension capabilities
- Custom trial lengths for different user segments
- Win-back campaigns for expired trials

## Related Decisions
- **ADR-013**: Specialized Fitness Goals Expansion (premium feature candidates)
- **ADR-014**: LLM Program Content Enhancement (premium program types)
- **Landing Page Pricing Section**: User-facing subscription tiers and messaging

---

**Implementation Notes:**
- Migration tested with PostgreSQL syntax validation
- TypeScript utilities provide type-safe subscription checking
- Next.js build confirmed successful with new subscription system
- Ready for immediate deployment and usage tracking 
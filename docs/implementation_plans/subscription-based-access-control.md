# Subscription-Based Access Control Implementation Plan

## Overview
Implement subscription management and trial logic to control access to premium features based on user subscription status and trial periods.

## Database Schema Changes Required

### Add Subscription Fields to Profiles Table
```sql
-- Add subscription tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free_trial' CHECK (subscription_tier IN ('free_trial', 'monthly', 'annual')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: trial, active, past_due, canceled, expired';
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier: free_trial, monthly, annual';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the free trial expires (defaults to 7 days from signup)';
COMMENT ON COLUMN profiles.subscription_ends_at IS 'When the paid subscription expires';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';
```

## Authentication & Access Control

### 1. Login Redirect Logic
Update `src/app/login/page.tsx`:
- Check subscription status after successful login
- Redirect based on access level:
  - Active trial/subscription → `/program`
  - Expired trial, no subscription → `/pricing?expired=true`
  - First-time users → Auto-start trial, redirect to `/onboarding`

### 2. Middleware Protection
Update `src/middleware.ts`:
- Add subscription checking to protected routes
- Allow access to `/pricing` and `/signup` for expired users
- Protect premium features based on subscription status

### 3. Profile Creation Enhancement
Update signup flow to automatically:
- Set `subscription_status = 'trial'`
- Set `trial_ends_at = NOW() + 7 days`
- Set `subscription_tier = 'free_trial'`

## Feature Access Control

### Protected Features
- AI Program Generation (limit to 1 program for trial users)
- Advanced Progress Analytics
- Unlimited Workout Logging
- Export/Sync Capabilities
- Premium Coach Insights

### Trial Limitations
- 1 AI-generated program max
- Basic progress tracking only
- Standard workout logging (no advanced features)
- No export capabilities

## User Experience Components

### 1. Trial Status Banner
```typescript
// src/components/ui/TrialStatusBanner.tsx
// Shows remaining trial days
// Links to upgrade options
// Appears on dashboard and key pages
```

### 2. Upgrade Prompts
```typescript
// src/components/ui/UpgradePrompt.tsx
// Feature-specific upgrade prompts
// Appears when users hit trial limits
// Clear upgrade paths to pricing page
```

### 3. Billing Dashboard
```typescript
// src/app/billing/page.tsx
// Current subscription status
// Payment history
// Plan change options
// Cancel/reactivate subscription
```

## Implementation Steps

### Phase 1: Database & Basic Logic
1. Run database migration for subscription fields
2. Update signup flow to auto-start trials
3. Implement basic access checking in login flow
4. Add trial status to user profile display

### Phase 2: Feature Protection
1. Add subscription checking to AI program generation
2. Implement trial limitations on workout features
3. Create upgrade prompts for protected features
4. Update middleware for route protection

### Phase 3: Billing Integration
1. Integrate Stripe for payment processing
2. Implement webhooks for subscription updates
3. Create billing dashboard
4. Add plan upgrade/downgrade flows

### Phase 4: Enhanced UX
1. Add trial countdown displays
2. Implement grace period logic
3. Create win-back campaigns for expired users
4. Add usage analytics for trial optimization

## API Endpoints Required

```typescript
// Subscription management
POST /api/subscriptions/create
POST /api/subscriptions/cancel
POST /api/subscriptions/reactivate
GET  /api/subscriptions/status

// Billing
POST /api/billing/create-checkout-session
POST /api/billing/create-portal-session
POST /api/webhooks/stripe

// Trial management
POST /api/trial/extend
GET  /api/trial/status
```

## Success Metrics

### Conversion Tracking
- Trial to paid conversion rate
- Time to first upgrade
- Feature usage during trial
- Churn rate by trial engagement

### Revenue Metrics
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)
- Average Revenue Per User (ARPU)
- Churn rate by subscription tier

## Technical Considerations

### Security
- Validate subscription status on server-side
- Encrypt sensitive billing data
- Implement webhook signature verification
- Add rate limiting to prevent abuse

### Performance
- Cache subscription status in user sessions
- Minimize database queries for access checks
- Optimize trial status calculations
- Use efficient indexing on subscription fields

### Error Handling
- Graceful degradation for billing service outages
- Clear error messages for payment failures
- Retry logic for webhook processing
- Fallback access for critical features

## Migration Strategy

### Existing Users
- All existing users get 7-day trial starting from migration date
- No disruption to current functionality
- Email notification about new trial benefits
- Clear upgrade path communication

### Data Integrity
- Backup existing profiles before migration
- Rollback plan for schema changes
- Gradual feature rollout with feature flags
- Monitor subscription status accuracy

## Implementation Status

### Completed ✅
- **Database Migration**: `20250709214850_add_premium_status_to_profiles.sql`
  - Added `is_premium` boolean column with default `FALSE`
  - Added `trial_ends_at` timestamp column for trial management
  - Created database indexes for efficient queries
  - Added helper functions: `has_active_access()` and `start_user_trial()`
  - Granted 7-day trial to all existing users
  
- **Subscription Utilities**: `src/lib/subscription.ts`
  - `getSubscriptionStatus()` - Detailed subscription status checking
  - `hasActiveAccess()` - Simple boolean access check
  - `startTrial()`, `upgradeToPremium()`, `cancelPremium()` - Subscription management
  - `getSubscriptionMessage()` - User-friendly status messages
  
- **Signup Enhancement**: `src/app/signup/page.tsx`
  - Automatic trial start for new users (7-day trial)
  - Trial messaging in signup flow
  - Updated button text to "Start 7-Day Free Trial"

### Next Steps 📋
- [ ] Login redirect logic enhancement based on subscription status
- [ ] Middleware for route protection of premium features
- [ ] UI components for subscription status display
- [ ] Feature access control implementation
- [ ] Stripe integration for payment processing

### Notes
- Migration uses simple boolean approach (`is_premium`) rather than complex status enums for MVP
- All existing users automatically granted 7-day trial period
- Database functions provide server-side subscription checking
- Signup flow now seamlessly starts trials for new users 
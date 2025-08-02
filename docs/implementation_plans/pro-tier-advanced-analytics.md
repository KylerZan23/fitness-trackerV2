# Pro Tier with Advanced Analytics Implementation Plan

## Overview
Expand the current binary subscription system (Free Trial/Premium) to include a 'Pro' tier with enhanced features. The first Pro-exclusive feature will be Advanced Analytics providing sophisticated data visualizations and insights.

## Current State Analysis
- **Existing System**: Binary subscription (is_premium boolean, trial_ends_at timestamp)
- **Current Analytics**: Basic progress tracking, strength progression charts, muscle distribution, workout summaries
- **Architecture**: Subscription checking via `src/lib/subscription.ts`, middleware protection, server-side validation

## Database Schema Changes

### 1. Add Subscription Tier to Profiles Table
```sql
-- Add subscription_tier column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'trial' 
CHECK (subscription_tier IN ('trial', 'standard', 'pro'));

-- Update existing users based on current premium status
UPDATE public.profiles 
SET subscription_tier = CASE 
  WHEN is_premium = true THEN 'standard'
  WHEN trial_ends_at > NOW() THEN 'trial'
  ELSE 'trial'
END;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Add comments
COMMENT ON COLUMN public.profiles.subscription_tier IS 'Subscription tier: trial, standard, pro';
```

### 2. Create Advanced Analytics Data Views
```sql
-- Create materialized view for Pro-tier analytics aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS user_advanced_analytics AS
SELECT 
  user_id,
  DATE_TRUNC('week', created_at) as week_start,
  -- Volume metrics by muscle group
  muscle_group,
  SUM(sets * reps * COALESCE(weight, 0)) as weekly_volume,
  AVG(COALESCE(weight, 0)) as avg_weight,
  COUNT(*) as exercise_count,
  -- PR tracking data
  MAX(CASE WHEN sets <= 5 AND reps <= 5 THEN weight END) as max_strength_weight,
  -- Recovery metrics
  COUNT(DISTINCT created_at::date) as training_days
FROM workouts 
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY user_id, DATE_TRUNC('week', created_at), muscle_group;

-- Create index for fast user queries
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_user_week 
ON user_advanced_analytics(user_id, week_start);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_advanced_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_advanced_analytics;
END;
$$ LANGUAGE plpgsql;
```

## Backend Logic Changes

### 1. Update Subscription Interface and Functions
```typescript
// src/lib/subscription.ts
export type SubscriptionTier = 'trial' | 'standard' | 'pro'

export interface SubscriptionStatus {
  hasAccess: boolean
  isPremium: boolean
  isPro: boolean
  isStandard: boolean
  isTrialActive: boolean
  subscriptionTier: SubscriptionTier
  trialEndsAt: string | null
  daysRemaining: number | null
  isReadOnlyMode: boolean
  trialExpired: boolean
}

export async function hasProAccess(userId: string): Promise<boolean>
export async function upgradeToProTier(userId: string): Promise<boolean>
export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier>
```

### 2. Create Pro Feature Access Control
```typescript
// src/lib/permissions.ts
export async function hasAdvancedAnalyticsAccess(userId: string): Promise<boolean> {
  const tier = await getSubscriptionTier(userId)
  return tier === 'pro'
}

export function requireProAccess(component: ReactNode): ReactNode {
  // HOC wrapper for Pro-gated components
}
```

## Advanced Analytics Features (Pro-Only)

### 1. Volume Progression Dashboard
- **Weekly/Monthly volume trends** by muscle group
- **Volume load progressions** with percentage changes
- **Training density analysis** (volume per training day)
- **Periodization visualization** showing volume waves

### 2. Enhanced PR Tracking
- **Multi-rep max calculations** (1RM, 3RM, 5RM progressions)
- **Strength velocity trends** showing rate of improvement
- **PR prediction algorithms** based on current trajectory
- **Competition peak planning** with strength curves

### 3. Recovery and Fatigue Analysis
- **Muscle group fatigue mapping** based on volume and frequency
- **Recovery time analysis** between similar muscle group sessions
- **Training readiness indicators** based on performance drop-offs
- **Optimal rest day suggestions** using fatigue algorithms

### 4. Advanced Data Export
- **Raw data export** in CSV/JSON formats
- **Training program export** for external analysis
- **Progress report PDFs** with advanced visualizations
- **API access** for third-party integrations

## Implementation Steps

### Phase 1: Database & Subscription Logic (Day 1-2)
1. ✅ Run database migration for subscription_tier
2. ✅ Update subscription.ts with Pro tier logic
3. ✅ Create Pro access checking functions
4. ✅ Update middleware for Pro route protection

### Phase 2: Advanced Analytics Components (Day 3-5)
1. ✅ Create VolumeProgressionChart component
2. ✅ Create EnhancedPRTracker component  
3. ✅ Create FatigueAnalysisChart component
4. ✅ Create ProAnalyticsDashboard layout

### Phase 3: Access Control & UI (Day 6-7)
1. ✅ Implement Pro-gated component wrappers
2. ✅ Add upgrade prompts for Standard users
3. ✅ Create Pro tier upgrade flow
4. ✅ Update pricing page with Pro tier

### Phase 4: Testing & Documentation (Day 8)
1. ✅ Unit tests for subscription logic
2. ✅ Integration tests for Pro features
3. ✅ Update ADR documentation
4. ✅ Update README with Pro features

## File Structure Changes
```
src/
├── components/
│   ├── analytics/
│   │   ├── VolumeProgressionChart.tsx (Pro)
│   │   ├── EnhancedPRTracker.tsx (Pro)
│   │   ├── FatigueAnalysisChart.tsx (Pro)
│   │   └── ProAnalyticsDashboard.tsx
│   └── ui/
│       └── ProFeatureGate.tsx
├── app/
│   └── analytics/
│       └── page.tsx (Pro-gated)
└── lib/
    ├── analytics/
    │   ├── volumeCalculations.ts
    │   ├── prCalculations.ts
    │   └── fatigueAnalysis.ts
    └── subscription.ts (updated)
```

## Success Criteria
1. ✅ Database successfully stores Pro tier subscriptions
2. ✅ Standard users see upgrade prompts for Advanced Analytics
3. ✅ Pro users can access all advanced analytics features
4. ✅ Charts render correctly with real user data
5. ✅ Export functionality works for Pro users
6. ✅ No performance degradation from new analytics queries

## Risk Mitigation
- **Data Privacy**: Pro analytics use existing anonymized workout data
- **Performance**: Materialized views and proper indexing for large datasets
- **User Experience**: Clear upgrade path with feature preview for Standard users
- **Backward Compatibility**: Existing premium users default to Standard tier
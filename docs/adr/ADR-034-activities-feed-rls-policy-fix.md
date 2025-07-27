# ADR-034: Activities Feed RLS Policy Fix

## Status
Accepted

## Context
The Activities tab on the `/community` page was not displaying workout activities from followed users, showing "No Activities Yet" message even when users had active follows with users who had completed workouts.

### Root Cause Analysis
The issue was identified in the Row Level Security (RLS) policies on the `workouts` and `workout_groups` tables. The existing policies were too restrictive:

```sql
-- Existing restrictive policies
CREATE POLICY "Users can view their own workouts" ON workouts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout groups" ON workout_groups
  FOR SELECT USING (auth.uid() = user_id);
```

These policies only allowed users to view their own workout data, blocking the Activities Feed from accessing followed users' workouts.

### Data Flow Impact
1. `ActivitiesFeed.tsx` → `getFollowedUsersActivities()` 
2. Function attempts to query:
   - ✅ `user_followers` table (accessible)
   - ❌ `workout_groups` table (blocked by RLS)
   - ❌ `workouts` table (blocked by RLS)
   - ✅ `profiles` table (accessible)

## Decision
Add complementary RLS policies that allow users to view workouts and workout_groups from users they explicitly follow, while maintaining data privacy and security.

### Solution Implementation
```sql
-- Allow viewing workouts from followed users
CREATE POLICY "Users can view followed users workouts" ON workouts
  FOR SELECT
  USING (
    user_id IN (
      SELECT following_id 
      FROM user_followers 
      WHERE follower_id = auth.uid()
    )
  );

-- Allow viewing workout_groups from followed users  
CREATE POLICY "Users can view followed users workout groups" ON workout_groups
  FOR SELECT
  USING (
    user_id IN (
      SELECT following_id
      FROM user_followers  
      WHERE follower_id = auth.uid()
    )
  );
```

## Consequences

### Positive
- ✅ Activities Feed now displays workouts from followed users
- ✅ Maintains strict data privacy (only followed users' data accessible)
- ✅ Preserves existing security model for own workout data
- ✅ Uses proper foreign key relationships through `user_followers` table
- ✅ Enables core community feature functionality

### Security Considerations
- Users can only access workout data from users they explicitly follow
- No unauthorized access to workout data from random users
- Follows the principle of least privilege
- Uses Supabase's built-in RLS for secure data access

### Performance
- Added composite index on `user_followers(follower_id, following_id)` for query optimization
- Subquery execution per policy evaluation (acceptable for typical follow counts)

## Implementation Details
- **Migration**: `20250127180000_fix_activities_feed_rls_policies.sql`
- **Affected Tables**: `workouts`, `workout_groups`, `user_followers`
- **New Policies**: 2 additional SELECT policies
- **New Indexes**: 1 composite index for optimization

## Testing Requirements
- [x] Users can view activities from followed users
- [x] Users cannot view activities from non-followed users
- [x] Existing own-data access remains unchanged  
- [x] Empty state displays correctly when no follows exist
- [x] Performance acceptable with realistic datasets

## Related
- Original issue: Activities Feed not displaying followed users' workouts
- Related tables: `user_followers`, `workouts`, `workout_groups`, `profiles`
- Component: `ActivitiesFeed.tsx`, `getFollowedUsersActivities()` action 
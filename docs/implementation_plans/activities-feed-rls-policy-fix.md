# Activities Feed RLS Policy Fix

## Problem Analysis

The Activities tab on the `/community` page displays "No Activities Yet" even when the user follows someone who has completed workouts recently.

### Root Cause
The Row Level Security (RLS) policies on the `workouts` and `workout_groups` tables are too restrictive:

```sql
-- Current restrictive policies
CREATE POLICY "Users can view their own workouts" ON workouts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout groups" ON workout_groups
  FOR SELECT USING (auth.uid() = user_id);
```

These policies **only allow users to see their own workouts**, preventing the Activities Feed from displaying workouts from followed users.

### Data Flow Issue
1. `ActivitiesFeed.tsx` calls `getFollowedUsersActivities()`
2. `getFollowedUsersActivities()` queries:
   - `user_followers` table ✅ (works - has proper RLS)
   - `workout_groups` table ❌ (blocked by RLS)
   - `workouts` table ❌ (blocked by RLS)
   - `profiles` table ✅ (works - has proper RLS)

## Solution

Add new RLS policies that allow users to view workouts and workout_groups from users they follow.

### New Policies Required

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

### Security Considerations
- ✅ Users can only see workouts from users they explicitly follow
- ✅ Maintains privacy - no unauthorized access to workout data
- ✅ Existing policies for own data remain unchanged
- ✅ Uses proper foreign key relationships through user_followers table

## Implementation Steps

1. Create migration file with new RLS policies
2. Test activities feed functionality
3. Document changes in ADR

## Testing Checklist

- [ ] User can see activities from followed users
- [ ] User cannot see activities from non-followed users  
- [ ] User can still see their own workouts
- [ ] Empty state shows when no follows exist
- [ ] Performance is acceptable with large datasets 
# ADR-026: Fix Leaderboard RLS Policy Restrictions

## Status
Accepted

## Context
The leaderboard functionality on the /community page was only displaying the current user's personal records instead of showing all users' records. This was caused by overly restrictive Row Level Security (RLS) policies that prevented leaderboard functions from accessing the necessary data across all users.

### Problem Details
1. **Workouts Table RLS**: The `workouts` table had a policy that only allowed users to view their own workouts: `USING (auth.uid() = user_id)`
2. **Profiles Table RLS**: The `profiles` table had a policy that only allowed users to view their own profiles: `USING (auth.uid() = id)`
3. **Function Privileges**: The leaderboard functions (`get_strength_leaderboard` and `get_user_rank_for_lift`) were not running with elevated privileges, so they were subject to the calling user's RLS restrictions

### Impact
- Leaderboard showed "1 out of 1 athletes" even when multiple users had logged workouts
- Community engagement features were broken
- Competitive aspects of the fitness app were non-functional

## Decision
We will implement a dual approach to fix the leaderboard while maintaining data privacy:

### 1. Function Security Enhancement
- Add `SECURITY DEFINER` to both `get_strength_leaderboard` and `get_user_rank_for_lift` functions
- This allows these functions to bypass RLS policies and access all users' workout data
- Functions run with elevated privileges only for legitimate leaderboard calculations

### 2. Profile Data Access for Leaderboards
- Add a public read policy for the `profiles` table that allows authenticated users to read basic profile information (name, profile_picture_url)
- This is necessary for displaying user names and avatars in leaderboards
- Only applies to authenticated users, maintaining some level of access control

## Consequences

### Positive
- ✅ Leaderboard functionality works correctly, showing all users' records
- ✅ Community engagement features are restored
- ✅ Competitive aspects of the app are functional
- ✅ Maintains security by requiring authentication
- ✅ Functions are explicitly designed for their purpose with clear access patterns

### Negative
- ⚠️ User names and profile pictures are now visible to all authenticated users
- ⚠️ Workout performance data is accessible through leaderboard functions (though not directly through table queries)

### Privacy Considerations
- Users joining a fitness community app typically expect their achievements to be visible to other community members
- The exposed data (names, profile pictures, and best lifts) is standard for fitness leaderboards
- Personal workout details and raw workout logs remain private
- Users can control their profile picture and name visibility

### Security Measures Maintained
- RLS policies on the underlying tables remain intact for direct access
- Only authenticated users can access leaderboard data
- Functions are specifically designed for leaderboard purposes
- No sensitive personal information (email, age, etc.) is exposed

## Implementation
Migration `20250131130000_fix_leaderboard_security_definer.sql` implements:
1. Updated `get_strength_leaderboard` function with `SECURITY DEFINER`
2. Updated `get_user_rank_for_lift` function with `SECURITY DEFINER` 
3. New public read policy for profiles table: `"Public read access for leaderboard display"`
4. Proper function permissions and documentation

## Alternatives Considered
1. **Create materialized views**: Would require complex refresh logic and doesn't solve the profiles access issue
2. **Create dedicated leaderboard tables**: Would require data synchronization and additional complexity
3. **Remove RLS entirely**: Would compromise user privacy unnecessarily
4. **API-level aggregation**: Would be slower and more complex than database-level functions

## Related Issues
- Fixes the community leaderboard showing only current user
- Enables proper competitive features in the fitness tracking app
- Maintains balance between functionality and privacy 
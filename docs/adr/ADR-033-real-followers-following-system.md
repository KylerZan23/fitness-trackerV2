# ADR-033: Real Followers/Following System Implementation

## Status
Accepted

## Context
The profile page was using placeholder/mock data for follower and following counts. Users needed real social functionality to follow other users, view follower lists, and track their social connections within the fitness platform.

## Decision
Implemented a comprehensive followers/following system with:

### Database Schema
- `user_followers` table with follower_id and following_id relationships
- Denormalized follower counts in profiles table for performance
- RLS policies for secure access control
- Automated triggers to maintain count consistency
- Activity feed integration for follow events

### Server Actions
- `followUser()` - Create follow relationship
- `unfollowUser()` - Remove follow relationship  
- `getFollowStatus()` - Check relationship status between users
- `getFollowers()` - List user's followers with pagination
- `getFollowing()` - List users being followed with pagination
- `getMutualFollows()` - Find mutual connections
- `searchUsers()` - Search for users to follow

### UI Components
- `FollowersModal` - Modal to display followers/following lists
- Updated `SocialProfileHeader` - Clickable follower counts
- Real-time follow/unfollow buttons
- Profile navigation between users

## Implementation Details

### Database Migration
```sql
-- Create user_followers table
CREATE TABLE user_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_follow_relationship UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Add count columns to profiles
ALTER TABLE profiles 
ADD COLUMN followers_count INTEGER DEFAULT 0,
ADD COLUMN following_count INTEGER DEFAULT 0;
```

### Security Considerations
- RLS policies prevent unauthorized follow operations
- Users can only create/delete their own follows
- All follow relationships are publicly viewable (social transparency)
- Triggers maintain data consistency automatically

### Performance Optimizations
- Denormalized counts in profiles table for O(1) lookups
- Database indexes on follower_id and following_id
- Efficient join queries for follower/following lists
- Pagination support for large follower lists

## Consequences

### Positive
- Real social functionality replaces placeholder data
- Scalable architecture supports large user bases
- Secure implementation with proper RLS policies
- Activity feed integration for social engagement
- Consistent UI/UX with clickable follower counts

### Negative
- Additional database complexity with triggers and counts
- Potential data inconsistency if triggers fail
- More complex queries for mutual follows feature

### Neutral
- Migration required to add database schema
- Existing profiles start with 0 followers/following

## Files Changed
- `supabase/migrations/20250726230000_create_user_followers_system.sql`
- `src/app/_actions/followActions.ts` (new)
- `src/app/_actions/profileActions.ts` (updated counts)
- `src/components/profile/FollowersModal.tsx` (new)
- `src/components/profile/SocialProfileHeader.tsx` (clickable counts)
- `src/app/profile/page.tsx` (modal integration)

## Next Steps
- Implement follow functionality in public profile pages (`/p/[userId]`)
- Add user search/discovery features
- Consider follow notifications system
- Add mutual friends suggestions
- Implement follow activity in community feed 
# ADR-025: Fix Community Posts Foreign Key Constraint

## Status
Accepted - Implemented

## Context
When accessing community group pages (e.g., `/community/c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b`), the application was throwing a PostgREST error:

```
Error fetching group posts: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'community_posts' and 'profiles' using the hint 'community_posts_user_id_fkey' in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'community_posts' and 'profiles' in the schema cache"
}
```

### Root Cause Analysis
1. **Original Schema**: The `community_posts` table was created with `user_id UUID NOT NULL REFERENCES auth.users(id)`
2. **Query Expectation**: The `getGroupDetailsAndPosts` function was trying to join with `profiles` using `user:profiles!community_posts_user_id_fkey`
3. **Missing Link**: No foreign key constraint existed from `community_posts.user_id` to `profiles.id`

### Impact
- Community group pages returned 404 errors
- Users could not view group posts or details
- Community feature was effectively broken

## Decision
Create a database migration to fix the foreign key relationship:

1. **Drop** the existing foreign key constraint pointing to `auth.users(id)`
2. **Create** a new foreign key constraint pointing to `profiles(id)`
3. **Validate** that the constraint is properly created

### Migration Details
- **File**: `supabase/migrations/20250129130000_fix_community_posts_user_fkey.sql`
- **Constraint Name**: `community_posts_user_id_fkey`
- **Target**: `profiles(id)` instead of `auth.users(id)`

## Implementation
The migration includes:

1. **Orphan Check**: Verifies no orphaned records exist before creating the constraint
2. **Safe Constraint Drop**: Removes the existing broken constraint
3. **Constraint Recreation**: Creates the proper foreign key to `profiles.id`
4. **Index Creation**: Adds performance index on the foreign key column
5. **Verification**: Confirms the constraint points to the correct table/column

### Code Changes
- **Database Schema**: Fixed foreign key relationship
- **Query Compatibility**: Existing Supabase queries now work properly
- **Performance**: Added index for better join performance

## Consequences

### Positive
- ✅ Community group pages now load properly
- ✅ User profiles can be joined correctly in post queries
- ✅ Supabase foreign key hints work as expected
- ✅ Better query performance with proper indexing

### Considerations
- Migration requires database downtime (minimal)
- Existing data integrity maintained (no data loss)
- Forward compatible with existing application code

## Verification
The fix was verified by:

1. **Migration Success**: Database reset applied all migrations successfully
2. **Constraint Verification**: Migration logs confirmed proper constraint creation
3. **Application Testing**: Community pages should now load without foreign key errors

## Related Issues
- Fixes the PostgREST error when accessing community group pages
- Resolves the 404 responses for `/community/[groupId]` routes
- Enables proper user information display in community posts 
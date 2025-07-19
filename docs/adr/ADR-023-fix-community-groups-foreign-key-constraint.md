# ADR-023: Fix Community Groups Foreign Key Constraint

## Status
Accepted

## Date
2025-01-28

## Context
The community groups feature was failing to load on the `/community` page with the error:
```
Could not find a relationship between 'community_groups' and 'profiles' in the schema cache
```

Investigation revealed that the `community_groups.created_by` column was missing its foreign key constraint to `profiles.id` in the live database, despite being defined in the original migration file `20250125120000_create_community_groups_and_posts.sql`.

The application code in `getCommunityGroups()` explicitly relies on this foreign key relationship to join creator profile information using Supabase's relationship syntax:
```sql
created_by_user:profiles!created_by(name, profile_picture_url)
```

## Decision
We will add the missing foreign key constraint through a new migration file rather than modifying existing migrations, following database migration best practices.

### Actions Taken:
1. **Created new migration**: `20250128120000_add_community_groups_created_by_fkey.sql`
   - Adds the missing foreign key constraint `community_groups_created_by_fkey`
   - Includes orphan record detection before constraint addition
   - Creates performance index on the foreign key column
   - Adds verification step to ensure constraint was added successfully

2. **Updated application code**: Fixed the foreign key reference in `getCommunityGroups()`
   - Changed from `profiles!created_by` to `profiles!community_groups_created_by_fkey`
   - This matches the constraint name and allows PostgREST to resolve the relationship

3. **Maintained consistency**: The `getCommunityGroup()` function already used the correct constraint name format

## Alternatives Considered
1. **Modifying the original migration**: Rejected as this is an anti-pattern that won't fix already-deployed databases
2. **Using different query syntax**: Rejected as the relationship-based approach is more maintainable
3. **Manual joins in the query**: Rejected as it's more complex and less performant

## Consequences

### Positive:
- Community groups will load correctly on the `/community` page
- Proper foreign key constraint ensures data integrity
- Performance index improves query speed
- Consistent constraint naming across similar functions
- Follows migration best practices

### Negative:
- Requires database migration deployment
- May fail if orphaned records exist (but this is by design for data integrity)

## Implementation Notes
- The migration includes safeguards to detect orphaned records before attempting to add the constraint
- If orphaned records exist, they must be cleaned up manually before the constraint can be added
- The constraint uses `ON DELETE CASCADE` to maintain referential integrity
- An index is created on the foreign key column for optimal join performance

## Verification
After deployment, verify:
1. The migration runs successfully without errors
2. Community groups load correctly on the `/community` page
3. Creator profile information displays properly in the UI
4. No performance degradation in community-related queries 
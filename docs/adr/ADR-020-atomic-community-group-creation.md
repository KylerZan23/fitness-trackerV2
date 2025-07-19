# ADR-020: Atomic Community Group Creation

## Status
Accepted

## Context
The `createCommunityGroup` action in `communityActions.ts` had a critical atomicity issue where group creation and admin assignment were performed as separate database operations:

1. Insert into `community_groups` table
2. Insert into `community_group_members` table to make creator an admin

**Problem**: If the first operation succeeded but the second failed (due to network issues, permission changes, etc.), the system would end up with orphaned groups that have no admin. The group creator would be unable to manage the group they just created.

**Risk**: Data integrity violation that could leave users unable to access or manage their created groups.

## Decision
Implemented a PostgreSQL RPC (Remote Procedure Call) function to ensure atomicity of the community group creation process.

### Solution Components

1. **PostgreSQL Function**: Created `create_group_and_add_admin()` RPC function that:
   - Takes group parameters and creator ID as input
   - Performs both operations within a single transaction
   - Returns the new group ID on success
   - Automatically rolls back if any operation fails
   - Uses `SECURITY DEFINER` to run with proper permissions

2. **Updated Server Action**: Modified `createCommunityGroup` to:
   - Use the RPC function instead of separate operations
   - Handle RPC response properly
   - Fetch group data for response consistency
   - Maintain same API interface

## Implementation Details

### Database Migration
```sql
-- File: supabase/migrations/20250126120000_create_group_with_admin_rpc.sql
CREATE OR REPLACE FUNCTION create_group_and_add_admin(
    group_name TEXT,
    group_description TEXT,
    group_type_param TEXT,
    creator_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_group_id UUID;
BEGIN
    INSERT INTO public.community_groups (name, description, group_type, created_by)
    VALUES (group_name, group_description, group_type_param, creator_id)
    RETURNING id INTO new_group_id;

    INSERT INTO public.community_group_members (group_id, user_id, role)
    VALUES (new_group_id, creator_id, 'admin');

    RETURN new_group_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create group and add admin: %', SQLERRM;
END;
$$;
```

### Server Action Update
```typescript
// Before: Two separate operations (non-atomic)
const { data: groupData, error: groupError } = await supabase
  .from('community_groups')
  .insert({...})

const { error: memberError } = await supabase
  .from('community_group_members')
  .insert({...})

// After: Single atomic operation
const { data: newGroupId, error: rpcError } = await supabase
  .rpc('create_group_and_add_admin', {...})
```

## Benefits

1. **Data Integrity**: Guarantees that groups always have an admin when created
2. **Atomicity**: Either both operations succeed or both fail - no partial state
3. **Error Recovery**: Automatic rollback prevents orphaned data
4. **Performance**: Single database round-trip instead of two
5. **Consistency**: Eliminates race conditions between operations
6. **Maintainability**: Business logic encapsulated in database function

## Consequences

### Positive
- Eliminates the critical data integrity issue
- Improves reliability of group creation
- Better user experience (no orphaned groups)
- Follows database best practices for complex operations
- Maintains backwards compatibility with existing API

### Considerations
- Adds complexity with RPC function management
- Database migrations required for deployment
- Function needs to be maintained alongside application code
- Requires understanding of PostgreSQL functions for developers

## Alternatives Considered

1. **Application-level transactions**: Not reliable across network boundaries
2. **Compensating actions**: Complex to implement and still has race conditions
3. **Event sourcing**: Overkill for this specific use case
4. **Queue-based processing**: Adds unnecessary complexity and latency

## Implementation Notes

- The RPC function uses `SECURITY DEFINER` to ensure proper permissions
- Error handling includes context in exception messages
- Function is granted to `authenticated` role for proper access control
- The server action maintains the same response format for API compatibility
- Comprehensive error handling ensures graceful failure modes

## Migration Strategy

1. Deploy the migration to create the RPC function
2. Update the application code to use the RPC
3. Test thoroughly in staging environment
4. Deploy to production with monitoring

This change significantly improves the reliability and data integrity of the community feature while maintaining a clean API interface. 
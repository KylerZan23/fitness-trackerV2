-- Create a PostgreSQL function to atomically create a community group and add the creator as admin
-- This ensures that if either operation fails, the entire transaction is rolled back

CREATE OR REPLACE FUNCTION create_group_and_add_admin(
    group_name TEXT,
    group_description TEXT,
    group_type_param TEXT,
    creator_id UUID
)
RETURNS UUID -- Returns the new group's ID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the permissions of the function owner
AS $$
DECLARE
    new_group_id UUID;
BEGIN
    -- Insert the new group and return its ID
    INSERT INTO public.community_groups (name, description, group_type, created_by)
    VALUES (group_name, group_description, group_type_param, creator_id)
    RETURNING id INTO new_group_id;

    -- Add the creator as an admin member
    INSERT INTO public.community_group_members (group_id, user_id, role)
    VALUES (new_group_id, creator_id, 'admin');

    RETURN new_group_id;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, the transaction will be rolled back automatically
        -- Re-raise the exception with context
        RAISE EXCEPTION 'Failed to create group and add admin: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_group_and_add_admin(TEXT, TEXT, TEXT, UUID) TO authenticated; 
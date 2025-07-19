-- Migration: Fix broken foreign key constraint for community_groups.created_by
-- Date: 2025-01-28
-- Description: The existing foreign key constraint is broken (points to null table/column)
--              This migration drops and recreates it properly

-- First, check for orphaned records that would prevent the constraint
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphan_count
    FROM community_groups cg
    LEFT JOIN profiles p ON cg.created_by = p.id
    WHERE p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE 'Found % community groups with created_by values that do not exist in profiles table', orphan_count;
        RAISE NOTICE 'These records will need to be cleaned up before the foreign key constraint can be added';
        RAISE EXCEPTION 'Cannot create foreign key constraint due to orphaned records';
    ELSE
        RAISE NOTICE 'No orphaned community groups found - constraint can be recreated safely';
    END IF;
END $$;

-- Drop the existing broken constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'community_groups_created_by_fkey' 
        AND table_name = 'community_groups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE community_groups DROP CONSTRAINT community_groups_created_by_fkey;
        RAISE NOTICE 'Dropped broken foreign key constraint community_groups_created_by_fkey';
    ELSE
        RAISE NOTICE 'Broken constraint community_groups_created_by_fkey not found - may have been already dropped';
    END IF;
END $$;

-- Recreate the foreign key constraint properly
ALTER TABLE community_groups 
ADD CONSTRAINT community_groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create an index on the foreign key column for better performance
CREATE INDEX IF NOT EXISTS idx_community_groups_created_by 
ON community_groups(created_by);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT community_groups_created_by_fkey ON community_groups 
IS 'Foreign key constraint ensuring community group creators exist in profiles table';

-- Verify the constraint was recreated properly
DO $$
DECLARE
    fk_details RECORD;
BEGIN
    SELECT 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    INTO fk_details
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_name = 'community_groups_created_by_fkey'
        AND tc.table_name = 'community_groups'
        AND tc.table_schema = 'public';
        
    IF fk_details.foreign_table_name = 'profiles' AND fk_details.foreign_column_name = 'id' THEN
        RAISE NOTICE 'Foreign key constraint community_groups_created_by_fkey successfully recreated and points to profiles.id';
    ELSE
        RAISE EXCEPTION 'Foreign key constraint was not recreated properly - points to %.%', 
            fk_details.foreign_table_name, fk_details.foreign_column_name;
    END IF;
END $$; 
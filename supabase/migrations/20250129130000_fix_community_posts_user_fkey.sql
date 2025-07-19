-- Migration: Fix community_posts.user_id foreign key to reference profiles
-- Date: 2025-01-29
-- Description: The community_posts.user_id currently references auth.users(id) but queries
--              expect it to reference profiles(id). This migration fixes the relationship.

-- First, check for orphaned records that would prevent the constraint
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphan_count
    FROM community_posts cp
    LEFT JOIN profiles p ON cp.user_id = p.id
    WHERE p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE 'Found % community posts with user_id values that do not exist in profiles table', orphan_count;
        RAISE NOTICE 'These records will need to be cleaned up before the foreign key constraint can be added';
        RAISE EXCEPTION 'Cannot create foreign key constraint due to orphaned records';
    ELSE
        RAISE NOTICE 'No orphaned community posts found - constraint can be recreated safely';
    END IF;
END $$;

-- Drop the existing constraint that points to auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%community_posts%user_id%' 
        AND table_name = 'community_posts'
        AND table_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Get the actual constraint name
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE table_name = 'community_posts'
            AND table_schema = 'public'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE community_posts DROP CONSTRAINT ' || constraint_name_var;
                RAISE NOTICE 'Dropped existing foreign key constraint: %', constraint_name_var;
            END IF;
        END;
    ELSE
        RAISE NOTICE 'No existing foreign key constraint found for community_posts.user_id';
    END IF;
END $$;

-- Create the new foreign key constraint pointing to profiles
ALTER TABLE community_posts 
ADD CONSTRAINT community_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create an index on the foreign key column for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id_profiles 
ON community_posts(user_id);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT community_posts_user_id_fkey ON community_posts 
IS 'Foreign key constraint ensuring community post authors exist in profiles table';

-- Verify the constraint was created properly
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
    WHERE tc.constraint_name = 'community_posts_user_id_fkey'
        AND tc.table_name = 'community_posts'
        AND tc.table_schema = 'public';
        
    IF fk_details.foreign_table_name = 'profiles' AND fk_details.foreign_column_name = 'id' THEN
        RAISE NOTICE 'Foreign key constraint community_posts_user_id_fkey successfully created and points to profiles.id';
    ELSE
        RAISE EXCEPTION 'Foreign key constraint was not created properly - points to %.%', 
            fk_details.foreign_table_name, fk_details.foreign_column_name;
    END IF;
END $$; 
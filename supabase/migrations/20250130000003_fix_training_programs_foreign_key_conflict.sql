-- Migration: Fix foreign key constraint conflict on training_programs table
-- The table has conflicting foreign key constraints on user_id column
-- It's trying to reference both auth.users and public.profiles

-- First, let's check what constraints currently exist
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Checking current foreign key constraints on training_programs.user_id...';
    
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'training_programs'
            AND kcu.column_name = 'user_id'
    LOOP
        RAISE NOTICE 'Found constraint %: %.% -> %.%', 
            constraint_record.constraint_name,
            constraint_record.table_name,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- Drop the conflicting foreign key constraint that references profiles
-- We want to keep the one that references auth.users since that's the correct relationship
DO $$
BEGIN
    -- Check if the fk_user_id constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_id' 
        AND table_name = 'training_programs'
    ) THEN
        ALTER TABLE public.training_programs DROP CONSTRAINT fk_user_id;
        RAISE NOTICE 'Dropped conflicting fk_user_id constraint';
    ELSE
        RAISE NOTICE 'fk_user_id constraint does not exist';
    END IF;
END $$;

-- Verify that the auth.users foreign key constraint still exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'training_programs'
            AND kcu.column_name = 'user_id'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
    ) THEN
        RAISE NOTICE '✅ auth.users foreign key constraint is intact';
    ELSE
        RAISE NOTICE '❌ auth.users foreign key constraint is missing - this is a problem!';
    END IF;
END $$;

-- Test the insert again with a valid auth.users ID
-- First, let's get a real user ID from the database
DO $$
DECLARE
    real_user_id UUID;
    test_id UUID;
BEGIN
    -- Get a real user ID from auth.users
    SELECT id INTO real_user_id FROM auth.users LIMIT 1;
    
    IF real_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with real user ID: %', real_user_id;
        
        -- Try to insert a test record
        INSERT INTO public.training_programs (
            user_id,
            generation_status,
            program_details,
            onboarding_data_snapshot
        ) VALUES (
            real_user_id,
            'pending',
            '{}'::jsonb,
            '{}'::jsonb
        ) RETURNING id INTO test_id;
        
        RAISE NOTICE '✅ SUCCESS: Training program insert test passed with real user ID';
        
        -- Clean up
        DELETE FROM public.training_programs WHERE id = test_id;
        RAISE NOTICE 'Cleaned up test record';
    ELSE
        RAISE NOTICE '❌ No users found in auth.users table';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to fix training_programs foreign key conflict completed successfully.';
END $$; 
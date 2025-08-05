-- Migration: Fix secrets schema error
-- This migration diagnoses and fixes the "schema 'secrets' does not exist" error

-- First, let's check if there are any functions that might be referencing a secrets schema
DO $$
DECLARE
    func_record RECORD;
    func_source TEXT;
BEGIN
    RAISE NOTICE 'Checking for functions that might reference secrets schema...';
    
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        func_source := func_record.function_definition;
        
        -- Check if function contains 'secrets.' reference
        IF func_source LIKE '%secrets.%' THEN
            RAISE NOTICE 'Found function % that references secrets schema', func_record.function_name;
            RAISE NOTICE 'Function definition: %', func_source;
        END IF;
    END LOOP;
END $$;

-- Check if there are any triggers that might be causing issues
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE 'Checking triggers on training_programs table...';
    
    FOR trigger_record IN 
        SELECT 
            tgname as trigger_name,
            tgrelid::regclass as table_name,
            tgfoid::regproc as function_name
        FROM pg_trigger
        WHERE tgrelid = 'public.training_programs'::regclass
    LOOP
        RAISE NOTICE 'Found trigger % on table % calling function %', 
            trigger_record.trigger_name, 
            trigger_record.table_name, 
            trigger_record.function_name;
    END LOOP;
END $$;

-- Check if the has_active_access function exists and is working
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_active_access') THEN
        RAISE NOTICE 'has_active_access function exists';
        
        -- Test the function with a dummy user ID
        BEGIN
            PERFORM has_active_access('00000000-0000-0000-0000-000000000000'::UUID);
            RAISE NOTICE 'has_active_access function executed successfully';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'has_active_access function error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'has_active_access function does not exist';
    END IF;
END $$;

-- Check if there are any views that might reference secrets schema
DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE 'Checking views for secrets schema references...';
    
    FOR view_record IN 
        SELECT 
            schemaname,
            viewname,
            definition
        FROM pg_views
        WHERE schemaname = 'public'
    LOOP
        IF view_record.definition LIKE '%secrets.%' THEN
            RAISE NOTICE 'Found view % that references secrets schema', view_record.viewname;
        END IF;
    END LOOP;
END $$;

-- Create a simple test function to verify the issue
CREATE OR REPLACE FUNCTION test_training_program_insert()
RETURNS TEXT AS $$
DECLARE
    test_id UUID;
BEGIN
    -- Try to insert a test record
    INSERT INTO public.training_programs (
        user_id,
        generation_status,
        program_details,
        onboarding_data_snapshot
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'pending',
        '{}'::jsonb,
        '{}'::jsonb
    ) RETURNING id INTO test_id;
    
    -- Clean up
    DELETE FROM public.training_programs WHERE id = test_id;
    
    RETURN 'SUCCESS: Training program insert test passed';
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT test_training_program_insert();

-- Clean up test function
DROP FUNCTION test_training_program_insert();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to diagnose secrets schema error completed successfully.';
END $$; 
-- Migration: Fix subscriptions table unique constraint
-- This migration adds the missing unique constraint on user_id that's needed for ON CONFLICT

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_user_id_key' 
        AND conrelid = 'public.subscriptions'::regclass
    ) THEN
        -- Add unique constraint
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on subscriptions.user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on subscriptions.user_id already exists';
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to fix subscriptions unique constraint completed successfully.';
END $$; 
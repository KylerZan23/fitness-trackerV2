-- Migration: Add Stripe Integration Columns to Profiles Table
-- This migration adds the missing Stripe customer and subscription ID columns
-- that are required for the subscription management functionality

--------------------------------------------------
-- 1. Add Stripe customer ID column to profiles table
--------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing and subscription management';

--------------------------------------------------
-- 2. Add Stripe subscription ID column to profiles table
--------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';

--------------------------------------------------
-- 3. Create indexes for efficient Stripe-related queries
--------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id 
ON public.profiles(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

--------------------------------------------------
-- 4. Add unique constraint on stripe_customer_id to prevent duplicates
--------------------------------------------------
-- Note: This constraint will only be applied if there are no existing duplicate values
DO $$
BEGIN
    -- Check if there are any duplicate stripe_customer_id values
    IF NOT EXISTS (
        SELECT stripe_customer_id, COUNT(*)
        FROM public.profiles 
        WHERE stripe_customer_id IS NOT NULL 
        GROUP BY stripe_customer_id 
        HAVING COUNT(*) > 1
    ) THEN
        -- Add unique constraint if no duplicates exist
        ALTER TABLE public.profiles 
        ADD CONSTRAINT unique_stripe_customer_id 
        UNIQUE (stripe_customer_id);
    ELSE
        RAISE NOTICE 'Skipping unique constraint on stripe_customer_id due to existing duplicates';
    END IF;
END $$;

--------------------------------------------------
-- 5. Create helper function to get Stripe customer ID
--------------------------------------------------
CREATE OR REPLACE FUNCTION get_stripe_customer_id(user_id UUID)
RETURNS VARCHAR(255) AS $$
DECLARE
    customer_id VARCHAR(255);
BEGIN
    -- Get user's Stripe customer ID
    SELECT stripe_customer_id
    INTO customer_id
    FROM profiles
    WHERE id = user_id;

    -- Return customer ID or null if not found
    RETURN customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_stripe_customer_id(UUID) TO authenticated;

--------------------------------------------------
-- 6. Create helper function to update Stripe customer ID
--------------------------------------------------
CREATE OR REPLACE FUNCTION update_stripe_customer_id(user_id UUID, customer_id VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user's Stripe customer ID
    UPDATE profiles 
    SET stripe_customer_id = customer_id
    WHERE id = user_id;

    -- Return true if update was successful
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_stripe_customer_id(UUID, VARCHAR(255)) TO authenticated;

--------------------------------------------------
-- 7. Add comments for documentation
--------------------------------------------------
COMMENT ON FUNCTION get_stripe_customer_id(UUID) IS 'Get Stripe customer ID for a user';
COMMENT ON FUNCTION update_stripe_customer_id(UUID, VARCHAR(255)) IS 'Update Stripe customer ID for a user';

--------------------------------------------------
-- 8. Log migration completion
--------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added Stripe integration columns to profiles table';
    RAISE NOTICE 'Columns added: stripe_customer_id, stripe_subscription_id';
    RAISE NOTICE 'Indexes created for efficient Stripe-related queries';
    RAISE NOTICE 'Helper functions created: get_stripe_customer_id(), update_stripe_customer_id()';
END $$; 
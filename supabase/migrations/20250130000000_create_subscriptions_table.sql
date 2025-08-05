-- Migration: Create subscriptions table for subscription management
-- This table stores subscription data that the program generation code expects

CREATE TABLE IF NOT EXISTS public.subscriptions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to auth.users (user who owns this subscription)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Subscription status
    status VARCHAR(50) NOT NULL DEFAULT 'trialing' 
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired')),
    
    -- Trial management
    trial_end TIMESTAMPTZ,
    
    -- Stripe integration
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Subscription details
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription data for access control and billing';
COMMENT ON COLUMN public.subscriptions.user_id IS 'ID of the user who owns this subscription';
COMMENT ON COLUMN public.subscriptions.status IS 'Current status of the subscription';
COMMENT ON COLUMN public.subscriptions.trial_end IS 'When the trial period ends';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID for billing';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe customer ID for billing';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON public.subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can select their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at_trigger
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- Create a function to sync subscription data from profiles table
CREATE OR REPLACE FUNCTION sync_subscription_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update subscription record based on profile data
    INSERT INTO public.subscriptions (user_id, status, trial_end, stripe_subscription_id, stripe_customer_id)
    VALUES (
        NEW.id,
        CASE 
            WHEN NEW.is_premium = true THEN 'active'
            WHEN NEW.trial_ends_at IS NOT NULL AND NEW.trial_ends_at > NOW() THEN 'trialing'
            ELSE 'canceled'
        END,
        NEW.trial_ends_at,
        NEW.stripe_subscription_id,
        NEW.stripe_customer_id
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        trial_end = EXCLUDED.trial_end,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync subscription data when profile is updated
CREATE TRIGGER sync_subscription_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_subscription_from_profile();

-- Migrate existing profile data to subscriptions table
INSERT INTO public.subscriptions (user_id, status, trial_end, stripe_subscription_id, stripe_customer_id)
SELECT 
    id as user_id,
    CASE 
        WHEN is_premium = true THEN 'active'
        WHEN trial_ends_at IS NOT NULL AND trial_ends_at > NOW() THEN 'trialing'
        ELSE 'canceled'
    END as status,
    trial_ends_at,
    stripe_subscription_id,
    stripe_customer_id
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to create subscriptions table completed successfully.';
END $$; 
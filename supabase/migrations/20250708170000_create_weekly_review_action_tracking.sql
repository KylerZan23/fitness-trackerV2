-- Migration: Create weekly review action tracking table
-- Created: 2025-01-08 17:00:00
-- Description: Table to store user progress on AI Weekly Review suggested actions

-- Create the weekly_review_action_tracking table
CREATE TABLE weekly_review_action_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Weekly review context
    review_week_start DATE NOT NULL, -- Monday of the review week
    actionable_tip TEXT NOT NULL, -- The suggested action from the review
    
    -- Progress tracking
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
    progress_notes TEXT, -- User notes about their progress
    completion_date TIMESTAMP WITH TIME ZONE, -- When they marked it complete
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one action per user per week
    UNIQUE(user_id, review_week_start)
);

-- Create indexes for efficient querying
CREATE INDEX idx_weekly_review_action_tracking_user_id ON weekly_review_action_tracking(user_id);
CREATE INDEX idx_weekly_review_action_tracking_week_start ON weekly_review_action_tracking(review_week_start);
CREATE INDEX idx_weekly_review_action_tracking_status ON weekly_review_action_tracking(status);
CREATE INDEX idx_weekly_review_action_tracking_user_week ON weekly_review_action_tracking(user_id, review_week_start);

-- Enable RLS
ALTER TABLE weekly_review_action_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own action tracking
CREATE POLICY "Users can view their own weekly review action tracking" ON weekly_review_action_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own action tracking
CREATE POLICY "Users can insert their own weekly review action tracking" ON weekly_review_action_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own action tracking
CREATE POLICY "Users can update their own weekly review action tracking" ON weekly_review_action_tracking
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own action tracking
CREATE POLICY "Users can delete their own weekly review action tracking" ON weekly_review_action_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_review_action_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_weekly_review_action_tracking_updated_at
    BEFORE UPDATE ON weekly_review_action_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_review_action_tracking_updated_at();

-- Add comment for documentation
COMMENT ON TABLE weekly_review_action_tracking IS 'Stores user progress tracking on AI Weekly Review suggested actionable tips';
COMMENT ON COLUMN weekly_review_action_tracking.review_week_start IS 'Monday of the week this review was generated for (YYYY-MM-DD format)';
COMMENT ON COLUMN weekly_review_action_tracking.actionable_tip IS 'The specific actionable tip suggested by the AI Weekly Review';
COMMENT ON COLUMN weekly_review_action_tracking.status IS 'Current progress status: pending, in_progress, completed, skipped';
COMMENT ON COLUMN weekly_review_action_tracking.progress_notes IS 'Optional user notes about their progress on this action';
COMMENT ON COLUMN weekly_review_action_tracking.completion_date IS 'When the user marked the action as completed'; 
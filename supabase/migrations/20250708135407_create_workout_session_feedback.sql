-- Migration: Create workout session feedback table
-- Created: 2025-01-08 13:54:07
-- Description: Table to store user feedback on workout sessions (too easy, just right, too hard)

-- Create the workout_session_feedback table
CREATE TABLE workout_session_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL CHECK (feedback IN ('easy', 'good', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one feedback per user per workout session
    UNIQUE(user_id, workout_group_id)
);

-- Create index for efficient querying
CREATE INDEX idx_workout_session_feedback_user_id ON workout_session_feedback(user_id);
CREATE INDEX idx_workout_session_feedback_workout_group_id ON workout_session_feedback(workout_group_id);
CREATE INDEX idx_workout_session_feedback_created_at ON workout_session_feedback(created_at);

-- Enable RLS
ALTER TABLE workout_session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own feedback
CREATE POLICY "Users can view their own workout session feedback" ON workout_session_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own workout session feedback" ON workout_session_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own feedback
CREATE POLICY "Users can update their own workout session feedback" ON workout_session_feedback
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own feedback
CREATE POLICY "Users can delete their own workout session feedback" ON workout_session_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE workout_session_feedback IS 'Stores user feedback on completed workout sessions to track exercise difficulty and program effectiveness';
COMMENT ON COLUMN workout_session_feedback.feedback IS 'User feedback: easy (too easy), good (just right), hard (too hard)'; 
-- Migration: Create pending_workout_sessions table
-- This table temporarily stores workout data before a user starts the session,
-- avoiding the need to pass large data objects in URL query parameters.

CREATE TABLE IF NOT EXISTS public.pending_workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_data JSONB NOT NULL,
  context_data JSONB,
  readiness_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pending_workout_sessions IS 'Temporarily stores planned workout data before a session is actively started by the user.';
COMMENT ON COLUMN public.pending_workout_sessions.id IS 'Unique identifier for the pending session.';
COMMENT ON COLUMN public.pending_workout_sessions.user_id IS 'The user who initiated the session.';
COMMENT ON COLUMN public.pending_workout_sessions.workout_data IS 'The planned WorkoutDay object.';
COMMENT ON COLUMN public.pending_workout_sessions.context_data IS 'Program context for linking the workout.';
COMMENT ON COLUMN public.pending_workout_sessions.readiness_data IS 'User readiness responses if provided.';
COMMENT ON COLUMN public.pending_workout_sessions.created_at IS 'Timestamp for potential cleanup of stale sessions.';

-- Create indexes for efficient querying and cleanup
CREATE INDEX IF NOT EXISTS idx_pending_workout_sessions_user_id ON public.pending_workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_workout_sessions_created_at ON public.pending_workout_sessions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pending_workout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own pending sessions
CREATE POLICY "Users can manage their own pending workout sessions"
  ON public.pending_workout_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 
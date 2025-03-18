-- Add workout_groups table
CREATE TABLE IF NOT EXISTS public.workout_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT workout_groups_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add workout_group_id to workouts table
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS workout_group_id UUID REFERENCES public.workout_groups(id) ON DELETE CASCADE;

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_workout_groups_user_id ON public.workout_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_workout_group_id ON public.workouts(workout_group_id);

-- Update RLS policies to include workout groups
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own workout groups"
  ON public.workout_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout groups"
  ON public.workout_groups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout groups"
  ON public.workout_groups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout groups"
  ON public.workout_groups
  FOR DELETE
  USING (auth.uid() = user_id); 
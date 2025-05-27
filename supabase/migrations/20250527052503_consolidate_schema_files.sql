-- Consolidate Schema Files from src/ directories
-- This migration consolidates schema definitions that were scattered in src/ directories
-- Note: Some tables may already exist from previous migrations

--------------------------------------------------
-- 1. Profiles table schema (may already exist)
--------------------------------------------------
-- This is likely already created, but ensuring it has all necessary columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER DEFAULT 0,
  fitness_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------
-- 2. Workouts table schema (may already exist)
--------------------------------------------------
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC(6, 2) NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add workout_group_id column if it doesn't exist (from src/db/migrations.sql)
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS workout_group_id UUID REFERENCES public.workout_groups(id) ON DELETE CASCADE;

--------------------------------------------------
-- 3. Workout groups table (may already exist)
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT workout_groups_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

--------------------------------------------------
-- 4. RLS policies for workouts table
--------------------------------------------------
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Users can view their own workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can view their own workouts') THEN
    CREATE POLICY "Users can view their own workouts" ON workouts 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can insert their own workouts') THEN
    CREATE POLICY "Users can insert their own workouts" ON workouts 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can update their own workouts') THEN
    CREATE POLICY "Users can update their own workouts" ON workouts 
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can delete their own workouts') THEN
    CREATE POLICY "Users can delete their own workouts" ON workouts 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

--------------------------------------------------
-- 5. RLS policies for workout_groups table
--------------------------------------------------
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Users can insert their own workout groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_groups' AND policyname = 'Users can insert their own workout groups') THEN
    CREATE POLICY "Users can insert their own workout groups"
      ON public.workout_groups
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can view their own workout groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_groups' AND policyname = 'Users can view their own workout groups') THEN
    CREATE POLICY "Users can view their own workout groups"
      ON public.workout_groups
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can update their own workout groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_groups' AND policyname = 'Users can update their own workout groups') THEN
    CREATE POLICY "Users can update their own workout groups"
      ON public.workout_groups
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own workout groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_groups' AND policyname = 'Users can delete their own workout groups') THEN
    CREATE POLICY "Users can delete their own workout groups"
      ON public.workout_groups
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

--------------------------------------------------
-- 6. Indexes for better performance
--------------------------------------------------
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts (user_id);
CREATE INDEX IF NOT EXISTS workouts_created_at_idx ON workouts (created_at);
CREATE INDEX IF NOT EXISTS idx_workout_groups_user_id ON public.workout_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_workout_group_id ON public.workouts(workout_group_id);

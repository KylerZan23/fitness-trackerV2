-- Database Schema for FitnessTracker

-- Profiles Table (already exists in previous setup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER DEFAULT 0,
  fitness_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workouts Table
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

-- Add RLS policies for workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own workouts
CREATE POLICY "Users can view their own workouts" ON workouts 
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" ON workouts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own workouts
CREATE POLICY "Users can update their own workouts" ON workouts 
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" ON workouts 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts (user_id);
CREATE INDEX IF NOT EXISTS workouts_created_at_idx ON workouts (created_at); 
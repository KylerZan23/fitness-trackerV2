-- Migration: Deprecate SECURITY DEFINER functions and create a new RLS policy for the leaderboard
-- Created: 2023-10-27
-- Description: This migration removes the get_strength_leaderboard and get_user_rank_for_lift functions
-- and adds a new RLS policy to the workouts table to allow read access for the leaderboard.

-- Step 1: Create a new RLS policy on the workouts table
CREATE POLICY "Allow read access for leaderboard"
ON public.workouts
FOR SELECT
TO authenticated
USING (true);

-- Step 2: Drop the deprecated SECURITY DEFINER functions
DROP FUNCTION IF EXISTS public.get_strength_leaderboard(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_user_rank_for_lift(UUID, TEXT);

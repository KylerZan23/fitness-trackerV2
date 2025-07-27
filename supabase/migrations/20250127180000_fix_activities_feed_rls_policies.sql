-- Migration: Fix Activities Feed RLS Policies
-- Issue: Users cannot see workouts from followed users due to restrictive RLS policies
-- Solution: Add policies to allow viewing workouts/workout_groups from followed users

-- Add policy to allow users to view workouts from users they follow
CREATE POLICY "Users can view followed users workouts" ON workouts
  FOR SELECT
  USING (
    user_id IN (
      SELECT following_id 
      FROM user_followers 
      WHERE follower_id = auth.uid()
    )
  );

-- Add policy to allow users to view workout_groups from users they follow  
CREATE POLICY "Users can view followed users workout groups" ON workout_groups
  FOR SELECT
  USING (
    user_id IN (
      SELECT following_id
      FROM user_followers  
      WHERE follower_id = auth.uid()
    )
  );

-- Add indexes to optimize the RLS policy queries
CREATE INDEX IF NOT EXISTS idx_user_followers_follower_lookup 
  ON user_followers(follower_id, following_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can view followed users workouts" ON workouts IS 
  'Allows users to view workouts from users they follow via user_followers table';

COMMENT ON POLICY "Users can view followed users workout groups" ON workout_groups IS 
  'Allows users to view workout groups from users they follow via user_followers table'; 
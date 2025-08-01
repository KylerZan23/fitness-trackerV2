-- Remove Strava-related columns from the profiles table
ALTER TABLE profiles
DROP COLUMN IF EXISTS strava_connected,
DROP COLUMN IF EXISTS strava_refresh_token,
DROP COLUMN IF EXISTS strava_access_token,
DROP COLUMN IF EXISTS strava_token_expires_at,
DROP COLUMN IF EXISTS strava_athlete_id;

-- Add onboarding_responses JSONB column to profiles table
-- This column will store the user's responses to the onboarding questionnaire

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_responses JSONB;

COMMENT ON COLUMN public.profiles.onboarding_responses
IS 'Stores user responses to the onboarding questionnaire in JSONB format. Example structure: {"primaryGoal": "Muscle Gain", "secondaryGoal": "Strength Gain", "trainingFrequencyDays": 4, "sessionDuration": "60-90 minutes", "equipment": ["Full Gym", "Dumbbells"], "exercisePreferences": "Enjoy squats, dislike burpees", "injuriesLimitations": "Slight lower back pain on deadlifts"}';

-- Add onboarding_completed boolean column to track completion status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.onboarding_completed
IS 'Boolean flag indicating whether the user has completed the onboarding questionnaire for the AI Training Program Generator'; 
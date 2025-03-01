-- Add muscle_group column to workouts table
ALTER TABLE workouts 
ADD COLUMN muscle_group VARCHAR(20) DEFAULT 'Other' NOT NULL;

-- Create a function to automatically set muscle_group based on exercise_name
CREATE OR REPLACE FUNCTION set_muscle_group()
RETURNS TRIGGER AS $$
BEGIN
  CASE
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%squat%', '%lunge%', '%leg press%', '%deadlift%', '%hamstring%', '%calf%', '%hip thrust%'])
      THEN NEW.muscle_group := 'Legs';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%bench press%', '%push-up%', '%push up%', '%fly%', '%chest%', '%dumbbell press%'])
      THEN NEW.muscle_group := 'Chest';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%pull-up%', '%chin-up%', '%lat%', '%row%', '%pull up%', '%chin up%', '%romanian%'])
      THEN NEW.muscle_group := 'Back';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%overhead%', '%arnold%', '%lateral%', '%front raise%', '%rear delt%', '%upright row%', '%shoulder%'])
      THEN NEW.muscle_group := 'Shoulders';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%bicep%', '%curl%', '%tricep%', '%skull%', '%close-grip%', '%dip%'])
      THEN NEW.muscle_group := 'Arms';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%plank%', '%crunch%', '%sit-up%', '%sit up%', '%twist%', '%hanging leg%', '%woodchop%', '%core%', '%ab%'])
      THEN NEW.muscle_group := 'Core';
    WHEN NEW.exercise_name ILIKE ANY(ARRAY['%run%', '%jog%', '%sprint%', '%cycling%', '%bike%', '%jump%', '%rowing%', '%swim%', '%climber%', '%cardio%'])
      THEN NEW.muscle_group := 'Cardio';
    ELSE
      NEW.muscle_group := 'Other';
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set muscle_group
CREATE TRIGGER set_workout_muscle_group
BEFORE INSERT OR UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION set_muscle_group();

-- Update existing workouts with appropriate muscle groups
UPDATE workouts SET muscle_group = 
  CASE
    WHEN exercise_name ILIKE ANY(ARRAY['%squat%', '%lunge%', '%leg press%', '%deadlift%', '%hamstring%', '%calf%', '%hip thrust%'])
      THEN 'Legs'
    WHEN exercise_name ILIKE ANY(ARRAY['%bench press%', '%push-up%', '%push up%', '%fly%', '%chest%', '%dumbbell press%'])
      THEN 'Chest'
    WHEN exercise_name ILIKE ANY(ARRAY['%pull-up%', '%chin-up%', '%lat%', '%row%', '%pull up%', '%chin up%', '%romanian%'])
      THEN 'Back'
    WHEN exercise_name ILIKE ANY(ARRAY['%overhead%', '%arnold%', '%lateral%', '%front raise%', '%rear delt%', '%upright row%', '%shoulder%'])
      THEN 'Shoulders'
    WHEN exercise_name ILIKE ANY(ARRAY['%bicep%', '%curl%', '%tricep%', '%skull%', '%close-grip%', '%dip%'])
      THEN 'Arms'
    WHEN exercise_name ILIKE ANY(ARRAY['%plank%', '%crunch%', '%sit-up%', '%sit up%', '%twist%', '%hanging leg%', '%woodchop%', '%core%', '%ab%'])
      THEN 'Core'
    WHEN exercise_name ILIKE ANY(ARRAY['%run%', '%jog%', '%sprint%', '%cycling%', '%bike%', '%jump%', '%rowing%', '%swim%', '%climber%', '%cardio%'])
      THEN 'Cardio'
    ELSE
      'Other'
  END
WHERE TRUE; 
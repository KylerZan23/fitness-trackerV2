-- Enhanced Muscle Group Categorization Migration
-- This migration updates the muscle group categorization logic to handle LLM-generated exercise names

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS set_workout_muscle_group ON workouts;
DROP FUNCTION IF EXISTS set_muscle_group();

-- Create enhanced muscle group categorization function
CREATE OR REPLACE FUNCTION enhanced_muscle_group_categorization(exercise_name TEXT)
RETURNS VARCHAR(20) AS $$
DECLARE
  normalized_name TEXT;
  leg_score INTEGER := 0;
  chest_score INTEGER := 0;
  back_score INTEGER := 0;
  shoulder_score INTEGER := 0;
  arm_score INTEGER := 0;
  core_score INTEGER := 0;
  cardio_score INTEGER := 0;
  max_score INTEGER := 0;
  result VARCHAR(20) := 'Other';
BEGIN
  normalized_name := LOWER(TRIM(exercise_name));
  
  -- Return 'Other' for empty or null exercise names
  IF normalized_name IS NULL OR normalized_name = '' THEN
    RETURN 'Other';
  END IF;

  -- LEGS scoring - Primary leg movements and variations
  IF normalized_name ~ '(squat|lunge|leg press|deadlift|hip thrust|glute bridge)' THEN leg_score := leg_score + 3; END IF;
  IF normalized_name ~ '(quad|hamstring|glute|calf|adductor|abductor)' THEN leg_score := leg_score + 3; END IF;
  IF normalized_name ~ '(step up|step-up|split squat|bulgarian|pistol squat)' THEN leg_score := leg_score + 3; END IF;
  IF normalized_name ~ '(leg curl|leg extension|hack squat|front squat|goblet squat)' THEN leg_score := leg_score + 3; END IF;
  IF normalized_name ~ '(romanian deadlift|romanian deadlifts|rdl|good morning|single leg deadlift|sumo deadlift)' THEN leg_score := leg_score + 5; END IF;

  -- CHEST scoring
  IF normalized_name ~ '(bench press|chest press|push up|push-up|pushup)' THEN chest_score := chest_score + 3; END IF;
  IF normalized_name ~ '(incline|decline|flat bench|dumbbell press|barbell press)' THEN chest_score := chest_score + 3; END IF;
  IF normalized_name ~ '(fly|flye|pec fly|chest fly|cable fly)' THEN chest_score := chest_score + 3; END IF;
  IF normalized_name ~ '(machine press|dumbbell bench|cable press)' THEN chest_score := chest_score + 3; END IF;

  -- BACK scoring
  IF normalized_name ~ '(pull up|pull-up|pullup|chin up|chin-up|chinup)' THEN back_score := back_score + 3; END IF;
  IF normalized_name ~ '(lat pulldown|pulldown)' THEN back_score := back_score + 3; END IF;
  IF normalized_name ~ '(row|bent over row|bent-over row|seated row|cable row)' THEN back_score := back_score + 3; END IF;
  IF normalized_name ~ '(dumbbell row|barbell row|t-bar row|chest supported row)' THEN back_score := back_score + 3; END IF;
  IF normalized_name ~ '(romanian deadlift|rdl|rack pull)' THEN back_score := back_score + 5; END IF;
  IF normalized_name ~ '(lat|latissimus|rhomboid|middle trap|rear delt)' THEN back_score := back_score + 3; END IF;

  -- SHOULDERS scoring
  IF normalized_name ~ '(overhead press|shoulder press|military press|strict press)' THEN shoulder_score := shoulder_score + 3; END IF;
  IF normalized_name ~ '(arnold press|dumbbell press|seated press|standing press)' THEN shoulder_score := shoulder_score + 3; END IF;
  IF normalized_name ~ '(lateral raise|side raise|lateral fly|side fly)' THEN shoulder_score := shoulder_score + 3; END IF;
  IF normalized_name ~ '(front raise|front delt|anterior delt)' THEN shoulder_score := shoulder_score + 3; END IF;
  IF normalized_name ~ '(rear delt|rear fly|reverse fly|face pull)' THEN shoulder_score := shoulder_score + 3; END IF;
  IF normalized_name ~ '(upright row|shrug|handstand push up|pike push up)' THEN shoulder_score := shoulder_score + 3; END IF;

  -- ARMS scoring
  IF normalized_name ~ '(bicep curl|biceps curl|curl|hammer curl|preacher curl)' THEN arm_score := arm_score + 3; END IF;
  IF normalized_name ~ '(concentration curl|barbell curl|dumbbell curl|cable curl)' THEN arm_score := arm_score + 3; END IF;
  IF normalized_name ~ '(tricep|triceps|dip|skull crusher|lying tricep|overhead tricep)' THEN arm_score := arm_score + 3; END IF;
  IF normalized_name ~ '(tricep pushdown|tricep extension|close grip|close-grip)' THEN arm_score := arm_score + 3; END IF;
  IF normalized_name ~ '(diamond push up|diamond pushup|tricep dip)' THEN arm_score := arm_score + 3; END IF;

  -- CORE scoring
  IF normalized_name ~ '(plank|side plank|front plank|elbow plank)' THEN core_score := core_score + 3; END IF;
  IF normalized_name ~ '(crunch|sit up|sit-up|situp|bicycle crunch)' THEN core_score := core_score + 3; END IF;
  IF normalized_name ~ '(russian twist|wood chop|woodchop|cable twist|oblique)' THEN core_score := core_score + 3; END IF;
  IF normalized_name ~ '(hanging leg raise|hanging knee raise|toes to bar)' THEN core_score := core_score + 3; END IF;
  IF normalized_name ~ '(dead bug|bird dog|mountain climber|ab wheel|hollow body)' THEN core_score := core_score + 3; END IF;
  IF normalized_name ~ '(v-up|toe touch|leg raise|knee raise)' THEN core_score := core_score + 3; END IF;

  -- CARDIO scoring
  IF normalized_name ~ '(run|jog|sprint|treadmill|incline walk)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(bike|cycle|cycling|stationary bike|spin)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(rowing|rower|erg)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(jump|jumping jack|burpee|jump rope|box jump)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(swim|swimming|freestyle|backstroke)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(elliptical|stair climber|step up|step ups|cardio)' THEN cardio_score := cardio_score + 3; END IF;
  IF normalized_name ~ '(hiit|conditioning|metabolic|circuit)' THEN cardio_score := cardio_score + 3; END IF;

  -- Determine the muscle group with the highest score
  max_score := GREATEST(leg_score, chest_score, back_score, shoulder_score, arm_score, core_score, cardio_score);
  
  IF max_score = 0 THEN
    result := 'Other';
  ELSIF leg_score = max_score THEN
    result := 'Legs';
  ELSIF chest_score = max_score THEN
    result := 'Chest';
  ELSIF back_score = max_score THEN
    result := 'Back';
  ELSIF shoulder_score = max_score THEN
    result := 'Shoulders';
  ELSIF arm_score = max_score THEN
    result := 'Arms';
  ELSIF core_score = max_score THEN
    result := 'Core';
  ELSIF cardio_score = max_score THEN
    result := 'Cardio';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger function using enhanced categorization
CREATE OR REPLACE FUNCTION set_muscle_group_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  NEW.muscle_group := enhanced_muscle_group_categorization(NEW.exercise_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set muscle_group using enhanced logic
CREATE TRIGGER set_workout_muscle_group_enhanced
BEFORE INSERT OR UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION set_muscle_group_enhanced();

-- Update existing workouts with enhanced categorization
UPDATE workouts 
SET muscle_group = enhanced_muscle_group_categorization(exercise_name)
WHERE muscle_group = 'Other' OR muscle_group IS NULL;

-- Create index for better performance on muscle_group queries
CREATE INDEX IF NOT EXISTS idx_workouts_muscle_group ON workouts(muscle_group);
CREATE INDEX IF NOT EXISTS idx_workouts_exercise_name ON workouts(exercise_name);

-- Add comment documenting the enhancement
COMMENT ON FUNCTION enhanced_muscle_group_categorization(TEXT) IS 
'Enhanced muscle group categorization that handles LLM-generated exercise name variations using comprehensive keyword matching and scoring.';

COMMENT ON TRIGGER set_workout_muscle_group_enhanced ON workouts IS 
'Automatically categorizes exercises into muscle groups using enhanced keyword-based algorithm that handles equipment variations and LLM-generated exercise names.'; 
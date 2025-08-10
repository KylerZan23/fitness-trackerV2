# Neural: Use Onboarding PRs for Concrete Weight Suggestions

## Overview
Neural-generated programs did not surface concrete weight suggestions even when users provided PRs for Squat/Bench/Deadlift during onboarding. This implementation adds deterministic, kg-based load suggestions post-generation using stored PRs and the prescribed reps/RPE.

## Changes
- Post-processing in `src/services/neuralAPI.ts`:
  - Append suggested absolute loads for big-3 exercises based on onboarding PRs.
  - Uses RPE first, then rep-based percentage tables.
  - Rounds to nearest 2.5 kg.
  - Merges with AI-provided `load` string as `"<ai load> | ~{kg} kg ({percent}% 1RM)"`.

## Logic
- Lift detection: infer `squat | bench | deadlift` from exercise name.
- Percent selection:
  - From RPE: 6→60%, 7→70%, 7.5→75%, 8→80%, 8.5→87.5%, 9→90%, 9.5+→100%.
  - From reps: {1:100, 2:95, 3:92, 4:90, 5:87.5, 6:85, 7:82.5, 8:80, 9:77.5, 10:75, 11:72.5, 12:70}.
- Storage unit: PRs are already stored in kg per ADR-044; suggestions therefore output kg.

## Tradeoffs
- Only big-3 suggestions; other exercises keep AI load text only.
- Name-based lift inference may miss exotic names; can expand dictionary later.

## QA
- Onboarding with known PRs (e.g., Squat 180kg, Bench 120kg, Deadlift 220kg) should show `load` fields including `~{kg} kg` for those lifts.
- Vary RPE and reps to verify percent mapping.
- Ensure no suggestions appear when PRs are absent.

## Next Steps
- Expand exercise-to-lift mapping and support OHP as PR source.
- Respect user display unit preference by converting kg→lbs in UI layer.


# Implementation Plan: Fix Training Program Generation Validation Error

## Context
User onboarding triggers AI program generation via `generateTrainingProgram` in `src/app/_actions/aiProgramActions.ts`. The LLM sometimes assigns `focus` values of `Squat`, `Bench`, and `Deadlift` for individual workout days. These values are not in `WorkoutFocusEnum`, causing Zod validation to fail and preventing program creation.

## Goals
1. Allow legitimate lift-specific focus names (`Squat`, `Bench`, `Deadlift`, `Overhead Press`) without overly relaxing validation.
2. Maintain type-safety and future extensibility for additional lift-specific focuses.
3. Resolve current onboarding → program generation flow so users land on `/program` with an active program.

## Approach
1. **Extend `WorkoutFocusEnum`** in `aiProgramActions.ts` to include commonly returned anchor lifts:
   - `"Squat"`
   - `"Bench"`
   - `"Deadlift"`
   - `"Overhead Press"`
2. **Regenerate `TrainingProgramSchema`** automatically (no change needed—enum extension suffices).
3. **Add quick unit test** in `src/__tests__/actions/aiProgramActions.test.ts` to assert that validation passes for a minimal program containing each new focus value.
4. **Update documentation**
   - Update `docs/e1rm-calculation-system.md` (if it references focuses).
   - Add changelog entry in `docs/implementation_plans/` (this file).
5. **No DB schema changes**—only runtime validation.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| LLM may generate other unexpected focus strings | Enumerate additional common lifts; if failures recur, consider switching to `z.string()` with warning logs. |
| Tests may rely on the previous enum list | Update affected tests to include new enum options. |

## Steps
1. Modify enum and commit.
2. Run `yarn test` to ensure all tests pass.
3. Manually run onboarding flow locally to confirm program generation succeeds.
4. Push changes and create PR.

## Acceptance Criteria
- Onboarding completes and redirects to `/program` displaying the generated program.
- No Zod validation errors for "Squat", "Bench", "Deadlift", or "Overhead Press" focuses.
- All automated tests pass. 
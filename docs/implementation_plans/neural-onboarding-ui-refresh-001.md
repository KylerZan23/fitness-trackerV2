## Neural Onboarding UI Refresh (Pass 1)

### Scope
- Align Step 1 (Primary Focus) with the provided reference design.
- Align progress indicator step names and count (6 steps) with the reference.
- Keep functional logic unchanged; visuals only.

### Observations
- Current progress indicator shows 5 steps and labels that differ from the reference.
- `primaryFocus` question renders as a vertical list; reference shows three horizontal cards.

### Changes
- Update `NEURAL_ONBOARDING_STEPS` to six steps with labels:
  1. Primary Focus
  2. Experience
  3. Session Duration
  4. Equipment
  5. Days/Week
  6. Optional PRs
- Update `NeuralOnboardingFlow` internal step titles to match the labels above.
- Enhance `NeuralQuestionCard` with `optionsLayout: 'stack' | 'grid'` (default 'stack') for single-select.
- Configure `primaryFocus` to use `optionsLayout: 'grid'` and update option labels/descriptions:
  - Hypertrophy — Build muscle size and shape
  - Strength — Lift heavier, get stronger
  - General Fitness — Move better, feel better

### Non-Goals (future passes)
- Rework typography system or global theme.
- Implement icons inside each focus card.
- Re-style other steps; those will be handled incrementally in later passes.

### Risks
- Minor style regressions in other single-select questions due to layout prop; mitigated by defaulting to 'stack'.

### Test Plan
- Navigate to `/neural/onboarding`.
- Verify progress indicator shows 6 steps and correct percentage increments.
- On Step 1, ensure options display as three cards in a responsive grid and selection works.
- Lint for TypeScript and UI components; fix any typing issues.



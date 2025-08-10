## Deterministic PPLx2 Split + Guardian Harmonizer (Single-Pass)

### Goal
Produce science-consistent weekly programs by enforcing a deterministic split and weekly set targets without adding multi-stage generation.

### Scope
- 6-day advanced hypertrophy defaults to PPLx2 (Mon Push, Tue Pull, Wed Legs, Thu Push, Fri Pull, Sat Legs).
- Strength focus: 10–15 sets per muscle/week.
- General fitness: 6–9 sets per muscle/week.
- Hypertrophy: experience-scaled within 12–20 sets/week:
  - Beginner: 12–14
  - Intermediate: 12–18
  - Advanced: 14–20

### Approach
1) Prompt reinforcement (single-pass):
   - When primaryFocus=hypertrophy, experienceLevel=advanced, trainingDaysPerWeek=6: inject an explicit PPLx2 day-by-day split with “do not deviate”.
   - Always embed per-focus weekly set targets; require that sums per muscle land within the specified ranges.

2) Guardian/Harmonizer (post-process, non-rejecting):
   - Normalize focus labels to PPL/PPL/Legs for the 6-day hypertrophy case.
   - Count per-muscle weekly sets and harmonize within target ranges by adjusting accessory set counts first, respecting sessionDuration.
   - If necessary, minimally add/remove accessory sets or a fallback accessory exercise when a muscle is missing entirely from a given day type.
   - Produce human-readable notes about corrections.

3) Validation & Logging:
   - Extend validation layer with split/volume checks that return advisories (no hard rejection).
   - Log deviations and harmonizer deltas for observability.

### Files
- Edit: `src/services/neuralAPI.ts` (prompt injection for deterministic PPLx2 and set targets)
- Edit: `src/services/programGenerator.ts` (invoke guardian)
- New: `src/lib/training/exerciseMuscleMap.ts` (heuristic exercise→muscle mapping)
- New: `src/lib/training/guardian.ts` (template enforcement, volume estimation, harmonization, notes)
- New: `src/lib/validation/trainingRules.ts` (optional, non-blocking rules helpers)
- Tests: `src/__tests__/lib/guardian.test.ts`
- Docs: ADR and README updates

### Risks & Mitigation
- Over-constraining creativity → Only constrain split and weekly totals; allow variety within days.
- Session time overruns → Prioritize anchor + primary; cap accessories.

### Rollout
- Default ON for 6-day advanced hypertrophy; extend later to additional frequencies.



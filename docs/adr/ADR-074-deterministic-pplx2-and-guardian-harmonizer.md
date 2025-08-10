# ADR-074: Deterministic PPLx2 Split and Guardian Harmonizer (Single-Pass)

## Status
Accepted

## Context
AI-generated weekly programs occasionally produced hybrid or incoherent splits (e.g., mixing active recovery on a training day, labeling lower body strength within hypertrophy focus) and failed to consistently meet evidence-based weekly set targets for each muscle group. Validation focused on structure rather than training science, and split utilities in the codebase were not applied in the active generation path.

## Decision
Introduce a deterministic split and a non-rejecting guardian harmonizer while preserving a single-pass generation flow.

### Deterministic Split
For users with primary focus = hypertrophy, experience level = advanced, and trainingDaysPerWeek = 6, enforce a PPLx2 split:
- Mon: Push
- Tue: Pull
- Wed: Legs
- Thu: Push
- Fri: Pull
- Sat: Legs

### Weekly Set Targets
- Hypertrophy: experience-scaled within 12–20 sets/week
  - Beginner: 12–14
  - Intermediate: 12–18
  - Advanced: 14–20
- Strength (powerlifting): 10–15 sets/week
- General fitness: 6–9 sets/week

### Guardian/Harmonizer
Post-process the single-pass LLM output to:
- Normalize day focus labels to the expected template.
- Estimate per-muscle weekly set counts and harmonize totals within target ranges by adjusting accessory volume first, preserving sessionDuration constraints and prioritizing anchor + primary movements.
- Emit non-fatal advisory notes logging corrections and set deltas.

## Consequences
- More consistent, science-aligned plans without changing the response format.
- Additional logic modules for exercise→muscle mapping, set counting, and harmonization.
- Improved observability of deviations via structured logs and notes.

## Alternatives Considered
- Multi-stage generation with macro scaffolding: rejected per requirement to remain single-pass.
- Hard-rejecting invalid outputs: rejected; UX would suffer and retries increase costs.

## Implementation
- Edit prompt construction in `src/services/neuralAPI.ts` to inject the deterministic split and weekly set targets when conditions match.
- Add guardian utilities under `src/lib/training/` and wire them in `src/services/programGenerator.ts` before persistence.
- Extend validation with non-blocking rule checks and log advisories.



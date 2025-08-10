# ADR-073: PR-Based Weight Suggestions in Neural Programs

## Status
Accepted

## Date
2025-08-10

## Context
Users enter PRs for Squat/Bench/Deadlift during onboarding to enable tailored loading. Neural programs previously returned textual guidance (RPE/%1RM) but no concrete absolute weights in exercises, leading to ambiguity for many users.

## Decision
Enhance the Neural service to compute kg-based weight suggestions post-generation using PRs and the prescribed RPE/reps, and merge this into each main exercise's `load` string.

## Details
- Implemented in `src/services/neuralAPI.ts` during transformation from raw AI output to internal types.
- If PRs are present, compute percent from RPE (preferred) or reps fallback, then round to nearest 2.5 kg.
- Append formatted suggestion to `load` as `"<ai load> | ~{kg} kg ({percent}% 1RM)"`.
- Lift inference supports big-3 via name matching; extensible.

## Alternatives Considered
- Prompt-only approach asking the LLM to include absolute loads. Rejected due to inconsistency across models and schema drift risk.
- Client-side calculation. Rejected to keep single source of truth server-side and ensure persistence.

## Consequences
Positive:
- Clear, actionable loads for users with PRs.
- Deterministic and consistent output across generations.

Negative:
- Name-based inference may miss variants and non-standard names.
- Only covers big-3 for now.

## Follow-ups
- Expand mapping to overhead press and common variants.
- Respect user display unit preference in UI (convert kg→lbs when needed).
- Consider storing computed suggestions separately for analytics.


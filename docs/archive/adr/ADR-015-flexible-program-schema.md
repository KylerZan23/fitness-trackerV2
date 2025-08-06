# ADR-015: Refactor Training Program Schema to a Flexible Session-Based Model

**Status:** Accepted

**Date:** 2024-08-05

## Context

The initial architecture for AI-generated training programs utilized a deeply nested, hierarchical JSON structure. The schema was defined with `phases`, which contained `weeks`, which in turn contained `days`. This structure was intended to provide a rich, detailed, and well-organized training plan.

However, the AI model (`gpt-4o-mini`) consistently failed to generate JSON that reliably adhered to this rigid schema. This resulted in frequent and persistent Zod validation errors on the backend, causing the entire program generation process to fail. The feature was functionally unusable, leading to a poor user experience where users would complete onboarding but never receive a training program.

The primary failure modes observed were:
1.  The AI would omit the `exercises` array within a `day` object.
2.  The AI would omit the entire `sessions` (previously `days`) array.
3.  The AI would fail to generate the correct nesting of `phases` and `weeks`.

## Decision

To address the reliability crisis, we have fundamentally refactored the training program schema. We have moved from the rigid, hierarchical `phases` model to a simpler, flatter, and more flexible **session-based model**.

The new core structure is a single array of `sessions`.

```typescript
// Old Structure Snippet
interface TrainingProgram {
  phases: {
    weeks: {
      days: {
        exercises: any[]
      }[]
    }[]
  }[]
}

// New Structure Snippet
interface TrainingProgram {
  sessions?: {
    week?: number;
    dayOfWeek?: number | string;
    focus?: string;
    exercises?: any[];
  }[];
}
```

Furthermore, nearly all fields within the `trainingProgram` and its child `sessions` and `exercises` have been made **optional**. The Zod schema now uses `.optional()` extensively and `.passthrough()` at the root to ignore any extra fields the AI might add.

This decision prioritizes **system reliability and resilience** over data richness and structural integrity.

## Consequences

### Positive

*   **Increased Reliability:** The program generation feature is now functional. The system can successfully receive, validate, and store a program from the AI, even if the data is sparse or missing fields. This unblocks the core user flow.
*   **Reduced Errors:** Zod validation errors related to schema mismatches have been virtually eliminated.
*   **Improved User Experience:** Users can now successfully receive a training program after onboarding, preventing a critical drop-off point.

### Negative

*   **Data Sparsity:** The generated programs are often minimal, sometimes lacking workout `sessions` or `exercises` within those sessions. The user is presented with a program that may not be immediately useful.
*   **Loss of Granularity:** The rich hierarchical data (phases, weeks) has been lost. This impacts our ability to build features based on this structure, such as:
    *   Phase-based progress tracking.
    *   Weekly check-ins and adaptations.
    *   Long-term periodization analytics.
*   **Significant Frontend Refactoring:** The entire `/program` page and its related components had to be refactored to consume the new, simpler data structure.
*   **Temporarily Disabled Features:** Features like `WeeklyCheckInModal` have been effectively stubbed out, as the logic relied on the old "week" structure.

### Future Work

This change is considered a tactical solution to a critical problem. Future work will be required to re-introduce data richness and structure in a reliable way. This may involve:
*   Experimenting with different, more capable LLMs.
*   Implementing a multi-step generation process where the AI builds the program piece by piece.
*   Developing a more robust data transformation layer that can attempt to repair or normalize inconsistent AI output.
*   Re-implementing features like weekly check-ins to be compatible with the new session-based model.

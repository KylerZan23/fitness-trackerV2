
# ADR-019: Structured AI Program Generation

## Date: 2024-07-24

## Status: Proposed

## Context

The AI Coach currently generates workout programs as free-form text. The application then attempts to parse this text to determine exercise details and categorize each exercise by muscle group. This parsing mechanism relies on a combination of a database trigger (`set_muscle_group`) and a client-side function (`findMuscleGroupForExercise`), both of which use keyword matching.

This approach is brittle and frequently fails. When the AI generates an exercise with a name that doesn't contain a recognized keyword (e.g., "Copenhagen Adduction" instead of "Core Exercise"), it is miscategorized as 'Other'. This leads to inaccurate data, particularly in user-facing analytics like the Muscle Group Distribution chart on the `/progress` page. The system is not scalable and requires constant maintenance to update the keyword lists.

## Decision

We will change the AI program generation process to enforce a structured data exchange. The core of this decision is to modify the prompt sent to the LLM, instructing it to return the workout program as a structured JSON object.

The new process will be:
1.  **Update the LLM Prompt**: The prompt in `aiProgramActions.ts` will be re-engineered to explicitly require the LLM to format its entire response as a single JSON array.
2.  **Define a Strict Schema**: The prompt will include a description of the required JSON schema, specifying fields like `name`, `sets`, `reps`, and `muscle_group`. Crucially, `muscle_group` will be constrained to a predefined enum of valid categories.
3.  **Implement Server-Side Parsing and Validation**: The server action will receive the JSON string from the LLM. It will parse this string and validate the resulting object against a corresponding Zod schema to ensure data integrity.
4.  **Direct Data Usage**: The validated data, including the `muscle_group` provided directly by the AI, will be used to populate the program page and log workouts. The application will no longer need to infer or guess the muscle group for AI-generated exercises.

## Consequences

### Positive

-   **High Accuracy**: Muscle group categorization will be as accurate as the LLM's understanding of fitness, which is far more advanced than our keyword matcher. The 'Other' category will be used rarely and appropriately.
-   **Reliability & Scalability**: The system will be able to handle any exercise the LLM can generate without requiring code changes. No more maintenance of keyword lists.
-   **Reduced Complexity**: The need for the fragile parsing logic (database triggers and client-side helpers) is eliminated for the AI generation flow, simplifying the codebase.
-   **Efficiency**: This approach avoids the need for extra API calls to categorize unknown exercises, keeping the process fast and cost-effective.
-   **Richer Data**: The prompt can be easily extended in the future to include more structured data, like `rpe`, `tempo`, or `notes`, without further architectural changes.

### Negative

-   **Prompt Engineering Effort**: The initial prompt needs to be carefully designed and tested to ensure the LLM consistently returns valid, well-formed JSON.
-   **LLM Reliability**: There is a risk that the LLM may occasionally fail to adhere to the JSON format. This will be mitigated by implementing robust server-side validation, error handling, and a potential retry mechanism.

## Implementation Details

-   **File to Modify**: `src/app/_actions/aiProgramActions.ts`
-   **New Dependency**: A Zod schema will be created to validate the incoming JSON from the LLM.
-   **Process**:
    1.  Create a Zod schema for the expected exercise structure.
    2.  Rewrite the `generateAiProgram` system prompt to request JSON output matching this schema.
    3.  In the `generateAiProgram` action, replace the text parsing logic with `JSON.parse()`.
    4.  Pipe the parsed object through the Zod schema for validation.
    5.  Map the validated data to the `WorkoutGroupData` structure used by the rest of the application.

## Alternatives Considered

1.  **Enhanced Keyword Matching**: Rejected as it's a temporary patch, not a scalable solution.
2.  **Real-Time AI Categorization**: Rejected due to increased latency and cost from additional API calls.
3.  **Fuzzy Matching**: Rejected due to high implementation complexity and potential for false positives.

The chosen solution is the most robust and addresses the root cause of the problem directly. 
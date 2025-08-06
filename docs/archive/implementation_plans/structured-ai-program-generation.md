
# Implementation Plan: Structured AI Program Generation

## 1. Objective

Refactor the AI program generation feature to use a structured JSON-based approach instead of free-form text parsing. This will ensure accurate muscle group categorization for all AI-generated exercises and improve the reliability and scalability of the feature.

## 2. Technical Strategy

The implementation will follow the "Structured AI Output" strategy (Solution 4) and will be executed in the following phases:

### Phase 1: Schema Definition and Prompt Engineering

1.  **Define Zod Schema**:
    -   In `src/lib/schemas.ts`, create a new Zod schema to represent the structure of a single exercise returned by the AI.
    -   It will include fields: `name` (string), `sets` (number), `reps` (string | number), and `muscle_group` (a Zod enum of the existing `MuscleGroup` type).
    -   Create a schema for the full AI response, which will be an array of the single exercise schema.

2.  **Re-engineer the System Prompt**:
    -   In `src/app/_actions/aiProgramActions.ts`, locate the `generateAiProgram` function.
    -   Rewrite the system prompt provided to the LLM.
    -   The new prompt will instruct the AI to act as an expert fitness coach and return a complete workout program formatted as a single, minified JSON array.
    -   The prompt will explicitly define the required JSON structure, referencing the fields from the Zod schema and listing the allowed values for `muscle_group`.

### Phase 2: Server Action Refactoring

1.  **Modify `generateAiProgram` Action**:
    -   In `src/app/_actions/aiProgramActions.ts`, remove the old free-text parsing logic.
    -   Add a `try...catch` block to handle potential JSON parsing errors from the AI's response.
    -   Use `JSON.parse()` to convert the AI's text response into a JavaScript object.

2.  **Implement Validation**:
    -   After parsing, validate the JavaScript object against the new Zod schema created in Phase 1.
    -   If validation fails, return a structured error to the client indicating that the AI failed to generate a valid program.

3.  **Map Validated Data to Application Type**:
    -   If validation succeeds, map the array of AI-generated exercises to the `WorkoutGroupData` type that the application uses for logging and display.
    -   Ensure the `muscle_group` from the AI response is correctly passed into this data structure. The existing `findMuscleGroupForExercise` function will no longer be needed for this flow.

### Phase 3: Frontend and Database (Review and Cleanup)

1.  **Frontend**:
    -   The `/program` page should require minimal changes, as it expects `WorkoutGroupData`. The refactoring in the server action should be largely transparent to the client. A thorough review will be conducted to ensure the new data structure is rendered correctly.

2.  **Database**:
    -   The old `set_muscle_group` database trigger and the `findMuscleGroupForExercise` client-side function will be left in place for now. They are still valuable for handling workouts that are logged manually by the user, ensuring those exercises are also categorized.
    -   The new system will simply provide an accurate `muscle_group` value upfront when logging AI-generated programs, bypassing the need for the trigger's guesswork in this context.

## 3. Files to be Modified

-   `src/app/_actions/aiProgramActions.ts`: Major changes to the prompt and parsing logic.
-   `src/lib/schemas.ts`: Addition of new Zod schemas for AI response validation.
-   `src/lib/types.ts`: Potentially minor adjustments if needed, but likely none.

## 4. Testing Strategy

1.  **Unit Tests**:
    -   Create a new test file for `aiProgramActions.test.ts`.
    -   Mock the LLM response to return a valid JSON string and assert that the action parses and maps it correctly.
    -   Mock the LLM response to return an invalid JSON string and assert that the action handles the error gracefully.
    -   Mock the LLM response to return JSON with an invalid structure (e.g., missing a required field) and assert that the Zod validation catches it.

2.  **Manual End-to-End Testing**:
    -   Navigate to the `/program` page and generate a new AI program.
    -   Verify that the program displays correctly with a variety of exercises.
    -   Log the generated workout.
    -   Navigate to the `/progress` page and confirm that the Muscle Group Distribution chart accurately reflects the muscle groups from the newly logged workout.
    -   Check the `workouts` table in the database to ensure the `muscle_group` column is being populated correctly from the AI response. 
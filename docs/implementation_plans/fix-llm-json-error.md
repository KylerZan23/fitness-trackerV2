# Implementation Plan: Fix LLM Invalid JSON Error

This document outlines the plan to debug and resolve the "LLM returned invalid JSON" error occurring during training program generation.

## 1. Problem Analysis

The core issue is that the Supabase Edge Function responsible for generating a training program is failing because the Large Language Model (LLM) it calls returns a response that cannot be parsed as JSON. This happens both after initial user onboarding and when retrying program generation.

**Error Messages:**
1. `Edge Function call failed: ... LLM API error: LLM returned invalid JSON.`
2. `Failed to start program generation. Please try again.`

This indicates a failure in the `generate-program` Edge Function.

## 2. Investigation Strategy

### Step 2.1: Analyze Server Actions
- **File:** `src/app/_actions/aiProgramActions.ts`
- **Function:** `generateTrainingProgram`
- **Goal:** Understand how the server action invokes the Supabase Edge Function and how it handles success and error cases. Check the different call sites identified by the different line numbers in the logs.

### Step 2.2: Analyze Onboarding Flow
- **File:** `src/app/_actions/onboardingActions.ts`
- **Functions:** `finalizeOnboardingAndGenerateProgram`, `saveOnboardingData`
- **Goal:** Understand how the initial program generation is triggered and what data is passed along.

### Step 2.3: Analyze the Edge Function
- **File:** `supabase/functions/generate-program/index.ts`
- **Goal:** This is the most critical part. I need to inspect:
    - The prompt sent to the LLM. It might be malformed or confusing.
    - The code that makes the API call to the LLM.
    - The response handling and JSON parsing logic.
    - The lack of robust error handling for non-JSON responses.

## 3. Proposed Solution

Based on the investigation, the likely solution will involve modifications to the `supabase/functions/generate-program/index.ts` file.

### Step 3.1: Improve Prompt Engineering
- I will refine the prompt to explicitly instruct the LLM to return only valid, minified JSON, and nothing else. I will add instructions on how to handle errors on its end.

### Step 3.2: Implement Robust JSON Parsing
- I will add logic to attempt to extract a JSON object from the LLM's response, even if it's embedded in other text. This will make the parsing more resilient to minor variations in the LLM's output.

### Step 3.3: Add Response Validation
- I will use a Zod schema to validate the structure of the parsed JSON. If the validation fails, the function will throw a specific error, which can be handled gracefully by the client.

### Step 3.4: Enhance Error Handling and Logging
- I will add more detailed logging to the Edge Function to capture the raw response from the LLM when an error occurs. This will be invaluable for future debugging.

## 4. Testing
- After implementing the fix, I will need to test the onboarding flow for a new user to confirm that the program is generated successfully.
- I will also test the "retry" functionality.
- I will add logging to see the raw LLM output to verify it is now correct.

## 5. Documentation
- I will update any relevant documentation, if necessary, to reflect the changes made to the program generation process.
- I will create an ADR for the change in the error handling and LLM interaction pattern.

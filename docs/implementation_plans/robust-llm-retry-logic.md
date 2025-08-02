# Implementation Plan: Add Retry Logic to LLM Call

**Objective:** Enhance the reliability of the AI program generation Edge Function by implementing a retry mechanism with exponential backoff for the LLM API call. This will prevent transient network issues or API flakes from causing the entire process to fail.

## 1. Analysis

-   **File to Modify:** `supabase/functions/generate-program/index.ts`
-   **Target Function:** `callLLMAPI(prompt: string)`
-   **Core Problem:** The existing `callLLMAPI` function makes a single attempt to call the OpenAI API. If this call fails for any reason (e.g., network error, temporary API unavailability, rate limiting), the program generation process terminates and returns an error.
-   **Proposed Solution:** Refactor the `callLLMAPI` function to include a retry loop.

## 2. Implementation Steps

1.  **Define Retry Parameters:**
    -   `MAX_RETRIES`: Set to `3` to balance resilience and user-facing latency.
    -   `INITIAL_DELAY_MS`: Set to `1000` (1 second) as a starting point for the backoff.

2.  **Implement Retry Loop:**
    -   Use a `for` loop to iterate from `1` to `MAX_RETRIES`.
    -   Wrap the entire existing logic of the `callLLMAPI` function (API key check, `fetch` call, response handling, JSON parsing) inside a `try` block within the loop.

3.  **Implement Exponential Backoff:**
    -   In the `catch` block, if the current attempt is less than `MAX_RETRIES`, calculate the delay using an exponential backoff formula: `delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1)`.
    -   Use `await new Promise(resolve => setTimeout(resolve, delay))` to pause execution before the next attempt.

4.  **Handle Errors and Success:**
    -   **Success:** If the API call and JSON parsing succeed, `return { program }` immediately to exit the loop.
    -   **Failure:** In the `catch` block, log the error for the current attempt. Store the `error` object in a `lastError` variable.
    -   **Final Failure:** If the loop completes without a successful attempt, log a final error message and return the `lastError`.

5.  **Replace Existing Function:**
    -   The old `callLLMAPI` function will be completely replaced by the new, more robust version.

## 3. Code Changes (Completed)

The `search_replace` tool was used to swap the original `callLLMAPI` function with the new implementation in `supabase/functions/generate-program/index.ts`.

```typescript
// Call LLM API with retry mechanism
async function callLLMAPI(prompt: string): Promise<{ program?: any; error?: string }> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 1000;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🤖 Calling LLM API... Attempt ${attempt}/${MAX_RETRIES}`);
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
      }

      const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

      const body = {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error?.message || JSON.stringify(errorData) || response.statusText;
        } catch (e) {
          // Ignore if error response is not JSON
        }
        throw new Error(`LLM API Error: ${response.status} - ${errorDetails}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('Invalid response structure from LLM.');
      }

      const contentString = data.choices[0].message.content;

      const extractJsonFromString = (text: string): string | null => {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : null;
      };

      const jsonString = extractJsonFromString(contentString);

      if (!jsonString) {
        console.error('Failed to find any JSON object in LLM response:', contentString);
        throw new Error('LLM did not return a recognizable JSON object.');
      }

      try {
        const program = JSON.parse(jsonString);
        return { program }; // Success
      } catch (parseError) {
        console.error('Failed to parse extracted LLM JSON response:', jsonString);
        console.error('Original full LLM response:', contentString);
        throw new Error('LLM returned invalid JSON, even after extraction.');
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('LLM API call failed after all retries:', lastError);
  return {
    error: lastError?.message || 'Failed to communicate with AI service after multiple attempts.',
  };
}
```

## 4. Verification

-   The change is self-contained within the `callLLMAPI` function and does not alter its public signature, so no other parts of the Edge Function need to be updated.
-   The new logic correctly handles success, retryable failures, and final failure states.

**Status:** Completed.
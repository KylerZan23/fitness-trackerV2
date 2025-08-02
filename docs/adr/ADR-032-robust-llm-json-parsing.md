# ADR-032: Robust LLM JSON Parsing Strategy

## Status

Accepted

## Context

The application relies on Large Language Models (LLMs) to generate structured data, specifically JSON objects for training programs. We have been experiencing failures in the `generate-program` Supabase Edge Function with the error message: `LLM API error: LLM returned invalid JSON.`

This error occurs because the LLM, despite being prompted to return a JSON object, sometimes includes extraneous text, conversational filler, or markdown code fences (e.g., \`\`\`json) around the actual JSON payload. The previous implementation used a direct `JSON.parse()` on the LLM's entire response string, which is brittle and fails if the response is not a perfectly formatted JSON string.

## Decision

To resolve this issue and make our LLM interactions more resilient, we will implement a two-pronged strategy for all services that expect a JSON object from an LLM:

1.  **Stricter Prompt Engineering:** The system prompt sent to the LLM will now include a `CRITICAL` instruction explicitly forbidding any text other than the JSON object itself. This reduces the likelihood of the LLM making a formatting error.

    **Example Instruction:**
    ```
    CRITICAL: Your entire response must be a single, raw JSON object, without any surrounding text, explanations, or code fences (like \`\`\`json). Start your response with '{' and end it with '}'. Do not include any other text.
    ```

2.  **Robust JSON Extraction:** Before attempting to parse the LLM's response, we will first run it through a function that extracts the JSON object. This function will use a regular expression to find the first occurrence of a string that starts with `{` and ends with `}`.

    **Example Implementation:**
    ```typescript
    function extractJsonFromString(text: string): string | null {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      return null;
    }

    // In the API handling logic:
    const rawResponse = getLLMResponse();
    const jsonString = extractJsonFromString(rawResponse);
    if (jsonString) {
      try {
        const parsedObject = JSON.parse(jsonString);
        // ... proceed with the parsed object
      } catch (e) {
        // ... handle parsing error, log both jsonString and rawResponse
      }
    } else {
      // ... handle case where no JSON object was found in the response
    }
    ```

This approach combines prevention (a better prompt) with a cure (resilient parsing), which will significantly improve the reliability of our AI-powered features.

## Consequences

*   **Positive:**
    *   Increased reliability of services that depend on LLM-generated JSON.
    *   Reduced rate of failures during critical user flows like onboarding and program generation.
    *   Improved debuggability by logging the raw LLM response when parsing fails, even after extraction.
*   **Neutral:**
    *   This pattern must be implemented in all current and future services that interact with LLMs for structured data.
*   **Negative:**
    *   There is a minor performance overhead due to the regex matching, but this is negligible compared to the network latency of the LLM API call.
    *   It's still possible for an LLM to produce a malformed string that *looks* like a JSON object (e.g., has matching braces but invalid syntax inside). Our `try...catch` block around `JSON.parse` still handles this, but the root cause is the LLM's output.

This change has been implemented in the `generate-program` Edge Function as the first application of this new standard.

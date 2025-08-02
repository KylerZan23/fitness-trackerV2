# Implementation Plan: Robust LLM JSON Parsing

This document outlines the plan to fix the "LLM returned invalid JSON" error by making the parsing logic more resilient.

## 1. Problem

The `callLLMAPI` function in the `generate-program` Edge Function uses a simple `JSON.parse()` on the response from the LLM. This fails if the LLM includes any extra text, markdown, or formatting around the JSON object.

## 2. Solution

I will implement a two-part solution: improve the prompt to prevent the error and improve the parsing to handle the error if it still occurs.

### Step 2.1: Enhance the Prompt

In `supabase/functions/generate-program/index.ts`, inside the `constructEnhancedProgramPrompt` function, I will add a more forceful instruction to the prompt.

**Addition to Prompt:**
```
CRITICAL: Your entire response must be a single, raw JSON object, without any surrounding text, explanations, or code fences (like \`\`\`json). Start your response with '{' and end it with '}'. Do not include any other text.
```

### Step 2.2: Implement Robust JSON Extraction

I will create a helper function `extractJsonFromString` and use it within `callLLMAPI` before parsing.

**New Helper Function:**
```typescript
function extractJsonFromString(text: string): string | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return null;
}
```

**Modified `callLLMAPI` Logic:**
```typescript
// Inside callLLMAPI, after getting contentString
const jsonString = extractJsonFromString(contentString);

if (!jsonString) {
  console.error('Failed to find any JSON object in LLM response:', contentString);
  throw new Error('LLM did not return a recognizable JSON object.');
}

try {
  return { program: JSON.parse(jsonString) };
} catch (parseError) {
  console.error('Failed to parse extracted LLM JSON response:', jsonString);
  // Log the original full string for more context
  console.error('Original full LLM response:', contentString);
  throw new Error('LLM returned invalid JSON, even after extraction.');
}
```

This ensures that even if the LLM wraps its response in explanatory text, we can still extract and parse the core JSON object. It also provides better logging for future failures.

## 3. Testing

After implementing the changes, the onboarding flow for a new user should be tested to confirm that a program is generated successfully without parsing errors.

## 4. ADR

I will create an ADR for this change, as it represents a new pattern for handling LLM responses that should be standardized across the application.

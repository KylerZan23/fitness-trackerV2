/**
 * Extracts a JSON object from a string, even if it's embedded in markdown code blocks (` ```json ... ``` `).
 * This is more reliable than simple string searching for handling LLM responses.
 * @param text The raw text from the LLM.
 * @returns The extracted JSON string, or null if no JSON object is found.
 */
export function extractJson(text: string): string | null {
  // This regex looks for a markdown JSON block OR a standalone JSON object.
  const match = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
  if (match) {
    // If a markdown block is found (match[1]), use its content.
    // Otherwise, use the standalone JSON object (match[2]).
    return match[1] || match[2];
  }
  // Return null if no JSON is found at all.
  return null;
}
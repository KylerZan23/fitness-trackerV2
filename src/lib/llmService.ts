/**
 * LLM Service
 * ------------------------------------------------
 * Centralized service for interacting with LLM APIs (OpenAI, etc.)
 * Provides a consistent interface and error handling for AI model calls
 */

interface LLMOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' } // Add other options as needed
  // Add other potential OpenAI API parameters here
}

export async function callLLM(
  promptContent: string,
  role: 'user' | 'system' = 'user', // Default role to "user"
  options: LLMOptions = {}
): Promise<any> {
  // Consider a more specific return type if possible, e.g., parsed JSON or string
  const apiKey = process.env.LLM_API_KEY
  // Use environment variable if set, otherwise default to standard OpenAI chat completions endpoint
  const apiEndpoint = process.env.LLM_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions'

  if (!apiKey) {
    console.error('CRITICAL: LLM_API_KEY is not set in environment variables.')
    // It's better to throw an error here to make the misconfiguration immediately obvious
    throw new Error('AI Service configuration error: API key not set.')
  }

  const body = {
    model: options.model || 'gpt-4o-mini', // Default model
    messages: [{ role: role, content: promptContent }],
    temperature: options.temperature ?? 0.7, // Use ?? for nullish coalescing
    max_tokens: options.max_tokens ?? 1024, // Sensible default, adjust as needed per call site
    ...(options.response_format && { response_format: options.response_format }),
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      // Attempt to parse error response for more details
      let errorDetails = response.statusText
      try {
        const errorData = await response.json()
        errorDetails = errorData.error?.message || JSON.stringify(errorData) || response.statusText
      } catch (e) {
        // Ignore if error response is not JSON
      }
      console.error('LLM API Error Response:', response.status, errorDetails)
      throw new Error(`LLM API Error: ${response.status} - ${errorDetails}`)
    }

    const data = await response.json()

    if (
      !data.choices ||
      data.choices.length === 0 ||
      !data.choices[0].message ||
      typeof data.choices[0].message.content !== 'string'
    ) {
      console.error('Invalid response structure from LLM:', data)
      throw new Error('Invalid response structure from LLM.')
    }

    const contentString = data.choices[0].message.content

    // If response_format is json_object, try to parse, otherwise return content string
    if (options.response_format?.type === 'json_object') {
      try {
        return JSON.parse(contentString)
      } catch (parseError) {
        console.error(
          'Failed to parse LLM JSON response:',
          parseError,
          'Raw content:',
          contentString
        )
        // It's crucial to know what the LLM actually returned when JSON parsing fails
        throw new Error(
          `LLM returned invalid JSON when JSON was expected. Raw content: ${contentString.substring(0, 200)}...`
        )
      }
    }
    return contentString // Return text content
  } catch (error) {
    console.error('LLM API call failed:', error)
    // Re-throw the error so the calling action can handle it appropriately
    // (e.g., return a specific error structure to the client)
    throw error // No need to wrap in a new Error if it's already an Error object
  }
}

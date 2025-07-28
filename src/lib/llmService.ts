/**
 * LLM Service
 * ------------------------------------------------
 * Centralized service for interacting with LLM APIs (OpenAI, etc.)
 * Provides a consistent interface and error handling for AI model calls
 */

import fs from 'fs/promises'
import path from 'path'
import { getLLMConfig } from '@/lib/env'
import { logger } from '@/lib/logging'

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
  let apiKey: string
  let apiEndpoint: string

  try {
    const config = getLLMConfig()
    apiKey = config.apiKey
    apiEndpoint = config.endpoint
  } catch (error) {
    logger.error(
      'LLM service configuration error',
      {
        operation: 'llmConfig',
        component: 'llmService',
      },
      error as Error
    )
    throw new Error('AI Service configuration error: ' + (error as Error).message)
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

      logger.error('LLM API request failed', {
        operation: 'llmApiCall',
        component: 'llmService',
        status: response.status,
        errorDetails,
        model: options.model,
        promptLength: promptContent.length,
      })

      throw new Error(`LLM API Error: ${response.status} - ${errorDetails}`)
    }

    const data = await response.json()

    if (
      !data.choices ||
      data.choices.length === 0 ||
      !data.choices[0].message ||
      typeof data.choices[0].message.content !== 'string'
    ) {
      logger.error('Invalid LLM response structure', {
        operation: 'llmApiCall',
        component: 'llmService',
        model: options.model,
        responseData: JSON.stringify(data).substring(0, 500),
      })
      throw new Error('Invalid response structure from LLM.')
    }

    const contentString = data.choices[0].message.content

    // If response_format is json_object, try to parse, otherwise return content string
    if (options.response_format?.type === 'json_object') {
      try {
        return JSON.parse(contentString)
      } catch (parseError) {
        console.error('Failed to parse LLM JSON response. Full response body being saved to file.')
        
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const filePath = path.join(process.cwd(), `.tmp/llm_parse_error_${timestamp}.json`)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, contentString, 'utf8')
          console.log(`Raw LLM response with parse error saved to: ${filePath}`)
        } catch (fileError) {
          console.error('Failed to save raw LLM response to file:', fileError)
        }

        logger.error(
          'Failed to parse LLM JSON response',
          {
            operation: 'llmJsonParse',
            component: 'llmService',
            model: options.model,
            rawContent: contentString.substring(0, 1000), // Log more for context
            parseError: (parseError as Error).message,
          },
          parseError as Error
        )

        // It's crucial to know what the LLM actually returned when JSON parsing fails
        throw new Error(
          `LLM returned invalid JSON when JSON was expected. Full response saved to server logs. Raw content start: ${contentString.substring(
            0,
            200
          )}...`
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

/**
 * OpenAI Service Layer
 * ------------------------------------------------
 * Provider-agnostic LLM service that uses OpenAI's Structured Outputs feature
 * to guarantee schema-compliant JSON generation, eliminating reliability issues
 * by moving validation responsibility to the OpenAI platform.
 * 
 * Features:
 * - Structured outputs with guaranteed schema compliance
 * - Provider-agnostic interface for easy swapping
 * - Built-in retry logic with exponential backoff
 * - Batch processing capabilities
 * - Comprehensive error handling
 * - Type-safe configuration management
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getLLMConfig } from '@/lib/env';
import { logger } from '@/lib/logging';
import type { ServiceHealth, ServiceMetrics } from './types';

// Initialize OpenAI client with environment configuration
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    try {
      const config = getLLMConfig();
      openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.endpoint !== 'https://api.openai.com/v1/chat/completions' 
          ? config.endpoint.replace('/chat/completions', '') 
          : undefined,
      });
    } catch (error) {
      logger.error('Failed to initialize OpenAI client', {
        operation: 'openaiInit',
        component: 'openaiService',
      }, error as Error);
      throw new Error('OpenAI client initialization failed: ' + (error as Error).message);
    }
  }
  return openai;
}

export interface LLMServiceConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
}

export const DEFAULT_CONFIG: LLMServiceConfig = {
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 4000,
};

/**
 * Provider-agnostic interface for structured LLM generation
 */
export interface ILLMService {
  generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config?: Partial<LLMServiceConfig>
  ): Promise<T>;
}

/**
 * OpenAI implementation using Structured Outputs
 */
export class OpenAIStructuredService implements ILLMService {
  private config: LLMServiceConfig;

  constructor(config: Partial<LLMServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config?: Partial<LLMServiceConfig>
  ): Promise<T> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      logger.info('Generating structured output with OpenAI', {
        operation: 'generateStructuredOutput',
        component: 'openaiService',
        model: finalConfig.model,
        promptLength: prompt.length,
        temperature: finalConfig.temperature,
      });

      // Convert Zod schema to JSON Schema
      const jsonSchema = zodToJsonSchema(schema, 'outputSchema');
      
      // Remove the $schema property as OpenAI doesn't expect it
      const { $schema, ...cleanJsonSchema } = jsonSchema;

      // Log schema validation before API call
      logger.info('Schema conversion and validation', {
        operation: 'generateStructuredOutput',
        component: 'openaiService',
        hasJsonSchema: !!jsonSchema,
        hasCleanSchema: !!cleanJsonSchema,
        schemaType: typeof cleanJsonSchema,
        schemaKeys: cleanJsonSchema ? Object.keys(cleanJsonSchema) : [],
        schemaStringified: JSON.stringify(cleanJsonSchema).substring(0, 500),
      });

      // Ensure we have a valid schema object
      if (!cleanJsonSchema || typeof cleanJsonSchema !== 'object') {
        logger.error('Invalid schema object generated', {
          operation: 'generateStructuredOutput',
          component: 'openaiService',
          originalSchema: schema,
          jsonSchema,
          cleanJsonSchema,
        });
        throw new Error('Failed to convert Zod schema to valid JSON Schema');
      }

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response_schema',
            strict: true,
            schema: cleanJsonSchema,
          },
        },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        logger.error('OpenAI returned no content', {
          operation: 'generateStructuredOutput',
          component: 'openaiService',
          model: finalConfig.model,
          response: completion,
        });
        throw new Error('No content returned from OpenAI');
      }

      // Parse and validate the JSON response
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI JSON response', {
          operation: 'generateStructuredOutput',
          component: 'openaiService',
          model: finalConfig.model,
          rawContent: content.substring(0, 1000),
          parseError: (parseError as Error).message,
        });
        throw new Error(`Invalid JSON returned from OpenAI: ${(parseError as Error).message}`);
      }
      
      // Validate against the original Zod schema
      const validated = schema.parse(parsed);
      
      logger.info('Successfully generated structured output', {
        operation: 'generateStructuredOutput',
        component: 'openaiService',
        model: finalConfig.model,
        outputSize: JSON.stringify(validated).length,
      });
      
      return validated;
    } catch (error) {
      logger.error('OpenAI Structured Output Error', {
        operation: 'generateStructuredOutput',
        component: 'openaiService',
        model: finalConfig.model,
        error: error instanceof Error ? error.message : String(error),
      });
      
      if (error instanceof z.ZodError) {
        throw new Error(`Schema validation failed: ${error.message}`);
      }
      
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON returned from OpenAI: ${error.message}`);
      }
      
      // Re-throw OpenAI API errors with context
      if (error instanceof Error && error.message.includes('OpenAI')) {
        throw error;
      }
      
      throw new Error(`OpenAI service error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Batch generation for parallel processing
   */
  async generateMultipleStructured<T>(
    prompts: string[],
    schema: z.ZodSchema<T>,
    config?: Partial<LLMServiceConfig>
  ): Promise<T[]> {
    logger.info('Starting batch structured generation', {
      operation: 'generateMultipleStructured',
      component: 'openaiService',
      promptCount: prompts.length,
      model: config?.model || this.config.model,
    });

    const promises = prompts.map((prompt, index) =>
      this.generateStructuredOutput(prompt, schema, config)
        .catch(error => {
          logger.error(`Batch generation failed for prompt ${index}`, {
            operation: 'generateMultipleStructured',
            component: 'openaiService',
            promptIndex: index,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        })
    );

    try {
      const results = await Promise.all(promises);
      logger.info('Batch structured generation completed', {
        operation: 'generateMultipleStructured',
        component: 'openaiService',
        successCount: results.length,
      });
      return results;
    } catch (error) {
      logger.error('Batch structured generation failed', {
        operation: 'generateMultipleStructured',
        component: 'openaiService',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate with retry logic for improved reliability
   */
  async generateWithRetry<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    maxRetries: number = 3,
    config?: Partial<LLMServiceConfig>
  ): Promise<T> {
    let lastError: Error;

    logger.info('Starting retry-based generation', {
      operation: 'generateWithRetry',
      component: 'openaiService',
      maxRetries,
      model: config?.model || this.config.model,
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateStructuredOutput(prompt, schema, config);
        
        if (attempt > 1) {
          logger.info('Retry successful', {
            operation: 'generateWithRetry',
            component: 'openaiService',
            attempt,
            maxRetries,
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Attempt ${attempt} failed`, {
          operation: 'generateWithRetry',
          component: 'openaiService',
          attempt,
          maxRetries,
          error: lastError.message,
        });
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 2^attempt * 1000ms
        const delay = Math.pow(2, attempt) * 1000;
        logger.info(`Waiting ${delay}ms before retry`, {
          operation: 'generateWithRetry',
          component: 'openaiService',
          attempt,
          delay,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    logger.error('All retry attempts failed', {
      operation: 'generateWithRetry',
      component: 'openaiService',
      maxRetries,
      finalError: lastError.message,
    });

    throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<LLMServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Updated OpenAI service configuration', {
      operation: 'updateConfig',
      component: 'openaiService',
      newConfig,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMServiceConfig {
    return { ...this.config };
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<ServiceHealth> {
    // For now, return a basic health status
    // In a real implementation, this would check API connectivity
    return {
      status: 'healthy',
      lastCheck: new Date(),
      errorCount: 0,
      successCount: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): ServiceMetrics {
    // For now, return basic metrics
    // In a real implementation, this would track actual metrics
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }
}

// Export singleton instance
export const openaiService = new OpenAIStructuredService();

// Export factory function for testing/custom configs
export const createOpenAIService = (config?: Partial<LLMServiceConfig>) => 
  new OpenAIStructuredService(config);

/**
 * Utility function for backward compatibility
 * This allows gradual migration from the old callLLM function
 */
export async function callLLMStructured<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  config?: Partial<LLMServiceConfig>
): Promise<T> {
  return openaiService.generateStructuredOutput(prompt, schema, config);
}

/**
 * Utility function for backward compatibility with retry logic
 */
export async function callLLMStructuredWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  maxRetries: number = 3,
  config?: Partial<LLMServiceConfig>
): Promise<T> {
  return openaiService.generateWithRetry(prompt, schema, maxRetries, config);
} 
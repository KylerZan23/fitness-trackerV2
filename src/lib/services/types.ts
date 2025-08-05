/**
 * Service Layer Types
 * ------------------------------------------------
 * Shared types and interfaces for the service layer architecture
 */

import { z } from 'zod';

/**
 * Base configuration for LLM services
 */
export interface BaseLLMServiceConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends BaseLLMServiceConfig {
  apiKey: string;
  baseURL?: string;
}

/**
 * Service initialization options
 */
export interface ServiceInitOptions {
  config?: Partial<BaseLLMServiceConfig>;
  enableLogging?: boolean;
  retryConfig?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Service health status
 */
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  errorCount: number;
  successCount: number;
  averageResponseTime: number;
}

/**
 * Service metrics
 */
export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime?: Date;
}

/**
 * Error types for service layer
 */
export enum ServiceErrorType {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Service error with context
 */
export interface ServiceError {
  type: ServiceErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
}

/**
 * Request context for tracking
 */
export interface RequestContext {
  requestId: string;
  timestamp: Date;
  operation: string;
  component: string;
  metadata?: Record<string, any>;
}

/**
 * Response wrapper with metadata
 */
export interface ServiceResponse<T> {
  data: T;
  metadata: {
    requestId: string;
    responseTime: number;
    model: string;
    tokensUsed?: number;
  };
}

/**
 * Batch request configuration
 */
export interface BatchRequestConfig {
  concurrency: number;
  timeout: number;
  retryConfig?: RetryConfig;
}

/**
 * Batch response with individual results
 */
export interface BatchResponse<T> {
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: ServiceError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
}

/**
 * Service factory function type
 */
export type ServiceFactory<T extends BaseLLMServiceConfig> = (
  config?: Partial<T>
) => Promise<ILLMService>;

/**
 * Provider-agnostic interface for structured LLM generation
 */
export interface ILLMService {
  generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config?: Partial<BaseLLMServiceConfig>
  ): Promise<T>;

  generateWithRetry<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    maxRetries?: number,
    config?: Partial<BaseLLMServiceConfig>
  ): Promise<T>;

  generateMultipleStructured<T>(
    prompts: string[],
    schema: z.ZodSchema<T>,
    config?: Partial<BaseLLMServiceConfig>
  ): Promise<T[]>;

  getHealth(): Promise<ServiceHealth>;
  getMetrics(): ServiceMetrics;
}

/**
 * Service registry for managing multiple providers
 */
export interface ServiceRegistry {
  register(name: string, factory: ServiceFactory<any>): void;
  get(name: string): ILLMService | undefined;
  list(): string[];
  remove(name: string): boolean;
}

/**
 * Service configuration validation schema
 */
export const ServiceConfigSchema = z.object({
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().positive().optional(),
});

/**
 * Retry configuration validation schema
 */
export const RetryConfigSchema = z.object({
  maxRetries: z.number().int().min(1).max(10),
  baseDelay: z.number().positive(),
  maxDelay: z.number().positive(),
  backoffMultiplier: z.number().positive(),
});

/**
 * Request context validation schema
 */
export const RequestContextSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.date(),
  operation: z.string(),
  component: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Export types
export type {
  BaseLLMServiceConfig,
  OpenAIConfig,
  ServiceInitOptions,
  RetryConfig,
  ServiceHealth,
  ServiceMetrics,
  ServiceError,
  RequestContext,
  ServiceResponse,
  BatchRequestConfig,
  BatchResponse,
  ServiceFactory,
  ILLMService,
  ServiceRegistry,
}; 
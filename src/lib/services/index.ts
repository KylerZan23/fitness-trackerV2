/**
 * Services Layer Index
 * ------------------------------------------------
 * Central export point for all service layer functionality
 * Provides a clean interface for importing service components
 */

// Core OpenAI Service
export {
  openaiService,
  createOpenAIService,
  OpenAIStructuredService,
  callLLMStructured,
  callLLMStructuredWithRetry,
  type LLMServiceConfig,
  type ILLMService,
  DEFAULT_CONFIG,
} from './openaiService';

// Service Types and Interfaces
export {
  type BaseLLMServiceConfig,
  type OpenAIConfig,
  type ServiceInitOptions,
  type RetryConfig,
  type ServiceHealth,
  type ServiceMetrics,
  type ServiceError,
  type RequestContext,
  type ServiceResponse,
  type BatchRequestConfig,
  type BatchResponse,
  type ServiceFactory,
  type ILLMService,
  type ServiceRegistry,
  ServiceErrorType,
  ServiceConfigSchema,
  RetryConfigSchema,
  RequestContextSchema,
} from './types';

/**
 * Service Layer Utilities
 */

/**
 * Create a service instance with default configuration
 */
export function createService<T extends BaseLLMServiceConfig>(
  factory: ServiceFactory<T>,
  config?: Partial<T>
): Promise<ILLMService> {
  return factory(config);
}

/**
 * Validate service configuration
 */
export function validateServiceConfig(config: any): config is BaseLLMServiceConfig {
  try {
    ServiceConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a retry configuration with sensible defaults
 */
export function createRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    ...overrides,
  };
}

/**
 * Service health check utility
 */
export async function checkServiceHealth(service: ILLMService): Promise<ServiceHealth> {
  try {
    return await service.getHealth();
  } catch (error) {
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      errorCount: 1,
      successCount: 0,
      averageResponseTime: 0,
    };
  }
}

/**
 * Batch service health check
 */
export async function checkMultipleServices(
  services: Record<string, ILLMService>
): Promise<Record<string, ServiceHealth>> {
  const results: Record<string, ServiceHealth> = {};
  
  await Promise.all(
    Object.entries(services).map(async ([name, service]) => {
      results[name] = await checkServiceHealth(service);
    })
  );
  
  return results;
}

/**
 * Service metrics aggregation
 */
export function aggregateServiceMetrics(
  metrics: ServiceMetrics[]
): ServiceMetrics {
  const total = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const successful = metrics.reduce((sum, m) => sum + m.successfulRequests, 0);
  const failed = metrics.reduce((sum, m) => sum + m.failedRequests, 0);
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;
  
  return {
    totalRequests: total,
    successfulRequests: successful,
    failedRequests: failed,
    averageResponseTime: avgResponseTime,
    lastRequestTime: metrics
      .map(m => m.lastRequestTime)
      .filter(Boolean)
      .sort()
      .pop(),
  };
}

// Re-export types for convenience
export type { BaseLLMServiceConfig as LLMServiceConfig } from './types'; 
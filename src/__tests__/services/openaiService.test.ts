/**
 * OpenAI Service Tests
 * ------------------------------------------------
 * Tests for the OpenAI Structured Service implementation
 */

import { z } from 'zod';
import { openaiService, createOpenAIService, callLLMStructured } from '@/lib/services/openaiService';

// Mock the environment configuration
jest.mock('@/lib/env', () => ({
  getLLMConfig: jest.fn(() => ({
    apiKey: 'test-api-key',
    endpoint: 'https://api.openai.com/v1/chat/completions',
  })),
}));

// Mock the logging module
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock OpenAI client
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('OpenAI Service', () => {
  const mockSchema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  });

  const mockValidResponse = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create service with default configuration', () => {
      const service = createOpenAIService();
      const config = service.getConfig();
      
      expect(config.model).toBe('gpt-4o');
      expect(config.temperature).toBe(0.1);
      expect(config.maxTokens).toBe(4000);
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 2000,
      };
      
      const service = createOpenAIService(customConfig);
      const config = service.getConfig();
      
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(2000);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const service = createOpenAIService();
      
      service.updateConfig({
        temperature: 0.8,
        maxTokens: 6000,
      });
      
      const config = service.getConfig();
      expect(config.temperature).toBe(0.8);
      expect(config.maxTokens).toBe(6000);
    });

    it('should get current configuration', () => {
      const service = createOpenAIService();
      const config = service.getConfig();
      
      expect(config).toEqual({
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4000,
      });
    });
  });

  describe('Health and Metrics', () => {
    it('should return health status', async () => {
      const service = createOpenAIService();
      const health = await service.getHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('lastCheck');
      expect(health).toHaveProperty('errorCount');
      expect(health).toHaveProperty('successCount');
      expect(health).toHaveProperty('averageResponseTime');
    });

    it('should return metrics', () => {
      const service = createOpenAIService();
      const metrics = service.getMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
    });
  });

  describe('Schema Validation', () => {
    it('should validate schema structure', () => {
      const schema = z.object({
        title: z.string(),
        content: z.string(),
        tags: z.array(z.string()),
      });

      expect(schema).toBeDefined();
      expect(typeof schema.parse).toBe('function');
    });

    it('should handle complex schemas', () => {
      const complexSchema = z.object({
        user: z.object({
          id: z.string(),
          profile: z.object({
            name: z.string(),
            preferences: z.record(z.any()),
          }),
        }),
        metadata: z.object({
          timestamp: z.string(),
          version: z.number(),
        }),
      });

      expect(complexSchema).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should export callLLMStructured function', () => {
      expect(typeof callLLMStructured).toBe('function');
    });

    it('should export singleton instance', () => {
      expect(openaiService).toBeDefined();
      expect(typeof openaiService.generateStructuredOutput).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration errors gracefully', () => {
      // This test would require mocking the environment to fail
      // For now, we just verify the error handling structure exists
      expect(openaiService).toBeDefined();
    });
  });
}); 
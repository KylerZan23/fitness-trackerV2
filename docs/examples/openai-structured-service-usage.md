# OpenAI Structured Service Usage Examples

This document provides practical examples of how to use the new OpenAI Structured Service for guaranteed schema-compliant JSON generation.

## Basic Usage

### Simple Schema Example

```typescript
import { z } from 'zod';
import { callLLMStructured } from '@/lib/services/openaiService';

// Define your schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
});

// Use the service
async function createUserProfile(userDescription: string) {
  try {
    const prompt = `Create a user profile based on this description: ${userDescription}`;
    
    const userProfile = await callLLMStructured(prompt, UserSchema, {
      model: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 1000,
    });
    
    return userProfile;
  } catch (error) {
    console.error('Failed to generate user profile:', error);
    throw error;
  }
}
```

### Complex Training Program Schema

```typescript
import { z } from 'zod';
import { callLLMStructuredWithRetry } from '@/lib/services/openaiService';

const ExerciseSchema = z.object({
  exerciseName: z.string(),
  sets: z.number(),
  reps: z.string(),
  weight: z.string(),
  restTime: z.string(),
  notes: z.string().optional(),
});

const WorkoutDaySchema = z.object({
  dayOfWeek: z.number(),
  exercises: z.array(ExerciseSchema),
  focus: z.string().optional(),
  estimatedDuration: z.number().optional(),
});

const TrainingWeekSchema = z.object({
  weekNumber: z.number(),
  days: z.array(WorkoutDaySchema),
  notes: z.string().optional(),
});

const TrainingProgramSchema = z.object({
  programName: z.string(),
  totalDurationWeeks: z.number(),
  phases: z.array(z.object({
    phaseName: z.string(),
    durationWeeks: z.number(),
    weeks: z.array(TrainingWeekSchema),
  })),
  generatedAt: z.string().optional(),
  aiModelUsed: z.string().optional(),
});

async function generateTrainingProgram(userProfile: any) {
  const prompt = `
    Generate a personalized training program for the following user:
    ${JSON.stringify(userProfile, null, 2)}
    
    The program should be structured and follow proper periodization principles.
  `;
  
  try {
    const program = await callLLMStructuredWithRetry(
      prompt,
      TrainingProgramSchema,
      3, // maxRetries
      {
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 8192,
      }
    );
    
    return program;
  } catch (error) {
    console.error('Failed to generate training program:', error);
    throw error;
  }
}
```

## Advanced Usage

### Batch Processing

```typescript
import { openaiService } from '@/lib/services/openaiService';

const AnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  keyPoints: z.array(z.string()),
});

async function analyzeMultipleTexts(texts: string[]) {
  const prompts = texts.map(text => 
    `Analyze the sentiment and extract key points from: "${text}"`
  );
  
  try {
    const analyses = await openaiService.generateMultipleStructured(
      prompts,
      AnalysisSchema,
      {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 500,
      }
    );
    
    return analyses;
  } catch (error) {
    console.error('Batch analysis failed:', error);
    throw error;
  }
}
```

### Custom Service Configuration

```typescript
import { createOpenAIService } from '@/lib/services/openaiService';

// Create a service with custom configuration
const customService = createOpenAIService({
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2000,
});

// Use the custom service
async function generateCreativeContent(prompt: string) {
  const CreativeSchema = z.object({
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    tone: z.enum(['formal', 'casual', 'humorous', 'serious']),
  });
  
  return await customService.generateStructuredOutput(prompt, CreativeSchema);
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
import { callLLMStructured } from '@/lib/services/openaiService';

async function robustGeneration(prompt: string) {
  const schema = z.object({
    result: z.string(),
    confidence: z.number(),
  });
  
  try {
    const result = await callLLMStructured(prompt, schema);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Schema validation failed')) {
        return { 
          success: false, 
          error: 'Invalid response format from AI service',
          type: 'VALIDATION_ERROR'
        };
      }
      
      if (error.message.includes('OpenAI API')) {
        return { 
          success: false, 
          error: 'AI service temporarily unavailable',
          type: 'API_ERROR'
        };
      }
      
      if (error.message.includes('Invalid JSON')) {
        return { 
          success: false, 
          error: 'AI service returned malformed response',
          type: 'PARSE_ERROR'
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Unknown error occurred',
      type: 'UNKNOWN_ERROR'
    };
  }
}
```

## Migration from Old Service

### Before (Old Service)

```typescript
import { callLLM } from '@/lib/llmService';

async function oldWay(prompt: string) {
  try {
    const response = await callLLM(prompt, 'user', {
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      model: 'gpt-4o',
    });
    
    // Manual validation
    const schema = z.object({ name: z.string(), age: z.number() });
    const validated = schema.parse(response);
    
    return validated;
  } catch (error) {
    // Complex error handling for parsing and validation
    console.error('Error:', error);
    throw error;
  }
}
```

### After (New Structured Service)

```typescript
import { callLLMStructured } from '@/lib/services/openaiService';

async function newWay(prompt: string) {
  const schema = z.object({ name: z.string(), age: z.number() });
  
  try {
    const result = await callLLMStructured(prompt, schema, {
      model: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 1000,
    });
    
    return result; // Already validated and typed
  } catch (error) {
    // Cleaner error handling with specific error types
    console.error('Error:', error);
    throw error;
  }
}
```

## Best Practices

### 1. Schema Design

```typescript
// Good: Specific and constrained
const GoodSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(120),
  email: z.string().email(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
});

// Avoid: Too generic
const BadSchema = z.object({
  data: z.any(),
  metadata: z.record(z.any()),
});
```

### 2. Prompt Engineering

```typescript
// Good: Clear and specific
const goodPrompt = `
Generate a user profile with the following requirements:
- Name should be a realistic full name
- Age should be between 18-65
- Email should be a valid email format
- Preferences should include theme (light/dark) and notifications (true/false)

User description: ${userDescription}
`;

// Avoid: Vague prompts
const badPrompt = `Create a profile for: ${userDescription}`;
```

### 3. Error Handling

```typescript
// Good: Specific error handling
try {
  const result = await callLLMStructured(prompt, schema);
  return result;
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Schema validation failed')) {
      // Handle validation errors
      return fallbackResponse;
    }
    if (error.message.includes('OpenAI API')) {
      // Handle API errors
      throw new ServiceUnavailableError();
    }
  }
  throw error;
}
```

### 4. Configuration Management

```typescript
// Good: Environment-specific configuration
const config = {
  model: process.env.NODE_ENV === 'production' ? 'gpt-4o' : 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 4000,
};

const result = await callLLMStructured(prompt, schema, config);
```

## Performance Considerations

### 1. Token Limits

```typescript
// Monitor token usage
const config = {
  model: 'gpt-4o',
  maxTokens: 4000, // Set appropriate limits
  temperature: 0.1,
};
```

### 2. Batch Processing

```typescript
// Use batch processing for multiple requests
const results = await openaiService.generateMultipleStructured(
  prompts,
  schema,
  config
);
```

### 3. Caching

```typescript
// Implement caching for repeated requests
const cacheKey = `generation:${hash(prompt)}:${hash(schema)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await callLLMStructured(prompt, schema);
await cache.set(cacheKey, result, 3600); // Cache for 1 hour
return result;
```

## Testing

### Unit Tests

```typescript
import { createOpenAIService } from '@/lib/services/openaiService';

describe('OpenAI Service', () => {
  it('should generate structured output', async () => {
    const service = createOpenAIService();
    const schema = z.object({ name: z.string() });
    
    const result = await service.generateStructuredOutput(
      'Generate a name',
      schema
    );
    
    expect(result).toHaveProperty('name');
    expect(typeof result.name).toBe('string');
  });
});
```

This structured approach provides guaranteed schema compliance, better error handling, and improved reliability compared to the previous manual JSON parsing approach. 
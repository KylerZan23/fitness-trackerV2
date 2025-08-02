# NeuraLift Trainer API Documentation

## Overview

The NeuraLift Trainer API provides secure, programmatic access to our AI-powered training program generation system. This API is designed for fitness professionals, trainers, and integrated applications that need to generate personalized workout programs at scale.

## Authentication

### API Key Authentication

All requests must include a valid API key. The API uses API key-based authentication with scope-based permissions.

#### Headers

Include your API key in one of these headers:

```http
Authorization: Bearer neurallift_sk_your_api_key_here
```

OR

```http
X-API-Key: neurallift_sk_your_api_key_here
```

#### API Key Format

API keys follow the format: `neurallift_sk_[64_character_hex_string]`

Example: `neurallift_sk_1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890`

### Scopes

API keys are assigned specific scopes that determine what actions they can perform:

- `program:generate` - Generate new training programs
- `program:read` - Read existing program data
- `user:read` - Access user profile information
- `analytics:read` - Access usage analytics

## Rate Limiting

### Default Limits

- **Hourly**: 100 requests per hour
- **Daily**: 1,000 requests per day

### Custom Limits

API keys can be configured with custom rate limits based on your subscription plan.

### Rate Limit Headers

Responses include rate limiting information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-01-28T15:00:00.000Z
Retry-After: 3600
```

### Rate Limit Exceeded

When rate limits are exceeded, the API returns a `429 Too Many Requests` status:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit_type": "hourly",
      "requests_made": 100,
      "limit": 100,
      "reset_time": "2024-01-28T15:00:00.000Z",
      "retry_after_seconds": 3600
    }
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z"
  }
}
```

## Endpoints

### POST /api/v1/trainer/generate-program

Generate a personalized training program using AI.

#### Required Scope
`program:generate`

#### Request Body

```typescript
{
  user_biometrics: {
    age: number;                    // 13-120
    weight?: number;                // Optional, in specified unit
    height?: number;                // Optional, in specified unit
    weight_unit: "kg" | "lbs";
    height_unit?: "cm" | "ft_in";
    body_fat_percentage?: number;   // 3-50
    fitness_level?: "beginner" | "intermediate" | "advanced" | "expert";
  };
  training_goals: {
    primary_goal: string;           // e.g., "Muscle Gain: General"
    secondary_goals?: string[];     // Optional additional goals
    training_frequency_days: number; // 2-7 days per week
    session_duration: "30-45 minutes" | "45-60 minutes" | "60-75 minutes" | "75+ minutes";
    available_equipment: string[];  // Equipment available to user
    training_style_preferences?: string[];
    specific_focus_areas?: string[];
  };
  experience_level: {
    level: "beginner" | "intermediate" | "advanced" | "expert";
    years_training?: number;        // Optional years of experience
    previous_injuries?: string[];   // Optional injury history
    lifting_experience?: {          // Optional 1RM data
      squat_1rm?: number;
      bench_1rm?: number;
      deadlift_1rm?: number;
      overhead_press_1rm?: number;
    };
  };
  client_info?: {                   // Optional metadata
    client_name?: string;
    client_id?: string;
    trainer_name?: string;
    trainer_id?: string;
  };
}
```

#### Example Request

```bash
curl -X POST https://api.neurallift.com/api/v1/trainer/generate-program \
  -H "Authorization: Bearer neurallift_sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_biometrics": {
      "age": 28,
      "weight": 75,
      "weight_unit": "kg",
      "fitness_level": "intermediate"
    },
    "training_goals": {
      "primary_goal": "Muscle Gain: General",
      "training_frequency_days": 4,
      "session_duration": "60-75 minutes",
      "available_equipment": ["Full Gym (Barbells, Racks, Machines)"]
    },
    "experience_level": {
      "level": "intermediate",
      "years_training": 3,
      "lifting_experience": {
        "squat_1rm": 120,
        "bench_1rm": 90,
        "deadlift_1rm": 140
      }
    },
    "client_info": {
      "client_name": "John Doe",
      "trainer_name": "Jane Smith"
    }
  }'
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "success": true,
    "program": {
      "id": "api-generated-req_1234567890",
      "name": "Intermediate Muscle Building Program",
      "duration_weeks": 8,
      "training_days": [
        {
          "weekNumber": 1,
          "title": "Foundation Week",
          "workouts": [
            {
              "dayOfWeek": 1,
              "focus": "Upper Body",
              "title": "Upper Body Strength",
              "exercises": [
                {
                  "name": "Barbell Bench Press",
                  "sets": 4,
                  "reps": "6-8",
                  "rest": "2-3 minutes",
                  "rpe": 7,
                  "category": "Compound",
                  "tier": "Tier_1",
                  "muscleGroups": ["chest", "shoulders", "triceps"]
                }
                // ... more exercises
              ]
            }
            // ... more workouts
          ]
        }
        // ... more weeks
      ],
      "metadata": {
        "generated_at": "2024-01-28T14:23:45.123Z",
        "ai_model_used": "gpt-4o",
        "generation_time_ms": 3456,
        "weak_point_analysis": ["posterior_chain", "core_stability"],
        "periodization_model": "Linear"
      }
    },
    "generation_time_ms": 3456
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z",
    "rate_limit": {
      "requests_made": 13,
      "limit": 100,
      "reset_time": "2024-01-28T15:00:00.000Z"
    }
  }
}
```

#### Error Responses

##### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "validation_errors": [
        "user_biometrics.age: Age must be at least 13",
        "training_goals.training_frequency_days: Training frequency must be at least 2 days"
      ]
    }
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z"
  }
}
```

##### Authentication Error (401)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key not found or inactive"
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z"
  }
}
```

##### Generation Error (500)

```json
{
  "success": false,
  "error": {
    "code": "PROGRAM_GENERATION_FAILED",
    "message": "Failed to generate training program",
    "details": {
      "llm_error": "AI service temporarily unavailable",
      "attempts_made": 3,
      "final_complexity": "basic"
    }
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z"
  }
}
```

### GET /api/v1/trainer/generate-program

Returns API documentation and usage information.

#### Response (200)

```json
{
  "success": true,
  "data": {
    "endpoint": "/api/v1/trainer/generate-program",
    "method": "POST",
    "description": "Generate a personalized training program using AI",
    "authentication": {
      "type": "API Key",
      "required_scope": "program:generate"
    },
    "rate_limits": {
      "default_hourly": 100,
      "default_daily": 1000
    },
    "documentation_url": "https://docs.neurallift.com/api/trainer/generate-program"
  }
}
```

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Additional error context (optional)
  },
  "meta": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-28T14:23:45.123Z"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_API_KEY` | 401 | No API key provided |
| `INVALID_API_KEY` | 401 | API key not found or inactive |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_REQUEST_BODY` | 400 | Invalid JSON in request body |
| `PROGRAM_GENERATION_FAILED` | 500 | AI program generation failed |
| `PROGRAM_VALIDATION_FAILED` | 500 | Generated program failed validation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported |

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Access-Control-Allow-Origin**: `*`
- **Access-Control-Allow-Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Access-Control-Allow-Headers**: `Content-Type, Authorization, X-API-Key`

## Data Types Reference

### Equipment Types

- `"Full Gym (Barbells, Racks, Machines)"`
- `"Dumbbells"`
- `"Kettlebells"`
- `"Resistance Bands"`
- `"Bodyweight Only"`
- `"Cardio Machines (Treadmill, Bike, Rower, Elliptical)"`

### Primary Goals

- `"Muscle Gain: General"`
- `"Muscle Gain: Hypertrophy Focus"`
- `"Strength Gain: Powerlifting Peak"`
- `"Strength Gain: General"`
- `"Endurance Improvement: Gym Cardio"`
- `"Sport-Specific S&C: Explosive Power"`
- `"General Fitness: Foundational Strength"`
- `"Weight Loss: Gym Based"`
- `"Bodyweight Mastery"`
- `"Recomposition: Lean Mass & Fat Loss"`

### Session Durations

- `"30-45 minutes"`
- `"45-60 minutes"`
- `"60-75 minutes"`
- `"75+ minutes"`

### Experience Levels

- `"beginner"` - Less than 1 year of structured training
- `"intermediate"` - 1-3 years of consistent training
- `"advanced"` - 3+ years with proven progress
- `"expert"` - Professional/competitive level

## API Key Management

### Creating API Keys

API keys can be created through the NeuraLift dashboard or by contacting support. Each key includes:

- **Name**: Human-readable identifier
- **Description**: Purpose and usage notes
- **Scopes**: Permitted operations
- **Rate Limits**: Custom or default limits
- **Expiration**: Optional expiration date

### Security Best Practices

1. **Keep API keys secure**: Never expose them in client-side code
2. **Use HTTPS**: Always make requests over secure connections
3. **Rotate keys regularly**: Generate new keys periodically
4. **Monitor usage**: Track API key usage and watch for anomalies
5. **Principle of least privilege**: Only grant necessary scopes

### Deactivating API Keys

API keys can be deactivated immediately through the dashboard. Deactivated keys will return a 401 error for all requests.

## SDKs and Libraries

### Official SDKs

- **Python**: `pip install neurallift-api`
- **JavaScript/Node.js**: `npm install @neurallift/api`
- **PHP**: `composer require neurallift/api-client`

### Community Libraries

- **Ruby**: Available on GitHub
- **Go**: Available on GitHub
- **Java**: Available on Maven Central

## Support and Resources

### Documentation
- **API Reference**: https://docs.neurallift.com/api
- **Getting Started Guide**: https://docs.neurallift.com/quickstart
- **Examples Repository**: https://github.com/neurallift/api-examples

### Support Channels
- **Email**: api-support@neurallift.com
- **Discord**: https://discord.gg/neurallift
- **GitHub Issues**: https://github.com/neurallift/api-feedback

### Status Page
Monitor API status and uptime: https://status.neurallift.com

## Changelog

### v1.0.0 (2024-01-28)
- Initial release of Trainer API
- Program generation endpoint
- API key authentication system
- Rate limiting and CORS support

---

*Last updated: January 28, 2024*
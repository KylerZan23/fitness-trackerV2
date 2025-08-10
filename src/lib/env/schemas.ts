import { z } from 'zod'

// Custom validation helpers
const envStringRequired = (name: string) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a string`,
    })
    .min(1, `${name} cannot be empty`)

const envUrl = (name: string) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a string`,
    })
    .url(`${name} must be a valid URL`)

const envApiKey = (name: string, minLength = 20) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a string`,
    })
    .min(minLength, `${name} must be at least ${minLength} characters long`)

// Supabase-specific validation
const supabaseKey = (name: string) =>
  z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a string`,
    })
    .min(100, `${name} appears to be invalid (too short)`)
    .regex(/^[A-Za-z0-9_.-]+$/, `${name} contains invalid characters`)

// Base environment schema - common to all environments
export const BaseEnvironmentSchema = z.object({
  // System/Runtime Variables
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      required_error: 'NODE_ENV must be specified',
      invalid_type_error: 'NODE_ENV must be development, production, or test',
    })
    .default('development'),

  CI: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === '1'),

  // Supabase Configuration (Core - Required)
  NEXT_PUBLIC_SUPABASE_URL: envUrl('NEXT_PUBLIC_SUPABASE_URL').refine(
    url => url.includes('.supabase.co'),
    {
      message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL',
    }
  ),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey('NEXT_PUBLIC_SUPABASE_ANON_KEY').refine(
    key => key.startsWith('eyJ'),
    {
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid',
    }
  ),

  // Server-side only Supabase key (optional in base schema)
  SUPABASE_SERVICE_ROLE_KEY: supabaseKey('SUPABASE_SERVICE_ROLE_KEY')
    .optional()
    .refine(key => !key || key.startsWith('eyJ'), {
      message: 'SUPABASE_SERVICE_ROLE_KEY appears to be invalid',
    }),

  // AI/LLM Configuration
  LLM_API_KEY: z.preprocess(
    () => process.env.LLM_API_KEY || process.env.LLM_API_KEY_STAGING,
    envApiKey('LLM_API_KEY').refine(
      key => key.startsWith('sk-') || key.startsWith('ak-'),
      {
        message: 'LLM_API_KEY must be a valid OpenAI or Anthropic API key',
      }
    )
  ),

  LLM_API_ENDPOINT: envUrl('LLM_API_ENDPOINT').default(
    'https://api.openai.com/v1/chat/completions'
  ),

  // API Key Management Configuration
  API_KEY_ENCRYPTION_SECRET: envApiKey('API_KEY_ENCRYPTION_SECRET', 32)
    .optional()
    .refine(
      secret => !secret || secret.length >= 32,
      {
        message: 'API_KEY_ENCRYPTION_SECRET must be at least 32 characters long',
      }
    ),

  // Rate limiting configuration
  API_RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    () => process.env.API_RATE_LIMIT_WINDOW_MINUTES,
    z.string().optional().transform(val => val ? parseInt(val, 10) : 60)
  ),

  // Stripe Configuration
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: envApiKey('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 100)
    .refine(key => key.startsWith('pk_'), {
      message: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_',
    }),

  STRIPE_SECRET_KEY: envApiKey('STRIPE_SECRET_KEY', 100)
    .refine(key => key.startsWith('sk_'), {
      message: 'STRIPE_SECRET_KEY must start with sk_',
    }),

  STRIPE_WEBHOOK_SECRET: envApiKey('STRIPE_WEBHOOK_SECRET', 50)
    .refine(secret => secret.startsWith('whsec_'), {
      message: 'STRIPE_WEBHOOK_SECRET must start with whsec_',
    }),

  STRIPE_PRICE_ID_MONTHLY: envStringRequired('STRIPE_PRICE_ID_MONTHLY')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'STRIPE_PRICE_ID_MONTHLY must start with price_',
    }),

  STRIPE_PRICE_ID_ANNUAL: envStringRequired('STRIPE_PRICE_ID_ANNUAL')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'STRIPE_PRICE_ID_ANNUAL must start with price_',
    }),

  // Pro plan (monthly) - server and client
  STRIPE_PRICE_ID_PRO_MONTHLY: envStringRequired('STRIPE_PRICE_ID_PRO_MONTHLY')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'STRIPE_PRICE_ID_PRO_MONTHLY must start with price_',
    }),
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY: envStringRequired('NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY must start with price_',
    }),

  // Pro plan (annual) - server and client
  STRIPE_PRICE_ID_PRO_ANNUAL: envStringRequired('STRIPE_PRICE_ID_PRO_ANNUAL')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'STRIPE_PRICE_ID_PRO_ANNUAL must start with price_',
    }),
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL: envStringRequired('NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL must start with price_',
    }),

  // Public Stripe Price IDs (for client-side access)
  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: envStringRequired('NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY must start with price_',
    }),

  NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL: envStringRequired('NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL')
    .refine(priceId => priceId.startsWith('price_'), {
      message: 'NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL must start with price_',
    }),

  // Observability Configuration (Optional)

  LOGTAIL_TOKEN: envApiKey('LOGTAIL_TOKEN', 32).optional(),
})

// Development environment schema
export const DevelopmentEnvironmentSchema = BaseEnvironmentSchema.extend({
  // In development, service role key is optional but recommended
  SUPABASE_SERVICE_ROLE_KEY: BaseEnvironmentSchema.shape.SUPABASE_SERVICE_ROLE_KEY,
})

// Production environment schema
export const ProductionEnvironmentSchema = BaseEnvironmentSchema.extend({
  // Service role key is required in production
  SUPABASE_SERVICE_ROLE_KEY: supabaseKey('SUPABASE_SERVICE_ROLE_KEY'),

  // All core features must be properly configured
  LLM_API_KEY: BaseEnvironmentSchema.shape.LLM_API_KEY,

  // Ensure NODE_ENV is set correctly
  NODE_ENV: z.literal('production'),
})

// Test environment schema
export const TestEnvironmentSchema = BaseEnvironmentSchema.extend({
  // Most services can be mocked in tests
  LLM_API_KEY: BaseEnvironmentSchema.shape.LLM_API_KEY.optional(),
  SUPABASE_SERVICE_ROLE_KEY: BaseEnvironmentSchema.shape.SUPABASE_SERVICE_ROLE_KEY.optional(),



  // Stripe integration not needed in tests
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_ANNUAL: z.string().optional(),

  // Ensure NODE_ENV is set correctly
  NODE_ENV: z.literal('test'),
})

// Client-side environment schema (only public variables)
export const ClientEnvironmentSchema = z.object({
  NODE_ENV: BaseEnvironmentSchema.shape.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: BaseEnvironmentSchema.shape.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: BaseEnvironmentSchema.shape.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: BaseEnvironmentSchema.shape.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: BaseEnvironmentSchema.shape.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL: BaseEnvironmentSchema.shape.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY: BaseEnvironmentSchema.shape.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL: BaseEnvironmentSchema.shape.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL,
})

// Server-side environment schema (all variables)
export const ServerEnvironmentSchema = BaseEnvironmentSchema

// Export environment-specific schemas
export const EnvironmentSchemas = {
  development: DevelopmentEnvironmentSchema,
  production: ProductionEnvironmentSchema,
  test: TestEnvironmentSchema,
  client: ClientEnvironmentSchema,
  server: ServerEnvironmentSchema,
} as const

// Type exports
export type BaseEnvironment = z.infer<typeof BaseEnvironmentSchema>
export type DevelopmentEnvironment = z.infer<typeof DevelopmentEnvironmentSchema>
export type ProductionEnvironment = z.infer<typeof ProductionEnvironmentSchema>
export type TestEnvironment = z.infer<typeof TestEnvironmentSchema>
export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>
export type ServerEnvironment = z.infer<typeof ServerEnvironmentSchema>

// Environment type union
export type ValidatedEnvironment = DevelopmentEnvironment | ProductionEnvironment | TestEnvironment

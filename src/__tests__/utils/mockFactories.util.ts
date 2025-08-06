import { jest } from '@jest/globals'

/**
 * Shared mock factories for consistent testing patterns across all server action tests
 */

// Simplified mock types for testing
export type MockSupabaseClient = any

export type MockUser = {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export type MockProfile = {
  id: string
  onboarding_completed: boolean
  primary_training_focus: string | null
  experience_level: string | null
  weight_unit: string | null
  onboarding_responses: Record<string, any> | null
}

export type MockWorkoutGroup = {
  id: string
  user_id: string
  date: string
  notes: string
  completed_at: string | null
}

export type MockTrainingProgram = {
  id: string
  user_id: string
  program_details: Record<string, any>
  created_at: string
  is_active: boolean
}

export type MockFeedback = {
  id: string
  user_id: string
  feedback_type: string
  related_item_id: string
  rating: number
  comment?: string
  created_at: string
  metadata?: Record<string, any>
}

/**
 * Mock data factories
 */
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockProfile = (overrides: Partial<MockProfile> = {}): MockProfile => ({
  id: 'test-user-id',
  onboarding_completed: false,
  primary_training_focus: null,
  experience_level: null,
  weight_unit: null,
  onboarding_responses: null,
  ...overrides,
})

export const createMockWorkoutGroup = (overrides: Partial<MockWorkoutGroup> = {}): MockWorkoutGroup => ({
  id: 'workout-group-id',
  user_id: 'test-user-id',
  date: '2024-01-01',
  notes: 'Test workout',
  completed_at: '2024-01-01T12:00:00.000Z',
  ...overrides,
})

export const createMockTrainingProgram = (overrides: Partial<MockTrainingProgram> = {}): MockTrainingProgram => ({
  id: 'test-program-id',
  user_id: 'test-user-id',
  program_details: {
    programName: 'Test Program',
    description: 'A test training program',
    phases: [],
  },
  created_at: '2024-01-01T00:00:00.000Z',
  is_active: true,
  ...overrides,
})

export const createMockFeedback = (overrides: Partial<MockFeedback> = {}): MockFeedback => ({
  id: 'feedback-id',
  user_id: 'test-user-id',
  feedback_type: 'training_program',
  related_item_id: 'test-program-id',
  rating: 5,
  comment: 'Great program!',
  created_at: '2024-01-01T00:00:00.000Z',
  metadata: {},
  ...overrides,
})

/**
 * Supabase client mock factory
 */
export const createMockSupabaseClient = (): MockSupabaseClient => {
  // Create terminal mock functions that support both mockResolvedValue and mockResolvedValueOnce
  const createTerminalMock = () => {
    const mock = jest.fn()
    mock.mockResolvedValue({
      data: null,
      error: null,
    })
    return mock
  }

  const createQueryChain = () => {
    const chain: any = {
      select: jest.fn() as any,
      eq: jest.fn() as any,
      order: jest.fn() as any,
      limit: jest.fn() as any,
      insert: jest.fn() as any,
      update: jest.fn() as any,
      upsert: jest.fn() as any,
      single: createTerminalMock(),
      maybeSingle: createTerminalMock(),
      or: jest.fn() as any,
    }
    
    // Make all methods return the chain to enable fluent chaining
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    chain.order.mockReturnValue(chain)
    chain.limit.mockReturnValue(chain)
    chain.insert.mockReturnValue(chain)
    chain.update.mockReturnValue(chain)
    chain.upsert.mockReturnValue(chain)
    chain.or.mockReturnValue(chain)
    
    return chain
  }

  // Create a reusable query chain for direct access (for legacy test compatibility)
  const mainQueryChain = createQueryChain()

  const client: any = {
    auth: {
      getUser: jest.fn() as any,
      getSession: jest.fn() as any,
    },
    from: jest.fn(() => mainQueryChain) as any, // Return the same chain so test mocks work
    rpc: jest.fn() as any,
    // Expose terminal methods at top level for legacy test compatibility
    maybeSingle: mainQueryChain.maybeSingle,
    single: mainQueryChain.single,
    select: mainQueryChain.select,
    eq: mainQueryChain.eq,
    or: mainQueryChain.or,
  }

  // Configure default mock behaviors
  client.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
  client.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  })
  client.rpc.mockResolvedValue({
    data: null,
    error: null,
  })

  return client
}

/**
 * Helper functions for common test scenarios
 */
export const mockAuthenticatedUser = (mockSupabaseClient: any, user: MockUser = createMockUser()) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
  return user
}

export const mockUnauthenticatedUser = (mockSupabaseClient: any) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}

export const mockAuthenticationError = (mockSupabaseClient: any, message = 'Token expired') => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message },
  })
}

export const mockDatabaseError = (mockSupabaseClient: any, operation: string, message = 'Database error') => {
  switch (operation) {
    case 'select':
    case 'single':
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message },
      })
      break
    case 'insert':
      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error: { message },
      })
      break
    case 'update':
      mockSupabaseClient.update.mockResolvedValue({
        data: null,
        error: { message },
      })
      break
    case 'upsert':
      mockSupabaseClient.upsert.mockResolvedValue({
        data: null,
        error: { message },
      })
      break
    default:
      throw new Error(`Unsupported operation: ${operation}`)
  }
}

export const mockSuccessfulDatabaseOperation = (
  mockSupabaseClient: any, 
  operation: string, 
  data: any = []
) => {
  switch (operation) {
    case 'select':
    case 'single':
      mockSupabaseClient.single.mockResolvedValue({
        data,
        error: null,
      })
      break
    case 'insert':
      mockSupabaseClient.insert.mockResolvedValue({
        data: Array.isArray(data) ? data : [data],
        error: null,
      })
      break
    case 'update':
      mockSupabaseClient.update.mockResolvedValue({
        data: Array.isArray(data) ? data : [data],
        error: null,
      })
      break
    case 'upsert':
      mockSupabaseClient.upsert.mockResolvedValue({
        data: Array.isArray(data) ? data : [data],
        error: null,
      })
      break
    default:
      throw new Error(`Unsupported operation: ${operation}`)
  }
}

/**
 * LLM service mock helpers
 */
export const mockLLMSuccess = (response: any) => {
  const { callLLM } = require('@/lib/llmService')
  const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>
  mockCallLLM.mockResolvedValue(response)
}

export const mockLLMFailure = (error: string) => {
  const { callLLM } = require('@/lib/llmService')
  const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>
  mockCallLLM.mockRejectedValue(new Error(error))
}

/**
 * Common test assertion helpers
 */
export const expectSuccessResult = (result: any, expectedMessage?: string) => {
  expect(result.success).toBe(true)
  if (expectedMessage) {
    expect(result.message).toBe(expectedMessage)
  }
}

export const expectErrorResult = (result: any, expectedError: string) => {
  expect(result.success).toBe(false)
  expect(result.error).toBe(expectedError)
}

export const expectDatabaseCall = (
  mockSupabaseClient: any, 
  operation: string, 
  table?: string,
  data?: any
) => {
  if (table) {
    expect(mockSupabaseClient.from).toHaveBeenCalledWith(table)
  }
  
  switch (operation) {
    case 'insert':
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(data)
      break
    case 'update':
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(data)
      break
    case 'upsert':
      if (data) {
        expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
          expect.objectContaining(data),
          expect.any(Object)
        )
      } else {
        expect(mockSupabaseClient.upsert).toHaveBeenCalled()
      }
      break
    case 'select':
      expect(mockSupabaseClient.select).toHaveBeenCalled()
      break
    default:
      throw new Error(`Unsupported assertion for operation: ${operation}`)
  }
}

/**
 * Test data generators for complex scenarios
 */
export const generateOnboardingAnswers = (overrides: Record<string, any> = {}) => ({
  primaryGoal: 'Build muscle',
  
  sportSpecificDetails: '',
  trainingFrequencyDays: 4,
  sessionDuration: '60-75 minutes',
  equipment: ['Dumbbells', 'Barbell', 'Pull-up bar'],
  exercisePreferences: 'I enjoy compound movements',
  injuriesLimitations: 'None',
  squat1RMEstimate: '100',
  benchPress1RMEstimate: '80',
  deadlift1RMEstimate: '120',
  overheadPress1RMEstimate: '50',
  strengthAssessmentType: 'Actual 1RM',
  experienceLevel: 'Intermediate',
  weightUnit: 'kg',
  ...overrides,
})

// Removed: generateTrainingProgramData factory - related functionality deleted
export const __removed_generateTrainingProgramData = (overrides: Record<string, any> = {}) => ({
  programName: 'AI Generated Program',
  description: 'Personalized training program',
  totalWeeks: 12,
  phases: [
    {
      name: 'Foundation Phase',
      weeks: 4,
      focusAreas: ['Strength', 'Technique'],
      exercises: [
        {
          name: 'Squat',
          sets: 3,
          reps: '8-10',
          weight: 'Progressive',
        },
      ],
    },
  ],
  ...overrides,
})

/**
 * Environment setup helpers for tests
 */
export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  // Restore console after all tests
  afterAll(() => {
    jest.restoreAllMocks()
  })
}

/**
 * Validation helpers for testing edge cases
 */
export const createInvalidInputs = {
  emptyString: '',
  nullValue: null,
  undefinedValue: undefined,
  negativeNumber: -1,
  zeroValue: 0,
  tooLargeNumber: 999999,
  invalidEmail: 'not-an-email',
  longString: 'A'.repeat(5000),
  specialCharacters: '!@#$%^&*()_+{}|:"<>?[]\\;\',./',
  sqlInjection: "'; DROP TABLE users; --",
  xssAttempt: '<script>alert("xss")</script>',
}

export const createValidInputBoundaries = {
  minRating: 1,
  maxRating: 5,
  minWeight: 0.5,
  maxWeight: 1000,
  minReps: 1,
  maxReps: 100,
  minSets: 1,
  maxSets: 20,
}

/**
 * Performance testing helpers
 */
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return {
    result,
    executionTime: end - start,
  }
}

export const expectFastExecution = (executionTime: number, maxMs = 100) => {
  expect(executionTime).toBeLessThan(maxMs)
}

/**
 * Concurrency testing helpers
 */
export const runConcurrentTests = async <T>(
  testFn: () => Promise<T>,
  concurrency = 5
): Promise<T[]> => {
  const promises = Array(concurrency).fill(null).map(() => testFn())
  return Promise.all(promises)
}

export const expectConsistentResults = <T>(results: T[], compareFn?: (a: T, b: T) => boolean) => {
  const firstResult = results[0]
  
  if (compareFn) {
    results.forEach(result => {
      expect(compareFn(result, firstResult)).toBe(true)
    })
  } else {
    results.forEach(result => {
      expect(result).toEqual(firstResult)
    })
  }
}

/**
 * Test suite for mock factories
 */
describe('Mock Factories', () => {
  describe('createMockSupabaseClient', () => {
    it('should create a functional mock client', () => {
      const client = createMockSupabaseClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
      expect(typeof client.auth.getUser).toBe('function')
    })
  })

  describe('createMockUser', () => {
    it('should create a mock user with default values', () => {
      const user = createMockUser()
      expect(user.id).toBe('test-user-id')
      expect(user.email).toBe('test@example.com')
    })

    it('should apply overrides correctly', () => {
      const user = createMockUser({ email: 'custom@example.com' })
      expect(user.email).toBe('custom@example.com')
      expect(user.id).toBe('test-user-id') // default preserved
    })
  })
})

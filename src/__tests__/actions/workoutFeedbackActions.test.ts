import { jest } from '@jest/globals'
import { 
  submitWorkoutFeedback,
  getWorkoutFeedback,
  type SubmitWorkoutFeedbackParams,
  type WorkoutFeedback
} from '@/app/_actions/workoutFeedbackActions'
import { createMockSupabaseClient } from '../utils/mockFactories.util'

// Mock all dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Import mocked modules for type safety
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

// Type the mocked functions
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>

// Mock data factories
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockWorkoutSessionFeedback = () => ({
  id: 'feedback-id',
  user_id: 'test-user-id',
  workout_group_id: 'workout-group-id',
  feedback: 'good' as WorkoutFeedback,
  created_at: '2024-01-01T12:30:00.000Z',
})

// Use standardized mock factory with additional methods for workout feedback
const createMockSupabaseClientForWorkoutFeedback = () => {
  const client = createMockSupabaseClient()
  
  // Add specific methods needed for workout feedback tests
  client.delete = jest.fn(() => client)
  client.range = jest.fn(() => client)
  client.filter = jest.fn(() => client)

  return client
}

describe('workoutFeedbackActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClientForWorkoutFeedback>
  let mockQueryBuilder: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClientForWorkoutFeedback()
    mockQueryBuilder = mockSupabaseClient.from() as any
    
    // Setup default mock implementations
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('submitWorkoutFeedback', () => {
    const validFeedbackParams: SubmitWorkoutFeedbackParams = {
      workoutGroupId: 'workout-group-id',
      feedback: 'good',
    }

    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })

      // Verify no database operations were attempted
      expect(mockQueryBuilder.upsert).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      } as any)

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })
    })

    it('should return an error for invalid feedback value', async () => {
      // Arrange: Valid user but invalid feedback
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      const invalidParams = {
        workoutGroupId: 'workout-group-id',
        feedback: 'invalid' as WorkoutFeedback,
      }

      // Act
      const result = await submitWorkoutFeedback(invalidParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid feedback value. Please select easy, good, or hard.',
      })

      // Verify no database operations were attempted
      expect(mockQueryBuilder.upsert).not.toHaveBeenCalled()
    })

    it('should return an error if database upsert fails', async () => {
      // Arrange: Valid setup but database upsert fails
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        error: { message: 'Upsert failed' },
      })

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to save feedback. Please try again.',
      })
    })

    it('should successfully submit workout feedback', async () => {
      // Arrange: All operations successful
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        error: null,
      })

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: true,
      })

      // Verify correct feedback data was upserted
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          workout_group_id: 'workout-group-id',
          feedback: 'good',
        },
        {
          onConflict: 'user_id,workout_group_id',
        }
      )
    })

    it('should accept all valid feedback values', async () => {
      // Test all valid feedback values
      const validFeedbackValues: WorkoutFeedback[] = ['easy', 'good', 'hard']

      for (const feedback of validFeedbackValues) {
        // Reset mocks for each iteration
        jest.clearAllMocks()
        mockSupabaseClient = createMockSupabaseClient()
        mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

        const mockUser = createMockUser()

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        } as any)

        mockQueryBuilder.upsert.mockResolvedValue({
          error: null,
        })

        const params = {
          workoutGroupId: 'workout-group-id',
          feedback,
        }

        // Act
        const result = await submitWorkoutFeedback(params)

        // Assert
        expect(result.success).toBe(true)
        expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback,
          }),
          expect.any(Object)
        )
      }
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Simulate unexpected error
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Unexpected service error'))

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })

    it('should handle database connection issues', async () => {
      // Arrange: Valid user but database operation throws
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Simulate database connection timeout
      mockQueryBuilder.upsert.mockRejectedValue(new Error('Connection timeout'))

      // Act
      const result = await submitWorkoutFeedback(validFeedbackParams)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })

    it('should use upsert to handle duplicate submissions', async () => {
      // Arrange: Valid setup to test upsert behavior
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        error: null,
      })

      // Act: Submit feedback twice
      await submitWorkoutFeedback(validFeedbackParams)
      await submitWorkoutFeedback({ ...validFeedbackParams, feedback: 'hard' })

      // Assert: Should use upsert with correct conflict resolution
      expect(mockQueryBuilder.upsert).toHaveBeenCalledTimes(2)
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.any(Object),
        {
          onConflict: 'user_id,workout_group_id',
        }
      )
    })
  })

  describe('getWorkoutFeedback', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })

      // Verify no database operations were attempted
      expect(mockSupabaseClient.single).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      } as any)

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })
    })

    it('should return an error if database query fails', async () => {
      // Arrange: Valid user but database error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DATABASE_ERROR' },
      })

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch feedback',
      })
    })

    it('should return null data if no feedback exists (PGRST116 error)', async () => {
      // Arrange: Valid user but no feedback found
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned', code: 'PGRST116' },
      })

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: true,
        data: null,
      })

      // Verify correct query was made
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('workout_group_id', 'workout-group-id')
    })

    it('should successfully return workout feedback', async () => {
      // Arrange: Valid user with existing feedback
      const mockUser = createMockUser()
      const mockFeedback = createMockWorkoutSessionFeedback()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockFeedback,
        error: null,
      })

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockFeedback,
      })

      // Verify correct query was made
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('workout_group_id', 'workout-group-id')
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Unexpected error
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Service error'))

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })

    it('should handle database connection issues', async () => {
      // Arrange: Valid user but database operation throws
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Simulate database connection timeout
      mockSupabaseClient.single.mockRejectedValue(new Error('Connection timeout'))

      // Act
      const result = await getWorkoutFeedback('workout-group-id')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete feedback submission and retrieval flow', async () => {
      // Arrange: Test the complete happy path
      const mockUser = createMockUser()
      const workoutGroupId = 'workout-group-id'
      const feedback: WorkoutFeedback = 'good'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Mock successful submission
      mockQueryBuilder.upsert.mockResolvedValue({
        error: null,
      })

      // Mock successful retrieval
      const mockFeedback = createMockWorkoutSessionFeedback()
      mockSupabaseClient.single.mockResolvedValue({
        data: mockFeedback,
        error: null,
      })

      // Act: Submit feedback then retrieve it
      const submitResult = await submitWorkoutFeedback({ workoutGroupId, feedback })
      const getResult = await getWorkoutFeedback(workoutGroupId)

      // Assert: Both operations should succeed
      expect(submitResult).toEqual({ success: true })
      expect(getResult).toEqual({
        success: true,
        data: mockFeedback,
      })

      // Verify operations were called correctly
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          workout_group_id: workoutGroupId,
          feedback,
        }),
        expect.any(Object)
      )
    })

    it('should handle concurrent feedback submissions for different workouts', async () => {
      // Arrange: Multiple simultaneous feedback submissions
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        error: null,
      })

      // Act: Submit multiple feedback concurrently for different workouts
      const promises = [
        submitWorkoutFeedback({ workoutGroupId: 'workout-1', feedback: 'easy' }),
        submitWorkoutFeedback({ workoutGroupId: 'workout-2', feedback: 'good' }),
        submitWorkoutFeedback({ workoutGroupId: 'workout-3', feedback: 'hard' }),
      ]

      const results = await Promise.all(promises)

      // Assert: All should succeed independently
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify all submissions were attempted
      expect(mockQueryBuilder.upsert).toHaveBeenCalledTimes(3)
    })

    it('should handle feedback update scenario', async () => {
      // Arrange: Test updating existing feedback
      const mockUser = createMockUser()
      const workoutGroupId = 'workout-group-id'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        error: null,
      })

      // Act: Submit initial feedback then update it
      await submitWorkoutFeedback({ workoutGroupId, feedback: 'good' })
      const updateResult = await submitWorkoutFeedback({ workoutGroupId, feedback: 'hard' })

      // Assert: Update should succeed
      expect(updateResult.success).toBe(true)

      // Verify upsert was called twice with different feedback values
      expect(mockQueryBuilder.upsert).toHaveBeenCalledTimes(2)
      expect(mockQueryBuilder.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          feedback: 'hard',
        }),
        expect.any(Object)
      )
    })
  })
}) 
import { jest } from '@jest/globals'
import { 
  testServerAction,
  submitProgramFeedback,
  submitCoachFeedback,
  getFeedbackStats
} from '@/app/_actions/feedbackActions'
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
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockProgram = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '550e8400-e29b-41d4-a716-446655440001',
  program_details: {
    programName: 'Test Program',
    description: 'A test training program',
  },
  created_at: '2024-01-01T00:00:00.000Z',
})

const createMockFeedbackEntry = () => ({
  id: 'feedback-id',
  user_id: 'test-user-id',
  feedback_type: 'training_program',
  rating: 5,
  comment: 'Great program!',
  created_at: '2024-01-01T00:00:00.000Z',
})

const createMockSupabaseClientForFeedback = () => {
  // Use the base mock factory and extend it
  const client = createMockSupabaseClient()
  
  // Add specific methods needed for feedback tests
  client.delete = jest.fn(() => client)
  client.range = jest.fn(() => client)
  client.filter = jest.fn(() => client)

  return client
}

describe('feedbackActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClientForFeedback>
  let mockQueryBuilder: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClientForFeedback()
    mockQueryBuilder = mockSupabaseClient.from() as any
    
    // Setup default mock implementations
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('testServerAction', () => {
    it('should return success message', async () => {
      // Act
      const result = await testServerAction()

      // Assert
      expect(result).toEqual({
        success: true,
        data: { message: 'Server action is working!' },
      })
    })
  })

  describe('submitProgramFeedback', () => {
    it('should always reject program feedback for Neural system', async () => {
      // Act - Program feedback should be rejected regardless of inputs
      const result = await submitProgramFeedback('any-program-id', 5, 'Great program!')

      // Assert - Neural system rejects all program feedback
      expect(result).toEqual({
        success: false,
        error: 'Program feedback is not supported for Neural-generated programs. Programs are generated on-demand.',
      })

      // Verify no database operations were attempted since function returns early
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      } as any)

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })
    })

    it('should return an error for invalid input data', async () => {
      // Arrange: Valid user but invalid input
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      // Act: Invalid rating (outside 1-5 range)
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 6, 'Invalid rating')

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('validation'),
      })
    })

    it('should return an error if program does not exist or access is denied', async () => {
      // Arrange: Valid user but program verification fails
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Program does not exist or doesn't belong to user
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' },
      })

      // Act
      const result = await submitProgramFeedback('non-existent-program', 5, 'Comment')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Program not found or access denied',
      })

      // Verify program verification query was made
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'non-existent-program')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should return an error if database connectivity test fails', async () => {
      // Arrange: Valid user and program but database connectivity fails
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockProgram, error: null }) // Program verification
        .mockResolvedValueOnce({ data: null, error: { message: 'Connection failed' } }) // Connectivity test

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, 'Comment')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Database connectivity issue. Please try again.',
      })
    })

    it('should return an error if feedback insertion fails', async () => {
      // Arrange: Valid setup but database insertion fails
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockProgram, error: null }) // Program verification
        .mockResolvedValueOnce({ data: { count: 1 }, error: null }) // Connectivity test

      mockQueryBuilder.insert.mockResolvedValue({
        error: { message: 'Insert failed' },
      })

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, 'Comment')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to save feedback. Please try again.',
      })
    })

    it('should successfully submit program feedback with comment', async () => {
      // Arrange: All operations successful
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()
      const mockFeedback = createMockFeedbackEntry()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockProgram, error: null }) // Program verification
        .mockResolvedValueOnce({ data: { count: 1 }, error: null }) // Connectivity test

      mockQueryBuilder.insert.mockResolvedValue({
        data: [mockFeedback],
        error: null,
      })

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, 'Excellent program!')

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Thank you for your feedback!',
      })

      // Verify correct feedback data was inserted
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        feedback_type: 'training_program',
        related_item_id: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        comment: 'Excellent program!',
      })
    })

    it('should successfully submit program feedback without comment', async () => {
      // Arrange: Valid submission without optional comment
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()
      const mockFeedback = createMockFeedbackEntry()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockProgram, error: null })
        .mockResolvedValueOnce({ data: { count: 1 }, error: null })

      mockQueryBuilder.insert.mockResolvedValue({
        data: [mockFeedback],
        error: null,
      })

      // Act: No comment provided
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 4)

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Thank you for your feedback!',
      })

      // Verify feedback was inserted without comment
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        feedback_type: 'training_program',
        related_item_id: '550e8400-e29b-41d4-a716-446655440000',
        rating: 4,
        comment: undefined,
      })
    })

    it('should validate rating bounds correctly', async () => {
      // Test various invalid ratings
      const invalidRatings = [0, -1, 6, 10, 0.5]

      for (const rating of invalidRatings) {
        // Reset mocks
        jest.clearAllMocks()
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: createMockUser() },
          error: null,
        } as any)

        // Act
        const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', rating, 'Comment')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toContain('validation')
      }
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Simulate unexpected error
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Unexpected service error'))

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, 'Comment')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })
  })

  describe('submitCoachFeedback', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await submitCoachFeedback(5, 'Great advice!', 'cache-key', 'hash')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required. Please log in again.',
      })
    })

    it('should return an error for invalid input data', async () => {
      // Arrange: Valid user but invalid data
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      // Act: Empty cache key
      const result = await submitCoachFeedback(5, 'Comment', '', 'hash')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })

    it('should successfully submit coach recommendation feedback', async () => {
      // Arrange: Valid setup
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        data: [{ id: 'feedback-id' }],
        error: null,
      })

      // Act
      const result = await submitCoachFeedback(
        4,
        'Helpful recommendation',
        'cache-key-123',
        'content-hash-456'
      )

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Thank you for your feedback!',
      })

      // Verify correct upsert operation
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          feedback_type: 'coach_recommendation',
          related_item_id: 'cache-key-123',
          rating: 4,
          comment: 'Helpful recommendation',
          metadata: {
            cacheKey: 'cache-key-123',
            contentHash: 'content-hash-456',
          },
        },
        {
          onConflict: 'user_id,feedback_type,related_item_id',
        }
      )
    })

    it('should handle database errors during upsert', async () => {
      // Arrange: Valid user but database error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      })

      // Act
      const result = await submitCoachFeedback(5, undefined, 'cache-key', 'hash')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to save feedback. Please try again.',
      })
    })

    it('should handle missing optional comment', async () => {
      // Arrange: Valid setup without comment
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.upsert.mockResolvedValue({
        data: [{ id: 'feedback-id' }],
        error: null,
      })

      // Act: No comment provided
      const result = await submitCoachFeedback(3, undefined, 'cache-key', 'hash')

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Thank you for your feedback!',
      })

      // Verify upsert was called without comment
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: undefined,
        }),
        expect.any(Object)
      )
    })
  })

  describe('getFeedbackStats', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await getFeedbackStats()

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

      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      // Act
      const result = await getFeedbackStats()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to retrieve feedback history',
      })
    })

    it('should successfully return recent feedback', async () => {
      // Arrange: Valid user with feedback history
      const mockUser = createMockUser()
      const mockFeedbackList = [
        { ...createMockFeedbackEntry(), id: 'feedback-1', rating: 5 },
        { ...createMockFeedbackEntry(), id: 'feedback-2', rating: 4 },
      ]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.select.mockResolvedValue({
        data: mockFeedbackList,
        error: null,
      })

      // Act
      const result = await getFeedbackStats()

      // Assert
      expect(result).toEqual({
        success: true,
        feedback: mockFeedbackList,
      })

      // Verify correct query was made
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50)
    })

    it('should return empty feedback list if user has no feedback', async () => {
      // Arrange: Valid user but no feedback
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockQueryBuilder.select.mockResolvedValue({
        data: [],
        error: null,
      })

      // Act
      const result = await getFeedbackStats()

      // Assert
      expect(result).toEqual({
        success: true,
        feedback: [],
      })
    })

    it('should handle null feedback data gracefully', async () => {
      // Arrange: Valid user but null data returned
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await getFeedbackStats()

      // Assert
      expect(result).toEqual({
        success: true,
        feedback: [],
      })
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Unexpected error
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Service error'))

      // Act
      const result = await getFeedbackStats()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely long comments appropriately', async () => {
      // Arrange: Valid user with very long comment
      const mockUser = createMockUser()
      const longComment = 'A'.repeat(2000) // Very long comment

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: createMockProgram(), error: null })
        .mockResolvedValueOnce({ data: { count: 1 }, error: null })

      mockQueryBuilder.insert.mockResolvedValue({
        data: [createMockFeedbackEntry()],
        error: null,
      })

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, longComment)

      // Assert: Should handle long comments gracefully
      expect(result.success).toBe(true)
    })

    it('should handle special characters in comments', async () => {
      // Arrange: Comment with special characters
      const mockUser = createMockUser()
      const specialComment = "Test with émojis 🎉 and special chars: @#$%^&*()_+ 'quotes' \"double quotes\""

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: createMockProgram(), error: null })
        .mockResolvedValueOnce({ data: { count: 1 }, error: null })

      mockQueryBuilder.insert.mockResolvedValue({
        data: [createMockFeedbackEntry()],
        error: null,
      })

      // Act
      const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, specialComment)

      // Assert
      expect(result.success).toBe(true)
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: specialComment,
        })
      )
    })

    it('should handle edge case rating values', async () => {
      // Test boundary values
      const validRatings = [1, 5] // Min and max valid ratings

      for (const rating of validRatings) {
        // Reset mocks
        jest.clearAllMocks()
        mockSupabaseClient = createMockSupabaseClient()
        mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

        const mockUser = createMockUser()
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        } as any)

        mockQueryBuilder.single
          .mockResolvedValueOnce({ data: createMockProgram(), error: null })
          .mockResolvedValueOnce({ data: { count: 1 }, error: null })

        mockQueryBuilder.insert.mockResolvedValue({
          data: [createMockFeedbackEntry()],
          error: null,
        })

        // Act
        const result = await submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', rating, 'Comment')

        // Assert
        expect(result.success).toBe(true)
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            rating,
          })
        )
      }
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle concurrent feedback submissions', async () => {
      // Arrange: Multiple simultaneous feedback submissions
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValue({ data: mockProgram, error: null })
        .mockResolvedValue({ data: { count: 1 }, error: null })

      mockQueryBuilder.insert.mockResolvedValue({
        data: [createMockFeedbackEntry()],
        error: null,
      })

      // Act: Submit multiple feedback concurrently
      const promises = [
        submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 5, 'First feedback'),
        submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 4, 'Second feedback'),
        submitProgramFeedback('550e8400-e29b-41d4-a716-446655440000', 3, 'Third feedback'),
      ]

      const results = await Promise.all(promises)

      // Assert: All should succeed independently
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle feedback submission after program generation', async () => {
      // Test the typical user flow: onboarding -> program generation -> feedback
      const mockUser = createMockUser()
      const mockProgram = createMockProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockProgram, error: null }) // Program verification
        .mockResolvedValueOnce({ data: { count: 1 }, error: null }) // Connectivity

      mockQueryBuilder.insert.mockResolvedValue({
        data: [createMockFeedbackEntry()],
        error: null,
      })

      // Act: Submit feedback for a newly generated program
      const result = await submitProgramFeedback(mockProgram.id, 5, 'Love my new program!')

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Thank you for your feedback!',
      })

      // Verify the program was verified against the correct user
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })
  })
}) 
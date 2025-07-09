import { jest } from '@jest/globals'
import { 
  finalizeOnboardingAndGenerateProgram,
  saveOnboardingData,
  checkOnboardingStatus,
  type FullOnboardingAnswers
} from '@/app/_actions/onboardingActions'

// Mock all dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/app/_actions/aiProgramActions')
jest.mock('@/lib/utils/goalToFocusMapping')

// Import mocked modules for type safety
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import { generateTrainingProgram } from '@/app/_actions/aiProgramActions'
import { mapGoalToTrainingFocus } from '@/lib/utils/goalToFocusMapping'

// Type the mocked functions
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockGenerateTrainingProgram = generateTrainingProgram as jest.MockedFunction<typeof generateTrainingProgram>
const mockMapGoalToTrainingFocus = mapGoalToTrainingFocus as jest.MockedFunction<typeof mapGoalToTrainingFocus>

// Mock data factories
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockOnboardingData = (): FullOnboardingAnswers => ({
  primaryGoal: 'Muscle Gain',
  secondaryGoal: 'Strength Gain',
  sportSpecificDetails: '',
  trainingFrequencyDays: 4,
  sessionDuration: '60-75 minutes',
  equipment: ['Dumbbells', 'Full Gym (Barbells, Racks, Machines)'],
  exercisePreferences: 'I enjoy compound movements',
  injuriesLimitations: 'None',
  squat1RMEstimate: 100,
  benchPress1RMEstimate: 80,
  deadlift1RMEstimate: 120,
  overheadPress1RMEstimate: 50,
  strengthAssessmentType: 'actual_1rm',
  experienceLevel: 'intermediate',
  weightUnit: 'kg',
})

const createMockProfile = () => ({
  id: 'test-user-id',
  onboarding_completed: false,
  primary_training_focus: null,
  experience_level: null,
  weight_unit: null,
  onboarding_responses: null,
})

const createMockSupabaseClient = () => {
  // Create a mock query builder that can be chained properly
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
  }

  return {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn().mockReturnValue(mockQueryBuilder),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}

describe('onboardingActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>
  let mockQueryBuilder: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClient()
    mockQueryBuilder = mockSupabaseClient.from() as any
    
    // Setup default mock implementations
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
    mockMapGoalToTrainingFocus.mockReturnValue('Muscle Gain')
  })

  describe('finalizeOnboardingAndGenerateProgram', () => {
    it('should call saveOnboardingData with the provided form data', async () => {
      // Arrange: Valid user and successful onboarding save
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: true,
        program: { id: 'test-program' },
      } as any)

      // Act
      const result = await finalizeOnboardingAndGenerateProgram(mockFormData)

      // Assert
      expect(result).toEqual({ success: true })
      
      // Verify that the onboarding data processing happened
      expect(mockMapGoalToTrainingFocus).toHaveBeenCalledWith('Muscle Gain')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          primary_training_focus: 'Muscle Gain',
          experience_level: 'Intermediate',
          weight_unit: 'kg',
          onboarding_completed: true,
          onboarding_responses: expect.objectContaining({
            primaryGoal: 'Build muscle',
            trainingFrequencyDays: 4,
          }),
        })
      )
    })

    it('should return an error if saveOnboardingData fails', async () => {
      // Arrange: Authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any)

      const mockFormData = createMockOnboardingData()

      // Act
      const result = await finalizeOnboardingAndGenerateProgram(mockFormData)

      // Assert
      expect(result).toEqual({
        error: 'Authentication failed. Please log in again.',
      })
    })
  })

  describe('saveOnboardingData', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const mockFormData = createMockOnboardingData()

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        error: 'You must be logged in to complete onboarding.',
      })

      // Verify no database operations were attempted
      expect(mockQueryBuilder.update).not.toHaveBeenCalled()
      expect(mockGenerateTrainingProgram).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      } as any)

      const mockFormData = createMockOnboardingData()

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        error: 'Authentication failed. Please log in again.',
      })
    })

    it('should return an error if database update fails', async () => {
      // Arrange: Valid user but database update fails
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: { message: 'Database connection failed' },
      })

      const mockFormData = createMockOnboardingData()

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        error: 'Failed to save your onboarding data. Please try again.',
      })

      // Verify training program generation was not attempted
      expect(mockGenerateTrainingProgram).not.toHaveBeenCalled()
    })

    it('should successfully save onboarding data and generate training program', async () => {
      // Arrange: All operations successful
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: true,
        program: { id: 'generated-program' },
      } as any)

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify correct data transformation and database update
      expect(mockMapGoalToTrainingFocus).toHaveBeenCalledWith('Muscle Gain')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        primary_training_focus: 'Muscle Gain',
        experience_level: 'Intermediate',
        weight_unit: 'kg',
        onboarding_completed: true,
        onboarding_responses: {
          primaryGoal: 'Build muscle',
          secondaryGoal: 'Improve strength',
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
        },
      })

      // Verify training program generation was called
      expect(mockGenerateTrainingProgram).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return success with warning if training program generation fails', async () => {
      // Arrange: Onboarding save successful but program generation fails
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: false,
        error: 'LLM service unavailable',
      } as any)

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        success: true,
        warning: 'Onboarding completed but program generation failed. Please try generating your program again.',
      })

      // Verify onboarding data was still saved
      expect(mockQueryBuilder.update).toHaveBeenCalled()
      expect(mockGenerateTrainingProgram).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return success with warning if training program generation throws', async () => {
      // Arrange: Onboarding save successful but program generation throws exception
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockRejectedValue(new Error('Network timeout'))

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        success: true,
        warning: 'Onboarding completed but program generation failed. Please try generating your program again.',
      })
    })

    it('should correctly separate profile fields from onboarding responses', async () => {
      // Arrange: Test data transformation logic
      const mockUser = createMockUser()
      const mockFormData: FullOnboardingAnswers = {
        ...createMockOnboardingData(),
        experienceLevel: 'Advanced',
        weightUnit: 'lbs',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: true,
        program: { id: 'test-program' },
      } as any)

      // Act
      await saveOnboardingData(mockFormData)

      // Assert: Verify that profile fields are separated correctly
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          experience_level: 'Advanced',
          weight_unit: 'lbs',
          onboarding_responses: expect.not.objectContaining({
            experienceLevel: expect.anything(),
            weightUnit: expect.anything(),
          }),
        })
      )

      // Verify that onboarding responses don't contain profile fields
      const updateCall = mockQueryBuilder.update.mock.calls[0][0]
      expect(updateCall.onboarding_responses).not.toHaveProperty('experienceLevel')
      expect(updateCall.onboarding_responses).not.toHaveProperty('weightUnit')
    })

    it('should handle missing optional fields gracefully', async () => {
      // Arrange: Minimal required onboarding data
      const mockUser = createMockUser()
      const minimalFormData: FullOnboardingAnswers = {
        primaryGoal: 'Build muscle',
        secondaryGoal: '',
        sportSpecificDetails: '',
        trainingFrequencyDays: 3,
        sessionDuration: '45-60 minutes',
        equipment: ['Dumbbells'],
        exercisePreferences: '',
        injuriesLimitations: '',
        squat1RMEstimate: '',
        benchPress1RMEstimate: '',
        deadlift1RMEstimate: '',
        overheadPress1RMEstimate: '',
        strengthAssessmentType: 'Not assessed',
        experienceLevel: 'Beginner',
        weightUnit: 'kg',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: true,
        program: { id: 'test-program' },
      } as any)

      // Act
      const result = await saveOnboardingData(minimalFormData)

      // Assert
      expect(result).toEqual({ success: true })

      // Verify that empty/optional fields are handled correctly
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_responses: expect.objectContaining({
            secondaryGoal: '',
            exercisePreferences: '',
            injuriesLimitations: '',
            squat1RMEstimate: '',
          }),
        })
      )
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Unexpected error during processing
      const mockFormData = createMockOnboardingData()

      // Mock an unexpected error in the Supabase client creation
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Unexpected service error'))

      // Act
      const result = await saveOnboardingData(mockFormData)

      // Assert
      expect(result).toEqual({
        error: 'An unexpected error occurred while saving your data. Please try again.',
      })
    })
  })

  describe('checkOnboardingStatus', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({
        error: 'Authentication required',
      })
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      } as any)

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({
        error: 'Authentication required',
      })
    })

    it('should return an error if database query fails', async () => {
      // Arrange: Valid user but database error
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Table does not exist' },
      })

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({
        error: 'Failed to check onboarding status',
      })
    })

    it('should return false for users who have not completed onboarding', async () => {
      // Arrange: User exists but onboarding not completed
      const mockUser = createMockUser()
      const mockProfile = { ...createMockProfile(), onboarding_completed: false }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({ completed: false })

      // Verify correct query was made
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('onboarding_completed')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('should return true for users who have completed onboarding', async () => {
      // Arrange: User with completed onboarding
      const mockUser = createMockUser()
      const mockProfile = { ...createMockProfile(), onboarding_completed: true }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({ completed: true })
    })

    it('should return false if profile onboarding_completed is null', async () => {
      // Arrange: User profile with null onboarding_completed field
      const mockUser = createMockUser()
      const mockProfile = { ...createMockProfile(), onboarding_completed: null }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({ completed: false })
    })

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Unexpected error
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Service unavailable'))

      // Act
      const result = await checkOnboardingStatus()

      // Assert
      expect(result).toEqual({
        error: 'An unexpected error occurred',
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete onboarding flow from start to finish', async () => {
      // Arrange: Test the complete happy path
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()
      const mockGeneratedProgram = { id: 'generated-program', name: 'Test Program' }

      // Mock authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Mock successful database update
      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      // Mock successful program generation
      mockGenerateTrainingProgram.mockResolvedValue({
        success: true,
        program: mockGeneratedProgram,
      } as any)

      // Act: Complete the onboarding flow
      const result = await finalizeOnboardingAndGenerateProgram(mockFormData)

      // Assert: Verify entire flow completed successfully
      expect(result).toEqual({ success: true })

      // Verify all steps were executed in order
      expect(mockMapGoalToTrainingFocus).toHaveBeenCalledWith('Muscle Gain')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed: true,
        })
      )
      expect(mockGenerateTrainingProgram).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle partial failures gracefully', async () => {
      // Arrange: Onboarding saves but program generation fails
      const mockUser = createMockUser()
      const mockFormData = createMockOnboardingData()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      mockGenerateTrainingProgram.mockResolvedValue({
        success: false,
        error: 'AI service temporarily unavailable',
      } as any)

      // Act
      const result = await finalizeOnboardingAndGenerateProgram(mockFormData)

      // Assert: Should succeed with warning
      expect(result).toEqual({
        success: true,
        warning: 'Onboarding completed but program generation failed. Please try generating your program again.',
      })

      // Verify user's onboarding was still saved
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed: true,
        })
      )
    })
  })

  describe('Data Validation and Edge Cases', () => {
    it('should handle different goal types correctly', async () => {
      // Test different primary goals and their mappings
      const goals = [
        { goal: 'Build muscle', expectedFocus: 'Muscle Gain' },
        { goal: 'Lose weight', expectedFocus: 'Weight Loss' },
        { goal: 'Improve athletic performance', expectedFocus: 'Athletic Performance' },
      ]

      for (const { goal, expectedFocus } of goals) {
        // Reset mocks
        jest.clearAllMocks()
        mockSupabaseClient = createMockSupabaseClient()
        mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

        const mockUser = createMockUser()
        const mockFormData = { ...createMockOnboardingData(), primaryGoal: goal }

        mockMapGoalToTrainingFocus.mockReturnValue(expectedFocus)
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        } as any)
        mockQueryBuilder.eq.mockResolvedValue({ error: null })
        mockGenerateTrainingProgram.mockResolvedValue({
          success: true,
          program: { id: 'test' },
        } as any)

        // Act
        await saveOnboardingData(mockFormData)

        // Assert
        expect(mockMapGoalToTrainingFocus).toHaveBeenCalledWith(goal)
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({
            primary_training_focus: expectedFocus,
          })
        )
      }
    })

    it('should handle various equipment combinations', async () => {
      // Arrange: Test different equipment arrays
      const mockUser = createMockUser()
      const equipmentCombinations = [
        ['Bodyweight only'],
        ['Dumbbells', 'Barbell'],
        ['Full gym access', 'Cable machine', 'Smith machine'],
      ]

      for (const equipment of equipmentCombinations) {
        // Reset mocks for each iteration
        jest.clearAllMocks()
        mockSupabaseClient = createMockSupabaseClient()
        mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

        const mockFormData = { ...createMockOnboardingData(), equipment }

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        } as any)
        mockQueryBuilder.eq.mockResolvedValue({ error: null })
        mockGenerateTrainingProgram.mockResolvedValue({
          success: true,
          program: { id: 'test' },
        } as any)

        // Act
        await saveOnboardingData(mockFormData)

        // Assert
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({
            onboarding_responses: expect.objectContaining({
              equipment,
            }),
          })
        )
      }
    })

    it('should handle different weight units correctly', async () => {
      // Test both kg and lbs
      const weightUnits = ['kg', 'lbs'] as const

      for (const weightUnit of weightUnits) {
        // Reset mocks
        jest.clearAllMocks()
        mockSupabaseClient = createMockSupabaseClient()
        mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

        const mockUser = createMockUser()
        const mockFormData = { ...createMockOnboardingData(), weightUnit }

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        } as any)
        mockQueryBuilder.eq.mockResolvedValue({ error: null })
        mockGenerateTrainingProgram.mockResolvedValue({
          success: true,
          program: { id: 'test' },
        } as any)

        // Act
        await saveOnboardingData(mockFormData)

        // Assert
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({
            weight_unit: weightUnit,
          })
        )
      }
    })
  })
}) 
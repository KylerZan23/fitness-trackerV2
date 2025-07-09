import { jest } from '@jest/globals'
import { 
  generateTrainingProgram, 
  getCurrentTrainingProgram, 
  fetchActiveProgramAction,
  getDailyAdaptedWorkout,
  adaptNextWeek,
  checkAndRegisterPB
} from '@/app/_actions/aiProgramActions'
import { DayOfWeek } from '@/lib/types/program'

// Mock all dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/llmService')
jest.mock('@/lib/db/program')
jest.mock('fs/promises')
jest.mock('path')

// Import mocked modules for type safety
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import { callLLM } from '@/lib/llmService'
import { getActiveTrainingProgram } from '@/lib/db/program'
import fs from 'fs/promises'
import path from 'path'

// Type the mocked functions
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>
const mockGetActiveTrainingProgram = getActiveTrainingProgram as jest.MockedFunction<typeof getActiveTrainingProgram>
const mockFs = fs as jest.Mocked<typeof fs>
const mockPath = path as jest.Mocked<typeof path>

// Mock data factories
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockUserProfile = () => ({
  id: 'test-user-id',
  name: 'Test User',
  age: 30,
  weight_unit: 'kg',
  primary_training_focus: 'Muscle Gain',
  experience_level: 'Intermediate',
  onboarding_responses: {
    primaryGoal: 'Build muscle',
    secondaryGoal: 'Improve strength',
    trainingFrequencyDays: 4,
    sessionDuration: '60-75 minutes',
    equipment: ['Dumbbells', 'Barbell', 'Pull-up bar'],
    exercisePreferences: 'I enjoy compound movements',
    injuriesLimitations: 'None',
    squat1RMEstimate: '100kg',
    benchPress1RMEstimate: '80kg',
    deadlift1RMEstimate: '120kg',
    overheadPress1RMEstimate: '50kg',
    strengthAssessmentType: 'Actual 1RM'
  }
})

const createMockTrainingProgram = () => ({
  programName: 'Test Program',
  description: 'A test training program',
  durationWeeksTotal: 12,
  phases: [
    {
      phaseName: 'Foundation Phase',
      durationWeeks: 4,
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              focus: 'Upper Body',
              exercises: [
                {
                  name: 'Bench Press',
                  sets: 3,
                  reps: '8-10',
                  rest: '2-3 minutes',
                  weight: '70kg',
                  category: 'Compound'
                }
              ],
              warmUp: [],
              coolDown: [],
              estimatedDurationMinutes: 60,
              isRestDay: false
            }
          ]
        }
      ],
      objectives: ['Build base strength'],
      notes: 'Foundation phase notes'
    }
  ],
  generalAdvice: 'Stay consistent',
  generatedAt: '2024-01-01T00:00:00.000Z',
  aiModelUsed: 'gpt-4o',
  difficultyLevel: 'Intermediate',
  requiredEquipment: ['Dumbbells', 'Barbell']
})

const createMockWorkoutDay = () => ({
  dayOfWeek: DayOfWeek.MONDAY,
  focus: 'Upper Body',
  exercises: [
    {
      name: 'Bench Press',
      sets: 3,
      reps: '8-10',
      rest: '2-3 minutes',
      weight: '70kg',
      category: 'Compound'
    }
  ],
  warmUp: [],
  coolDown: [],
  estimatedDurationMinutes: 60,
  isRestDay: false
})

const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  rpc: jest.fn(),
})

describe('aiProgramActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClient()
    
    // Setup default mock implementations
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
    
    // Mock path.join and fs functions
    mockPath.join.mockReturnValue('/mock/path/file.json')
    mockPath.dirname.mockReturnValue('/mock/path')
    mockFs.mkdir.mockResolvedValue(undefined)
    mockFs.writeFile.mockResolvedValue(undefined)
  })

  describe('generateTrainingProgram', () => {
    it('should return an error if the user is not authenticated', async () => {
      // Arrange: Configure the mocked client to return no user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act: Call the generateTrainingProgram action
      const result = await generateTrainingProgram()

      // Assert: Check that the result is an authentication error
      expect(result).toEqual({
        error: 'Authentication required',
        success: false,
      })

      // Verify that dependent functions were not called
      expect(mockCallLLM).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Configure the mocked client to return an auth error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session expired' },
      } as any)

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Authentication required',
        success: false,
      })
    })

    it('should return an error if user profile cannot be fetched', async () => {
      // Arrange: User is authenticated but profile fetch fails
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Failed to fetch user profile',
        success: false,
      })
    })

    it('should return an error if user has not completed onboarding', async () => {
      // Arrange: User is authenticated but has no onboarding data
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      const incompleteProfile = { ...createMockUserProfile(), onboarding_responses: null }
      mockSupabaseClient.single.mockResolvedValue({ data: incompleteProfile, error: null })

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Please complete onboarding first',
        success: false,
      })
    })

    it('should return an error if LLM API call fails', async () => {
      // Arrange: Valid user and profile but LLM fails
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({ 
        data: createMockUserProfile(), 
        error: null 
      })

      mockCallLLM.mockRejectedValue(new Error('LLM API error'))

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Failed to communicate with AI service for program generation',
        success: false,
      })
    })

    it('should return an error if LLM returns invalid program structure', async () => {
      // Arrange: Valid user and profile but LLM returns invalid data
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({ 
        data: createMockUserProfile(), 
        error: null 
      })

      // Return invalid program structure (missing required fields)
      mockCallLLM.mockResolvedValue({ invalidField: 'invalid' })

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Generated program structure is invalid',
        success: false,
      })
    })

    it('should return an error if database save fails', async () => {
      // Arrange: Valid user, profile, and LLM response but database save fails
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: createMockUserProfile(), error: null })
        .mockRejectedValue(new Error('Database save error'))

      mockCallLLM.mockResolvedValue(createMockTrainingProgram())

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Failed to save training program',
        success: false,
      })
    })

    it('should successfully generate and save a training program', async () => {
      // Arrange: All dependencies working correctly
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockProgram = createMockTrainingProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ 
          data: { id: 'saved-program-id' }, 
          error: null 
        })

      mockCallLLM.mockResolvedValue(mockProgram)

      // Act
      const result = await generateTrainingProgram()

      // Assert
      expect(result).toEqual({
        program: expect.objectContaining({
          programName: 'Test Program',
          description: 'A test training program',
          durationWeeksTotal: 12,
        }),
        success: true,
      })

      // Verify LLM was called with proper prompt
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('You are an expert strength and conditioning coach'),
        'user',
        expect.objectContaining({
          response_format: { type: 'json_object' },
          max_tokens: 16000,
          model: 'gpt-4o',
        })
      )

      // Verify database save was attempted
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          program_details: expect.any(Object),
          ai_model_version: 'gpt-4o',
          onboarding_data_snapshot: mockProfile.onboarding_responses,
        })
      )
    })

    it('should work with a specific user ID parameter', async () => {
      // Arrange: Testing the userIdToGenerateFor parameter
      const specificUserId = 'specific-user-id'
      const mockProfile = { 
        ...createMockUserProfile(), 
        id: specificUserId 
      }

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ 
          data: { id: 'saved-program-id' }, 
          error: null 
        })

      mockCallLLM.mockResolvedValue(createMockTrainingProgram())

      // Act
      const result = await generateTrainingProgram(specificUserId)

      // Assert
      expect(result.success).toBe(true)
      
      // Verify that auth.getUser was not called since we provided a user ID
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled()
      
      // Verify the correct user ID was used in database queries
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', specificUserId)
    })
  })

  describe('getCurrentTrainingProgram', () => {
    it('should return an error if the user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await getCurrentTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Authentication required',
      })
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Auth error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session expired' },
      } as any)

      // Act
      const result = await getCurrentTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Authentication required',
      })
    })

    it('should return an error if database query fails', async () => {
      // Arrange: Authenticated user but database error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      // Act
      const result = await getCurrentTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'Failed to fetch training program',
      })
    })

    it('should return an error if no active program is found', async () => {
      // Arrange: Authenticated user but no program
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await getCurrentTrainingProgram()

      // Assert
      expect(result).toEqual({
        error: 'No active training program found',
      })
    })

    it('should successfully return the user\'s active training program', async () => {
      // Arrange: Authenticated user with active program
      const mockUser = createMockUser()
      const mockProgramData = {
        id: 'program-id',
        user_id: mockUser.id,
        program_details: createMockTrainingProgram(),
        is_active: true,
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockProgramData,
        error: null,
      })

      // Act
      const result = await getCurrentTrainingProgram()

      // Assert
      expect(result).toEqual({
        program: mockProgramData,
      })

      // Verify correct query was made
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('generated_at', { ascending: false })
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1)
    })

    it('should work with a specific user ID parameter', async () => {
      // Arrange: Testing the userId parameter
      const specificUserId = 'specific-user-id'
      const mockProgramData = {
        id: 'program-id',
        user_id: specificUserId,
        program_details: createMockTrainingProgram(),
        is_active: true,
      }

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockProgramData,
        error: null,
      })

      // Act
      const result = await getCurrentTrainingProgram(specificUserId)

      // Assert
      expect(result).toEqual({
        program: mockProgramData,
      })
      
      // Verify that auth.getUser was not called since we provided a user ID
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled()
      
      // Verify the correct user ID was used
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', specificUserId)
    })
  })

  describe('fetchActiveProgramAction', () => {
    it('should return empty data if no active program is found', async () => {
      // Arrange: No active program
      mockGetActiveTrainingProgram.mockResolvedValue(null)

      // Act
      const result = await fetchActiveProgramAction()

      // Assert
      expect(result).toEqual({
        program: null,
        completedDays: [],
      })
    })

    it('should return an error if getActiveTrainingProgram throws', async () => {
      // Arrange: Function throws an error
      mockGetActiveTrainingProgram.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await fetchActiveProgramAction()

      // Assert
      expect(result).toEqual({
        program: null,
        completedDays: [],
        error: 'Failed to fetch your training program. Please try again.',
      })
    })

    it('should return program with empty completed days if workout query fails', async () => {
      // Arrange: Active program but workout query fails
      const mockProgram = { id: 'program-id', ...createMockTrainingProgram() }
      mockGetActiveTrainingProgram.mockResolvedValue(mockProgram as any)

      mockSupabaseClient.not.mockResolvedValue({
        data: null,
        error: { message: 'Workout query error' },
      })

      // Act
      const result = await fetchActiveProgramAction()

      // Assert
      expect(result).toEqual({
        program: mockProgram,
        completedDays: [],
      })
    })

    it('should successfully return program with completed days', async () => {
      // Arrange: Active program with completed workouts
      const mockProgram = { id: 'program-id', ...createMockTrainingProgram() }
      const mockCompletedWorkouts = [
        {
          linked_program_phase_index: 0,
          linked_program_week_index: 0,
          linked_program_day_of_week: 1,
        },
        {
          linked_program_phase_index: 0,
          linked_program_week_index: 0,
          linked_program_day_of_week: 3,
        },
      ]

      mockGetActiveTrainingProgram.mockResolvedValue(mockProgram as any)

      mockSupabaseClient.not.mockResolvedValue({
        data: mockCompletedWorkouts,
        error: null,
      })

      // Act
      const result = await fetchActiveProgramAction()

      // Assert
      expect(result).toEqual({
        program: mockProgram,
        completedDays: [
          {
            phaseIndex: 0,
            weekIndex: 0,
            dayOfWeek: 1,
          },
          {
            phaseIndex: 0,
            weekIndex: 0,
            dayOfWeek: 3,
          },
        ],
      })

      // Verify correct workout query was made
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('linked_program_id', 'program-id')
      expect(mockSupabaseClient.not).toHaveBeenCalledWith('linked_program_phase_index', 'is', null)
      expect(mockSupabaseClient.not).toHaveBeenCalledWith('linked_program_week_index', 'is', null)
      expect(mockSupabaseClient.not).toHaveBeenCalledWith('linked_program_day_of_week', 'is', null)
    })
  })

  describe('getDailyAdaptedWorkout', () => {
    it('should return an error if LLM call fails', async () => {
      // Arrange: LLM call fails
      const mockWorkout = createMockWorkoutDay()
      const mockReadiness = { sleep: 'Poor' as const, energy: 'Sore/Tired' as const }

      mockCallLLM.mockRejectedValue(new Error('LLM API error'))

      // Act
      const result = await getDailyAdaptedWorkout(mockWorkout, mockReadiness)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred while adapting your workout',
      })
    })

    it('should return an error if LLM returns invalid workout structure', async () => {
      // Arrange: LLM returns invalid structure
      const mockWorkout = createMockWorkoutDay()
      const mockReadiness = { sleep: 'Poor' as const, energy: 'Sore/Tired' as const }

      mockCallLLM.mockResolvedValue({ invalidField: 'invalid' })

      // Act
      const result = await getDailyAdaptedWorkout(mockWorkout, mockReadiness)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to generate valid workout adaptation',
      })
    })

    it('should successfully adapt workout based on readiness', async () => {
      // Arrange: Valid inputs and LLM response
      const mockWorkout = createMockWorkoutDay()
      const mockReadiness = { sleep: 'Great' as const, energy: 'Ready to Go' as const }
      const adaptedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: 4, // Increased sets due to good readiness
            weight: '75kg' // Increased weight
          }
        ]
      }

      mockCallLLM.mockResolvedValue(adaptedWorkout)

      // Act
      const result = await getDailyAdaptedWorkout(mockWorkout, mockReadiness)

      // Assert
      expect(result).toEqual({
        success: true,
        adaptedWorkout: adaptedWorkout,
      })

      // Verify LLM was called with correct parameters
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('adapt the following workout'),
        'user',
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          max_tokens: 2000,
        })
      )
    })

    it('should handle poor readiness appropriately', async () => {
      // Arrange: Poor readiness should result in easier workout
      const mockWorkout = createMockWorkoutDay()
      const mockReadiness = { sleep: 'Poor' as const, energy: 'Sore/Tired' as const }
      const adaptedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: 2, // Reduced sets due to poor readiness
            weight: '60kg' // Reduced weight
          }
        ]
      }

      mockCallLLM.mockResolvedValue(adaptedWorkout)

      // Act
      const result = await getDailyAdaptedWorkout(mockWorkout, mockReadiness)

      // Assert
      expect(result.success).toBe(true)
      expect(result.adaptedWorkout).toEqual(adaptedWorkout)

      // Verify the prompt includes readiness information
      const promptCall = mockCallLLM.mock.calls[0][0]
      expect(promptCall).toContain('Poor')
      expect(promptCall).toContain('Sore/Tired')
    })
  })

  describe('adaptNextWeek', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      // Act
      const result = await adaptNextWeek('good')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should return an error if no active program is found', async () => {
      // Arrange: Authenticated user but no active program
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'No active program' },
      })

      // Act
      const result = await adaptNextWeek('good')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'No active training program found',
      })
    })

    it('should return an error if LLM adaptation fails', async () => {
      // Arrange: Valid user and program but LLM fails
      const mockProgramData = {
        id: 'program-id',
        program_details: createMockTrainingProgram(),
        current_week: 1,
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProgramData,
        error: null,
      })

      mockCallLLM.mockRejectedValue(new Error('LLM error'))

      // Act
      const result = await adaptNextWeek('hard')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred while adapting your program',
      })
    })

    it('should successfully adapt next week based on feedback', async () => {
      // Arrange: Valid setup for successful adaptation
      const mockProgram = createMockTrainingProgram()
      const mockProgramData = {
        id: 'program-id',
        program_details: mockProgram,
        current_week: 1,
      }

      const adaptedWeek = {
        weekNumber: 2,
        days: [
          {
            ...createMockWorkoutDay(),
            exercises: [
              {
                name: 'Bench Press',
                sets: 4, // Increased sets based on 'easy' feedback
                reps: '8-10',
                rest: '2-3 minutes',
                weight: '75kg',
                category: 'Compound'
              }
            ]
          }
        ]
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      } as any)

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockProgramData, error: null })
        .mockResolvedValueOnce({ data: { id: 'updated-program' }, error: null })

      mockCallLLM.mockResolvedValue(adaptedWeek)

      // Act
      const result = await adaptNextWeek('easy')

      // Assert
      expect(result).toEqual({
        success: true,
        adaptedWeek: adaptedWeek,
      })

      // Verify LLM was called with appropriate adaptation prompt
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('adapt the next week'),
        'user',
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.3,
        })
      )

      // Verify database update was attempted
      expect(mockSupabaseClient.update).toHaveBeenCalled()
    })

    it('should handle different feedback types appropriately', async () => {
      // Test each feedback type
      const feedbackTypes = ['easy', 'good', 'hard'] as const

      for (const feedback of feedbackTypes) {
        // Reset mocks
        jest.clearAllMocks()

        // Arrange
        const mockProgramData = {
          id: 'program-id',
          program_details: createMockTrainingProgram(),
          current_week: 1,
        }

        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'test-user-id' } } },
          error: null,
        } as any)

        mockSupabaseClient.single
          .mockResolvedValueOnce({ data: mockProgramData, error: null })
          .mockResolvedValueOnce({ data: { id: 'updated-program' }, error: null })

        mockCallLLM.mockResolvedValue({
          weekNumber: 2,
          days: [createMockWorkoutDay()]
        })

        // Act
        const result = await adaptNextWeek(feedback)

        // Assert
        expect(result.success).toBe(true)

        // Verify the feedback was included in the prompt
        const promptCall = mockCallLLM.mock.calls[0][0]
        expect(promptCall).toContain(feedback)
      }
    })
  })

  describe('checkAndRegisterPB', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await checkAndRegisterPB('Bench Press', 100, 5)

      // Assert
      expect(result).toEqual({
        isPB: false,
        error: 'User not authenticated',
      })
    })

    it('should return an error if database query fails', async () => {
      // Arrange: Authenticated user but database error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await checkAndRegisterPB('Bench Press', 100, 5)

      // Assert
      expect(result).toEqual({
        isPB: false,
        error: 'Failed to check personal best records',
      })
    })

    it('should detect and register a new personal best', async () => {
      // Arrange: User has previous records but new performance is better
      const mockUser = createMockUser()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // Mock existing record (lower than new performance)
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { max_weight: 95, max_reps: 4 }, // Previous best
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'new-pb-id' },
          error: null,
        })

      // Act: New performance is better (100kg x 5 reps)
      const result = await checkAndRegisterPB('Bench Press', 100, 5)

      // Assert
      expect(result).toEqual({
        isPB: true,
        pbType: 'Overall PB',
      })

      // Verify new PB was inserted
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          exercise_name: 'Bench Press',
          weight: 100,
          reps: 5,
          pb_type: 'Overall PB',
        })
      )
    })

    it('should return false for performance that is not a personal best', async () => {
      // Arrange: User has better previous records
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      // Mock existing record (better than new performance)
      mockSupabaseClient.single.mockResolvedValue({
        data: { max_weight: 110, max_reps: 6 }, // Previous best is better
        error: null,
      })

      // Act: New performance is not better (100kg x 5 reps)
      const result = await checkAndRegisterPB('Bench Press', 100, 5)

      // Assert
      expect(result).toEqual({
        isPB: false,
      })

      // Verify no new PB was inserted
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled()
    })

    it('should handle first time performing an exercise', async () => {
      // Arrange: No previous records for this exercise
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      // Mock no existing records
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'first-pb-id' },
          error: null,
        })

      // Act
      const result = await checkAndRegisterPB('Deadlift', 150, 3)

      // Assert
      expect(result).toEqual({
        isPB: true,
        pbType: 'First Time PB',
      })

      // Verify new PB was inserted with correct type
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          exercise_name: 'Deadlift',
          weight: 150,
          reps: 3,
          pb_type: 'First Time PB',
        })
      )
    })

    it('should handle database insertion errors gracefully', async () => {
      // Arrange: Valid PB but database insertion fails
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { max_weight: 90, max_reps: 4 }, // Previous best (lower)
          error: null,
        })
        .mockRejectedValue(new Error('Database insertion error'))

      // Act
      const result = await checkAndRegisterPB('Bench Press', 100, 5)

      // Assert
      expect(result).toEqual({
        isPB: false,
        error: 'Failed to register personal best',
      })
    })

    it('should correctly calculate different types of personal bests', async () => {
      // Test weight PB
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      // Previous: 90kg x 8 reps, New: 100kg x 5 reps (weight PB)
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { max_weight: 90, max_reps: 8 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'weight-pb-id' },
          error: null,
        })

      const result = await checkAndRegisterPB('Squat', 100, 5)

      expect(result).toEqual({
        isPB: true,
        pbType: 'Weight PB',
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed onboarding data gracefully', async () => {
      // Arrange: User profile with malformed onboarding data
      const malformedProfile = {
        ...createMockUserProfile(),
        onboarding_responses: {
          // Missing required fields
          primaryGoal: 'Build muscle',
          // trainingFrequencyDays missing
          // equipment missing
        }
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: malformedProfile,
        error: null,
      })

      // Act
      const result = await generateTrainingProgram()

      // Assert - Should handle gracefully and still attempt generation
      expect(result.success).toBe(false)
      expect(result.error).toContain('communicate with AI service')
    })

    it('should handle network timeouts and retries appropriately', async () => {
      // This test would be more relevant with actual retry logic
      // For now, testing that network errors are handled gracefully

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: createMockUserProfile(),
        error: null,
      })

      // Simulate network timeout
      mockCallLLM.mockRejectedValue(new Error('Network timeout'))

      const result = await generateTrainingProgram()

      expect(result).toEqual({
        success: false,
        error: 'Failed to communicate with AI service for program generation',
      })
    })

    it('should handle concurrent program generation requests', async () => {
      // Test that multiple simultaneous calls don't interfere with each other
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockProgram = createMockTrainingProgram()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single
        .mockResolvedValue({ data: mockProfile, error: null })
        .mockResolvedValue({ data: { id: 'saved-program-id' }, error: null })

      mockCallLLM.mockResolvedValue(mockProgram)

      // Act: Make multiple concurrent calls
      const promises = [
        generateTrainingProgram(),
        generateTrainingProgram(),
        generateTrainingProgram(),
      ]

      const results = await Promise.all(promises)

      // Assert: All should succeed independently
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
}) 
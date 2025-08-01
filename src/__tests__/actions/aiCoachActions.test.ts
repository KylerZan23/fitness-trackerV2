import { jest } from '@jest/globals'
import { getAICoachRecommendation, type AICoachRecommendation } from '@/app/_actions/aiCoachActions'

// Mock the dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/llmService')
jest.mock('@/lib/db/index')
jest.mock('@/lib/db/goals')
jest.mock('@/lib/db/program')
jest.mock('next/headers')

// Import mocked modules for type safety
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import { callLLM } from '@/lib/llmService'
import { getUserProfile } from '@/lib/db/index'
import { fetchCurrentWeekGoalsWithProgress } from '@/lib/db/goals'
import { getActiveTrainingProgram } from '@/lib/db/program'
import { cookies } from 'next/headers'

// Type the mocked functions
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>
const mockFetchCurrentWeekGoalsWithProgress = fetchCurrentWeekGoalsWithProgress as jest.MockedFunction<typeof fetchCurrentWeekGoalsWithProgress>
const mockGetActiveTrainingProgram = getActiveTrainingProgram as jest.MockedFunction<typeof getActiveTrainingProgram>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

// Mock data factories
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockUserProfile = () => ({
  id: 'test-user-id',
  age: 30,
  fitness_goals: 'Build muscle',
  weight_unit: 'kg',
  primary_training_focus: 'Bodybuilding',
  experience_level: 'Intermediate',
})

const createMockGoalsWithProgress = () => [
  {
    id: 'goal-1',
    user_id: 'test-user-id',
    metric_type: 'workout_sessions',
    target_value: 4,
    target_unit: 'sessions',
    label: 'Weekly Workouts',
    current_value: 2,
    progress_percentage: 50,
    time_period: 'week',
    start_date: '2024-01-01',
    end_date: '2024-01-07',
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
]

const createMockTrainingProgram = () => ({
  id: 'program-1',
  programName: 'Test Program',
  durationWeeksTotal: 12,
  phases: [
    {
      phaseName: 'Foundation Phase',
      durationWeeks: 4,
      objectives: ['Build base strength'],
      weeks: [
        {
          weekNumber: 1,
          weeklyGoals: ['Form focus'],
          days: [
            {
              dayOfWeek: 1,
              focus: 'Upper Body' as const,
              estimatedDurationMinutes: 60,
              isRestDay: false,
              exercises: [],
              warmUp: [],
              coolDown: [],
            },
          ],
        },
      ],
    },
  ],
  description: 'A comprehensive training program',
  requiredEquipment: ['Dumbbells', 'Barbell'],
  difficultyLevel: 'Intermediate' as const,
  generalAdvice: 'Stay consistent',
  generatedAt: '2024-01-01T00:00:00.000Z',
  aiModelUsed: 'gpt-4',
})

const createMockAICoachRecommendation = (): AICoachRecommendation => ({
  workoutRecommendation: {
    title: 'Upper Body Focus',
    details: 'Focus on compound movements',
    suggestedExercises: ['Bench Press', 'Pull-ups'],
  },
  runRecommendation: {
    title: 'Easy Run',
    details: 'Go for a 30-minute easy run',
  },
  generalInsight: {
    title: 'Great Progress',
    details: 'You are making excellent progress',
  },
  focusAreaSuggestion: {
    title: 'Improve Upper Body',
    details: 'Focus more on upper body exercises',
  },
})

const createMockCookieStore = () => ({
  getAll: jest.fn().mockReturnValue([]),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
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
  rpc: jest.fn(),
})

describe('aiCoachActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>
  let mockCookieStore: ReturnType<typeof createMockCookieStore>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClient()
    mockCookieStore = createMockCookieStore()
    
    // Setup default mock implementations
    mockCookies.mockResolvedValue(mockCookieStore as any)
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('getAICoachRecommendation', () => {
    it('should return an error if the user is not authenticated', async () => {
      // Arrange: Configure the mocked createSupabaseServerClient to return no user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act: Call the getAICoachRecommendation action
      const result = await getAICoachRecommendation()

      // Assert: Check that the result is an authentication error
      expect(result).toEqual({
        error: 'User not authenticated.',
      })

      // Verify that dependent functions were not called
      expect(mockGetUserProfile).not.toHaveBeenCalled()
      expect(mockCallLLM).not.toHaveBeenCalled()
    })

    it('should return an error if there is an authentication error', async () => {
      // Arrange: Configure the mocked createSupabaseServerClient to return an auth error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session expired' },
      } as any)

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual({
        error: 'User not authenticated.',
      })
    })

    it('should return an error if user profile cannot be fetched', async () => {
      // Arrange: User is authenticated but profile fetch fails
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      } as any)
      
      mockGetUserProfile.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual({
        error: 'Failed to fetch user profile: Database error',
      })
    })

    it('should return an error if goals data cannot be fetched', async () => {
      // Arrange: User authenticated, profile fetched, but goals fetch fails
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockGetUserProfile.mockResolvedValue(mockProfile)
      mockFetchCurrentWeekGoalsWithProgress.mockRejectedValue(new Error('Goals fetch failed'))

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual({
        error: 'Failed to fetch goals data: Goals fetch failed',
      })
    })

    it('should return an error if training program cannot be fetched', async () => {
      // Arrange: User authenticated, profile and goals fetched, but program fetch fails
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockGoals = createMockGoalsWithProgress()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockGetUserProfile.mockResolvedValue(mockProfile)
      mockFetchCurrentWeekGoalsWithProgress.mockResolvedValue(mockGoals)
      mockGetActiveTrainingProgram.mockRejectedValue(new Error('Program fetch failed'))

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual({
        error: 'Failed to fetch training program: Program fetch failed',
      })
    })

    it('should return an error if LLM call fails', async () => {
      // Arrange: All data fetched successfully but LLM call fails
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockGoals = createMockGoalsWithProgress()
      const mockProgram = createMockTrainingProgram()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      // Setup successful data fetching
      mockGetUserProfile.mockResolvedValue(mockProfile)
      mockFetchCurrentWeekGoalsWithProgress.mockResolvedValue(mockGoals)
      mockGetActiveTrainingProgram.mockResolvedValue(mockProgram)
      
      // Setup RPC call for user activity summary
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          total_workout_sessions: 10,
          total_run_sessions: 5,
          avg_workout_duration_minutes: 45,
          avg_run_distance_meters: 5000,
          avg_run_duration_seconds: 1800,
          muscle_group_summary: {},
          dynamic_exercise_progression: [],
          last_3_runs: [],
          recent_run_pace_trend: 'improving',
          workout_days_this_week: 2,
          workout_days_last_week: 3,
        },
        error: null,
      })
      
      // Mock LLM failure
      mockCallLLM.mockRejectedValue(new Error('LLM API error'))

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual({
        error: 'Failed to get AI recommendation: LLM API error',
      })
    })

    it('should return successful AI recommendation when all data is available', async () => {
      // Arrange: Setup successful scenario
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockGoals = createMockGoalsWithProgress()
      const mockProgram = createMockTrainingProgram()
      const mockRecommendation = createMockAICoachRecommendation()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      // Setup successful data fetching
      mockGetUserProfile.mockResolvedValue(mockProfile)
      mockFetchCurrentWeekGoalsWithProgress.mockResolvedValue(mockGoals)
      mockGetActiveTrainingProgram.mockResolvedValue(mockProgram)
      
      // Setup RPC call for user activity summary
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          total_workout_sessions: 10,
          total_run_sessions: 5,
          avg_workout_duration_minutes: 45,
          avg_run_distance_meters: 5000,
          avg_run_duration_seconds: 1800,
          muscle_group_summary: {},
          dynamic_exercise_progression: [],
          last_3_runs: [],
          recent_run_pace_trend: 'improving',
          workout_days_this_week: 2,
          workout_days_last_week: 3,
        },
        error: null,
      })
      
      // Mock successful LLM call
      mockCallLLM.mockResolvedValue(mockRecommendation)

      // Act
      const result = await getAICoachRecommendation()

      // Assert
      expect(result).toEqual(expect.objectContaining({
        workoutRecommendation: expect.objectContaining({
          title: expect.any(String),
          details: expect.any(String),
          suggestedExercises: expect.any(Array),
        }),
        generalInsight: expect.objectContaining({
          title: expect.any(String),
          details: expect.any(String),
        }),
      }))
      
      // Verify that all dependencies were called correctly
      expect(mockGetUserProfile).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockFetchCurrentWeekGoalsWithProgress).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetActiveTrainingProgram).toHaveBeenCalled()
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('user profile'),
        'user',
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          response_format: { type: 'json_object' },
        })
      )
    })

    it('should handle missing training program gracefully', async () => {
      // Arrange: Setup scenario where user has no active training program
      const mockUser = createMockUser()
      const mockProfile = createMockUserProfile()
      const mockGoals = createMockGoalsWithProgress()
      const mockRecommendation = createMockAICoachRecommendation()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      // Setup data fetching with null program
      mockGetUserProfile.mockResolvedValue(mockProfile)
      mockFetchCurrentWeekGoalsWithProgress.mockResolvedValue(mockGoals)
      mockGetActiveTrainingProgram.mockResolvedValue(null) // No active program
      
      // Setup RPC call for user activity summary
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          total_workout_sessions: 10,
          total_run_sessions: 5,
          avg_workout_duration_minutes: 45,
          avg_run_distance_meters: 5000,
          avg_run_duration_seconds: 1800,
          muscle_group_summary: {},
          dynamic_exercise_progression: [],
          last_3_runs: [],
          recent_run_pace_trend: 'improving',
          workout_days_this_week: 2,
          workout_days_last_week: 3,
        },
        error: null,
      })
      
      // Mock successful LLM call
      mockCallLLM.mockResolvedValue(mockRecommendation)

      // Act
      const result = await getAICoachRecommendation()

      // Assert: Should still return recommendation without program data
      expect(result).toEqual(expect.objectContaining({
        workoutRecommendation: expect.objectContaining({
          title: expect.any(String),
          details: expect.any(String),
          suggestedExercises: expect.any(Array),
        }),
        generalInsight: expect.objectContaining({
          title: expect.any(String),
          details: expect.any(String),
        }),
      }))
      
      // Verify LLM was called with prompt indicating no program
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('No active program'),
        'user',
        expect.any(Object)
      )
    })
  })
})

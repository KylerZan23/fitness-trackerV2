'use server'

import { cookies } from 'next/headers'
import {
    getLinkedWorkouts,
    getUserActivitySummary,
    getCachedAICoachRecommendation,
    cacheAICoachRecommendation,
} from '@/lib/data/ai-coach';

import { getUserProfile } from '@/lib/db/index'
import { fetchCurrentWeekGoalsWithProgress } from '@/lib/db/goals'
import { getActiveTrainingProgram, type TrainingProgramWithId } from '@/lib/db/program'
import type { GoalWithProgress } from '@/lib/types'
import { MuscleGroup } from '@/lib/types'
import type { DayOfWeek } from '@/lib/types/program'
import { callLLM } from '@/lib/llmService'
import { 
  aiCoachRecommendationSchema,
  type AICoachRecommendation,
  type AIWeeklyReview,
  type AIWeeklyReviewFollowUp
} from '@/lib/types/aiCoach'

const AI_COACH_CACHE_DURATION_MINUTES = 30

interface MuscleExerciseVolume {
  exercise_name: string
  exercise_volume: number
}

interface MuscleGroupDetail {
  total_sets: number
  last_trained_date: string | null
  total_volume: number
  distinct_exercises_count: number
  top_3_exercises_by_volume: MuscleExerciseVolume[]
}

interface ExerciseSession {
  date: string
  performance: string
  notes: string | null
}

interface ExerciseProgressionDetail {
  exercise_name: string
  frequency_rank: number
  last_sessions: ExerciseSession[]
  trend: string
}

interface RunDetail {
  run_date: string
  name: string | null
  distance_km: number
  duration_min: number
  avg_pace_min_km: string
  elevation_gain_m: number
  run_type: string
}

interface UserActivitySummary {
  total_workout_sessions: number
  total_run_sessions: number
  avg_workout_duration_minutes: number | null
  avg_run_distance_meters: number
  avg_run_duration_seconds: number
  muscle_group_summary: {
    [group: string]: MuscleGroupDetail | undefined
  }
  dynamic_exercise_progression: ExerciseProgressionDetail[]
  last_3_runs: RunDetail[]
  recent_run_pace_trend: string
  workout_days_this_week: number
  workout_days_last_week: number
}

interface UserProfile {
  id: string
  age: number | null
  fitness_goals: string | null
  weight_unit: string | null
  primary_training_focus?: string | null
  experience_level?: string | null
  // other profile fields
}

interface ProgramAdherenceData {
  programName: string
  currentPhase: string
  currentWeek: string
  todaysPlannedWorkout: string
  workoutsCompletedThisWeek: number
  lastLoggedWorkoutVsPlan: string
}

/**
 * Helper function to calculate week-over-week duration change
 */
function calculateDurationChange(
  currentAvgDuration: number | null | undefined,
  extendedAvgDuration: number | null | undefined,
  currentWeekSessions: number
): number {
  if (!currentAvgDuration || !extendedAvgDuration || currentWeekSessions === 0) {
    return 0
  }
  
  // Estimate previous week average by calculating difference
  // Extended period includes both weeks, so we need to isolate previous week
  const totalExtendedSessions = currentWeekSessions * 2 // Rough estimate for 2-week period
  const previousWeekEstimatedDuration = extendedAvgDuration // Simplified for now
  
  return Math.round((currentAvgDuration - previousWeekEstimatedDuration) * 10) / 10
}

/**
 * Helper function to fetch and analyze program adherence data
 */
async function getProgramAdherenceData(
  supabase: any,
  userId: string,
  activeProgram: TrainingProgramWithId
): Promise<ProgramAdherenceData | null> {
  try {
    // Get current date info
    const today = new Date()
    const currentDayOfWeek = ((today.getDay() + 6) % 7) + 1 // Convert Sunday=0 to Monday=1 format
    
    // For MVP, assume user is in first phase, first week (can be enhanced later with start_date logic)
    const currentPhaseIndex = 0
    const currentWeekIndex = 0
    
    if (!activeProgram.phases[currentPhaseIndex]?.weeks[currentWeekIndex]) {
      return null
    }
    
    const currentPhase = activeProgram.phases[currentPhaseIndex]
    const currentWeek = currentPhase.weeks[currentWeekIndex]
    
    // Find today's planned workout
    const todaysWorkout = currentWeek.days.find(day => day.dayOfWeek === currentDayOfWeek)
    const todaysPlannedWorkout = todaysWorkout?.isRestDay 
      ? 'Rest Day' 
      : todaysWorkout?.focus || 'Workout Planned'
    
    // Query workout_groups for adherence data
    const { success, data: linkedWorkouts, error } = await getLinkedWorkouts(userId, activeProgram.id, currentPhaseIndex, currentWeekIndex);

    if (!success) {
        console.error('Error fetching linked workouts for adherence:', error);
        return null;
    }
    
    // Calculate adherence metrics
    const workoutsCompletedThisWeek = linkedWorkouts?.length || 0
    
    // Determine last logged workout vs plan
    let lastLoggedWorkoutVsPlan = 'N/A'
    if (linkedWorkouts && linkedWorkouts.length > 0) {
      const lastWorkout = linkedWorkouts[0]
      const lastWorkoutDay = currentWeek.days.find(day => day.dayOfWeek === lastWorkout.linked_program_day_of_week)
      if (lastWorkoutDay) {
        const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][lastWorkout.linked_program_day_of_week - 1]
        lastLoggedWorkoutVsPlan = `Completed ${dayName}'s ${lastWorkoutDay.focus || 'workout'}`
      }
    } else {
      lastLoggedWorkoutVsPlan = 'No workouts logged for current week yet'
    }
    
    return {
      programName: activeProgram.programName,
      currentPhase: `Phase ${currentPhaseIndex + 1} of ${activeProgram.phases.length}: ${currentPhase.phaseName}`,
      currentWeek: `Week ${currentWeekIndex + 1} of ${currentPhase.durationWeeks}`,
      todaysPlannedWorkout,
      workoutsCompletedThisWeek,
      lastLoggedWorkoutVsPlan
    }
  } catch (error) {
    console.error('ERROR in getProgramAdherenceData:', error)
    return null
  }
}

// Placeholder for actual OpenAI or LLM client initialization if needed globally
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get AI-generated weekly review based on user's past 7 days of activity
 */
export async function getAIWeeklyReview(): Promise<
  AIWeeklyReview | { error: string }
> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in getAIWeeklyReview:', authError)
      return { error: 'Authentication required. Please log in again.' }
    }

    console.log('Getting AI weekly review for user:', user.id)

    // Fetch activity data for both current week (7 days) and previous week (14 days total for comparison)
    const [currentWeekResult, previousWeekResult] = await Promise.all([
      getUserActivitySummary(user.id, 7),
      getUserActivitySummary(user.id, 14)
    ]);

    if (!currentWeekResult.success) {
      return { error: currentWeekResult.error || 'Unable to fetch your current week activity data. Please try again.' };
    }

    if (!previousWeekResult.success) {
      return { error: previousWeekResult.error || 'Unable to fetch your previous week activity data. Please try again.' };
    }

    const activityData = currentWeekResult.data
    const extendedActivityData = previousWeekResult.data

    console.log('Current week activity summary retrieved:', JSON.stringify(activityData, null, 2))
    console.log('Extended activity summary retrieved:', JSON.stringify(extendedActivityData, null, 2))

    // Get user profile for additional context
    const userProfile = await getUserProfile(supabase)
    if (!userProfile) {
      console.error('User profile not found for weekly review')
      return { error: 'User profile not found. Please complete your profile setup.' }
    }

    // Fetch active training program and adherence data
    let activeProgram: TrainingProgramWithId | null = null
    let programAdherence: ProgramAdherenceData | null = null
    
    try {
      activeProgram = await getActiveTrainingProgram()
      if (activeProgram) {
        programAdherence = await getProgramAdherenceData(supabase, user.id, activeProgram)
        console.log('Program adherence data retrieved:', JSON.stringify(programAdherence, null, 2))
      } else {
        console.log('No active training program found for weekly review')
      }
    } catch (programError) {
      console.warn('Error fetching program adherence data for weekly review:', programError)
      // Continue without program data - not critical for weekly review
    }

    // Calculate week-over-week trends for enhanced analysis
    const weekOverWeekTrends = {
      workoutDaysChange: activityData?.workout_days_this_week - activityData?.workout_days_last_week || 0,
      workoutSessionsChange: (activityData?.total_workout_sessions || 0) - Math.max((extendedActivityData?.total_workout_sessions || 0) - (activityData?.total_workout_sessions || 0), 0),
      runSessionsChange: (activityData?.total_run_sessions || 0) - Math.max((extendedActivityData?.total_run_sessions || 0) - (activityData?.total_run_sessions || 0), 0),
      avgWorkoutDurationChange: calculateDurationChange(activityData?.avg_workout_duration_minutes, extendedActivityData?.avg_workout_duration_minutes, activityData?.total_workout_sessions || 0),
      runPaceTrend: activityData?.recent_run_pace_trend || 'N/A'
    }

    console.log('Week-over-week trends calculated:', JSON.stringify(weekOverWeekTrends, null, 2))

    // Create cache key based on user activity data, profile, program adherence, and trends
    const cacheDataSignature = {
      userId: user.id,
      totalWorkoutSessions: activityData?.total_workout_sessions || 0,
      totalRunSessions: activityData?.total_run_sessions || 0,
      workoutDaysThisWeek: activityData?.workout_days_this_week || 0,
      workoutDaysLastWeek: activityData?.workout_days_last_week || 0,
      fitnessGoals: userProfile.fitness_goals || null,
      experienceLevel: userProfile.experience_level || null,
      // Include program adherence data in cache key for more contextual caching
      programName: programAdherence?.programName || null,
      currentPhase: programAdherence?.currentPhase || null,
      currentWeek: programAdherence?.currentWeek || null,
      workoutsCompletedThisWeek: programAdherence?.workoutsCompletedThisWeek || 0,
      // Include week-over-week trends for enhanced caching
      workoutDaysChange: weekOverWeekTrends.workoutDaysChange,
      workoutSessionsChange: weekOverWeekTrends.workoutSessionsChange,
      runSessionsChange: weekOverWeekTrends.runSessionsChange,
      avgWorkoutDurationChange: weekOverWeekTrends.avgWorkoutDurationChange,
      // Include current week to ensure cache invalidation for new weeks
      calendarWeek: new Date().toISOString().split('T')[0].slice(0, 7) // YYYY-MM format
    }

    const sortedKeys = Object.keys(cacheDataSignature).sort()
    const sortedCacheData: Record<string, any> = {}
    for (const key of sortedKeys) {
      sortedCacheData[key] = (cacheDataSignature as Record<string, any>)[key]
    }
    
    const stableCacheString = JSON.stringify(sortedCacheData)
    const hashedDataInput = Buffer.from(stableCacheString).toString('base64')
    const cacheKey = `aiWeeklyReview:u${user.id}:d${hashedDataInput}`

    console.log(`AI Weekly Review: Checking cache for key: ${cacheKey}`)

    // Check for cached response
    const { data: cachedEntry } = await getCachedAICoachRecommendation(cacheKey);

    if (cachedEntry && new Date(cachedEntry.expires_at) > new Date()) {
        console.log('AI Weekly Review: Returning valid recommendation from cache.');
        const weeklyReview = cachedEntry.recommendation as AIWeeklyReview;
        return weeklyReview;
    } else if (cachedEntry) {
        console.log('AI Weekly Review: Cache entry found but expired.');
    } else {
        console.log('AI Weekly Review: No cache entry found.');
    }

    // Format program adherence context for the prompt
    const programContextSection = programAdherence 
      ? `
**TRAINING PROGRAM ADHERENCE CONTEXT:**
- Program Name: ${programAdherence.programName}
- Current Phase: ${programAdherence.currentPhase}
- Current Week: ${programAdherence.currentWeek}
- Today's Planned Workout Focus: ${programAdherence.todaysPlannedWorkout}
- Workouts Completed This Week: ${programAdherence.workoutsCompletedThisWeek}
- Last Logged Workout vs Plan: ${programAdherence.lastLoggedWorkoutVsPlan}

**PROGRAM ADHERENCE ANALYSIS INSTRUCTIONS:**
- If user is following a structured program, assess adherence to their planned workouts
- Compare actual workouts completed vs expected for the week
- Reference specific program phases and focus areas in your analysis
- Highlight alignment between planned workout focuses and actual activity
- If behind on program schedule, provide specific catch-up recommendations
- If ahead or on track, celebrate program consistency and suggest optimization`
      : `
**TRAINING PROGRAM ADHERENCE CONTEXT:**
- Program Name: No active structured program
- Training Approach: Self-directed/flexible training

**GENERAL TRAINING ANALYSIS INSTRUCTIONS:**
- Focus on overall activity patterns and consistency
- Suggest potential benefits of following a structured program if appropriate
- Analyze muscle group balance and training frequency patterns`

    // Construct the LLM prompt for weekly review
    const prompt = `You are a supportive and data-driven fitness coach analyzing a user's weekly training performance. 

Based on the following UserActivitySummary JSON data from the past 7 days and training program adherence information, generate a comprehensive weekly review.

USER ACTIVITY DATA:
${JSON.stringify(activityData, null, 2)}

WEEK-OVER-WEEK TREND ANALYSIS:
- Workout Days Change: ${weekOverWeekTrends.workoutDaysChange > 0 ? '+' : ''}${weekOverWeekTrends.workoutDaysChange} days (This Week: ${activityData?.workout_days_this_week || 0}, Last Week: ${activityData?.workout_days_last_week || 0})
- Workout Sessions Change: ${weekOverWeekTrends.workoutSessionsChange > 0 ? '+' : ''}${weekOverWeekTrends.workoutSessionsChange} sessions
- Run Sessions Change: ${weekOverWeekTrends.runSessionsChange > 0 ? '+' : ''}${weekOverWeekTrends.runSessionsChange} runs
- Average Workout Duration Change: ${weekOverWeekTrends.avgWorkoutDurationChange > 0 ? '+' : ''}${weekOverWeekTrends.avgWorkoutDurationChange} minutes
- Run Pace Trend: ${weekOverWeekTrends.runPaceTrend}

USER PROFILE CONTEXT:
- Primary Goal: ${userProfile.fitness_goals || 'General fitness'}
- Experience Level: ${userProfile.experience_level || 'Not specified'}
- Weight Unit: ${userProfile.weight_unit || 'kg'}

${programContextSection}

ENHANCED INSTRUCTIONS:
1. Act as an encouraging yet analytical coach
2. Focus on data-driven insights from activity summary, program adherence, AND week-over-week trends
3. Be specific about numbers (workouts, volume, exercises, program compliance, trends)
4. Prioritize week-over-week trend analysis to show progress or areas needing attention
5. If user has an active program, integrate program adherence with trend analysis
6. Identify both strengths and concrete improvement opportunities based on trends
7. Provide actionable, specific tips for the upcoming week that align with trends and program (if applicable)
8. Reference program-specific focuses and planned workouts when available
9. Celebrate positive trends (increased workout days, improved pace, etc.) specifically
10. Address negative trends constructively with specific strategies for improvement

REQUIRED OUTPUT FORMAT (JSON only):
{
  "title": "Your Weekly Review",
  "summary": "A 1-2 sentence overview mentioning week-over-week trends, total workouts, program adherence (if applicable), key metrics, or overall activity level",
  "whatWentWell": "A specific success from the data highlighting positive trends (increased workout days, improved pace, program adherence, consistency, volume increase, etc.)",
  "improvementArea": "A data-driven area for improvement based on negative trends or opportunities (declining workout frequency, slower pace, program compliance, missed planned workouts, etc.)",
  "actionableTip": "One specific, concrete tip for next week based on trend analysis and improvement area (e.g., 'Add one more workout day to match last week's 4-day consistency' or 'Focus on maintaining your improved pace from this week')"
}

IMPORTANT: 
- Base ALL insights on the actual data provided, especially week-over-week trends
- Prioritize trend analysis - highlight what's improving, declining, or staying consistent
- If user has an active program, integrate program adherence with trend insights
- If no workouts were logged, focus on motivation and trend-based comeback strategies
- Celebrate positive trends specifically (e.g., "+2 workout days this week", "pace improved")
- Address negative trends constructively with specific recovery strategies
- Make improvement areas constructive, not critical, and trend-focused
- Ensure actionable tips are specific, measurable, and aligned with trend reversals or momentum

Return ONLY the JSON object, no additional text.`

    // Call the LLM service
    const llmResponse = await callLLM(prompt)
    console.log('LLM response for weekly review:', llmResponse)

    // Parse the LLM response
    let weeklyReview: AIWeeklyReview
    try {
      const parsedResponse = JSON.parse(llmResponse)
      
      // Validate the response structure
      if (!parsedResponse.title || !parsedResponse.summary || !parsedResponse.whatWentWell || 
          !parsedResponse.improvementArea || !parsedResponse.actionableTip) {
        throw new Error('Invalid response structure from LLM')
      }

      weeklyReview = {
        title: parsedResponse.title,
        summary: parsedResponse.summary,
        whatWentWell: parsedResponse.whatWentWell,
        improvementArea: parsedResponse.improvementArea,
        actionableTip: parsedResponse.actionableTip
      }
    } catch (parseError) {
      console.error('Error parsing LLM response for weekly review:', parseError)
      console.error('Raw LLM response:', llmResponse)
      return { error: 'Unable to generate your weekly review. Please try again.' }
    }

    console.log('Successfully generated weekly review:', weeklyReview)

    // Cache the new weekly review response
    await cacheAICoachRecommendation(cacheKey, user.id, weeklyReview, hashedDataInput);

    return weeklyReview

  } catch (error) {
    console.error('ERROR in getAIWeeklyReview:', error)
    return { error: 'An unexpected error occurred while generating your weekly review.' }
  }
}

/**
 * Get AI-generated follow-up answer to user questions about their weekly review
 */
export async function getAIWeeklyReviewFollowUp(
  originalReview: AIWeeklyReview,
  userQuestion: string
): Promise<AIWeeklyReviewFollowUp | { error: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in getAIWeeklyReviewFollowUp:', authError)
      return { error: 'Authentication required. Please log in again.' }
    }

    console.log('Getting AI weekly review follow-up for user:', user.id, 'Question:', userQuestion)

    // Get user profile for context
    const userProfile = await getUserProfile(supabase)
    if (!userProfile) {
      console.error('User profile not found for weekly review follow-up')
      return { error: 'User profile not found. Please complete your profile setup.' }
    }

    // Construct the LLM prompt for follow-up questions
    const prompt = `You are a supportive and knowledgeable fitness coach answering a follow-up question about a user's weekly review.

ORIGINAL WEEKLY REVIEW:
Title: ${originalReview.title}
Summary: ${originalReview.summary}
What Went Well: ${originalReview.whatWentWell}
Focus Area: ${originalReview.improvementArea}
This Week's Action: ${originalReview.actionableTip}

USER PROFILE CONTEXT:
- Primary Goal: ${userProfile.fitness_goals || 'General fitness'}
- Experience Level: ${userProfile.experience_level || 'Not specified'}
- Weight Unit: ${userProfile.weight_unit || 'kg'}

USER'S FOLLOW-UP QUESTION:
"${userQuestion}"

INSTRUCTIONS:
1. Answer the user's question directly and helpfully
2. Reference specific details from their weekly review when relevant
3. Maintain the same supportive yet analytical coaching tone
4. Provide actionable, specific advice related to their question
5. Keep the response concise but thorough (2-4 sentences)
6. If the question is unclear, ask for clarification
7. Stay focused on fitness, training, and wellness topics

REQUIRED OUTPUT FORMAT (JSON only):
{
  "question": "${userQuestion}",
  "answer": "Your detailed, helpful response to the user's question, referencing their weekly review insights when appropriate."
}

Return ONLY the JSON object, no additional text.`

    // Call the LLM service
    const llmResponse = await callLLM(prompt)
    console.log('LLM response for weekly review follow-up:', llmResponse)

    // Parse the LLM response
    let followUpResponse: AIWeeklyReviewFollowUp
    try {
      const parsedResponse = JSON.parse(llmResponse)
      
      // Validate the response structure
      if (!parsedResponse.question || !parsedResponse.answer) {
        throw new Error('Invalid response structure from LLM')
      }

      followUpResponse = {
        question: parsedResponse.question,
        answer: parsedResponse.answer
      }
    } catch (parseError) {
      console.error('Error parsing LLM response for weekly review follow-up:', parseError)
      console.error('Raw LLM response:', llmResponse)
      return { error: 'Unable to generate a response to your question. Please try again.' }
    }

    console.log('Successfully generated weekly review follow-up:', followUpResponse)

    return followUpResponse

  } catch (error) {
    console.error('ERROR in getAIWeeklyReviewFollowUp:', error)
    return { error: 'An unexpected error occurred while answering your question.' }
  }
}

export async function getAICoachRecommendation(): Promise<
  (AICoachRecommendation & { cacheKey?: string }) | { error: string }
> {
  try {
    const cookieStore = await cookies()
    // Debug log for cookies from next/headers
    console.log(
      'AI Coach Action: All cookies from next/headers:',
      JSON.stringify(cookieStore.getAll(), null, 2)
    )

    const supabase = await createSupabaseServerClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    // Debug log for user and authError
    console.log(
      'AI Coach Action: User from supabase.auth.getUser():',
      user ? user.id : 'null',
      'Auth Error:',
      authError ? authError.message : 'null'
    )

    // Simplified and corrected authentication check
    if (authError || !user?.id) {
      console.error(
        'AI Coach Action: User not authenticated or error fetching user.',
        authError ? authError.message : 'User ID is missing.'
      )
      return { error: 'Authentication required. Please log in again.' }
    }

    // If we reach here, user and user.id are valid
    const userId = user.id

    let profile: UserProfile | null = null
    let goals: GoalWithProgress[] = []
    let summary: UserActivitySummary | null = null
    let activeProgram: TrainingProgramWithId | null = null
    let programAdherence: ProgramAdherenceData | null = null

    try {
      profile = (await getUserProfile(supabase)) as UserProfile | null

      try {
        goals = await fetchCurrentWeekGoalsWithProgress(supabase)
      } catch (goalFetchError) {
        console.warn(
          `getAICoachRecommendation: Error fetching goals for user ${userId}`,
          goalFetchError
        )
      }

      // Fetch active training program
      try {
        activeProgram = await getActiveTrainingProgram()
        if (activeProgram) {
          programAdherence = await getProgramAdherenceData(supabase, userId, activeProgram)
        }
      } catch (programFetchError) {
        console.warn(
          `getAICoachRecommendation: Error fetching active program for user ${userId}`,
          programFetchError
        )
      }

      const { success, data: summaryData, error: summaryError } = await getUserActivitySummary(userId, 30);

      if (!success) {
        return { error: summaryError || 'Failed to load your activity data. Please try again later.' };
      }
      summary = summaryData as UserActivitySummary

      if (!summary) {
        console.error(`getAICoachRecommendation: No activity summary returned for user ${userId}`)
        return { error: 'Unable to generate recommendations at this time. Please try again later.' }
      }
    } catch (e) {
      console.error(
        `getAICoachRecommendation: Unexpected error during data fetching for user ${userId}`,
        e
      )
      return { error: 'Failed to load your profile data. Please try again later.' }
    }

    const goalsString =
      goals.length > 0
        ? goals
            .map(
              g =>
                `- ${g.label || g.metric_type}: Target ${g.target_value} ${g.target_unit || ''}, Current ${(g.current_value ?? 0).toFixed(1)}`
            )
            .join('\\n')
        : 'No active goals set for this week.'

    const dataSignatureObject = {
      profileFitnessGoals: profile?.fitness_goals || null,
  
      totalWorkouts: summary?.total_workout_sessions || 0,
      totalRuns: summary?.total_run_sessions || 0,
      workoutsThisWeek: summary?.workout_days_this_week || 0,
      programAdherence: programAdherence || null,
      topExerciseTrend: summary?.dynamic_exercise_progression?.[0]?.trend || null,
      activeGoals: goalsString || '',
      profileTrainingFocus: profile?.primary_training_focus || null,
      profileExperienceLevel: profile?.experience_level || null,
    }

    // Refactored to fix linter error - using Record<string, any> for intermediate object
    const sortedKeys = Object.keys(dataSignatureObject).sort() // Keys are strings
    const sortedObjectForStringify: Record<string, any> = {}
    for (const key of sortedKeys) {
      // Accessing dataSignatureObject with a string key might require a cast if it were strictly typed
      // but here dataSignatureObject can be treated as Record<string,any> for this purpose too.
      sortedObjectForStringify[key] = (dataSignatureObject as Record<string, any>)[key]
    }
    const stableSignatureString = JSON.stringify(sortedObjectForStringify)

    const hashedDataInput = Buffer.from(stableSignatureString).toString('base64')
    const cacheKey = `aiCoach:u${userId}:d${hashedDataInput}`

    console.log(`AI Coach: Checking cache for key: ${cacheKey}`)
    const { data: cachedEntry } = await getCachedAICoachRecommendation(cacheKey);

    if (cachedEntry && new Date(cachedEntry.expires_at) > new Date()) {
        console.log('AI Coach: Returning valid recommendation from cache.');
        const recommendation = JSON.parse(JSON.stringify(cachedEntry.recommendation)) as AICoachRecommendation;
        return { ...recommendation, cacheKey };
    } else if (cachedEntry) {
        console.log('AI Coach: Cache entry found but expired.');
    } else {
        console.log('AI Coach: No cache entry found.');
    }

    // If cache miss or expired, proceed to generate new recommendation
    const metersToMiles = (meters: number | null | undefined) => {
      if (meters === null || meters === undefined || meters === 0) return 0
      return parseFloat((meters / 1609.34).toFixed(2))
    }

    const preferredWeightUnit = profile?.weight_unit || 'kg'
    const periodDays = 30

    const formatMuscleGroupSummary = (
      summaryInput: UserActivitySummary | null,
      weightUnit: string
    ): string => {
      if (
        !summaryInput?.muscle_group_summary ||
        Object.keys(summaryInput.muscle_group_summary).length === 0
      ) {
        return 'No muscle group data available for this period.'
      }
      let output = ''
      for (const groupName in summaryInput.muscle_group_summary) {
        const group = summaryInput.muscle_group_summary[groupName]
        if (group) {
          const topExercisesString =
            group.top_3_exercises_by_volume?.length > 0
              ? group.top_3_exercises_by_volume
                  .map(e => `${e.exercise_name} (${e.exercise_volume}${weightUnit})`)
                  .join(', ')
              : 'N/A'
          output += `- ${groupName}: Sets: ${group.total_sets || 0}, Last Trained: ${group.last_trained_date || 'N/A'}, Volume: ${group.total_volume || 0}${weightUnit}, Distinct Ex: ${group.distinct_exercises_count || 0}. Top Volume Ex: ${topExercisesString}\\n`
        }
      }
      return output.trim() || 'No muscle group data available for this period.'
    }

    const formatDynamicExerciseProgression = (summaryInput: UserActivitySummary | null): string => {
      if (
        !summaryInput?.dynamic_exercise_progression ||
        summaryInput.dynamic_exercise_progression.length === 0
      ) {
        return 'No specific exercise progression data tracked for top lifts in this period.'
      }
      return summaryInput.dynamic_exercise_progression
        .map(ex => {
          const sessionsString =
            ex.last_sessions?.length > 0
              ? ex.last_sessions
                  .map(s => `  - ${s.date}: ${s.performance} (Notes: ${s.notes || 'None'})`)
                  .join('\\n')
              : '  N/A'
          return `- ${ex.exercise_name} (Rank: ${ex.frequency_rank}): Trend: ${ex.trend || 'N/A'}\\nLast Sessions:\\n${sessionsString}`
        })
        .join('\\n\\n')
    }

    const formatLast3Runs = (summaryInput: UserActivitySummary | null): string => {
      if (!summaryInput?.last_3_runs || summaryInput.last_3_runs.length === 0) {
        return 'No recent run data available for this period.'
      }
      return summaryInput.last_3_runs
        .map(
          r =>
            `- ${r.run_date} - Name: \"${r.name || 'Unnamed Run'}\" - ${r.distance_km?.toFixed(1)}km in ${r.duration_min}min (Pace: ${r.avg_pace_min_km || 'N/A'}, Elev: ${r.elevation_gain_m || 0}m, Type: ${r.run_type || 'Run'})`
        )
        .join('\\n')
    }

    const formattedMuscleSummary = formatMuscleGroupSummary(summary, preferredWeightUnit)
    const formattedExerciseProgression = formatDynamicExerciseProgression(summary)
    const formattedRuns = formatLast3Runs(summary)
    const formattedGoals = goalsString

    // Format program context for the prompt
    const programContextSection = programAdherence 
      ? `
**Current Training Program Context:**
- Program Name: ${programAdherence.programName}
- Current Phase: ${programAdherence.currentPhase}
- Current Week: ${programAdherence.currentWeek}
- Today's Planned Workout Focus: ${programAdherence.todaysPlannedWorkout}
- Workouts Completed This Week: ${programAdherence.workoutsCompletedThisWeek}
- Last Logged Workout vs Plan: ${programAdherence.lastLoggedWorkoutVsPlan}`
      : `
**Current Training Program Context:**
- Program Name: N/A
- Current Phase: N/A
- Current Week: N/A
- Today's Planned Workout Focus: N/A
- Workouts Completed This Week: N/A
- Last Logged Workout vs Plan: N/A`

    const promptText = `
You are an expert AI Fitness Coach for NeuralLift. Your primary goal is to provide a concise, encouraging, and tactical piece of advice for today's planned workout, using the ProgramAdherenceData and UserActivitySummary to inform your recommendation. If it's a rest day, provide a recovery-focused tip.

**Key Instructions for LLM:**
1.  **Focus on TODAY**: Your advice must be directly relevant to today's planned session.
2.  **Be Concise & Tactical**: Provide specific, actionable advice for today's workout. Reference specific exercises or techniques.
3.  **Positive & Encouraging Tone**: Motivate the user for their session today.
4.  **Use Program Context**: Always reference the user's current program and today's planned focus.
5.  **Data-Driven**: Connect advice to recent performance and adherence patterns.
6.  **Safety First**: Include form cues or progression advice when relevant.

**CRITICAL: Your workoutRecommendation.title and workoutRecommendation.details must directly reference today's planned focus and exercises from the ProgramAdherenceData.**

**Today's Workout Focus Guidelines:**
- If today's planned workout focus is provided (e.g., "Upper Body", "Legs", "Push"), your workoutRecommendation.title should be "Focus for Your [Focus] Day" or "Today's [Focus] Session".
- Your workoutRecommendation.details should give specific advice for today's session, like "I see your program includes heavy squats today. Based on your last session, focus on hitting depth. Your secondary focus should be maintaining tempo on your lunges."
- If it's a rest day, focus on recovery advice: title "Recovery Day Focus", details about active recovery, hydration, sleep, etc.
- If no specific workout is planned, provide general motivation to get back on track.

**User Profile:**
- Age: ${profile?.age || 'Not specified'}
- Fitness Goals: ${profile?.fitness_goals || 'Not set'}
- Preferred Weight Unit: ${preferredWeightUnit}

- Primary Training Focus: ${profile?.primary_training_focus || 'General Fitness'}
- Experience Level: ${profile?.experience_level || 'Not Specified'}

**Current Weekly Goals (Tracked in App):**
${formattedGoals}

**Recent Activity Context (for informing today's advice):**
- Workout Days This Week: ${summary?.workout_days_this_week || 0}
- Workout Days Last Week: ${summary?.workout_days_last_week || 0}
- Recent Run Pace Trend: ${summary?.recent_run_pace_trend || 'N/A'}
${programContextSection}

**Output Format (Strict JSON - provide only the JSON object):**
Provide your response as a single JSON object matching this TypeScript interface:
\`\`\`json
{
  "workoutRecommendation": {
    "title": "Your Suggested Workout Focus",
    "details": "Explain why and what to do. Be specific. E.g., focus on X today with Y sets/reps because your Z data shows...",
    "suggestedExercises": [
      { "name": "Barbell Squat", "sets": 3, "reps": "5-8", "muscle_group": "Legs" },
      { "name": "Bench Press", "sets": 3, "reps": "8-12", "muscle_group": "Chest" },
      { "name": "Leg Press", "sets": 3, "reps": "10-15", "muscle_group": "Legs" }
    ]
  },
  "runRecommendation": {
    "title": "Your Suggested Run",
    "details": "Details for the run. E.g., a 5k tempo run at X pace, or an easy 30-min recovery run."
  },
  "generalInsight": {
    "title": "One Key Insight from Your Data",
    "details": "A brief, encouraging insight. E.g., 'Great job on increasing your chest volume!' or 'Remember to incorporate rest days.'"
  },
  "focusAreaSuggestion": {
    "title": "Suggested Focus Area (Optional)",
    "details": "A specific, actionable focus area for long-term improvement based on data. Give a concrete tip or action."
  }
}
\`\`\`

**Specific Instructions for Output Fields:**
- \`suggestedExercises\`: MUST be an array of objects. Each object MUST contain 'name', 'sets', 'reps', and 'muscle_group'. The 'muscle_group' MUST be one of the following exact values: ${Object.values(
      MuscleGroup
    ).join(', ')}.
- \`workoutRecommendation.details\`: Provide specific, tactical advice for today's session. Reference form cues, intensity, or specific exercises from their program. Connect to recent adherence patterns.
- \`runRecommendation\`: Only include if relevant to today's plan or if it's a rest day and light cardio would help recovery. Keep it simple and specific to today.
- \`generalInsight\`: Brief encouragement related to their recent adherence or progress. Reference their current program position.

**For \`focusAreaSuggestion\` (Optional):**
-   Only include if there's a specific technique or form cue that would improve today's session.
-   Focus on immediate, actionable improvements for today's workout.
-   If it's a rest day, suggest recovery techniques or mobility work.

Now, generate the recommendation based on all the above data and instructions.
`

    try {
      // --- Start of Replacement: LLM Call Logic ---
      console.log('AI Coach: Cache miss or stale, calling LLM API via llmService...')

      let advice: AICoachRecommendation | null = null

      try {
        const rawResponse = await callLLM(promptText, 'user', {
          response_format: { type: 'json_object' },
          max_tokens: 800,
          model: 'gpt-4o', // Specific model for AI Coach
        })

        const validationResult = aiCoachRecommendationSchema.safeParse(rawResponse)
        if (validationResult.success) {
          advice = validationResult.data
        } else {
          console.error(
            'AI Coach LLM response validation failed:',
            validationResult.error
          )
          return {
            error:
              'The AI Coach returned an invalid response. Please try again later.',
          }
        }
      } catch (error: any) {
        console.error('LLM API call failed via llmService:', error)
        return {
          error: 'AI Coach is currently unavailable. Please try again later.',
        }
      }

      if (!advice) {
        console.error(
          'AI Coach: Advice object is null after LLM call attempt, despite no explicit error thrown.'
        )
        return {
          error:
            'Unable to generate recommendations at this time. Please try again later.',
        }
      }
      // --- End of Replacement: LLM Call Logic ---

      // If LLM call was successful and advice is populated:
      await cacheAICoachRecommendation(cacheKey, userId, advice, hashedDataInput);

      return { ...advice, cacheKey } // Return the newly fetched advice with cache key
    } catch (error: any) {
      console.error('ERROR in getAICoachRecommendation (LLM call):', error)
      return { error: 'Unable to generate recommendations at this time. Please try again later.' }
    }

  } catch (error: any) {
    console.error('ERROR in getAICoachRecommendation (main):', error)
    return { error: 'An unexpected error occurred. Please try again later.' }
  }
}

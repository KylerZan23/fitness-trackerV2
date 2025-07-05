'use server'

import { cookies } from 'next/headers'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/lib/db'
import { fetchCurrentWeekGoalsWithProgress } from '@/lib/goalsDb'
import { getActiveTrainingProgram, type TrainingProgramWithId } from '@/lib/programDb'
import type { GoalWithProgress } from '@/lib/types'
import type { DayOfWeek } from '@/lib/types/program'
import { callLLM } from '@/lib/llmService'
// Assuming OpenAI client might be needed, or similar for LLM interaction
// import OpenAI from 'openai';

const AI_COACH_CACHE_DURATION_MINUTES = 30

// Define the structure for the AI Coach's recommendation
export interface AICoachRecommendation {
  workoutRecommendation: {
    title: string
    details: string
    suggestedExercises: string[]
  }
  runRecommendation: {
    title: string
    details: string
  } | null
  generalInsight: {
    title: string
    details: string
  }
  focusAreaSuggestion?: {
    title: string
    details: string
  } | null
}

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
  strava_connected: boolean | null
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
    const { data: linkedWorkouts, error } = await supabase
      .from('workout_groups')
      .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week, created_at')
      .eq('user_id', userId)
      .eq('linked_program_id', activeProgram.id)
      .eq('linked_program_phase_index', currentPhaseIndex)
      .eq('linked_program_week_index', currentWeekIndex)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching linked workouts for adherence:', error)
      return null
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
    console.error('Error in getProgramAdherenceData:', error)
    return null
  }
}

// Placeholder for actual OpenAI or LLM client initialization if needed globally
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAICoachRecommendation(): Promise<
  (AICoachRecommendation & { cacheKey?: string }) | { error: string }
> {
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
    // Return a generic error or specific based on authError
    if (authError) {
      return { error: `Authentication error: ${authError.message}` }
    }
    return { error: 'User not authenticated.' } // Covers !user?.id case
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

    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_user_activity_summary',
      { user_id_param: userId, period_days_param: 30 }
    )

    if (summaryError) {
      console.error(
        `getAICoachRecommendation: Error fetching activity summary for user ${userId}`,
        summaryError
      )
      return { error: `Failed to fetch activity summary: ${summaryError.message}` }
    }
    summary = summaryData as UserActivitySummary

    if (!summary) {
      console.error(`getAICoachRecommendation: No activity summary returned for user ${userId}`)
      return { error: 'Failed to retrieve user activity summary.' }
    }
  } catch (e) {
    console.error(
      `getAICoachRecommendation: Unexpected error during data fetching for user ${userId}`,
      e
    )
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred during data retrieval.'
    return { error: message }
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
    stravaConnected: profile?.strava_connected || false,
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
  const { data: cachedEntry, error: cacheSelectError } = await supabase
    .from('ai_coach_cache')
    .select('recommendation, expires_at')
    .eq('cache_key', cacheKey)
    .single()

  if (cacheSelectError && cacheSelectError.code !== 'PGRST116') {
    console.warn('AI Coach: Error fetching from cache:', cacheSelectError.message)
  }

  if (cachedEntry && new Date(cachedEntry.expires_at) > new Date()) {
    console.log('AI Coach: Returning valid recommendation from cache.')
    const recommendation = JSON.parse(JSON.stringify(cachedEntry.recommendation)) as AICoachRecommendation
    return { ...recommendation, cacheKey }
  } else if (cachedEntry) {
    console.log('AI Coach: Cache entry found but expired.')
  } else {
    console.log('AI Coach: No cache entry found.')
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
You are an expert AI Fitness Coach for FitnessTracker V2. Your primary goal is to provide a concise, encouraging, and tactical piece of advice for today's planned workout, using the ProgramAdherenceData and UserActivitySummary to inform your recommendation. If it's a rest day, provide a recovery-focused tip.

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
- Strava Connected for Runs: ${profile?.strava_connected ? 'Yes' : 'No'}
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
    "suggestedExercises": ["Exercise 1 (e.g., Barbell Squat 3x5-8)", "Exercise 2 (e.g., Bench Press 3x8-12)", "Accessory 1 (e.g., Leg Press 3x10-15)"]
  },
  "runRecommendation": {
    "title": "Your Suggested Run", // Or null if not applicable or Strava not connected
    "details": "Details for the run. E.g., a 5k tempo run at X pace, or an easy 30-min recovery run."
  },
  "generalInsight": {
    "title": "One Key Insight from Your Data",
    "details": "A brief, encouraging insight. E.g., 'Great job on increasing your chest volume!' or 'Remember to incorporate rest days.'"
  },
  "focusAreaSuggestion": {
    "title": "Suggested Focus Area (Optional)", // e.g., "Boost Back Volume", "Improve Squat Depth"
    "details": "A specific, actionable focus area for long-term improvement based on data. Give a concrete tip or action."
  }
}
\`\`\`

**Specific Instructions for Output Fields:**
-   \`workoutRecommendation.title\`: Must reference today's planned focus (e.g., "Focus for Your Leg Day", "Today's Upper Body Session", "Recovery Day Focus").
-   \`workoutRecommendation.details\`: Provide specific, tactical advice for today's session. Reference form cues, intensity, or specific exercises from their program. Connect to recent adherence patterns.
-   \`workoutRecommendation.suggestedExercises\`: List 2-3 key exercises that align with today's planned focus. Include specific form cues or progression tips.
-   \`runRecommendation\`: Only include if relevant to today's plan or if it's a rest day and light cardio would help recovery. Keep it simple and specific to today.
-   \`generalInsight\`: Brief encouragement related to their recent adherence or progress. Reference their current program position.

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
      advice = await callLLM(promptText, 'user', {
        response_format: { type: 'json_object' },
        max_tokens: 800,
        model: 'gpt-4o', // Specific model for AI Coach
      })
    } catch (error: any) {
      console.error('LLM API call failed via llmService:', error)
      const errorMessage = error.message || 'Unknown AI Coach communication error'
      return { error: `AI Coach communication error: ${errorMessage}` }
    }

    if (!advice) {
      console.error(
        'AI Coach: Advice object is null after LLM call attempt, despite no explicit error thrown.'
      )
      return { error: 'AI Coach: Failed to generate advice.' }
    }
    // --- End of Replacement: LLM Call Logic ---

    // If LLM call was successful and advice is populated:
    const now = new Date()
    const expiresAt = new Date(now.getTime() + AI_COACH_CACHE_DURATION_MINUTES * 60 * 1000)

    console.log(
      `AI Coach: Storing new recommendation in cache. Key: ${cacheKey}, Expires: ${expiresAt.toISOString()}`
    )
    const { error: cacheUpsertError } = await supabase.from('ai_coach_cache').upsert(
      {
        cache_key: cacheKey,
        user_id: userId,
        recommendation: advice, // advice from LLM (or placeholder)
        hashed_data_input: hashedDataInput,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'cache_key',
      }
    )

    if (cacheUpsertError) {
      console.error('AI Coach: Failed to store recommendation in cache:', cacheUpsertError.message)
    } else {
      console.log('AI Coach: Recommendation stored in cache successfully.')
    }

    return { ...advice, cacheKey } // Return the newly fetched advice with cache key
  } catch (error: any) {
    console.error('getAICoachRecommendation: Error during LLM call or processing', error)
    const message = error.message || 'Failed to get recommendation from AI coach.'
    return { error: message }
  }
}

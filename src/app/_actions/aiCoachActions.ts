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
You are an expert AI Fitness Coach for FitnessTracker V2. Your goal is to provide a personalized, actionable, and encouraging daily/bi-daily recommendation. Users will see this in a dedicated "AI Coach" card in their dashboard.

**Key Instructions for LLM:**
1.  **Be Concise & Actionable**: Provide clear, direct advice. Focus on 1-2 key recommendations.
2.  **Positive & Encouraging Tone**: Motivate the user.
3.  **Personalize Deeply**: Use all available user data to tailor advice. Reference specific numbers, trends, and goals.
4.  **Holistic View**: Consider workouts, runs (if Strava connected), goals, and overall activity patterns.
5.  **Variety**: Suggest varied workouts or focus areas over time if data suggests stagnation or imbalance.
6.  **Safety First**: If suggesting new exercises, subtly remind about good form or starting with lighter weights.
7.  **Data-Driven Insights**: Connect your suggestions directly to the data provided (e.g., "I see your squat volume is trending up, let's build on that...").
8.  **Crucially, tailor all recommendations considering the user's Primary Training Focus and Experience Level.**

**CRITICAL: If 'Current Training Program Context' is provided and indicates an active program:**
- PRIORITIZE your \`workoutRecommendation\` and \`generalInsight\` to align with the user's current position in their AI-generated program.
- If a workout was planned for today but not yet logged, encourage them to do it, possibly highlighting an exercise. Title could be 'Today's Plan: [Workout Focus]'.
- If a workout was recently completed, acknowledge it. Title could be 'Great Job on Your [Focus] Workout!'.
- If a workout was missed, gently suggest how to get back on track (e.g., 'Missed yesterday's workout? No worries, you can do it today or adjust your week. Focus on [X] next.').
- If the user is consistently adhering, provide positive reinforcement.
- Tailor \`focusAreaSuggestion\` to complement their current program phase or address potential imbalances noted from their adherence.

**User Profile:**
- Age: ${profile?.age || 'Not specified'}
- Fitness Goals: ${profile?.fitness_goals || 'Not set'}
- Preferred Weight Unit: ${preferredWeightUnit}
- Strava Connected for Runs: ${profile?.strava_connected ? 'Yes' : 'No'}
- Primary Training Focus: ${profile?.primary_training_focus || 'General Fitness'}
- Experience Level: ${profile?.experience_level || 'Not Specified'}

**Current Weekly Goals (Tracked in App):**
${formattedGoals}

**Activity Summary (Last ${periodDays} Days):**
- Total Workout Sessions: ${summary?.total_workout_sessions || 0}
- Total Run Sessions (from Strava if connected): ${summary?.total_run_sessions || 0}
- Avg Workout Duration: ${summary?.avg_workout_duration_minutes?.toFixed(0) || 'N/A'} minutes
- Avg Run Distance: ${metersToMiles(summary?.avg_run_distance_meters).toFixed(1)} miles / ${(summary?.avg_run_distance_meters / 1000).toFixed(1)} km
- Avg Run Duration: ${(summary?.avg_run_duration_seconds / 60).toFixed(0) || 'N/A'} minutes
- Workout Days This Week: ${summary?.workout_days_this_week || 0}
- Workout Days Last Week: ${summary?.workout_days_last_week || 0}
- Recent Run Pace Trend (Last 3 runs vs. prior): ${summary?.recent_run_pace_trend || 'N/A'}

**Detailed Muscle Group Summary (Last ${periodDays} Days):**
${formattedMuscleSummary}

**Dynamic Exercise Progression (Top Lifts, Last ${periodDays} Days):**
${formattedExerciseProgression}

**Last 3 Runs (If Strava Connected):**
${formattedRuns}
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
-   \`workoutRecommendation.title\`: Catchy and descriptive (e.g., "Leg Day Power Builder", "Upper Body Hypertrophy Focus").
-   \`workoutRecommendation.details\`: Explain the rationale based on user data. Provide specific sets/reps or intensity cues.
-   \`workoutRecommendation.suggestedExercises\`:
    *   List 3-5 key exercises. Include example sets/reps.
    *   If Experience Level is 'Beginner', prioritize fundamental compound movements, ensure clear form cues or suggest simpler variations. Avoid overly complex or high-volume routines.
    *   If Primary Training Focus is 'Bodybuilding', suggest exercises and set/rep schemes conducive to hypertrophy.
    *   If Primary Training Focus is 'Powerlifting', focus recommendations on Squat, Bench, Deadlift variations and accessory exercises.
    *   If Primary Training Focus involves running (e.g., 'Endurance'), suggest strength exercises that complement this.
-   \`runRecommendation\`: Only include if Strava is connected AND user has run data OR their goals suggest running focus. If so, make it specific. Title example: "Tempo Run Challenge", "Easy Recovery Jog".
    *   If Primary Training Focus involves running, make the run recommendation highly specific to that focus (e.g., interval suggestions for 'Sprint Training', varied runs for 'Marathon Training').
-   \`generalInsight\`: Positive and data-driven. One concise sentence or two.

**For \`focusAreaSuggestion\` (If a clear opportunity exists):**
-   Analyze \`Detailed Muscle Group Summary\` and \`Dynamic Exercise Progression\`.
-   IF a muscle group in \`muscle_group_summary\` has significantly lower \`total_sets\` or \`total_volume\` compared to others (especially antagonist muscles or those key to \`Primary Goal\`), suggest focusing on it. Example - Title: 'Balance Your Push/Pull', Details: 'Your chest volume is higher than your back volume. Try adding one extra set to your rows or lat pulldowns this week to promote balanced development.'
-   IF \`dynamic_exercise_progression\` for a key lift (relevant to \`Primary Goal\`) shows a 'Decreasing' or 'Stagnant' trend, suggest a focus. Example - Title: 'Reignite Bench Press Progress', Details: 'Your bench press trend has been stagnant. Consider a small deload this week, or focus on improving your form on the eccentric phase for better control.'
-   IF \`profile.experience_level\` is 'Beginner', the focus could be on mastering form for a fundamental exercise. Example - Title: 'Master Squat Form', Details: 'Focus on squat depth and maintaining a neutral spine. Watch tutorial videos or consider recording yourself.'
-   IF no clear data-driven focus emerges, this field can be \`null\` or omitted.

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

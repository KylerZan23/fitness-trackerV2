"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/lib/db";
import { fetchCurrentWeekGoalsWithProgress } from "@/lib/goalsDb";
import type { GoalWithProgress } from "@/lib/types"; // Assuming UserProfile is implicitly handled by getUserProfile return type

// Define the structure for the AI Coach's recommendation
export interface AICoachRecommendation {
  workoutRecommendation: {
    title: string;
    details: string;
    suggestedExercises: string[];
  };
  runRecommendation: {
    title: string;
    details: string;
  } | null; // Can be null if Strava not connected or no run recommendation/data
  generalInsight: {
    title: string;
    details: string;
  };
  focusAreaSuggestion?: { // Optional field
    title: string;
    details: string;
  } | null;
}

// Helper interface for exercises within muscle_group_summary.top_3_exercises_by_volume
interface MuscleExerciseVolume {
  exercise_name: string;
  exercise_volume: number;
}

// Helper interface for individual muscle group details within muscle_group_summary
interface MuscleGroupDetail {
  total_sets: number;
  last_trained_date: string | null;
  total_volume: number;
  distinct_exercises_count: number;
  top_3_exercises_by_volume: MuscleExerciseVolume[];
}

// Helper interface for sessions within dynamic_exercise_progression.last_sessions
interface ExerciseSession {
  date: string;
  performance: string;
  notes: string | null;
}

// Helper interface for elements within dynamic_exercise_progression array
interface ExerciseProgressionDetail {
  exercise_name: string;
  frequency_rank: number;
  last_sessions: ExerciseSession[];
  trend: string;
}

// Helper interface for elements within last_3_runs array
interface RunDetail {
  run_date: string;
  name: string | null;
  distance_km: number;
  duration_min: number;
  avg_pace_min_km: string;
  elevation_gain_m: number;
  run_type: string;
}

// This helps with type safety when accessing its properties.
interface UserActivitySummary {
  total_workout_sessions: number;
  total_run_sessions: number;
  avg_workout_duration_minutes: number | null;
  avg_run_distance_meters: number;
  avg_run_duration_seconds: number;
  muscle_group_summary: {
    [group: string]: MuscleGroupDetail | undefined;
  };
  dynamic_exercise_progression: ExerciseProgressionDetail[];
  last_3_runs: RunDetail[];
  recent_run_pace_trend: string;
  workout_days_this_week: number;
  workout_days_last_week: number;
}

// Define the structure for the user's profile (inferred)
interface UserProfile {
  id: string;
  age: number | null;
  fitness_goals: string | null;
  weight_unit: string | null; // e.g., 'kg', 'lbs'
  strava_connected: boolean | null;
  // ... other profile fields
}

export async function getAICoachRecommendation(): Promise<AICoachRecommendation | { error: string }> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    console.error("getAICoachRecommendation: User not authenticated", authError);
    return { error: "User not authenticated" };
  }

  const userId = user.id;
  let profile: UserProfile | null = null;
  let goals: GoalWithProgress[] = [];
  let summary: UserActivitySummary | null = null;

  try {
    // 1. Fetch User Profile
    profile = await getUserProfile() as UserProfile | null;
    // Graceful handling: if profile is null, proceed, prompt will use defaults

    // 2. Fetch Active Goals
    try {
      goals = await fetchCurrentWeekGoalsWithProgress();
    } catch (goalFetchError) {
      console.warn(`getAICoachRecommendation: Error fetching goals for user ${userId}`, goalFetchError);
      // Proceed without goals, prompt will show "No active goals"
    }

    // 3. Fetch User Activity Summary
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_user_activity_summary',
      {
        user_id_param: userId,
        period_days_param: 30,
      }
    );

    if (summaryError) {
      console.error(`getAICoachRecommendation: Error fetching activity summary for user ${userId}`, summaryError);
      return { error: `Failed to fetch activity summary: ${summaryError.message}` };
    }
    summary = summaryData as UserActivitySummary; // Assuming the RPC returns a single row matching the type

    if (!summary) {
        console.error(`getAICoachRecommendation: No activity summary returned for user ${userId}`);
        return { error: "Failed to retrieve user activity summary." };
    }

  } catch (e) {
    // Catch any other unexpected errors during data fetching phase
    console.error(`getAICoachRecommendation: Unexpected error during data fetching for user ${userId}`, e);
    const message = e instanceof Error ? e.message : "An unexpected error occurred during data retrieval.";
    return { error: message };
  }
    
  // 4. Construct Prompt
  const metersToMiles = (meters: number | null | undefined) => {
    if (meters === null || meters === undefined || meters === 0) return 0;
    return parseFloat((meters / 1609.34).toFixed(2));
  };

  const goalsString = goals && goals.length > 0 
    ? goals.map(g => `- ${g.label || g.metric_type}: Target ${g.target_value} ${g.target_unit || ''}, Current ${(g.current_value ?? 0).toFixed(1)}`).join('\n') 
    : 'No active goals set for this week.';

  const preferredWeightUnit = profile?.weight_unit || 'kg';
  const periodDays = 30; // As used in the RPC call

  const formatMuscleGroupSummary = (summary: UserActivitySummary | null, weightUnit: string): string => {
    if (!summary?.muscle_group_summary || Object.keys(summary.muscle_group_summary).length === 0) {
      return "No muscle group data available for this period.";
    }
    let output = "";
    for (const groupName in summary.muscle_group_summary) {
      const group = summary.muscle_group_summary[groupName];
      if (group) {
        const topExercisesString = group.top_3_exercises_by_volume && group.top_3_exercises_by_volume.length > 0
          ? group.top_3_exercises_by_volume.map(e => `${e.exercise_name} (${e.exercise_volume}${weightUnit})`).join(', ')
          : 'N/A';
        output += `- ${groupName}: Sets: ${group.total_sets || 0}, Last Trained: ${group.last_trained_date || 'N/A'}, Volume: ${group.total_volume || 0}${weightUnit}, Distinct Ex: ${group.distinct_exercises_count || 0}. Top Volume Ex: ${topExercisesString}\n`;
      }
    }
    return output.trim() || "No muscle group data available for this period.";
  };

  const formatDynamicExerciseProgression = (summary: UserActivitySummary | null): string => {
    if (!summary?.dynamic_exercise_progression || summary.dynamic_exercise_progression.length === 0) {
      return "No specific exercise progression data tracked for top lifts in this period.";
    }
    return summary.dynamic_exercise_progression.map(ex => {
      const sessionsString = ex.last_sessions && ex.last_sessions.length > 0
        ? ex.last_sessions.map(s => `  - ${s.date}: ${s.performance} (Notes: ${s.notes || 'None'})`).join('\n')
        : '  N/A';
      return `- ${ex.exercise_name} (Rank: ${ex.frequency_rank}): Trend: ${ex.trend || 'N/A'}\nLast Sessions:\n${sessionsString}`;
    }).join('\n\n');
  };

  const formatLast3Runs = (summary: UserActivitySummary | null): string => {
    if (!summary?.last_3_runs || summary.last_3_runs.length === 0) {
      return "No recent run data available for this period.";
    }
    return summary.last_3_runs.map(r => 
      `- ${r.run_date} - Name: "${r.name || 'Unnamed Run'}" - ${r.distance_km?.toFixed(1)}km in ${r.duration_min}min (Pace: ${r.avg_pace_min_km || 'N/A'}, Elev: ${r.elevation_gain_m || 0}m, Type: ${r.run_type || 'Run'})`
    ).join('\n');
  };

  const formattedMuscleSummary = formatMuscleGroupSummary(summary, preferredWeightUnit);
  const formattedExerciseProgression = formatDynamicExerciseProgression(summary);
  const formattedRuns = formatLast3Runs(summary);

  const promptText = `
You are an expert AI Personal Fitness Coach for FitnessTracker. Your primary goal is to provide actionable, personalized, and encouraging advice. Your tone should be supportive and motivational.

User Profile:
- Age: ${profile?.age || 'N/A'}
- Stated Fitness Goals: "${profile?.fitness_goals || 'Not specified'}"
- Preferred Weight Unit: ${preferredWeightUnit}
- Strava Connected: ${profile?.strava_connected ? 'Yes' : 'No'}

Active Goals This Week:
${goalsString}

Activity Summary (Last ${periodDays} Days):

Overall Stats:
- Total Workout Sessions: ${summary?.total_workout_sessions || 0}
- Total Run Sessions: ${summary?.total_run_sessions || 0}
- Avg Workout Duration: ${summary?.avg_workout_duration_minutes?.toFixed(0) || '0'} min (per session day)
- Avg Run Distance: ${metersToMiles(summary?.avg_run_distance_meters).toFixed(2) || '0.00'} mi
- Avg Run Duration: ${Math.round((summary?.avg_run_duration_seconds || 0) / 60)} min

Workout Consistency:
- Workouts This Week (Mon-Sun): ${summary?.workout_days_this_week || 0} days
- Workouts Last Week (Mon-Sun): ${summary?.workout_days_last_week || 0} days

Muscle Group Focus (Last ${periodDays} Days):
${formattedMuscleSummary}

Key Exercise Progression (Your Top Lifts):
${formattedExerciseProgression}

Recent Running Performance:
- Recent Run Pace Trend: ${summary?.recent_run_pace_trend || 'N/A'}
- Last 3 Runs:
${formattedRuns}

Based on ALL this information, provide:

1.  A Workout Recommendation (workoutRecommendation):
    *   For workoutRecommendation.title, give a concise name for the suggested workout (e.g., 'Full Body Strength Focus', 'Chest & Triceps Hypertrophy').
    *   For workoutRecommendation.details, provide a brief overview of the workout's focus.
    *   For workoutRecommendation.suggestedExercises, list 3-5 specific exercises. For each, suggest a target (e.g., 'Bench Press: 3 sets of 6-8 reps at RPE 8', 'Squats: 4 sets of 10 reps', 'Leg Press: 3 sets of 12-15 reps'). When selecting exercises, consider the user's dynamic_exercise_progression for their top lifts (e.g., if a lift is 'Stagnant', suggest a variation or different rep scheme). Also, heavily consider the muscle_group_summary, prioritizing muscle groups with older last_trained_date or lower total_volume if it aligns with the user's profile.fitness_goals. Ensure suggestions are varied and avoid excessive overlap if a muscle group was just trained.

2.  A Run Recommendation (runRecommendation):
    *   If profile.strava_connected is true AND summary.total_run_sessions > 0, provide a runRecommendation. If not, runRecommendation MUST BE null.
    *   The runRecommendation.title should be concise (e.g., 'Easy Recovery Run', 'Tempo Run Challenge').
    *   The runRecommendation.details should describe the run (e.g., 'Aim for a 30-minute easy jog at a conversational pace to aid recovery.', 'Try a 20-minute tempo run: 5 min warm-up, 10 min at a comfortably hard pace, 5 min cool-down.'). Base this on summary.last_3_runs and summary.recent_run_pace_trend. If recent runs are all short/easy, suggest a slightly longer run or one with some intensity. If the recent_run_pace_trend is 'Slower' or indicates fatigue, suggest an easier run or rest. If the user has specific running goals (check goalsString), try to align the recommendation.

3.  A General Insight (generalInsight):
    *   The generalInsight.title should be a short, catchy phrase (e.g., 'Consistency is Key!', 'Volume Milestone').
    *   The generalInsight.details should be a brief (1-2 sentences), positive, and encouraging observation based on their overall Activity Summary (e.g., workout consistency like workout_days_this_week, trends in total volume, or meeting a goal from goalsString).

4.  A Focus Area Suggestion (focusAreaSuggestion):
    *   Your task is to identify ONE specific area for improvement or attention. This can be null if everything looks well-balanced or no clear focus emerges.
    *   Consider these factors:
        *   A muscle group from muscle_group_summary with notably low total_sets or total_volume compared to others, OR a significantly older last_trained_date.
        *   A stagnant or declining trend in dynamic_exercise_progression for a key lift.
        *   A recent_run_pace_trend that is 'Slower' or 'Stagnant' if running is part of their goals.
        *   Low workout_days_this_week if inconsistent with workout_days_last_week or stated goals.
    *   If a focus area is identified:
        *   focusAreaSuggestion.title should be concise (e.g., 'Boost Leg Volume', 'Address Squat Plateau', 'Run Pace Improvement').
        *   focusAreaSuggestion.details should explain why it's a focus (e.g., 'Your leg training volume has been a bit lower compared to upper body work this past month. This could be an opportunity to build more balanced strength.') and suggest 1-2 actionable steps or example exercises (e.g., 'Consider adding an extra set to your Squats or incorporating Romanian Deadlifts.').
        *   If multiple potential focus areas exist, pick the one you deem most impactful for the user's profile.fitness_goals.

Constraints:
- Your primary goal is to provide actionable, personalized, and encouraging advice.
- Your tone should be supportive and motivational.
- Keep recommendations concise and actionable.
- VERY IMPORTANT: Your entire response MUST be a single, valid JSON object strictly adhering to the AICoachRecommendation interface structure provided in previous context. Ensure all strings are properly escaped within the JSON. Do not include any text outside of this JSON object.
  The AICoachRecommendation structure is:
  {
    "workoutRecommendation": { "title": "string", "details": "string", "suggestedExercises": ["string", "string"] },
    "runRecommendation": { "title": "string", "details": "string" } | null,
    "generalInsight": { "title": "string", "details": "string" },
    "focusAreaSuggestion": { "title": "string", "details": "string" } | null
  }
`;

  // 5. Call LLM API
  if (!process.env.LLM_API_KEY) {
    console.error("CRITICAL: LLM_API_KEY is not set.");
    return { error: "AI Coach configuration error: API key not available." };
  }

  const apiKey = process.env.LLM_API_KEY;
  const llmApiUrl = "https://api.openai.com/v1/chat/completions";

  try {
    console.log("----------- Sending Prompt to LLM (getAICoachRecommendation) -----------");
    // console.log(promptText); // Uncomment for debugging if needed, but can be verbose
    console.log("----------------------------------------------------------------------");

    const response = await fetch(llmApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptText }],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Use text() first to avoid JSON parse error if not JSON
      console.error(`LLM API request failed with status ${response.status}:`, errorBody);
      throw new Error(`LLM API request failed: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("LLM API response format error: Unexpected structure", data);
      throw new Error("LLM API response format error: Unexpected structure.");
    }
    
    const llmResponseContent = data.choices[0].message.content;
    console.log("----------- LLM Raw Response Content (getAICoachRecommendation) ----------");
    console.log(llmResponseContent);
    console.log("--------------------------------------------------------------------------");

    try {
      const recommendation: AICoachRecommendation = JSON.parse(llmResponseContent);
      return recommendation;
    } catch (parseError) {
      console.error("LLM API response JSON parsing failed:", parseError, "Raw content:", llmResponseContent);
      // Try to provide more context from the parseError
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse LLM response as JSON: ${errorMessage}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("LLM API call failed in getAICoachRecommendation:", errorMessage, error);
    return { error: `AI Coach communication error: ${errorMessage}` };
  }
} 
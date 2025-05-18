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

// Define the expected structure from the get_user_activity_summary DB function
// This helps with type safety when accessing its properties.
interface UserActivitySummary {
  total_workout_sessions: number;
  total_run_sessions: number;
  avg_workout_duration_minutes: number | null;
  avg_run_distance_meters: number | null;
  avg_run_duration_seconds: number | null;
  muscle_group_summary: {
    [group: string]: {
      total_sets: number;
      total_volume: number;
      last_trained_date: string | null; // Assuming DATE comes as string
    } | undefined; // Muscle group might not exist
  };
  recent_exercise_progression: {
    [exercise: string]: {
      last_session_details: string | null;
      previous_session_details: string | null;
      trend: string | null;
    } | undefined; // Exercise might not exist
  };
  recent_run_pace_trend: string | null;
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

  const promptText = `
You are an expert AI Personal Fitness Coach for an application called FitnessTracker.
Your goal is to provide personalized, actionable, and encouraging workout and running recommendations.

User Profile:
- Age: ${profile?.age || 'N/A'}
- Stated Fitness Goals: "${profile?.fitness_goals || 'Not specified'}"
- Preferred Weight Unit: ${profile?.weight_unit || 'kg'}
- Strava Connected: ${profile?.strava_connected ? 'Yes' : 'No'}

Active Goals This Week:
${goalsString}

Activity Summary (Last 30 Days):
- Total Workout Sessions: ${summary?.total_workout_sessions || 0}
- Total Run Sessions: ${summary?.total_run_sessions || 0}
- Avg Workout Duration: ${summary?.avg_workout_duration_minutes?.toFixed(0) || '0'} min
- Avg Run Distance: ${metersToMiles(summary?.avg_run_distance_meters)} mi
- Avg Run Duration: ${Math.round((summary?.avg_run_duration_seconds || 0) / 60)} min
- Muscle Group Summary (Total Sets for each group):
  - Chest: ${summary?.muscle_group_summary?.Chest?.total_sets || 0}
  - Back: ${summary?.muscle_group_summary?.Back?.total_sets || 0}
  - Legs: ${summary?.muscle_group_summary?.Legs?.total_sets || 0}
  - Shoulders: ${summary?.muscle_group_summary?.Shoulders?.total_sets || 0}
  - Arms: ${summary?.muscle_group_summary?.Arms?.total_sets || 0}
  - Core: ${summary?.muscle_group_summary?.Core?.total_sets || 0}
  - Cardio: ${summary?.muscle_group_summary?.Cardio?.total_sets || 0}
  - Other: ${summary?.muscle_group_summary?.Other?.total_sets || 0}
- Recent Exercise Progression (Bench Press): ${summary?.recent_exercise_progression?.['Bench Press']?.last_session_details || 'N/A'} (Trend: ${summary?.recent_exercise_progression?.['Bench Press']?.trend || 'N/A'})
- Recent Exercise Progression (Squats): ${summary?.recent_exercise_progression?.Squats?.last_session_details || 'N/A'} (Trend: ${summary?.recent_exercise_progression?.Squats?.trend || 'N/A'})
- Recent Exercise Progression (Deadlifts): ${summary?.recent_exercise_progression?.Deadlifts?.last_session_details || 'N/A'} (Trend: ${summary?.recent_exercise_progression?.Deadlifts?.trend || 'N/A'})
- Recent Run Pace Trend: ${summary?.recent_run_pace_trend || 'N/A'}

Based on this information, provide:
1.  A primary recommendation for the user's next workout session. Be specific.
2.  A primary recommendation for their next run (if Strava is connected and run data exists).
3.  One general insight or piece of encouragement.
4.  If a muscle group has 0 sets in the summary, suggest focusing on it.

Constraints:
- Keep recommendations concise and actionable.
- Format the output STRICTLY as a JSON object with the following structure:
  {
    "workoutRecommendation": { "title": "string", "details": "string", "suggestedExercises": ["string", "string"] },
    "runRecommendation": { "title": "string", "details": "string" },
    "generalInsight": { "title": "string", "details": "string" },
    "focusAreaSuggestion": { "title": "string", "details": "string" } // This field is optional; include only if a clear focus area is identified (e.g., neglected muscle group).
  }
- Be encouraging and supportive.
`;

  // 5. Mock LLM Call
  console.log("----------- LLM Prompt (getAICoachRecommendation) -----------");
  console.log(promptText);
  console.log("-----------------------------------------------------------");

  // Example logic for focusAreaSuggestion based on prompt requirements
  let focusAreaSuggestion = null;
  if (summary?.muscle_group_summary) {
    const muscleGroups = [
      { name: 'Chest', sets: summary.muscle_group_summary.Chest?.total_sets || 0 },
      { name: 'Back', sets: summary.muscle_group_summary.Back?.total_sets || 0 },
      { name: 'Legs', sets: summary.muscle_group_summary.Legs?.total_sets || 0 },
      { name: 'Shoulders', sets: summary.muscle_group_summary.Shoulders?.total_sets || 0 },
      { name: 'Arms', sets: summary.muscle_group_summary.Arms?.total_sets || 0 },
      { name: 'Core', sets: summary.muscle_group_summary.Core?.total_sets || 0 },
    ];
    const neglectedGroup = muscleGroups.find(mg => mg.sets === 0);
    if (neglectedGroup) {
      focusAreaSuggestion = {
        title: `Consider ${neglectedGroup.name} Work`,
        details: `It looks like ${neglectedGroup.name.toLowerCase()} workouts have been a bit sparse. Try incorporating some exercises for this group into your routine this week.`
      };
    }
  }

  const mockResponse: AICoachRecommendation = {
    workoutRecommendation: {
      title: "Next Workout: Chest & Triceps",
      details: "Focus on compound movements. Try Bench Press for 4 sets of 6-8 reps, then Incline Dumbbell Press for 3 sets of 8-12 reps. For triceps, do Cable Pushdowns for 3 sets of 10-15 reps.",
      suggestedExercises: ["Bench Press", "Incline Dumbbell Press", "Cable Pushdowns"],
    },
    runRecommendation: (profile?.strava_connected && (summary?.total_run_sessions || 0) > 0) 
      ? { 
          title: "Next Run: Steady Pace", 
          details: "Aim for a 4-mile run at a comfortable, steady pace. Focus on maintaining good form." 
        }
      : null, // Set to null if not applicable
    generalInsight: {
      title: "Coach's Insight",
      details: "Your consistency with workout sessions is improving! Keep up the momentum.",
    },
    focusAreaSuggestion: focusAreaSuggestion, // Use the dynamically determined one
  };

  return mockResponse;
} 
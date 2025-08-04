// Type definitions
export interface WorkoutData {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  created_at: string;
  muscle_group?: string;
  notes?: string;
}

export interface OnboardingStrengthData {
  squat1RMEstimate?: number;
  benchPress1RMEstimate?: number;
  deadlift1RMEstimate?: number;
  strengthAssessmentType?: string;
}

export interface StrengthLevels {
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
}

export interface VolumeData {
  value: number;
  unit: 'kg' | 'lbs';
}

/**
 * Validates if the given weight and reps are suitable for e1RM calculation.
 * @param weight The weight lifted.
 * @param reps The number of repetitions.
 * @returns True if the inputs are valid, false otherwise.
 */
export const isValidForE1RM = (weight: number, reps: number): boolean => {
  return weight > 0 && reps > 0 && reps <= 20;
};

/**
 * Validates if a workout is suitable for e1RM calculation.
 * @param workout The workout data to validate.
 * @returns True if the workout is valid for e1RM calculation.
 */
export const isValidWorkoutForE1RM = (workout: any): workout is WorkoutData => {
  return (
    workout &&
    typeof workout.weight === 'number' &&
    typeof workout.reps === 'number' &&
    workout.weight > 0 &&
    workout.reps > 0 &&
    workout.reps <= 20 &&
    workout.exercise_name &&
    typeof workout.exercise_name === 'string'
  );
};

/**
 * Calculates the estimated 1-Rep Max (e1RM) using the Brzycki formula.
 * @param weight The weight lifted.
 * @param reps The number of repetitions.
 * @returns The calculated e1RM.
 */
export const calculateE1RM = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) {
    throw new Error("Weight and repetitions must be greater than 0");
  }

  if (reps === 1) {
    return weight;
  }

  const cappedReps = Math.min(reps, 12);
  const denominator = 1.0278 - 0.0278 * cappedReps;

  if (denominator <= 0) {
    return weight * 1.5; // Conservative fallback
  }

  const e1rm = weight / denominator;
  return Math.round(e1rm * 10) / 10;
};

/**
 * Formats e1RM value for display.
 * @param e1rm The e1RM value to format.
 * @returns Formatted e1RM string.
 */
export const formatE1RM = (e1rm: number): string => {
  return e1rm.toFixed(1);
};

/**
 * Gets current strength levels from workout history and onboarding data.
 * @param workouts Array of workout data.
 * @param onboardingData Onboarding strength data.
 * @returns Current strength levels for major lifts.
 */
export const getCurrentStrengthLevelsWithOnboarding = (
  workouts: WorkoutData[],
  onboardingData?: OnboardingStrengthData
): StrengthLevels => {
  const levels: StrengthLevels = {
    squat: onboardingData?.squat1RMEstimate || null,
    bench: onboardingData?.benchPress1RMEstimate || null,
    deadlift: onboardingData?.deadlift1RMEstimate || null,
  };

  // Update with recent workout data if available
  workouts.forEach(workout => {
    const exerciseName = workout.exercise_name.toLowerCase();
    const e1rm = calculateE1RM(workout.weight, workout.reps);

    if (exerciseName.includes('squat')) {
      levels.squat = Math.max(levels.squat || 0, e1rm);
    } else if (exerciseName.includes('bench')) {
      levels.bench = Math.max(levels.bench || 0, e1rm);
    } else if (exerciseName.includes('deadlift')) {
      levels.deadlift = Math.max(levels.deadlift || 0, e1rm);
    }
  });

  return levels;
};

/**
 * Calculates 7-day training volume from workout history.
 * @param workouts Array of workout data.
 * @param unit Weight unit ('kg' or 'lbs').
 * @returns Total volume for the last 7 days.
 */
export const calculate7DayVolume = (
  workouts: WorkoutData[],
  unit: 'kg' | 'lbs' = 'kg'
): VolumeData => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentWorkouts = workouts.filter(
    workout => new Date(workout.created_at) >= sevenDaysAgo
  );

  const totalVolume = recentWorkouts.reduce((total, workout) => {
    return total + (workout.weight * workout.reps * workout.sets);
  }, 0);

  return {
    value: Math.round(totalVolume),
    unit,
  };
};

/**
 * Calculates strength progression trend.
 * @param workouts Array of workout data.
 * @param formula The e1RM formula to use.
 * @returns Strength progression data.
 */
export const calculateStrengthProgression = (workouts: WorkoutData[], formula: string = 'epley') => {
  if (!workouts || workouts.length === 0) {
    return [];
  }

  return workouts
    .filter(workout => isValidWorkoutForE1RM(workout))
    .map(workout => {
      const e1rm = calculateE1RM(workout.weight, workout.reps);
      return {
        date: workout.created_at,
        e1rm,
        workout: {
          weight: workout.weight,
          reps: workout.reps,
          sets: workout.sets
        },
        formula
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates strength trend over time.
 * @param progressionData Array of progression data points.
 * @returns Strength trend analysis.
 */
export const calculateStrengthTrend = (progressionData: any[]) => {
  if (!progressionData || progressionData.length === 0) {
    return {
      trend: 'stable',
      change: 0,
      period: '7d'
    };
  }

  // Calculate trend based on recent data points
  const recentData = progressionData.slice(-7); // Last 7 data points
  if (recentData.length < 2) {
    return {
      trend: 'stable',
      change: 0,
      period: '7d'
    };
  }

  const firstE1RM = recentData[0].e1rm;
  const lastE1RM = recentData[recentData.length - 1].e1rm;
  const change = lastE1RM - firstE1RM;
  const percentChange = (change / firstE1RM) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentChange > 2) {
    trend = 'increasing';
  } else if (percentChange < -2) {
    trend = 'decreasing';
  }

  return {
    trend,
    change: Math.round(change * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10,
    period: '7d'
  };
};

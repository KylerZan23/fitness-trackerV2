/**
 * This module implements a multi-modal RPE (Rate of Perceived Exertion) and
 * adaptive loading system. It provides functions to adjust training loads based on
 * performance feedback, track cumulative fatigue, and recommend deloads, creating
 * a responsive, autoregulated training environment.
 *
 * The science is based on principles of fatigue management, stimulus-recovery-adaptation (SRA),
 * and RPE-based autoregulation popularized in modern strength coaching.
 */

import { RecoveryProfile } from './types/program';

// --- INTERFACES & TYPES ---

/**
 * Describes the RPE configuration for a specific training session.
 * This is generated from a user's main RPEProfile to guide a workout.
 */
export interface EnhancedRPESystem {
  sessionRPE: {
    target: number;
    range: [number, number];
    /** Rules for adjusting load based on hitting RPE targets. */
    autoregulationRules: {
      onTarget: 'MAINTAIN';
      belowRange: 'INCREASE_LOAD';
      aboveRange: 'DECREASE_LOAD';
    };
  };
  /** Maps specific exercises to their own RPE targets, overriding the session default. */
  exerciseSpecificRPE: Record<string, {
    target: number;
    range: [number, number];
  }>;
}

/**
 * Represents the outcome of a previous training session for a given exercise.
 */
export interface SessionFeedback {
  /** The RPE recorded for the last set of the exercise. */
  lastSessionRPE: number;
  /** The total volume (sets x reps) performed. */
  totalVolume: number;
  /** Notes on performance, e.g., "Felt strong", "Form broke down". */
  notes?: string;
}

/**
 * The output of the adaptive load calculation, providing a clear recommendation.
 */
export interface LoadRecommendation {
  /** The final recommended weight for the upcoming session. */
  recommendedWeight: number;
  /** The percentage change from the base weight. */
  percentageChange: number;
  /** Justification for the adjustment. */
  reasoning: string[];
}

/**
 * The output of the deload analysis, providing a structured recommendation.
 */
export interface DeloadRecommendation {
  /** Whether a deload is necessary. */
  isNeeded: boolean;
  /** The reason for the recommendation. */
  reason?: string;
  /** Recommended type of deload (volume or intensity reduction). */
  type?: 'volume' | 'intensity' | 'complete';
  /** Recommended duration in days. */
  durationDays?: number;
  /** The percentage to reduce volume/intensity by. */
  reductionPercentage?: number;
}


// --- HELPER FUNCTIONS ---

const FATIGUE_DECAY_RATE = 0.3; // Daily decay rate for cumulative fatigue

/**
 * Tracks the accumulation of fatigue over time.
 * Rationale: Each workout adds fatigue, which must decay over time. A user's
 * recovery rate influences how quickly they dissipate this fatigue. This function
 * models that process.
 *
 * @param cumulativeFatigue - The current total fatigue score.
 * @param newSessionFatigue - The fatigue added from the most recent workout.
 * @param recoveryRate - The user's individual recovery coefficient (from RecoveryProfile).
 * @returns The updated cumulative fatigue score.
 */
export const trackCumulativeFatigue = (
  cumulativeFatigue: number,
  newSessionFatigue: number,
  recoveryRate: number
): number => {
  // Apply daily decay, amplified by the user's recovery rate
  const decayedFatigue = cumulativeFatigue * (1 - FATIGUE_DECAY_RATE * (1 / recoveryRate));
  return decayedFatigue + newSessionFatigue;
};

/**
 * Analyzes the trend of RPEs over a series of sessions for a single exercise.
 * Rationale: A consistently increasing RPE at the same load indicates growing fatigue
 * and is a strong signal that a deload or load reduction may be needed.
 *
 * @param rpeHistory - An array of RPE values from oldest to newest.
 * @returns 'increasing', 'decreasing', or 'stable' trend.
 */
export const analyzeRPETrend = (rpeHistory: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (rpeHistory.length < 3) return 'stable';

  const first = rpeHistory[0];
  const last = rpeHistory[rpeHistory.length - 1];

  if (last > first + 1) return 'increasing';
  if (last < first - 1) return 'decreasing';
  return 'stable';
};


// --- CORE FUNCTIONS ---

/**
 * Calculates an adaptive training load for an upcoming session.
 * Science: This function combines two autoregulation principles:
 * 1. Proactive Fatigue Management: It anticipates fatigue accumulation across a mesocycle
 *    and preemptively tempers the load.
 * 2. Reactive RPE Adjustment: It reacts to the previous session's feedback, adjusting
 *    the load up or down based on how difficult it felt.
 *
 * @param baseWeight - The planned starting weight for the exercise.
 * @param weekInMesocycle - The current week number (1-based).
 * @param individualFactors - The user's `RecoveryProfile`.
 * @param previousSessionFeedback - Feedback from the last session of this exercise.
 * @returns A `LoadRecommendation` object with the adjusted weight and reasoning.
 */
export const calculateAdaptiveLoad = (
  baseWeight: number,
  weekInMesocycle: number,
  individualFactors: RecoveryProfile,
  previousSessionFeedback: SessionFeedback,
): LoadRecommendation => {
  let adjustedWeight = baseWeight;
  const reasoning: string[] = [`Base weight set to ${baseWeight}kg.`];

  // 1. Apply proactive fatigue accumulation model
  const fatigueRate = 1 / individualFactors.recoveryRate;
  const fatigueReduction = (weekInMesocycle - 1) * 0.05 * fatigueRate;
  if (fatigueReduction > 0) {
    adjustedWeight *= (1 - fatigueReduction);
    reasoning.push(`Applied a ${fatigueReduction.toFixed(2)}% fatigue reduction for week ${weekInMesocycle}.`);
  }

  // 2. Adjust reactively based on previous session RPE
  const { lastSessionRPE } = previousSessionFeedback;
  if (lastSessionRPE > 8.5) {
    adjustedWeight *= 0.95; // Reduce 5% if RPE was very high
    reasoning.push(`Reduced load by 5% due to high RPE (${lastSessionRPE}) in the last session.`);
  } else if (lastSessionRPE < 7.5) {
    adjustedWeight *= 1.03; // Increase 3% if RPE was low
    reasoning.push(`Increased load by 3% due to low RPE (${lastSessionRPE}) in the last session.`);
  } else {
    reasoning.push(`Maintained load as last session RPE (${lastSessionRPE}) was within the target range.`);
  }

  const percentageChange = ((adjustedWeight - baseWeight) / baseWeight) * 100;

  return {
    recommendedWeight: Math.round(adjustedWeight / 2.5) * 2.5, // Round to nearest 2.5kg
    percentageChange,
    reasoning,
  };
};

/**
 * Determines if a deload is needed based on cumulative fatigue.
 * Science: This models the body's overall stress level. When cumulative fatigue
 * (from training and life) exceeds an individual's capacity to recover (their fatigue
 * threshold), a deload is prescribed to allow for supercompensation and prevent overtraining.
 *
 * @param cumulativeFatigue - The user's current fatigue score.
 * @param individualThreshold - The user's `fatigueThreshold` from their RecoveryProfile.
 * @param rpeTrend - The RPE trend for a primary lift.
 * @returns A `DeloadRecommendation` object.
 */
export const determineDeloadNeed = (
  cumulativeFatigue: number,
  individualThreshold: number,
  rpeTrend: 'increasing' | 'stable' | 'decreasing' = 'stable',
): DeloadRecommendation => {
  if (cumulativeFatigue > individualThreshold) {
    return {
      isNeeded: true,
      reason: `Cumulative fatigue (${cumulativeFatigue.toFixed(0)}) has exceeded your threshold of ${individualThreshold}.`,
      type: 'volume',
      durationDays: 7,
      reductionPercentage: 50,
    };
  }

  if (rpeTrend === 'increasing') {
    return {
      isNeeded: true,
      reason: 'RPE for a primary exercise has been consistently increasing, indicating a need for recovery.',
      type: 'intensity',
      durationDays: 7,
      reductionPercentage: 20,
    };
  }

  return {
    isNeeded: false,
    reason: `Fatigue level (${cumulativeFatigue.toFixed(0)}) is within tolerance (${individualThreshold}).`,
  };
}; 
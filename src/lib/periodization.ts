/**
 * This module implements research-based periodization strategies for structuring long-term training.
 * It provides pre-built models for common fitness goals and functions to generate detailed
 * week-by-week progressions and calculate optimal deloads based on user data.
 * The system is designed to be modular, allowing for easy addition or modification of models.
 */

import { RecoveryProfile } from './types/program';
import { trackCumulativeFatigue } from './autoregulation'; // Assuming this can be used

// --- INTERFACES & TYPES ---

/**
 * Defines the structure of a single phase within a periodization model.
 */
export interface PeriodizationPhase {
  /** The name of the phase, e.g., 'Hypertrophy Accumulation'. */
  name: string;
  /** The duration of the phase in weeks. */
  durationWeeks: number;
  /** The target intensity range as a percentage of 1RM. */
  intensityRange: [number, number];
  /** The method for progressing volume throughout the phase. */
  volumeProgression: 'linear' | 'ramping' | 'stable';
  /** The primary physiological adaptation this phase targets. */
  primaryAdaptation: 'hypertrophy' | 'strength' | 'peaking' | 'recovery';
}

/**
 * Details the specific training parameters for a single week within a phase.
 */
export interface WeeklyProgression {
  weekInPhase: number;
  targetVolumeSets: number;
  targetIntensityPercent: number;
  focus: string;
}

/**
 * Provides a detailed, actionable deload prescription.
 */
export interface DetailedDeloadProtocol {
  type: 'active' | 'passive';
  durationDays: number;
  volumeReductionPercent: number;
  intensityReductionPercent: number;
  /** Specific focus for the deload, e.g., 'Technique refinement' or 'Full recovery'. */
  specializationFocus: string;
}


// --- PERIODIZATION MODELS ---

/**
 * A collection of pre-built, evidence-based periodization models.
 * Each model is a sequence of phases designed to achieve a specific long-term goal.
 */
export const ENHANCED_PERIODIZATION_MODELS: Record<string, PeriodizationPhase[]> = {
  /**
   * Rationale: Maximizes muscle growth by prioritizing a long volume accumulation phase,
   * followed by an intensification phase to translate new muscle into strength, and a short
   * realization/peaking phase to express that strength.
   */
  hypertrophyFocused: [
    { name: 'Volume Accumulation', durationWeeks: 3, intensityRange: [65, 80], volumeProgression: 'ramping', primaryAdaptation: 'hypertrophy' },
    { name: 'Intensification', durationWeeks: 2, intensityRange: [80, 90], volumeProgression: 'stable', primaryAdaptation: 'strength' },
    { name: 'Realization', durationWeeks: 1, intensityRange: [90, 95], volumeProgression: 'linear', primaryAdaptation: 'peaking' },
  ],
  /**
   * Rationale: Prioritizes strength expression. It starts with a base volume phase, moves to a
   * longer intensification block to build strength in heavy loads, and finishes with a true
   * peaking phase to prepare for 1RM testing or competition.
   */
  strengthFocused: [
    { name: 'Base Volume', durationWeeks: 2, intensityRange: [70, 85], volumeProgression: 'stable', primaryAdaptation: 'hypertrophy' },
    { name: 'Strength Intensification', durationWeeks: 3, intensityRange: [85, 95], volumeProgression: 'ramping', primaryAdaptation: 'strength' },
    { name: 'Peaking', durationWeeks: 1, intensityRange: [95, 102.5], volumeProgression: 'linear', primaryAdaptation: 'peaking' },
  ],
  /**
   * Rationale: A balanced, sustainable model for general fitness enthusiasts. It uses a simple
   * linear progression within a 4-week block, allowing for steady progress without the
   * high complexity or fatigue of more specialized models. Relies on autoregulation.
   */
  generalFitness: [
    { name: 'Linear Progression Block', durationWeeks: 4, intensityRange: [75, 85], volumeProgression: 'linear', primaryAdaptation: 'strength' },
  ],
};


// --- CORE FUNCTIONS ---

/**
 * Generates a detailed week-by-week progression for a given training phase.
 *
 * @param phase - The `PeriodizationPhase` to generate a progression for.
 * @param baseVolumeSets - The user's baseline weekly volume (e.g., their MAV).
 * @returns An array of `WeeklyProgression` objects detailing each week's plan.
 */
export const generatePhaseProgression = (
  phase: PeriodizationPhase,
  baseVolumeSets: number
): WeeklyProgression[] => {
  const progression: WeeklyProgression[] = [];
  const [startIntensity, endIntensity] = phase.intensityRange;

  for (let i = 1; i <= phase.durationWeeks; i++) {
    let targetVolumeSets: number;
    switch (phase.volumeProgression) {
      case 'ramping':
        // Start at 80% of base volume and ramp up to 110%
        targetVolumeSets = baseVolumeSets * (0.8 + (0.3 * (i / phase.durationWeeks)));
        break;
      case 'stable':
        targetVolumeSets = baseVolumeSets;
        break;
      case 'linear':
      default:
        // Linearly progress volume down slightly as intensity goes up
        targetVolumeSets = baseVolumeSets * (1 - (0.1 * ((i - 1) / (phase.durationWeeks -1 || 1))));
        break;
    }

    const targetIntensityPercent = startIntensity + ((endIntensity - startIntensity) * ((i - 1) / (phase.durationWeeks - 1 || 1)));

    progression.push({
      weekInPhase: i,
      targetVolumeSets: Math.round(targetVolumeSets),
      targetIntensityPercent: parseFloat(targetIntensityPercent.toFixed(1)),
      focus: `Focus on ${phase.primaryAdaptation} at ${targetIntensityPercent.toFixed(0)}% intensity.`,
    });
  }
  return progression;
};

/**
 * Calculates the optimal deload protocol based on user fatigue and recovery data.
 *
 * @param cumulativeFatigue - The user's current fatigue score.
 * @param recoveryProfile - The user's `RecoveryProfile`.
 * @param lastPhase - The `PeriodizationPhase` that was just completed.
 * @returns A `DetailedDeloadProtocol` object with a specific prescription.
 */
export const calculateOptimalDeload = (
  cumulativeFatigue: number,
  recoveryProfile: RecoveryProfile,
  lastPhase: PeriodizationPhase
): DetailedDeloadProtocol => {
  const fatigueRatio = cumulativeFatigue / recoveryProfile.fatigueThreshold;

  // If fatigue is extremely high or recovery is very poor, recommend a passive deload.
  if (fatigueRatio > 1.2 || recoveryProfile.recoveryRate < 0.8) {
    return {
      type: 'passive',
      durationDays: 3,
      volumeReductionPercent: 100,
      intensityReductionPercent: 100,
      specializationFocus: 'Complete rest and recovery.',
    };
  }

  // Standard active deload, adjusted by the last phase's intensity.
  let volumeReduction = 50;
  let intensityReduction = 40;

  if (lastPhase.primaryAdaptation === 'peaking') {
    // After peaking, a more significant deload is needed to realize gains.
    volumeReduction = 60;
    intensityReduction = 50;
  }

  return {
    type: 'active',
    durationDays: 7,
    volumeReductionPercent: volumeReduction,
    intensityReductionPercent: intensityReduction,
    specializationFocus: 'Technique refinement with light loads.',
  };
};


// --- HELPER FUNCTIONS ---

/**
 * Projects a potential 1RM adaptation based on the completed phase.
 * Rationale: Different training phases produce different types of adaptation. This provides
 * a rough estimate of expected progress to help manage user expectations.
 *
 * @param current1RM - The user's 1RM before the phase.
 * @param phase - The `PeriodizationPhase` that was completed.
 * @returns The projected new 1RM.
 */
export const projectAdaptation = (current1RM: number, phase: PeriodizationPhase): number => {
  let multiplier = 1.0;
  switch (phase.primaryAdaptation) {
    case 'strength':
      multiplier = 1.025; // 2.5% increase
      break;
    case 'peaking':
      multiplier = 1.03; // 3% increase from expressing strength
      break;
    case 'hypertrophy':
      multiplier = 1.01; // 1% increase, as primary adaptation is size, not strength
      break;
  }
  return parseFloat((current1RM * multiplier).toFixed(1));
}; 
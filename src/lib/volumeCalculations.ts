/**
 * This module implements science-based calculations for individualizing training volume landmarks.
 * It uses a combination of research-backed base volumes and multipliers derived from user-specific
 * parameters to tailor MEV, MAV, and MRV recommendations.
 *
 * The methodology is inspired by principles from Dr. Mike Israetel and Renaissance Periodization,
 * adapting them into a programmable formula.
 */

import { VolumeParameters, VolumeLandmarks } from './types/program';

/**
 * Defines the research-backed base weekly set volumes for major muscle groups.
 * These values represent the average starting points for a typical intermediate lifter
 * before individual adjustments are made.
 *
 * - MEV (Minimum Effective Volume): The minimum amount of work needed to maintain muscle.
 * - MAV (Maximum Adaptive Volume): The range of volume where most muscle growth occurs.
 * - MRV (Maximum Recoverable Volume): The maximum volume a lifter can recover from before performance declines.
 */
export const MUSCLE_GROUP_BASE_VOLUMES: Record<string, VolumeLandmarks> = {
  chest: { MEV: 8, MAV: 18, MRV: 26 },
  back: { MEV: 10, MAV: 20, MRV: 30 },
  shoulders: { MEV: 8, MAV: 16, MRV: 24 },
  arms: { MEV: 6, MAV: 14, MRV: 22 },
  quads: { MEV: 8, MAV: 16, MRV: 24 },
  hamstrings: { MEV: 6, MAV: 12, MRV: 18 },
  glutes: { MEV: 6, MAV: 12, MRV: 18 },
  calves: { MEV: 8, MAV: 16, MRV: 25 },
  abs: { MEV: 0, MAV: 16, MRV: 25 },
};

/**
 * Calculates a multiplier based on the user's training age.
 * Rationale: More experienced lifters can tolerate and benefit from higher training volumes.
 * This function provides a capped linear progression, increasing volume potential up to a certain point.
 * @param trainingAge - The user's training experience in years.
 * @returns A multiplier between 1.0 and 1.8.
 */
const getTrainingAgeMultiplier = (trainingAge: number): number => {
  // Cap at 2 years (24 months) of experience for the max multiplier.
  const effectiveAge = Math.min(trainingAge, 2);
  // Linearly scale from 1.0 (no experience) to 1.8 (2+ years experience).
  return 1.0 + (effectiveAge / 2.0) * 0.8;
};

/**
 * Calculates a multiplier based on the user's recovery capacity.
 * Rationale: Recovery ability (influenced by sleep, nutrition, genetics) is a key
 * determinant of how much volume one can handle.
 * @param recoveryCapacity - A 1-10 rating of the user's recovery ability.
 * @returns A multiplier (e.g., 0.7 for low, 1.0 for moderate, 1.3 for high).
 */
const getRecoveryCapacityMultiplier = (recoveryCapacity: number): number => {
  if (recoveryCapacity <= 3) return 0.7; // Low recovery
  if (recoveryCapacity <= 7) return 1.0; // Moderate recovery
  return 1.3; // High recovery
};

/**
 * Calculates a multiplier based on the user's current life stress level.
 * Rationale: High life stress competes for the same recovery resources as training stress,
 * reducing the amount of training volume that can be tolerated and recovered from.
 * @param stressLevel - A 1-10 rating of the user's current stress (higher is more stress).
 * @returns A multiplier (e.g., 1.1 for low stress, 0.6 for very high stress).
 */
const getStressLevelMultiplier = (stressLevel: number): number => {
  if (stressLevel <= 2) return 1.1; // Very Low Stress
  if (stressLevel <= 4) return 1.0; // Low Stress
  if (stressLevel <= 6) return 0.9; // Moderate Stress
  if (stressLevel <= 8) return 0.7; // High Stress
  return 0.6; // Very High Stress
};

/**
 * Calculates individualized volume landmarks for a specific muscle group.
 * It adjusts the base volumes using multipliers derived from the user's profile.
 *
 * @param params - The user's `VolumeParameters` (training age, recovery, stress).
 * @param muscleGroup - The name of the muscle group to calculate for.
 * @returns An adjusted `VolumeLandmarks` object, or null if the muscle group is invalid.
 */
export const calculateIndividualVolumeLandmarks = (
  params: VolumeParameters,
  muscleGroup: string
): VolumeLandmarks | null => {
  const baseLandmarks = MUSCLE_GROUP_BASE_VOLUMES[muscleGroup.toLowerCase()];

  if (!baseLandmarks) {
    return null;
  }

  const ageMultiplier = getTrainingAgeMultiplier(params.trainingAge);
  const recoveryMultiplier = getRecoveryCapacityMultiplier(params.recoveryCapacity);
  const stressMultiplier = getStressLevelMultiplier(params.stressLevel);

  const finalMultiplier = ageMultiplier * recoveryMultiplier * stressMultiplier * params.volumeTolerance;

  const adjustedLandmarks: VolumeLandmarks = {
    MEV: Math.round(baseLandmarks.MEV * finalMultiplier),
    MAV: Math.round(baseLandmarks.MAV * finalMultiplier),
    MRV: Math.round(baseLandmarks.MRV * finalMultiplier),
  };

  return adjustedLandmarks;
};

/**
 * Calculates individualized volume landmarks for all major muscle groups.
 * This function iterates through the base volumes and applies user-specific adjustments to each.
 *
 * @param params - The user's complete `VolumeParameters`.
 * @returns A record mapping each muscle group to its adjusted `VolumeLandmarks`.
 */
export const calculateAllMuscleLandmarks = (
  params: VolumeParameters
): Record<string, VolumeLandmarks> => {
  const allLandmarks: Record<string, VolumeLandmarks> = {};

  for (const muscleGroup in MUSCLE_GROUP_BASE_VOLUMES) {
    const adjusted = calculateIndividualVolumeLandmarks(params, muscleGroup);
    if (adjusted) {
      allLandmarks[muscleGroup] = adjusted;
    }
  }

  return allLandmarks;
}; 
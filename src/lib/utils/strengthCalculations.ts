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

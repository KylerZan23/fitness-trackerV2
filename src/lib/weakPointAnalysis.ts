/**
 * This module implements a systematic analysis of a user's strength ratios to identify
 * muscular imbalances and prescribe corrective exercise protocols. It is based on
 * established strength coaching standards to promote balanced development and reduce injury risk.
 */

// --- INTERFACES & TYPES ---

/**
 * Represents a user's one-rep max (1RM) for the primary compound lifts.
 */
export interface StrengthProfile {
  squat1RM: number;
  bench1RM: number;
  deadlift1RM: number;
  overheadPress1RM: number;
}

/**
 * The structured output of the weak point analysis.
 */
export interface WeakPointProtocol {
  /** A list of identified imbalances with their details. */
  issues: {
    ratioName: keyof typeof STRENGTH_RATIO_STANDARDS;
    yourRatio: number;
    standardMinimum: number;
    severity: 'Moderate' | 'High';
    explanation: string;
  }[];
  /** A deduplicated list of recommended exercises to address the issues. */
  correctionExercises: string[];
  /** A summary of the primary areas that need work. */
  primaryWeakPoints: string[];
  /** Recommended timeframe in weeks to re-assess the ratios. */
  reassessmentPeriodWeeks: number;
}

type WeakPointType =
  | 'WEAK_POSTERIOR_CHAIN'
  | 'WEAK_HORIZONTAL_PRESS'
  | 'WEAK_VERTICAL_PRESS';


// --- CONSTANTS & PROTOCOLS ---

/**
 * Defines research-backed strength ratio standards. These ratios help identify
 * potential muscular imbalances between major muscle groups and movement patterns.
 */
export const STRENGTH_RATIO_STANDARDS = {
  /**
   * Biomechanical Rationale: Compares general upper body horizontal pressing strength
   * to overall full-body strength. A significant deviation may indicate that upper body
   * strength is lagging behind the lower body and back.
   */
  benchToDeadlift: { minimum: 0.6, optimal: 0.8, type: 'WEAK_HORIZONTAL_PRESS' as WeakPointType },
  /**
   * Biomechanical Rationale: Compares quad-dominant strength (squat) to
   * hip-dominant strength (deadlift). A low ratio often suggests a weaker posterior chain
   * (glutes, hamstrings, erectors) relative to the quads, which can impact performance
   * and potentially increase injury risk in the lower back.
   */
  squatToDeadlift: { minimum: 0.75, optimal: 0.9, type: 'WEAK_POSTERIOR_CHAIN' as WeakPointType },
  /**
   * Biomechanical Rationale: Compares vertical pressing (shoulders, triceps) to
   * horizontal pressing (chest, front delts). A low ratio can indicate underdeveloped
   * shoulder girdle strength and stability, or weak triceps, which can limit
   * overall upper body development and performance in overhead movements.
   */
  overheadToBench: { minimum: 0.6, optimal: 0.75, type: 'WEAK_VERTICAL_PRESS' as WeakPointType },
};

/**
 * Maps identified weak point types to specific corrective exercise protocols.
 * These exercises are chosen to directly target the muscles and movement patterns
 * associated with each common imbalance.
 */
export const WEAK_POINT_PROTOCOLS: Record<WeakPointType, string[]> = {
  WEAK_POSTERIOR_CHAIN: [
    'Romanian Deadlifts',
    'Good Mornings',
    'Glute-Ham Raises',
    'Hip Thrusts',
  ],
  WEAK_HORIZONTAL_PRESS: [
    'Dumbbell Bench Press',
    'Incline Barbell Press',
    'Weighted Dips',
    'Push-ups (Weighted or Variations)',
  ],
  WEAK_VERTICAL_PRESS: [
    'Seated Dumbbell Press',
    'Arnold Press',
    'Lateral Raises',
    'Close-Grip Bench Press',
  ],
};


// --- HELPER FUNCTIONS ---

/**
 * Generates a list of correction exercises based on identified weak points.
 * @param weakPointTypes - An array of unique weak point type identifiers.
 * @returns A deduplicated array of recommended exercise names.
 */
export const generateCorrectionExercises = (weakPointTypes: WeakPointType[]): string[] => {
  const exercises = new Set<string>();
  weakPointTypes.forEach(type => {
    WEAK_POINT_PROTOCOLS[type]?.forEach(ex => exercises.add(ex));
  });
  return Array.from(exercises);
};

/**
 * Determines the recommended reassessment period based on the highest severity found.
 * Rationale: More severe imbalances require a more focused, shorter-term block of
 * corrective work before re-testing to ensure the protocol is effective.
 * @param severities - An array of severity levels ('Moderate', 'High').
 * @returns The recommended number of weeks until the next reassessment.
 */
export const calculateReassessmentPeriod = (severities: ('Moderate' | 'High')[]): number => {
  if (severities.includes('High')) {
    return 8; // A focused 8-week block for severe issues.
  }
  if (severities.includes('Moderate')) {
    return 12; // A 12-week mesocycle for moderate issues.
  }
  return 16; // Standard 16-week period if no major issues are found.
};


// --- CORE FUNCTION ---

/**
 * Performs a comprehensive weak point analysis based on a user's strength profile.
 * It calculates strength ratios, compares them to standards, identifies imbalances,
 * and generates a complete corrective protocol.
 *
 * @param profile - The user's `StrengthProfile` containing their 1RM data.
 * @returns A `WeakPointProtocol` object with analysis results and recommendations.
 */
export const enhancedWeakPointAnalysis = (profile: StrengthProfile): WeakPointProtocol => {
  const issues: WeakPointProtocol['issues'] = [];
  const weakPointTypes = new Set<WeakPointType>();

  // Ensure there are no divisions by zero for users with no 1RM data.
  const deadlift = profile.deadlift1RM || 1;
  const bench = profile.bench1RM || 1;

  const ratios = {
    benchToDeadlift: profile.bench1RM / deadlift,
    squatToDeadlift: profile.squat1RM / deadlift,
    overheadToBench: profile.overheadPress1RM / bench,
  };

  for (const key in STRENGTH_RATIO_STANDARDS) {
    const ratioName = key as keyof typeof STRENGTH_RATIO_STANDARDS;
    const standard = STRENGTH_RATIO_STANDARDS[ratioName];
    const userRatio = ratios[ratioName];

    if (userRatio < standard.minimum) {
      const severity = userRatio < standard.minimum * 0.9 ? 'High' : 'Moderate';
      issues.push({
        ratioName,
        yourRatio: parseFloat(userRatio.toFixed(2)),
        standardMinimum: standard.minimum,
        severity,
        explanation: `Your ${ratioName} ratio is below the minimum standard, suggesting a potential imbalance.`,
      });
      weakPointTypes.add(standard.type);
    }
  }

  const correctionExercises = generateCorrectionExercises(Array.from(weakPointTypes));
  const severities = issues.map(issue => issue.severity);

  return {
    issues,
    correctionExercises,
    primaryWeakPoints: Array.from(weakPointTypes),
    reassessmentPeriodWeeks: calculateReassessmentPeriod(severities),
  };
}; 
import { z } from "zod";

// Equipment types that users can select from
const EquipmentType = z.enum([
  'Full Gym (Barbells, Racks, Machines)',
  'Dumbbells',
  'Kettlebells',
  'Resistance Bands',
  'Bodyweight Only',
  'Cardio Machines (Treadmill, Bike, Rower, Elliptical)'
]);

// Primary fitness goals - specialized, gym-focused options
const FitnessGoal = z.enum([
  'Muscle Gain: General',
  'Muscle Gain: Hypertrophy Focus',
  'Strength Gain: Powerlifting Peak',
  'Strength Gain: General',
  'Endurance Improvement: Gym Cardio',
  'Sport-Specific S&C: Explosive Power',
  'General Fitness: Foundational Strength',
  'Weight Loss: Gym Based',
  'Bodyweight Mastery',
  'Recomposition: Lean Mass & Fat Loss'
]);

// Session duration options
const SessionDuration = z.enum(['30-45 minutes', '45-60 minutes', '60-75 minutes', '75+ minutes']);

// Weight unit options
const WeightUnit = z.enum(['kg', 'lbs']);

// Strength assessment type
const StrengthAssessmentType = z.enum(['actual_1rm', 'estimated_1rm', 'unsure']);

/**
 * Schema for onboarding data validation
 */
const OnboardingDataSchema = z.object({
  primaryGoal: FitnessGoal,
  sportSpecificDetails: z.string().optional(),
  trainingFrequencyDays: z.number().min(2).max(7),
  sessionDuration: SessionDuration,
  equipment: z.array(EquipmentType),
  weightUnit: WeightUnit,
  exercisePreferences: z.string().optional(),
  injuriesLimitations: z.string().optional(),
  squat1RMEstimate: z.number().positive().optional(),
  benchPress1RMEstimate: z.number().positive().optional(),
  deadlift1RMEstimate: z.number().positive().optional(),
  overheadPress1RMEstimate: z.number().positive().optional(),
  strengthAssessmentType: StrengthAssessmentType.optional(),
});

/**
 * Schema for training program generation input.
 * This defines the structure and validation rules for the data
 * required to generate a new training program.
 */
export const schema = z.object({
  onboardingData: OnboardingDataSchema,
});

export type GenerateTrainingProgramInput = z.infer<typeof schema>; 
// src/lib/validation/neuralProgramSchema.ts
import { z } from 'zod';

// --- Base Schemas for Internal and API Validation ---

export const neuralOnboardingDataSchema = z.object({
  primaryFocus: z.enum(['hypertrophy', 'strength', 'general_fitness']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  equipmentAccess: z.enum(['full_gym', 'dumbbells_only', 'bodyweight_only']),
  personalRecords: z.object({
    squat: z.number().optional(),
    bench: z.number().optional(),
    deadlift: z.number().optional(),
  }).optional(),
});

export const neuralProgressDataSchema = z.record(z.any()).optional();

// Neural API request schema - matches the actual NeuralRequest interface structure
export const neuralRequestSchema = z.object({
    onboardingData: neuralOnboardingDataSchema,
    currentWeek: z.number(),
    previousProgress: neuralProgressDataSchema,
});


// --- AI-Facing Schemas for OpenAI Generation ---
// Note: These schemas are defined independently (not extending base schemas) 
// to avoid $ref issues with OpenAI structured outputs

const warmupExerciseSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().optional().describe("A brief description of the exercise."),
    intensity: z.string().describe("Intensity level (e.g., 'Light cardio').")
});

const mainExerciseSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().optional().describe("A brief description of the exercise."),
    RPE: z.number().min(1).max(10).optional().describe("Rate of Perceived Exertion (1-10)."),
    coaching_cues: z.string().optional().describe("Specific coaching cues for form.")
});

const finisherExerciseSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().optional().describe("A brief description of the exercise."),
    duration: z.string().describe("Total duration for the finisher (e.g., '5 minutes').")
});

const cooldownExerciseSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().optional().describe("A brief description of the exercise."),
    duration: z.string().describe("Duration for each stretch (e.g., '30s per side').")
});

const workoutSchema = z.object({
    day: z.string().describe("Assigned day (e.g., 'Day 1', 'Monday')."),
    focus: z.string().describe("Primary focus of the workout (e.g., 'Full Body Strength')."),
    warmup: z.array(warmupExerciseSchema).describe("List of warmup exercises."),
    main_exercises: z.array(mainExerciseSchema).describe("List of main exercises."),
    optional_finisher: z.array(finisherExerciseSchema).optional().describe("Optional high-intensity finisher."),
    cooldown: z.array(cooldownExerciseSchema).optional().describe("List of cooldown stretches.")
});

// The top-level schema for the AI's response
export const outputSchema = z.object({
    program_name: z.string().describe("A creative name for the training program."),
    workouts: z.array(workoutSchema).describe("List of all workouts for the week.")
});

// Alias for the AI's response schema
export const RawAIResponseSchema = outputSchema;


// --- Validation Functions for Internal Use ---

export const validateNeuralOnboardingData = (data: unknown) => neuralOnboardingDataSchema.safeParse(data);
export const validateNeuralRequest = (data: unknown) => neuralRequestSchema.safeParse(data);
export const validateNeuralProgram = (data: unknown) => outputSchema.safeParse(data);
export const validateRawAIResponse = (data: unknown) => RawAIResponseSchema.safeParse(data);
export const validateNeuralProgressData = (data: unknown) => neuralProgressDataSchema.safeParse(data);


// --- Type Exports for Use Throughout the Application ---

export type NeuralProgram = z.infer<typeof outputSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type MainExercise = z.infer<typeof mainExerciseSchema>;
export type WarmupExercise = z.infer<typeof warmupExerciseSchema>;
export type FinisherExercise = z.infer<typeof finisherExerciseSchema>;
export type CooldownExercise = z.infer<typeof cooldownExerciseSchema>;

// Keep singular exports for backward compatibility if needed elsewhere
export const FinisherExerciseSchema = finisherExerciseSchema;
export const WarmupExerciseSchema = warmupExerciseSchema;
export const NeuralExerciseSchema = mainExerciseSchema;
export const CooldownExerciseSchema = cooldownExerciseSchema;
export const WorkoutSchema = workoutSchema;
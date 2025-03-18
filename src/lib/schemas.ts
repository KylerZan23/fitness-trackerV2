import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(13, 'You must be at least 13 years old').max(120, 'Please enter a valid age'),
  fitnessGoals: z.string().min(10, 'Please describe your fitness goals (min 10 characters)'),
})

export const workoutSchema = z.object({
  exerciseName: z
    .string()
    .min(2, 'Exercise name must be at least 2 characters')
    .max(50, 'Exercise name must be less than 50 characters'),
  sets: z
    .number()
    .min(1, 'Must have at least 1 set')
    .max(20, 'Maximum 20 sets allowed'),
  reps: z
    .number()
    .min(1, 'Must have at least 1 rep')
    .max(100, 'Maximum 100 reps allowed'),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .max(1000, 'Maximum weight 1000 kg/lbs'),
  duration: z
    .number()
    .min(0, 'Duration cannot be negative')
    .max(360, 'Maximum duration 360 minutes'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

export const workoutExerciseSchema = workoutSchema.omit({ duration: true, notes: true })

export const workoutGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Workout name must be at least 2 characters')
    .max(50, 'Workout name must be less than 50 characters'),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, 'Must have at least 1 exercise')
    .max(20, 'Maximum 20 exercises allowed'),
  duration: z
    .number()
    .min(0, 'Duration cannot be negative')
    .max(360, 'Maximum duration 360 minutes'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type WorkoutFormData = z.infer<typeof workoutSchema>
export type WorkoutExerciseData = z.infer<typeof workoutExerciseSchema>
export type WorkoutGroupData = z.infer<typeof workoutGroupSchema> 
import { z } from 'zod'
import { MuscleGroup } from '@/lib/types'

const aiCoachExerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.union([z.string(), z.number()]),
  muscle_group: z.nativeEnum(MuscleGroup),
})

// Define the structure for the AI Coach's recommendation
export const aiCoachRecommendationSchema = z.object({
  workoutRecommendation: z.object({
    title: z.string(),
    details: z.string(),
    suggestedExercises: z.array(aiCoachExerciseSchema),
  }),
  runRecommendation: z
    .object({
      title: z.string(),
      details: z.string(),
    })
    .nullable(),
  generalInsight: z.object({
    title: z.string(),
    details: z.string(),
  }),
  focusAreaSuggestion: z
    .object({
      title: z.string(),
      details: z.string(),
    })
    .nullable(),
})

export type AICoachRecommendation = z.infer<typeof aiCoachRecommendationSchema>

export interface AIWeeklyReview {
  title: string
  summary: string
  whatWentWell: string
  improvementArea: string
  actionableTip: string
}

export interface AIWeeklyReviewFollowUp {
  question: string
  answer: string
} 
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/client'
  const supabase = await createClient()
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/ui/Icon'
import { Error } from '@/components/ui/error'
import {
  type OnboardingData,
  type FitnessGoal,
  type SessionDuration,
  type EquipmentType,
} from '@/lib/types/onboarding'
import {
  finalizeOnboarding,
  type FullOnboardingAnswers,
} from '@/app/_actions/onboardingActions'

// Constants for form options
const FITNESS_GOALS: { value: FitnessGoal; label: string }[] = [
  { value: 'Muscle Gain: General', label: 'Muscle Gain' },
  { value: 'Strength Gain: General', label: 'Strength Gain' },
  { value: 'Endurance Improvement: Gym Cardio', label: 'Endurance Improvement' },
  { value: 'Sport-Specific S&C: Explosive Power', label: 'Sport-Specific' },
  { value: 'General Fitness: Foundational Strength', label: 'General Fitness' },
]

const TRAINING_FOCUS_OPTIONS = [
  { value: 'General Fitness', label: 'General Fitness' },
  { value: 'Bodybuilding', label: 'Bodybuilding' },
  { value: 'Powerlifting', label: 'Powerlifting' },
  { value: 'Athletic Performance', label: 'Athletic Performance' },
  { value: 'Endurance', label: 'Endurance' },
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'Beginner (<6 months)', label: 'Beginner (<6 months)' },
  { value: 'Intermediate (6mo-2yr)', label: 'Intermediate (6mo-2yr)' },
  { value: 'Advanced (2+ years)', label: 'Advanced (2+ years)' },
]

const SESSION_DURATIONS: { value: SessionDuration; label: string }[] = [
  { value: '30-45 minutes', label: '30-45 minutes' },
  { value: '45-60 minutes', label: '45-60 minutes' },
  { value: '60-75 minutes', label: '60-75 minutes' },
  { value: '75+ minutes', label: '75+ minutes' },
]

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'Full Gym (Barbells, Racks, Machines)', label: 'Full Gym (Barbells, Racks, Machines)' },
  { value: 'Dumbbells', label: 'Dumbbells' },
  { value: 'Kettlebells', label: 'Kettlebells' },
  { value: 'Resistance Bands', label: 'Resistance Bands' },
  { value: 'Bodyweight Only', label: 'Bodyweight Only' },
  { value: 'Cardio Machines (Treadmill, Bike, Rower, Elliptical)', label: 'Cardio Machines' },
]

const TRAINING_FREQUENCY_OPTIONS = [
  { value: 2, label: '2 days per week' },
  { value: 3, label: '3 days per week' },
  { value: 4, label: '4 days per week' },
  { value: 5, label: '5 days per week' },
  { value: 6, label: '6 days per week' },
  { value: 7, label: '7 days per week' },
]

// Zod schemas for each step
const step1Schema = z.object({
  primaryGoal: z.enum([
    'Muscle Gain: General',
    'Strength Gain: General',
    'Endurance Improvement: Gym Cardio',
    'Sport-Specific S&C: Explosive Power',
    'General Fitness: Foundational Strength',
  ]),
  secondaryGoal: z
    .enum([
      'Muscle Gain: General',
      'Strength Gain: General',
      'Endurance Improvement: Gym Cardio',
      'Sport-Specific S&C: Explosive Power',
      'General Fitness: Foundational Strength',
    ])
    .optional(),
  sportSpecificDetails: z.string().optional(),
  primaryTrainingFocus: z.string().min(1, 'Please select your primary training focus'),
  experienceLevel: z.string().min(1, 'Please select your experience level'),
})

const step2Schema = z.object({
  trainingFrequencyDays: z.number().min(2).max(7),
      sessionDuration: z.enum(['30-45 minutes', '45-60 minutes', '60-75 minutes', '75+ minutes']),
  equipment: z
    .array(
      z.enum([
        'Full Gym (Barbells, Racks, Machines)',
        'Dumbbells',
        'Kettlebells',
        'Resistance Bands',
        'Bodyweight Only',
        'Cardio Machines (Treadmill, Bike, Rower, Elliptical)',
      ])
    )
    .min(1, 'Please select at least one equipment option'),
  squat1RMEstimate: z.number().positive().optional().or(z.literal('').transform(() => undefined)),
  benchPress1RMEstimate: z.number().positive().optional().or(z.literal('').transform(() => undefined)),
  deadlift1RMEstimate: z.number().positive().optional().or(z.literal('').transform(() => undefined)),
  overheadPress1RMEstimate: z.number().positive().optional().or(z.literal('').transform(() => undefined)),
  strengthAssessmentType: z.enum(['actual_1rm', 'estimated_1rm', 'unsure']).optional(),
})

const step3Schema = z.object({
  exercisePreferences: z.string().optional(),
  injuriesLimitations: z.string().optional(),
})

// Combined schema for the entire form
const onboardingSchema = step1Schema.merge(step2Schema).merge(step3Schema)

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface UserProfile {
  id: string
  name: string
  email: string
  weight_unit?: string
  onboarding_completed?: boolean
  onboarding_responses?: any
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 3

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      equipment: [],
    },
  })

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = form

  // Watch specific fields for conditional rendering
  const primaryGoal = watch('primaryGoal')
  const secondaryGoal = watch('secondaryGoal')

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        setIsLoading(true)
        setError(null)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          console.log('No active session found, redirecting to signup')
          router.replace('/signup')
          return
        }

        console.log('Authenticated user found:', session.user.id)

        // Check for force reset parameter (for debugging)
        const urlParams = new URLSearchParams(window.location.search)
        const forceReset = urlParams.get('reset') === 'true'

        if (forceReset) {
          console.log('Force reset requested, clearing onboarding status')
          try {
            await supabase
              .from('profiles')
              .update({
                onboarding_completed: false,
                onboarding_responses: null,
              })
              .eq('id', session.user.id)
            console.log('Onboarding status reset successfully')
          } catch (resetError) {
            console.error('Error resetting onboarding:', resetError)
          }
        }

        // Fetch user profile (should exist from signup)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, weight_unit, onboarding_completed, onboarding_responses')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error loading profile:', profileError)

          // If profile doesn't exist, redirect to signup to create one
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, redirecting to signup')
            router.replace('/signup')
            return
          }

          setError('Failed to load your profile. Please try again.')
          return
        }

        setProfile(profile)

        // Check if user has already completed onboarding and has an active program
        if (profile.onboarding_completed && !forceReset) {
          // Check if user has an active training program
          const { data: trainingProgram } = await supabase
            .from('training_programs')
            .select('id, is_active')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .maybeSingle()

          const hasActiveProgram = !!trainingProgram

          if (hasActiveProgram) {
            console.log(
              'User has completed onboarding and has active program, redirecting to program page'
            )
            router.replace('/workouts')
            return
          } else {
            console.log(
              'User completed onboarding but no active program found, allowing re-onboarding'
            )
            // Allow user to redo onboarding to generate new program
          }
        }

        console.log('User ready for onboarding')
      } catch (err) {
        console.error('Error during auth check:', err)
        setError('An error occurred while loading your profile. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  const onSubmit = async (data: OnboardingFormData) => {
    if (!profile) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare the data for the server action
      const onboardingAndProfileData: FullOnboardingAnswers = {
        ...data,
        experienceLevel: data.experienceLevel,
        weightUnit: 'lbs', // Default to lbs for old onboarding flow
      }

      console.log('Submitting onboarding data:', onboardingAndProfileData)

      // Call the server action
      const result = await finalizeOnboarding(onboardingAndProfileData)

      if ('error' in result) {
        setError(result.error || 'An error occurred')
        return
      }

      // Success! Show success message and redirect
      console.log('Onboarding completed successfully!')

      // You could add a toast notification here in the future
      // toast.success('Welcome! Your personalized training program is being generated.')

      // Redirect to workouts page after onboarding completion
      router.push('/workouts?onboarding=completed')
    } catch (err) {
      console.error('Error submitting onboarding:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    let isValid = false

    switch (currentStep) {
      case 1:
        isValid = await trigger(['primaryGoal', 'primaryTrainingFocus', 'experienceLevel'])
        break
      case 2:
        isValid = await trigger(['trainingFrequencyDays', 'sessionDuration', 'equipment'])
        break
      case 3:
        isValid = true // Step 3 fields are optional
        break
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getProgressPercentage = () => {
    return (currentStep / totalSteps) * 100
  }

  // Prepare props for the Sidebar
  const sidebarProps = {
    userName: profile?.name,
    userEmail: profile?.email,
    onLogout: async () => {
      await supabase.auth.signOut()
    },
  }

  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))]">
          <Icon
            name="loader"
            className="animate-spin h-16 w-16 border-b-2 border-gray-900 mx-auto"
          />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.24))] text-center">
          <Error message={error} className="text-red-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Training Program Generator</h1>
          <p className="text-lg text-gray-600">Let's create your personalized workout program</p>

          {/* Show message if redoing onboarding */}
          {profile?.onboarding_completed && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> We noticed you've completed onboarding before but don't have
                an active training program. Let's generate a new personalized program for you!
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Goals & Focus */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Goals & Training Focus</CardTitle>
                <CardDescription>
                  Tell us about your fitness goals and training background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Fitness Goal */}
                <div className="space-y-2">
                  <Label htmlFor="primaryGoal">Primary Fitness Goal *</Label>
                  <Controller
                    name="primaryGoal"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {FITNESS_GOALS.map(goal => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {primaryGoal === 'Sport-Specific S&C: Explosive Power' && (
                    <Controller
                      name="sportSpecificDetails"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Please specify your sport"
                          className="mt-2"
                        />
                      )}
                    />
                  )}
                  {errors.primaryGoal && (
                    <p className="text-sm text-red-600">{errors.primaryGoal.message}</p>
                  )}
                </div>

                {/* Secondary Fitness Goal */}
                <div className="space-y-2">
                  <Label htmlFor="secondaryGoal">Secondary Fitness Goal (Optional)</Label>
                  <Controller
                    name="secondaryGoal"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a secondary goal (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {FITNESS_GOALS.map(goal => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {secondaryGoal === 'Sport-Specific S&C: Explosive Power' && (
                    <Controller
                      name="sportSpecificDetails"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Please specify your sport"
                          className="mt-2"
                        />
                      )}
                    />
                  )}
                </div>

                {/* Primary Training Focus */}
                <div className="space-y-2">
                  <Label htmlFor="primaryTrainingFocus">Primary Training Focus *</Label>
                  <Controller
                    name="primaryTrainingFocus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary training focus" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRAINING_FOCUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.primaryTrainingFocus && (
                    <p className="text-sm text-red-600">{errors.primaryTrainingFocus.message}</p>
                  )}
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level *</Label>
                  <Controller
                    name="experienceLevel"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVEL_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.experienceLevel && (
                    <p className="text-sm text-red-600">{errors.experienceLevel.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Training Preferences */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Training Preferences</CardTitle>
                <CardDescription>
                  Help us understand your training schedule and available equipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Training Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="trainingFrequencyDays">Training Frequency *</Label>
                  <Controller
                    name="trainingFrequencyDays"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={value => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How many days per week can you train?" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRAINING_FREQUENCY_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.trainingFrequencyDays && (
                    <p className="text-sm text-red-600">{errors.trainingFrequencyDays.message}</p>
                  )}
                </div>

                {/* Session Duration */}
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration">Session Duration *</Label>
                  <Controller
                    name="sessionDuration"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="How long can you train per session?" />
                        </SelectTrigger>
                        <SelectContent>
                          {SESSION_DURATIONS.map(duration => (
                            <SelectItem key={duration.value} value={duration.value}>
                              {duration.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sessionDuration && (
                    <p className="text-sm text-red-600">{errors.sessionDuration.message}</p>
                  )}
                </div>

                {/* Equipment Access */}
                <div className="space-y-3">
                  <Label>Equipment Access * (Select all that apply)</Label>
                  <Controller
                    name="equipment"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {EQUIPMENT_OPTIONS.map(equipment => (
                          <label
                            key={equipment.value}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(equipment.value) || false}
                              onChange={e => {
                                const currentValue = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...currentValue, equipment.value])
                                } else {
                                  field.onChange(
                                    currentValue.filter(item => item !== equipment.value)
                                  )
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{equipment.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.equipment && (
                    <p className="text-sm text-red-600">{errors.equipment.message}</p>
                  )}
                </div>

                {/* Current Strength Levels (Optional) */}
                <div className="space-y-4 pt-4 border-t mt-6">
                  <div>
                    <h3 className="text-md font-semibold text-gray-700">Current Strength Levels (Optional)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Providing these helps us tailor weight recommendations. Enter your 1 Rep Max or a recent heavy lift (e.g., weight for 3-5 reps).
                    </p>
                  </div>

                  {/* Squat 1RM / Estimate */}
                  <div className="space-y-2">
                    <Label htmlFor="squat1RMEstimate">Squat 1RM / Estimate (in {profile?.weight_unit || 'kg'})</Label>
                    <Controller
                      name="squat1RMEstimate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="squat1RMEstimate"
                          type="number"
                          step="any"
                          placeholder="e.g., 100"
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          value={field.value === undefined ? '' : field.value}
                          className={errors.squat1RMEstimate ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.squat1RMEstimate && (
                      <p className="text-sm text-red-600">{errors.squat1RMEstimate.message}</p>
                    )}
                  </div>

                  {/* Bench Press 1RM / Estimate */}
                  <div className="space-y-2">
                    <Label htmlFor="benchPress1RMEstimate">Bench Press 1RM / Estimate (in {profile?.weight_unit || 'kg'})</Label>
                    <Controller
                      name="benchPress1RMEstimate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="benchPress1RMEstimate"
                          type="number"
                          step="any"
                          placeholder="e.g., 80"
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          value={field.value === undefined ? '' : field.value}
                          className={errors.benchPress1RMEstimate ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.benchPress1RMEstimate && (
                      <p className="text-sm text-red-600">{errors.benchPress1RMEstimate.message}</p>
                    )}
                  </div>

                  {/* Deadlift 1RM / Estimate */}
                  <div className="space-y-2">
                    <Label htmlFor="deadlift1RMEstimate">Deadlift 1RM / Estimate (in {profile?.weight_unit || 'kg'})</Label>
                    <Controller
                      name="deadlift1RMEstimate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="deadlift1RMEstimate"
                          type="number"
                          step="any"
                          placeholder="e.g., 120"
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          value={field.value === undefined ? '' : field.value}
                          className={errors.deadlift1RMEstimate ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.deadlift1RMEstimate && (
                      <p className="text-sm text-red-600">{errors.deadlift1RMEstimate.message}</p>
                    )}
                  </div>

                  {/* Overhead Press 1RM / Estimate */}
                  <div className="space-y-2">
                    <Label htmlFor="overheadPress1RMEstimate">Overhead Press 1RM / Estimate (in {profile?.weight_unit || 'kg'})</Label>
                    <Controller
                      name="overheadPress1RMEstimate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="overheadPress1RMEstimate"
                          type="number"
                          step="any"
                          placeholder="e.g., 50"
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          value={field.value === undefined ? '' : field.value}
                          className={errors.overheadPress1RMEstimate ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.overheadPress1RMEstimate && (
                      <p className="text-sm text-red-600">{errors.overheadPress1RMEstimate.message}</p>
                    )}
                  </div>

                  {/* Strength Assessment Type */}
                  <div className="space-y-2">
                    <Label htmlFor="strengthAssessmentType">How were these values determined?</Label>
                    <Controller
                      name="strengthAssessmentType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assessment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actual_1rm">Actual 1 Rep Max</SelectItem>
                            <SelectItem value="estimated_1rm">Estimated (from 2-5 rep max)</SelectItem>
                            <SelectItem value="unsure">Unsure / Just a guess</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.strengthAssessmentType && (
                      <p className="text-sm text-red-600">{errors.strengthAssessmentType.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Personal Preferences & Limitations */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Preferences & Limitations</CardTitle>
                <CardDescription>
                  Tell us about any exercise preferences or physical limitations (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Exercise Preferences */}
                <div className="space-y-2">
                  <Label htmlFor="exercisePreferences">
                    Exercise Preferences/Dislikes (Optional)
                  </Label>
                  <Controller
                    name="exercisePreferences"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="e.g., I enjoy squats and deadlifts, but I dislike burpees..."
                        rows={4}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">
                    Let us know about exercises you particularly enjoy or want to avoid
                  </p>
                </div>

                {/* Injuries/Limitations */}
                <div className="space-y-2">
                  <Label htmlFor="injuriesLimitations">Known Injuries/Limitations (Optional)</Label>
                  <Controller
                    name="injuriesLimitations"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="e.g., Lower back pain, knee injury, shoulder mobility issues..."
                        rows={4}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">
                    Help us create a safe program by sharing any current or past injuries
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <CardFooter className="flex justify-between mt-6 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6"
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep} className="px-8">
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="animate-spin mr-2 h-4 w-4" />
                      Generating Program...
                    </>
                  ) : (
                    'Submit & Generate Program'
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-4">
            <Error message={error} className="text-red-600" />
          </div>
        )}

        {/* Debug Section (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Options</h3>
            <p className="text-xs text-gray-600 mb-3">
              If you're experiencing issues with onboarding redirects, try these options:
            </p>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = '/onboarding?reset=true'
                }}
                className="text-xs"
              >
                Reset Onboarding Status
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!profile) return
                  console.log('=== DEBUG INFO ===')
                  console.log('Profile:', profile)

                  // Check training programs
                  const { data: programs, error } = await supabase
                    .from('training_programs')
                    .select('*')
                    .eq('user_id', profile.id)
                  console.log('Training programs:', programs, error)

                  alert('Debug info logged to console')
                }}
                className="text-xs ml-2"
              >
                Log Debug Info
              </Button>
              {profile && (
                <div className="text-xs text-gray-600 mt-2">
                  <p>Current Status:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>onboarding_completed = {String(profile.onboarding_completed)}</li>
                    <li>has_onboarding_responses = {String(!!profile.onboarding_responses)}</li>
                    {profile.onboarding_responses && (
                      <li>
                        onboarding_response_keys ={' '}
                        {Object.keys(profile.onboarding_responses).join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

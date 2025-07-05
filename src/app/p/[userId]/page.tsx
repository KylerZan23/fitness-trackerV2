import { createClient } from '@/utils/supabase/server'
import { calculateWorkoutStreak } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { StreakIndicator } from '@/components/ui/StreakIndicator'
import { Trophy, Calendar, Zap, Target, Weight, TrendingUp } from 'lucide-react'

interface PublicProfilePageProps {
  params: Promise<{
    userId: string
  }>
}

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
}

interface WorkoutStats {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  totalWeight: number
  totalDuration: number
}

interface PersonalBest {
  exerciseName: string
  weight: number
  reps: number
  created_at: string
}

// Server-side data fetching functions
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, profile_picture_url')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}

async function getUserWorkoutStats(userId: string): Promise<WorkoutStats> {
  const supabase = await createClient()
  
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('sets, reps, weight, duration')
    .eq('user_id', userId)

  if (error || !workouts) {
    return {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalWeight: 0,
      totalDuration: 0
    }
  }

  const stats = workouts.reduce(
    (acc, workout) => ({
      totalWorkouts: acc.totalWorkouts + 1,
      totalSets: acc.totalSets + workout.sets,
      totalReps: acc.totalReps + (workout.sets * workout.reps),
      totalWeight: acc.totalWeight + parseFloat(workout.weight.toString()),
      totalDuration: acc.totalDuration + workout.duration,
    }),
    {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalWeight: 0,
      totalDuration: 0,
    }
  )

  return {
    ...stats,
    totalWeight: Math.round(stats.totalWeight)
  }
}

async function getUserPersonalBests(userId: string): Promise<PersonalBest[]> {
  const supabase = await createClient()
  
  // Key exercises we want to show PBs for
  const keyExercises = ['Squat', 'Bench Press', 'Deadlift']
  const personalBests: PersonalBest[] = []

  for (const exerciseName of keyExercises) {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('weight, reps, created_at')
      .eq('user_id', userId)
      .ilike('exercise_name', `%${exerciseName}%`)
      .order('weight', { ascending: false })
      .limit(1)

    if (!error && workouts && workouts.length > 0) {
      personalBests.push({
        exerciseName,
        weight: parseFloat(workouts[0].weight.toString()),
        reps: workouts[0].reps,
        created_at: workouts[0].created_at
      })
    }
  }

  return personalBests
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params

  // Fetch all data in parallel
  const [profile, workoutStats, personalBests, workoutStreak] = await Promise.all([
    getUserProfile(userId),
    getUserWorkoutStats(userId),
    getUserPersonalBests(userId),
    calculateWorkoutStreak(userId, await createClient())
  ])

  // If user doesn't exist, show 404
  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Main Profile Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-white/20"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-2 border-white/20"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/10"></div>
            </div>
            
            {/* Profile Header */}
            <div className="relative z-10 text-center">
              <div className="mb-6">
                <UserAvatar
                  name={profile.name}
                  email={profile.email}
                  size={20}
                  profilePictureUrl={profile.profile_picture_url}
                />
              </div>
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-lg font-medium text-blue-100">Fitness Athlete</span>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            {/* Workout Streak */}
            <div className="mb-8">
              <StreakIndicator
                currentStreak={workoutStreak}
                longestStreak={workoutStreak}
                streakType="workout"
                className="mx-auto"
                showMilestones={false}
              />
            </div>

            {/* Lifetime Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{workoutStats.totalWorkouts}</div>
                <div className="text-sm text-blue-700 font-medium">Total Workouts</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{workoutStats.totalSets.toLocaleString()}</div>
                <div className="text-sm text-green-700 font-medium">Total Sets</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Weight className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">{workoutStats.totalWeight.toLocaleString()}</div>
                <div className="text-sm text-purple-700 font-medium">Total Weight (kg)</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{Math.round(workoutStats.totalDuration / 60)}</div>
                <div className="text-sm text-orange-700 font-medium">Total Hours</div>
              </div>
            </div>

            {/* Personal Bests */}
            {personalBests.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Personal Bests</h2>
                </div>
                <div className="space-y-4">
                  {personalBests.map((pb) => (
                    <div
                      key={pb.exerciseName}
                      className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pb.exerciseName}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(pb.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-700">
                            {pb.weight}kg
                          </div>
                          <div className="text-sm text-amber-600">
                            {pb.reps} rep{pb.reps !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Powered By Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Powered by AI Fitness Coach</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Start your fitness journey today
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Generate metadata for better social sharing
export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { userId } = await params
  const profile = await getUserProfile(userId)
  
  if (!profile) {
    return {
      title: 'User Not Found',
      description: 'This fitness profile could not be found.'
    }
  }

  return {
    title: `${profile.name}'s Fitness Profile`,
    description: `Check out ${profile.name}'s fitness achievements and workout stats!`,
    openGraph: {
      title: `${profile.name}'s Fitness Profile`,
      description: `Check out ${profile.name}'s fitness achievements and workout stats!`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name}'s Fitness Profile`,
      description: `Check out ${profile.name}'s fitness achievements and workout stats!`,
    }
  }
} 
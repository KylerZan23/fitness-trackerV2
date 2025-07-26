import { createClient } from '@/utils/supabase/server'
import { calculateWorkoutStreak } from '@/lib/db/index'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { StreakIndicator } from '@/components/ui/StreakIndicator'
import { BackButton } from '@/components/ui/BackButton'
import { Trophy, Calendar, User, Star, Users, Flame, TrendingUp, Activity, Clock, Dumbbell } from 'lucide-react'

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
  primary_training_focus?: string
  experience_level?: string
  age?: number
  birth_date?: string
  professional_title?: string
  followers_count?: number
  following_count?: number
}

interface PersonalBest {
  exerciseName: string
  weight: number
  reps: number
  created_at: string
}

interface RecentActivity {
  id: string
  type: 'workout' | 'pr'
  title: string
  description: string
  created_at: string
}

interface WorkoutCount {
  totalWorkouts: number
}

// Server-side data fetching functions
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id, 
      name, 
      email, 
      profile_picture_url,
      primary_training_focus,
      experience_level,
      age,
      birth_date,
      professional_title,
      followers_count,
      following_count
    `)
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
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

async function getUserRecentActivity(userId: string): Promise<RecentActivity[]> {
  const supabase = await createClient()
  const activities: RecentActivity[] = []

  // Get recent workouts
  const { data: recentWorkouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, exercise_name, weight, reps, sets, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!workoutsError && recentWorkouts) {
    recentWorkouts.forEach(workout => {
      activities.push({
        id: `workout-${workout.id}`,
        type: 'workout',
        title: `Completed ${workout.exercise_name}`,
        description: `${workout.sets} sets × ${workout.reps} reps @ ${workout.weight}kg`,
        created_at: workout.created_at
      })
    })
  }

  // Get recent workout groups (sessions)
  const { data: recentSessions, error: sessionsError } = await supabase
    .from('workout_groups')
    .select('id, name, duration, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!sessionsError && recentSessions) {
    recentSessions.forEach(session => {
      activities.push({
        id: `session-${session.id}`,
        type: 'workout',
        title: `Completed ${session.name}`,
        description: `${Math.round(session.duration)} minute session`,
        created_at: session.created_at
      })
    })
  }

  // Sort by date and limit to most recent
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
}

async function getUserWorkoutCount(userId: string): Promise<WorkoutCount> {
  const supabase = await createClient()
  
  // Count total workouts for the user
  const { count, error } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting workouts:', error)
    return { totalWorkouts: 0 }
  }

  return { totalWorkouts: count || 0 }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params

  // Fetch all data in parallel
  const [profile, personalBests, workoutStreak, recentActivity, workoutCount] = await Promise.all([
    getUserProfile(userId),
    getUserPersonalBests(userId),
    calculateWorkoutStreak(userId, await createClient()),
    getUserRecentActivity(userId),
    getUserWorkoutCount(userId)
  ])

  // If user doesn't exist, show 404
  if (!profile) {
    notFound()
  }

  // Calculate age from birth_date if available
  const age = profile.birth_date 
    ? Math.floor((new Date().getTime() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : profile.age

  // Format training focus for display
  const trainingFocus = profile.primary_training_focus || 'General Fitness'
  const experienceLevel = profile.experience_level || 'Beginner'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <div className="mb-6 flex justify-end">
          <BackButton />
        </div>
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
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-lg font-medium text-blue-100">
                  {profile.professional_title || 'Fitness Athlete'}
                </span>
              </div>
              
              {/* Followers/Following - Small Display */}
              <div className="flex items-center justify-center space-x-6 text-blue-100">
                <div className="text-center">
                  <div className="text-lg font-semibold">{profile.followers_count || 0}</div>
                  <div className="text-xs opacity-80">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{profile.following_count || 0}</div>
                  <div className="text-xs opacity-80">Following</div>
                </div>
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

            {/* User Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Training Focus */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-900">{trainingFocus}</div>
                <div className="text-sm text-blue-700 font-medium">Training Focus</div>
              </div>

              {/* Age */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{age || '—'}</div>
                <div className="text-sm text-green-700 font-medium">Age</div>
              </div>

              {/* Experience Level */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-900">{experienceLevel}</div>
                <div className="text-sm text-purple-700 font-medium">Experience</div>
              </div>

              {/* Total Workouts */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Dumbbell className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{workoutCount.totalWorkouts}</div>
                <div className="text-sm text-orange-700 font-medium">Workouts Completed</div>
              </div>
            </div>

            {/* Big Three PRs */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Personal Records</h2>
              </div>
              
              {personalBests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {personalBests.map((pb) => (
                    <div
                      key={pb.exerciseName}
                      className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200 text-center"
                    >
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 text-lg">{pb.exerciseName}</h3>
                      </div>
                      <div className="mb-2">
                        <div className="text-3xl font-bold text-amber-700">
                          {pb.weight}kg
                        </div>
                        <div className="text-sm text-amber-600">
                          {pb.reps} rep{pb.reps !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pb.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add placeholder cards for missing PRs */}
                  {Array.from({ length: 3 - personalBests.length }).map((_, index) => {
                    const missingExercises = ['Squat', 'Bench Press', 'Deadlift'].filter(
                      exercise => !personalBests.some(pb => pb.exerciseName === exercise)
                    )
                    return (
                      <div
                        key={`missing-${index}`}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 text-center"
                      >
                        <div className="mb-3">
                          <h3 className="font-bold text-gray-500 text-lg">
                            {missingExercises[index] || 'Unknown'}
                          </h3>
                        </div>
                        <div className="mb-2">
                          <div className="text-3xl font-bold text-gray-400">—</div>
                          <div className="text-sm text-gray-400">No PR yet</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Start tracking
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Squat', 'Bench Press', 'Deadlift'].map((exercise) => (
                    <div
                      key={exercise}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 text-center"
                    >
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-500 text-lg">{exercise}</h3>
                      </div>
                      <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-400">—</div>
                        <div className="text-sm text-gray-400">No PR yet</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Start tracking
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-green-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                </div>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(activity.created_at).toLocaleDateString()}
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
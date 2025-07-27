/**
 * Experience Card Component
 * ------------------------------------------------
 * Shows user experience level with progress bar and stats
 */

import { User, Calendar, Trophy } from 'lucide-react'

interface ExperienceCardProps {
  profile: {
    experience_level?: string | null
    primary_training_focus?: string | null
  }
  workoutStats: {
    totalWorkouts: number
    personalRecordsCount: number
  }
}

function getExperienceData(experienceLevel: string | null) {
  switch (experienceLevel) {
    case 'Beginner (<6 months)':
      return {
        level: 'Beginner',
        duration: '<6 Months',
        progress: 25,
        color: 'bg-green-500'
      }
    case 'Intermediate (6mo-2yr)':
      return {
        level: 'Intermediate',
        duration: '6mo-2yr',
        progress: 60,
        color: 'bg-blue-500'
      }
    case 'Advanced (2+ years)':
      return {
        level: 'Advanced',
        duration: '2+ Years',
        progress: 90,
        color: 'bg-purple-500'
      }
    default:
      return {
        level: 'Intermediate',
        duration: '1-2 Years',
        progress: 50,
        color: 'bg-blue-500'
      }
  }
}

export function ExperienceCard({ profile, workoutStats }: ExperienceCardProps) {
  const experienceData = getExperienceData(profile.experience_level ?? null)

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-green-100 rounded-lg">
          <User className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Experience Level</h3>
      </div>

      <div className="space-y-4">
        {/* Experience Level Display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-gray-900">
              {experienceData.level}
            </span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {experienceData.duration}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`${experienceData.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${experienceData.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-900">
              {workoutStats.totalWorkouts.toLocaleString()}
            </div>
            <div className="text-xs text-green-700 font-medium">
              Workouts
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-900">
              {workoutStats.personalRecordsCount}
            </div>
            <div className="text-xs text-green-700 font-medium">
              PRs Set
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
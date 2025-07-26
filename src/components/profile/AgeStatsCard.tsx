/**
 * Age & Stats Card Component
 * ------------------------------------------------
 * Displays user age, height, weight with badges
 */

import { Calendar, Ruler, Scale } from 'lucide-react'

interface AgeStatsCardProps {
  profile: {
    age?: number
    height_cm?: number | null
    weight_kg?: number | null
    birth_date?: string | null
  }
  weightUnit?: 'kg' | 'lbs'
}

function calculateAge(birthDate: string | null, currentAge?: number): number {
  if (currentAge && currentAge > 0) return currentAge
  
  if (!birthDate) return 0
  
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

function getAgeBadge(age: number): { text: string; color: string } {
  if (age >= 18 && age <= 35) {
    return { text: 'Prime Age', color: 'bg-blue-100 text-blue-700' }
  } else if (age >= 36 && age <= 50) {
    return { text: 'Peak Years', color: 'bg-purple-100 text-purple-700' }
  } else if (age > 50) {
    return { text: 'Master', color: 'bg-orange-100 text-orange-700' }
  } else {
    return { text: 'Youth', color: 'bg-green-100 text-green-700' }
  }
}

function convertWeight(weightKg: number, unit: 'kg' | 'lbs'): { value: number; unit: string } {
  if (unit === 'lbs') {
    return { value: Math.round(weightKg * 2.20462), unit: 'lbs' }
  }
  return { value: Math.round(weightKg), unit: 'kg' }
}

function convertHeight(heightCm: number): { feet: number; inches: number; cm: number } {
  const totalInches = heightCm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  
  return { feet, inches, cm: Math.round(heightCm) }
}

export function AgeStatsCard({ profile, weightUnit = 'kg' }: AgeStatsCardProps) {
  const age = calculateAge(profile.birth_date ?? null, profile.age)
  const ageBadge = getAgeBadge(age)
  
  const height = profile.height_cm ? convertHeight(profile.height_cm) : null
  const weight = profile.weight_kg ? convertWeight(profile.weight_kg, weightUnit) : null

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Age & Stats</h3>
      </div>

      <div className="space-y-4">
        {/* Age Display */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-gray-900">
              {age > 0 ? `${age} Years Old` : 'Age not set'}
            </span>
            {age > 0 && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ageBadge.color}`}>
                {ageBadge.text}
              </span>
            )}
          </div>
        </div>

        {/* Physical Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Height */}
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-900">
              {height ? `${height.feet}'${height.inches}"` : '--'}
            </div>
            <div className="text-xs text-blue-700 font-medium">
              Height
            </div>
          </div>

          {/* Weight */}
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Scale className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-900">
              {weight ? `${weight.value} ${weight.unit}` : '--'}
            </div>
            <div className="text-xs text-blue-700 font-medium">
              Weight
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
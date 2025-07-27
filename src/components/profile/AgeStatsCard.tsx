/**
 * Age & Stats Card Component
 * ------------------------------------------------
 * Displays user age, height, weight with inline editing
 */

import { useState } from 'react'
import { Calendar, Ruler, Scale, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateProfileBasicInfo } from '@/app/_actions/profileActions'

interface AgeStatsCardProps {
  profile: {
    age?: number
    height_cm?: number | null
    weight_kg?: number | null
    birth_date?: string | null
  }
  weightUnit?: 'kg' | 'lbs'
  onProfileUpdate?: () => void
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

// Convert weight from display unit back to kg for storage
function convertWeightToKg(value: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') {
    return value / 2.20462
  }
  return value
}

// Convert height from feet/inches to cm
function convertHeightToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54
}

export function AgeStatsCard({ profile, weightUnit = 'kg', onProfileUpdate }: AgeStatsCardProps) {
  const age = calculateAge(profile.birth_date ?? null, profile.age)
  const height = profile.height_cm ? convertHeight(profile.height_cm) : null
  const weight = profile.weight_kg ? convertWeight(profile.weight_kg, weightUnit) : null

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Edit state
  const [editAge, setEditAge] = useState(age || '')
  const [editHeightFeet, setEditHeightFeet] = useState(height?.feet || '')
  const [editHeightInches, setEditHeightInches] = useState(height?.inches || '')
  const [editHeightCm, setEditHeightCm] = useState(height?.cm || '')
  const [editWeight, setEditWeight] = useState(weight?.value || '')

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    // Reset edit values
    setEditAge(age || '')
    setEditHeightFeet(height?.feet || '')
    setEditHeightInches(height?.inches || '')
    setEditHeightCm(height?.cm || '')
    setEditWeight(weight?.value || '')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Validate and prepare data
      const updateData: { age?: number | null; height_cm?: number | null; weight_kg?: number | null } = {}

      // Age
      if (editAge !== '') {
        const ageNum = parseInt(editAge.toString())
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
          throw new Error('Age must be between 13 and 120 years')
        }
        updateData.age = ageNum
      } else {
        updateData.age = null
      }

      // Height
      if (weightUnit === 'lbs') {
        // Imperial: feet and inches
        if (editHeightFeet !== '' || editHeightInches !== '') {
          const feet = parseInt(editHeightFeet.toString()) || 0
          const inches = parseInt(editHeightInches.toString()) || 0
          if (feet < 3 || feet > 8 || inches < 0 || inches > 11) {
            throw new Error('Invalid height. Please enter a realistic height.')
          }
          updateData.height_cm = Math.round(convertHeightToCm(feet, inches))
        } else {
          updateData.height_cm = null
        }
      } else {
        // Metric: cm
        if (editHeightCm !== '') {
          const cm = parseInt(editHeightCm.toString())
          if (isNaN(cm) || cm < 100 || cm > 250) {
            throw new Error('Height must be between 100cm and 250cm')
          }
          updateData.height_cm = cm
        } else {
          updateData.height_cm = null
        }
      }

      // Weight
      if (editWeight !== '') {
        const weightValue = parseFloat(editWeight.toString())
        if (isNaN(weightValue) || weightValue <= 0) {
          throw new Error('Please enter a valid weight')
        }
        const weightInKg = convertWeightToKg(weightValue, weightUnit)
        if (weightInKg < 30 || weightInKg > 300) {
          throw new Error(`Weight must be between ${weightUnit === 'lbs' ? '66-660 lbs' : '30-300 kg'}`)
        }
        updateData.weight_kg = weightInKg
      } else {
        updateData.weight_kg = null
      }

      // Update profile
      const result = await updateProfileBasicInfo(updateData)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setIsEditing(false)
      onProfileUpdate?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Age & Stats</h3>
        </div>
        
        {!isEditing ? (
          <Button
            onClick={handleEdit}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Age Display/Edit */}
        <div>
          {!isEditing ? (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-gray-900">
                {age > 0 ? `${age} Years Old` : 'Age not set'}
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                placeholder="Enter age"
                min="13"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Physical Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Height */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-center mb-2">
              <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-blue-700 font-medium">Height</div>
            </div>
            
            {!isEditing ? (
              <div className="text-lg font-bold text-blue-900 text-center">
                {height ? `${height.feet}'${height.inches}"` : '--'}
              </div>
            ) : (
              <div className="space-y-1">
                {weightUnit === 'lbs' ? (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={editHeightFeet}
                      onChange={(e) => setEditHeightFeet(e.target.value)}
                      placeholder="ft"
                      min="3"
                      max="8"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={editHeightInches}
                      onChange={(e) => setEditHeightInches(e.target.value)}
                      placeholder="in"
                      min="0"
                      max="11"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={editHeightCm}
                    onChange={(e) => setEditHeightCm(e.target.value)}
                    placeholder="cm"
                    min="100"
                    max="250"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-center mb-2">
              <Scale className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-blue-700 font-medium">Weight</div>
            </div>
            
            {!isEditing ? (
              <div className="text-lg font-bold text-blue-900 text-center">
                {weight ? `${weight.value} ${weight.unit}` : '--'}
              </div>
            ) : (
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                placeholder={weightUnit}
                min={weightUnit === 'lbs' ? '66' : '30'}
                max={weightUnit === 'lbs' ? '660' : '300'}
                step="0.1"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
      </div>
    </div>
  )
} 
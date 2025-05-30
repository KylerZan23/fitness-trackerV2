'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'
import { type EquipmentType } from '@/lib/types/onboarding'

const EQUIPMENT_OPTIONS: { 
  value: EquipmentType; 
  label: string; 
  shortLabel: string;
  description: string; 
  emoji: string; 
  color: string;
  benefits: string[];
}[] = [
  {
    value: 'Full Gym (Barbells, Racks, Machines)',
    label: 'Full Gym Access',
    shortLabel: 'Full Gym',
    description: 'Complete gym with barbells, racks, and machines',
    emoji: '🏋️‍♂️',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
    benefits: ['Maximum exercise variety', 'Progressive overload', 'All muscle groups']
  },
  {
    value: 'Dumbbells',
    label: 'Dumbbells',
    shortLabel: 'Dumbbells',
    description: 'Adjustable or fixed weight dumbbells',
    emoji: '🏋️‍♀️',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
    benefits: ['Unilateral training', 'Stabilizer muscles', 'Versatile exercises']
  },
  {
    value: 'Kettlebells',
    label: 'Kettlebells',
    shortLabel: 'Kettlebells',
    description: 'Dynamic training with kettlebells',
    emoji: '🔔',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
    benefits: ['Functional movement', 'Cardio + strength', 'Core engagement']
  },
  {
    value: 'Resistance Bands',
    label: 'Resistance Bands',
    shortLabel: 'Bands',
    description: 'Elastic resistance bands and tubes',
    emoji: '🎯',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300',
    benefits: ['Portable', 'Joint-friendly', 'Variable resistance']
  },
  {
    value: 'Bodyweight Only',
    label: 'Bodyweight Only',
    shortLabel: 'Bodyweight',
    description: 'No equipment needed - just your body',
    emoji: '🤸‍♀️',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300',
    benefits: ['Always available', 'Functional strength', 'No cost']
  },
  {
    value: 'Cardio Machines (Treadmill, Bike, Rower, Elliptical)',
    label: 'Cardio Machines',
    shortLabel: 'Cardio',
    description: 'Treadmill, bike, rower, elliptical',
    emoji: '🏃‍♂️',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300',
    benefits: ['Cardiovascular health', 'Endurance building', 'Low impact options']
  }
]

export function EquipmentAccessQuestion({ value, onChange, error }: QuestionProps) {
  const selectedEquipment = (value as EquipmentType[]) || []

  const handleEquipmentToggle = (equipment: EquipmentType) => {
    const currentSelection = selectedEquipment || []
    
    if (currentSelection.includes(equipment)) {
      // Remove equipment
      const newSelection = currentSelection.filter(item => item !== equipment)
      onChange(newSelection)
    } else {
      // Add equipment
      const newSelection = [...currentSelection, equipment]
      onChange(newSelection)
    }
  }

  return (
    <div className="space-y-6">
      {/* Equipment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EQUIPMENT_OPTIONS.map((equipment) => {
          const isSelected = selectedEquipment.includes(equipment.value)
          
          return (
            <button
              key={equipment.value}
              onClick={() => handleEquipmentToggle(equipment.value)}
              className={`
                relative p-5 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : equipment.color
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Equipment Content */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{equipment.emoji}</div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {equipment.label}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {equipment.description}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-1">
                  {equipment.benefits.map((benefit, index) => (
                    <div key={index} className={`text-xs flex items-center ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedEquipment.length > 0 && (
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-2">
            ✅ Selected Equipment ({selectedEquipment.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedEquipment.map((equipment) => {
              const option = EQUIPMENT_OPTIONS.find(opt => opt.value === equipment)
              return (
                <span key={equipment} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                  {option?.emoji} {option?.shortLabel}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Helpful Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Equipment Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Select all that apply</strong> - We'll design workouts around what you have</li>
          <li>• <strong>Don't have much?</strong> Bodyweight exercises can be incredibly effective</li>
          <li>• <strong>Mix and match</strong> - Combining equipment types creates variety</li>
          <li>• <strong>Start simple</strong> - You can always add more equipment later</li>
        </ul>
      </div>
    </div>
  )
} 
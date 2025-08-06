'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface BaseOption {
  /** Option value can be string or number */
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

interface NeuralQuestionCardProps {
  /** Question title */
  title: string
  /** Optional question description */
  description?: string
  /** Question type determines the input component */
  type: 'single-select' | 'multi-select' | 'number' | 'text'
  /** Available options for select types */
  options?: BaseOption[]
  /** Current value */
  value: any
  /** Change handler */
  onChange: (value: any) => void
  /** Validation error message */
  error?: string
  /** Whether the question is required */
  required?: boolean
  /** Placeholder text for input types */
  placeholder?: string
  /** Minimum value for number inputs */
  min?: number
  /** Maximum value for number inputs */
  max?: number
  /** Unit label for number inputs */
  unit?: string
  /** Whether the card is currently focused/active */
  isActive?: boolean
  /** Optional emoji or icon for the question */
  emoji?: string
  /** Custom className */
  className?: string
}

/**
 * NeuralQuestionCard - Reusable question component for Neural onboarding
 * 
 * Features:
 * - Multiple input types (single-select, multi-select, number, text)
 * - Accessible design with keyboard navigation
 * - Professional styling with Neural branding
 * - Built-in validation display
 * - Smooth animations and hover effects
 */
export function NeuralQuestionCard({
  title,
  description,
  type,
  options = [],
  value,
  onChange,
  error,
  required = false,
  placeholder,
  min,
  max,
  unit,
  isActive = false,
  emoji,
  className
}: NeuralQuestionCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when card becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const hasError = Boolean(error)
  const isValid = !hasError && value !== undefined && value !== null && value !== ''

  const handleSingleSelect = (selectedValue: string | number) => {
    onChange(selectedValue)
  }

  const handleMultiSelect = (selectedValue: string | number) => {
    const currentValues = Array.isArray(value) ? value : []
    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter(v => v !== selectedValue)
      : [...currentValues, selectedValue]
    onChange(newValues)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === '' ? undefined : Number(e.target.value)
    onChange(numValue)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const renderSingleSelect = () => (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSingleSelect(option.value)}
          disabled={option.disabled}
          className={cn(
            "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
            "hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            value === option.value 
              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
              : "border-gray-200 bg-white",
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.description && (
                <div className="text-sm text-gray-600 mt-1">{option.description}</div>
              )}
            </div>
            {value === option.value && (
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
          </div>
        </button>
      ))}
    </div>
  )

  const renderMultiSelect = () => (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = Array.isArray(value) && value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleMultiSelect(option.value)}
            disabled={option.disabled}
            className={cn(
              "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
              "hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isSelected
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 bg-white",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                )}
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )

  const renderNumberInput = () => (
    <div className="relative">
      <input
        ref={inputRef}
        type="number"
        value={value ?? ''}
        onChange={handleNumberChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          "w-full px-4 py-3 text-lg font-medium rounded-lg border-2 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          hasError 
            ? "border-red-300 focus:border-red-500" 
            : "border-gray-300 focus:border-blue-500",
          unit && "pr-16"
        )}
      />
      {unit && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
          {unit}
        </div>
      )}
    </div>
  )

  const renderTextInput = () => (
    <input
      ref={inputRef}
      type="text"
      value={value ?? ''}
      onChange={handleTextChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
      className={cn(
        "w-full px-4 py-3 text-lg rounded-lg border-2 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        hasError 
          ? "border-red-300 focus:border-red-500" 
          : "border-gray-300 focus:border-blue-500"
      )}
    />
  )

  const renderInput = () => {
    switch (type) {
      case 'single-select':
        return renderSingleSelect()
      case 'multi-select':
        return renderMultiSelect()
      case 'number':
        return renderNumberInput()
      case 'text':
        return renderTextInput()
      default:
        return null
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all duration-300",
        "hover:shadow-xl hover:border-blue-300",
        isActive && "ring-2 ring-blue-500 ring-offset-2 shadow-xl",
        hasError && "ring-2 ring-red-500 ring-offset-2",
        isValid && "ring-2 ring-green-500 ring-offset-2",
        className
      )}
    >
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          {emoji && (
            <div className="text-2xl">{emoji}</div>
          )}
          <h3 className="text-xl font-bold text-gray-900 flex-1">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {isValid && (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )}
        </div>
        {description && (
          <p className="text-gray-600 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Input Component */}
      <div className="mb-4">
        {renderInput()}
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Help Text for Complex Questions */}
      {(type === 'multi-select') && (
        <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
          <span>💡</span>
          <span>You can select multiple options</span>
        </div>
      )}
    </div>
  )
}

// Preset question configurations for common Neural onboarding questions
export const NEURAL_QUESTION_CONFIGS = {
  primaryFocus: {
    title: "What's your primary fitness goal?",
    description: "This helps Neural create the most effective program for you",
    emoji: "🎯",
    type: 'single-select' as const,
    options: [
      {
        value: 'hypertrophy',
        label: 'Build Muscle (Hypertrophy)',
        description: 'Focus on muscle growth and size'
      },
      {
        value: 'strength',
        label: 'Get Stronger',
        description: 'Maximize your strength in key lifts'
      },
      {
        value: 'general_fitness',
        label: 'General Fitness',
        description: 'Improve overall health and conditioning'
      }
    ]
  },
  experienceLevel: {
    title: "What's your training experience?",
    description: "Neural will adjust the complexity and intensity based on your background",
    emoji: "📈",
    type: 'single-select' as const,
    options: [
      {
        value: 'beginner',
        label: 'Beginner',
        description: 'New to structured training (0-1 years)'
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        description: 'Regular training experience (1-3 years)'
      },
      {
        value: 'advanced',
        label: 'Advanced',
        description: 'Extensive training background (3+ years)'
      }
    ]
  },
  sessionDuration: {
    title: "How long can you train per session?",
    description: "Be realistic - Neural will optimize your time efficiently",
    emoji: "⏱️",
    type: 'single-select' as const,
    options: [
      {
        value: 30,
        label: '30 minutes',
        description: 'Quick, efficient sessions'
      },
      {
        value: 45,
        label: '45 minutes',
        description: 'Balanced workout length'
      },
      {
        value: 60,
        label: '60 minutes',
        description: 'Standard gym session'
      },
      {
        value: 90,
        label: '90 minutes',
        description: 'Extended training time'
      }
    ]
  },
  equipmentAccess: {
    title: "What equipment do you have access to?",
    description: "Neural will design your program around your available resources",
    emoji: "🏋️",
    type: 'single-select' as const,
    options: [
      {
        value: 'full_gym',
        label: 'Full Gym',
        description: 'Complete gym with barbells, machines, etc.'
      },
      {
        value: 'dumbbells_only',
        label: 'Dumbbells Only',
        description: 'Home gym or limited equipment'
      },
      {
        value: 'bodyweight_only',
        label: 'Bodyweight Only',
        description: 'No equipment needed'
      }
    ]
  }
}

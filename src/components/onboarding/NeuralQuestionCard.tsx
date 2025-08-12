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
  /** Layout for select options */
  optionsLayout?: 'stack' | 'grid'
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
  optionsLayout = 'stack',
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
    <div className={cn(optionsLayout === 'grid' ? 'grid gap-4 sm:grid-cols-3' : 'space-y-2')}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSingleSelect(option.value)}
          disabled={option.disabled}
          className={cn(
            "group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200",
            "hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            value === option.value
              ? "border-transparent bg-gradient-to-br from-blue-50 to-purple-50 ring-2 ring-blue-200"
              : "border-gray-200 bg-white/90",
            option.disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{option.label}</div>
              {option.description && (
                <div className="mt-1 text-sm text-gray-600">{option.description}</div>
              )}
            </div>
            {value === option.value && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
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
              "w-full rounded-xl border-2 p-4 text-left transition-all duration-200",
              "hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isSelected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200 bg-white/90",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="mt-1 text-sm text-gray-600">{option.description}</div>
                )}
              </div>
              {isSelected && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 shadow">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
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
        "rounded-2xl border border-gray-200/70 bg-white/90 p-6 shadow-lg backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-[1px] hover:shadow-xl",
        isActive && "ring-2 ring-blue-500 ring-offset-2",
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
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
  quickInfo: {
    title: "Quick Info",
    description: "Tell us your gender, height, weight, and preferred unit",
    emoji: "⚡",
    type: 'text' as const,
  },
  primaryFocus: {
    title: "Primary Focus",
    description: "What is your main goal?",
    emoji: "🎯",
    type: 'single-select' as const,
    optionsLayout: 'grid' as const,
    options: [
      {
        value: 'hypertrophy',
        label: 'Hypertrophy',
        description: 'Build muscle size and shape'
      },
      {
        value: 'strength',
        label: 'Strength',
        description: 'Lift heavier, get stronger'
      },
      {
        value: 'general_fitness',
        label: 'General Fitness',
        description: 'Move better, feel better'
      }
    ]
  },
  experienceLevel: {
    title: "Experience",
    description: "How experienced are you?",
    emoji: "📈",
    type: 'single-select' as const,
    optionsLayout: 'grid' as const,
    options: [
      {
        value: 'beginner',
        label: 'Beginner',
          description: '0–3 months — new or returning'
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
          description: '3–12 months — consistent training'
      },
      {
        value: 'advanced',
        label: 'Advanced',
          description: '12+ months — optimizing performance'
      }
    ]
  },
  sessionDuration: {
    title: "Session Duration",
    description: "How long per session?",
    emoji: "⏱️",
    type: 'single-select' as const,
    options: [
      {
        value: 30,
        label: '30 minutes',
        description: 'Quick & focused'
      },
      {
        value: 45,
        label: '45 minutes',
        description: 'Balanced'
      },
      {
        value: 60,
        label: '60 minutes',
        description: 'Full session'
      },
      {
        value: 90,
        label: '90 minutes',
        description: 'Extended work'
      }
    ]
  },
  equipmentAccess: {
    title: "Equipment",
    description: "What can you access?",
    emoji: "🏋️",
    type: 'single-select' as const,
    options: [
      {
        value: 'full_gym',
        label: 'Full Gym',
        description: 'Machines & free weights'
      },
      {
        value: 'dumbbells_only',
        label: 'Dumbbells Only',
        description: 'Pairs and adjustable'
      },
      {
        value: 'bodyweight_only',
        label: 'Bodyweight',
        description: 'Minimal equipment'
      }
    ]
  },
  trainingDaysPerWeek: {
    title: "Days/Week",
    description: "How many days can you train?",
    emoji: "🗓️",
    type: 'single-select' as const,
    options: [
      { value: 2, label: '2 days/week', description: 'Minimal schedule' },
      { value: 3, label: '3 days/week', description: 'We recommend at least 2–3 days/week' },
      { value: 4, label: '4 days/week', description: 'Upper/Lower split friendly' },
      { value: 5, label: '5 days/week', description: 'High frequency' },
      { value: 6, label: '6 days/week', description: 'Advanced training' },
    ]
  }
}

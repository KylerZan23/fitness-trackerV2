'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Target, Dumbbell, Activity, Calendar, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FloatingAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  color: string
  description: string
}

interface FloatingActionMenuProps {
  actions?: FloatingAction[]
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

const defaultActions: FloatingAction[] = [
  {
    id: 'new-workout',
    label: 'Log Workout',
    icon: Dumbbell,
    href: '/workout/new',
    color: 'from-blue-500 to-blue-600',
    description: 'Record a new workout session'
  },
  {
    id: 'add-goal',
    label: 'Add Goal',
    icon: Target,
    color: 'from-purple-500 to-purple-600',
    description: 'Set a new fitness goal'
  },
  {
    id: 'view-progress',
    label: 'View Progress',
    icon: TrendingUp,
    href: '/workouts',
    color: 'from-green-500 to-green-600',
    description: 'Check your workout history'
  },
  {
    id: 'log-run',
    label: 'Log Run',
    icon: Activity,
    href: '/run-logger',
    color: 'from-orange-500 to-orange-600',
    description: 'Record a running session'
  }
]

export function FloatingActionMenu({ 
  actions = defaultActions, 
  position = 'bottom-right',
  className = ''
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  // Animation direction based on position
  const getActionPosition = (index: number) => {
    const spacing = 70
    const offset = (index + 1) * spacing

    switch (position) {
      case 'bottom-right':
      case 'bottom-left':
        return { bottom: offset }
      case 'top-right':
      case 'top-left':
        return { top: offset }
      default:
        return { bottom: offset }
    }
  }

  const handleActionClick = (action: FloatingAction) => {
    if (action.onClick) {
      action.onClick()
    }
    setIsOpen(false)
  }

  return (
    <div 
      ref={menuRef}
      className={`fixed z-50 ${positionClasses[position]} ${className}`}
    >
      {/* Action Items */}
      {isOpen && (
        <div className="absolute">
          {actions.map((action, index) => {
            const ActionIcon = action.icon
            const actionStyle = getActionPosition(index)
            
            return (
              <div
                key={action.id}
                className={`
                  absolute transition-all duration-300 ease-out
                  ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                `}
                style={{
                  ...actionStyle,
                  transitionDelay: `${index * 50}ms`,
                  [position.includes('right') ? 'right' : 'left']: 0
                }}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
              >
                {/* Tooltip */}
                {hoveredAction === action.id && (
                  <div 
                    className={`
                      absolute z-10 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg
                      whitespace-nowrap transition-all duration-200
                      ${position.includes('right') 
                        ? 'right-16 -translate-y-1/2 top-1/2' 
                        : 'left-16 -translate-y-1/2 top-1/2'
                      }
                    `}
                  >
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-gray-300">{action.description}</div>
                    {/* Arrow */}
                    <div 
                      className={`
                        absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45
                        ${position.includes('right') ? '-right-1' : '-left-1'}
                      `}
                    />
                  </div>
                )}

                {/* Action Button */}
                {action.href ? (
                  <Link href={action.href}>
                    <Button
                      size="lg"
                      className={`
                        w-14 h-14 rounded-full shadow-lg hover:shadow-xl
                        bg-gradient-to-r ${action.color} hover:scale-110
                        transition-all duration-200 border-0
                        group relative overflow-hidden
                      `}
                      onClick={() => handleActionClick(action)}
                    >
                      {/* Ripple effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                      <ActionIcon className="w-6 h-6 text-white relative z-10" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className={`
                      w-14 h-14 rounded-full shadow-lg hover:shadow-xl
                      bg-gradient-to-r ${action.color} hover:scale-110
                      transition-all duration-200 border-0
                      group relative overflow-hidden
                    `}
                    onClick={() => handleActionClick(action)}
                  >
                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                    <ActionIcon className="w-6 h-6 text-white relative z-10" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <Button
        size="lg"
        className={`
          w-16 h-16 rounded-full shadow-xl hover:shadow-2xl
          bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
          transition-all duration-300 border-0 group relative overflow-hidden
          ${isOpen ? 'rotate-45 scale-110' : 'hover:scale-105'}
        `}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open quick actions menu'}
      >
        {/* Background pulse effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-pulse opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        
        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300">
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <Plus className="w-7 h-7 text-white" />
          )}
        </div>

        {/* Ripple effect on click */}
        <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-100 transition-transform duration-150" />
      </Button>

      {/* Backdrop blur when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm -z-10 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
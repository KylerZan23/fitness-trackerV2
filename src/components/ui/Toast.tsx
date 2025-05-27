'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, Trophy, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'goal-completed'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  achievement?: {
    badge: string
    points?: number
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Individual Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(onRemove, 300) // Wait for exit animation
  }

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: CheckCircle,
          iconColor: 'text-white'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: AlertCircle,
          iconColor: 'text-white'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          icon: AlertCircle,
          iconColor: 'text-white'
        }
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          icon: Info,
          iconColor: 'text-white'
        }
      case 'achievement':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
          icon: Trophy,
          iconColor: 'text-white'
        }
      case 'goal-completed':
        return {
          bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          icon: Target,
          iconColor: 'text-white'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          icon: Info,
          iconColor: 'text-white'
        }
    }
  }

  const styles = getToastStyles()
  const Icon = styles.icon

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-lg border border-white/20
        transform transition-all duration-300 ease-out
        ${styles.bg}
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        ${toast.type === 'achievement' || toast.type === 'goal-completed' 
          ? 'animate-bounce' 
          : ''
        }
      `}
    >
      {/* Background pattern for achievements */}
      {(toast.type === 'achievement' || toast.type === 'goal-completed') && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
          {/* Sparkle effects */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
          <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-3 right-4 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>
      )}

      <div className="relative p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${toast.type === 'achievement' ? 'animate-bounce' : ''}`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm leading-tight">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-white/90 text-xs mt-1 leading-relaxed">
                    {toast.description}
                  </p>
                )}
                
                {/* Achievement details */}
                {toast.achievement && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full">
                      {toast.achievement.badge}
                    </span>
                    {toast.achievement.points && (
                      <span className="text-white/90 text-xs flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        +{toast.achievement.points} pts
                      </span>
                    )}
                  </div>
                )}

                {/* Action button */}
                {toast.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-white hover:bg-white/20 h-8 px-3 text-xs"
                    onClick={toast.action.onClick}
                  >
                    {toast.action.label}
                  </Button>
                )}
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20 h-6 w-6 p-0 ml-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress bar for timed toasts */}
        {toast.duration && toast.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white/40 transition-all ease-linear"
              style={{
                animation: `shrink ${toast.duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Toast Container Component
function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook for toast utilities - must be used inside a component
export function useToastUtils() {
  const { addToast } = useToast()
  
  return {
    success: (title: string, description?: string) => {
      addToast({ type: 'success', title, description })
    },
    error: (title: string, description?: string) => {
      addToast({ type: 'error', title, description })
    },
    achievement: (title: string, badge: string, points?: number) => {
      addToast({ 
        type: 'achievement', 
        title, 
        achievement: { badge, points },
        duration: 8000 // Longer duration for achievements
      })
    },
    goalCompleted: (title: string, description?: string) => {
      addToast({ 
        type: 'goal-completed', 
        title, 
        description,
        duration: 8000
      })
    }
  }
}

// CSS for progress bar animation (add to global styles)
const progressBarStyles = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
`

// Export styles to be added to global CSS
export { progressBarStyles } 
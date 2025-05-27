'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  iconName?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  variant?: 'default' | 'motivational' | 'success'
  className?: string
}

export function EmptyState({
  title,
  description,
  iconName = 'activity',
  actionLabel,
  actionHref,
  onAction,
  variant = 'default',
  className = ''
}: EmptyStateProps) {
  const variantStyles = {
    default: {
      container: 'bg-gray-50 border-gray-200',
      icon: 'text-gray-400 bg-gray-100',
      title: 'text-gray-900',
      description: 'text-gray-600',
      button: 'bg-primary hover:bg-primary/90'
    },
    motivational: {
      container: 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200',
      icon: 'text-blue-500 bg-blue-100',
      title: 'text-gray-900',
      description: 'text-gray-700',
      button: 'bg-gradient-primary hover:opacity-90'
    },
    success: {
      container: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
      icon: 'text-green-500 bg-green-100',
      title: 'text-gray-900',
      description: 'text-gray-700',
      button: 'bg-gradient-success hover:opacity-90'
    }
  }

  const styles = variantStyles[variant]

  const ActionButton = () => {
    if (!actionLabel) return null

    const buttonContent = (
      <Button 
        className={`${styles.button} text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )

    if (actionHref) {
      return (
        <Link href={actionHref}>
          {buttonContent}
        </Link>
      )
    }

    return buttonContent
  }

  return (
    <div className={`
      ${styles.container} 
      border-2 border-dashed rounded-2xl p-12 text-center 
      animate-fadeIn transition-all duration-300 hover:shadow-md
      ${className}
    `}>
      {/* Icon */}
      <div className={`
        ${styles.icon} 
        w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6
        animate-scaleIn
      `}>
        <Icon name={iconName} size={32} />
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className={`${styles.title} text-xl font-bold mb-3`}>
          {title}
        </h3>
        <p className={`${styles.description} text-base leading-relaxed mb-8`}>
          {description}
        </p>
        
        <ActionButton />
      </div>

      {/* Decorative elements for motivational variant */}
      {variant === 'motivational' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-4 right-4 w-8 h-8 bg-blue-200/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-6 left-6 w-6 h-6 bg-purple-200/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-4 w-4 h-4 bg-indigo-200/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}
    </div>
  )
} 
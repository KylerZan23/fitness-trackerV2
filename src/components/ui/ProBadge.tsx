'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Crown } from 'lucide-react'
import { getSubscriptionTier } from '@/lib/subscription'

interface ProBadgeProps {
  userId: string
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export function ProBadge({ userId, variant = 'default', className = '' }: ProBadgeProps) {
  const [isProUser, setIsProUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkProStatus() {
      try {
        const tier = await getSubscriptionTier(userId)
        setIsProUser(tier === 'pro')
      } catch (error) {
        console.error('Error checking Pro status:', error)
        setIsProUser(false)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      checkProStatus()
    }
  }, [userId])

  // Don't render anything while loading or if not Pro user
  if (loading || !isProUser) {
    return null
  }

  const badgeContent = () => {
    switch (variant) {
      case 'icon-only':
        return <Crown className="w-3 h-3" />
      case 'compact':
        return (
          <div className="flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span className="text-xs font-medium">Pro</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span className="text-xs font-medium">Pro</span>
          </div>
        )
    }
  }

  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-gradient-to-r from-amber-100 to-yellow-100 
        text-amber-800 border-amber-200 
        hover:from-amber-200 hover:to-yellow-200
        inline-flex items-center
        ${className}
      `}
    >
      {badgeContent()}
    </Badge>
  )
}

// Server-side Pro badge checker (for server components)
export async function ProBadgeServer({ userId, variant = 'default', className = '' }: ProBadgeProps) {
  try {
    const tier = await getSubscriptionTier(userId)
    const isProUser = tier === 'pro'

    if (!isProUser) {
      return null
    }

    const badgeContent = () => {
      switch (variant) {
        case 'icon-only':
          return <Crown className="w-3 h-3" />
        case 'compact':
          return (
            <div className="flex items-center space-x-1">
              <Crown className="w-3 h-3" />
              <span className="text-xs font-medium">Pro</span>
            </div>
          )
        default:
          return (
            <div className="flex items-center space-x-1">
              <Crown className="w-3 h-3" />
              <span className="text-xs font-medium">Pro</span>
            </div>
          )
      }
    }

    return (
      <Badge 
        variant="secondary" 
        className={`
          bg-gradient-to-r from-amber-100 to-yellow-100 
          text-amber-800 border-amber-200 
          hover:from-amber-200 hover:to-yellow-200
          inline-flex items-center
          ${className}
        `}
      >
        {badgeContent()}
      </Badge>
    )
  } catch (error) {
    console.error('Error checking Pro status in server component:', error)
    return null
  }
}
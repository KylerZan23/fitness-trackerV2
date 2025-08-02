'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { checkSubscriptionStatus } from '@/app/_actions/subscriptionActions'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProgramWeekDisplay } from './ProgramWeekDisplay'
import { Lock, Crown, Star } from 'lucide-react'
import { type Week, type CompletedDayIdentifier } from '@/lib/types/program'

const supabase = createClient()

interface SubscriptionGatedWeekProps {
  week: Week
  weekIndex: number
  phaseIndex: number
  completedDays: CompletedDayIdentifier[]
  weekNumber: number
  absoluteWeekIndex: number // Global week position (0-based)
}

const TRIAL_WEEK_LIMIT = 2 // Allow first 2 weeks during trial

export function SubscriptionGatedWeek({
  week,
  weekIndex,
  phaseIndex,
  completedDays,
  weekNumber,
  absoluteWeekIndex,
}: SubscriptionGatedWeekProps) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        // Check subscription status using server action
        const subscriptionStatus = await checkSubscriptionStatus()
        
        // Allow access if:
        // 1. User has active subscription, OR
        // 2. This is within the trial week limit (0-indexed, so weeks 0 and 1 are free)
        const weekIsAccessible = subscriptionStatus.hasAccess || absoluteWeekIndex < TRIAL_WEEK_LIMIT
        
        setHasAccess(weekIsAccessible)
      } catch (error) {
        console.error('Error checking week access:', error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [absoluteWeekIndex])

  const handleUpgradeClick = () => {
    router.push(`/pricing?expired=true&feature=week ${weekNumber} training plan`)
  }

  if (isLoading) {
    return (
      <AccordionItem
        value={`week-${weekNumber}-${weekIndex}`}
        className="border-2 border-gray-200 rounded-lg px-4 transition-colors"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                Week {weekNumber}
              </Badge>
              <span className="font-medium text-gray-900">
                Loading...
              </span>
            </div>
          </div>
        </AccordionTrigger>
      </AccordionItem>
    )
  }

  // If user has access, render normally
  if (hasAccess) {
    return (
      <AccordionItem
        value={`week-${weekNumber}-${weekIndex}`}
        className="border-2 border-gray-200 rounded-lg px-4 transition-colors hover:border-blue-300"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Week {weekNumber}
              </Badge>
              <span className="font-medium text-gray-900">
                Training Week {weekIndex + 1}
              </span>
              {absoluteWeekIndex < TRIAL_WEEK_LIMIT && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                  Trial
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {week.days.length} days
              </Badge>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
          <ProgramWeekDisplay
            week={week}
            weekIndex={weekIndex}
            phaseIndex={phaseIndex}
            completedDays={completedDays}
          />
        </AccordionContent>
      </AccordionItem>
    )
  }

  // If user doesn't have access, show locked version
  return (
    <AccordionItem
      value={`week-${weekNumber}-${weekIndex}`}
      className="border-2 border-orange-200 bg-orange-50/30 rounded-lg px-4 transition-colors relative"
    >
      <AccordionTrigger 
        className="hover:no-underline py-4 cursor-default"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              Week {weekNumber}
            </Badge>
            <span className="font-medium text-gray-700">
              Training Week {weekIndex + 1}
            </span>
            <div className="flex items-center space-x-1">
              <Lock className="h-4 w-4 text-orange-600" />
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                Premium
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-orange-600" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-orange-900">Premium Content</CardTitle>
                <p className="text-sm text-orange-700">Week {weekNumber} training plan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50/50">
              <Star className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Your free trial includes access to the first {TRIAL_WEEK_LIMIT} weeks of your training program. 
                Upgrade to premium to unlock all {weekNumber}+ weeks of your personalized program.
              </AlertDescription>
            </Alert>
            
            <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-gray-900 mb-2">What you'll get with premium:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Complete {weekNumber}+ week training progression</li>
                <li>• Advanced periodization and deload weeks</li>
                <li>• Detailed exercise progressions</li>
                <li>• Neural's coaching tips for each week</li>
                <li>• Unlimited program modifications</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleUpgradeClick}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/pricing')}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  )
}
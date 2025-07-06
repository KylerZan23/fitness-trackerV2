'use client'

import { useState } from 'react'
import { Moon, Zap, CheckCircle2, AlertCircle, Battery, BatteryLow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type DailyReadinessModalProps, type DailyReadinessData } from '@/lib/types/program'

export function DailyReadinessModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting = false 
}: DailyReadinessModalProps) {
  const [selectedSleep, setSelectedSleep] = useState<DailyReadinessData['sleep'] | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<DailyReadinessData['energy'] | null>(null)

  const handleSubmit = () => {
    if (!selectedSleep || !selectedEnergy) return

    const readinessData: DailyReadinessData = {
      sleep: selectedSleep,
      energy: selectedEnergy,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      timestamp: new Date().toISOString()
    }

    onSubmit(readinessData)
  }

  const canSubmit = selectedSleep && selectedEnergy && !isSubmitting

  // Sleep quality options with icons and descriptions
  const sleepOptions = [
    {
      value: 'Poor' as const,
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Poor',
      description: 'Restless, less than 6 hours',
      color: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
    },
    {
      value: 'Average' as const,
      icon: <Moon className="w-6 h-6" />,
      title: 'Average',
      description: '6-7 hours, some interruptions',
      color: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
    },
    {
      value: 'Great' as const,
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Great',
      description: '7+ hours, restful sleep',
      color: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
    }
  ]

  // Energy level options with icons and descriptions
  const energyOptions = [
    {
      value: 'Sore/Tired' as const,
      icon: <BatteryLow className="w-6 h-6" />,
      title: 'Sore/Tired',
      description: 'Feeling fatigued or sore',
      color: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
    },
    {
      value: 'Feeling Good' as const,
      icon: <Battery className="w-6 h-6" />,
      title: 'Feeling Good',
      description: 'Normal energy levels',
      color: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
    },
    {
      value: 'Ready to Go' as const,
      icon: <Zap className="w-6 h-6" />,
      title: 'Ready to Go',
      description: 'High energy, feeling strong',
      color: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pr-8">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Daily Readiness Check
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 mt-2">
            Help your AI coach adapt today's workout to how you're feeling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sleep Quality Section */}
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Moon className="w-5 h-5 text-indigo-600" />
                <span>How was your sleep?</span>
              </CardTitle>
              <CardDescription>
                Quality sleep is crucial for recovery and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sleepOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedSleep(option.value)}
                  disabled={isSubmitting}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                    selectedSleep === option.value
                      ? `${option.color} border-current ring-2 ring-current ring-opacity-20`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${selectedSleep === option.value ? 'text-current' : 'text-gray-400'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{option.title}</div>
                      <div className={`text-sm ${selectedSleep === option.value ? 'text-current opacity-80' : 'text-gray-500'}`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Energy Level Section */}
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Zap className="w-5 h-5 text-orange-600" />
                <span>How is your energy/soreness?</span>
              </CardTitle>
              <CardDescription>
                Your current energy levels help determine workout intensity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {energyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedEnergy(option.value)}
                  disabled={isSubmitting}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                    selectedEnergy === option.value
                      ? `${option.color} border-current ring-2 ring-current ring-opacity-20`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${selectedEnergy === option.value ? 'text-current' : 'text-gray-400'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{option.title}</div>
                      <div className={`text-sm ${selectedEnergy === option.value ? 'text-current opacity-80' : 'text-gray-500'}`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between space-x-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? 'Adapting Workout...' : 'Continue to Workout'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
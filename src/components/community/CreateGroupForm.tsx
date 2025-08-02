'use client'

import { useState } from 'react'
import { createCommunityGroup } from '@/app/_actions/communityActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useReadOnlyMode, useReadOnlyGuard } from '@/contexts/ReadOnlyModeContext'

const GROUP_TYPES = [
  // Strength & Power Sports
  { value: 'Powerlifting', label: '🏆 Powerlifting' },
  { value: 'Bodybuilding', label: '🏋️‍♂️ Bodybuilding' },
  { value: 'Olympic Lifting', label: '🥇 Olympic Weightlifting' },
  { value: 'Strongman', label: '💪 Strongman Training' },
  { value: 'Calisthenics', label: '🤸‍♂️ Calisthenics' },
  
  // Endurance & Cardio
  { value: 'Running', label: '🏃‍♂️ Running' },
  { value: 'Cycling', label: '🚴‍♂️ Cycling' },
  { value: 'CrossFit', label: '🔥 CrossFit' },
  
  // Combat & Martial Arts
  { value: 'Combat Sports', label: '🥊 Boxing & Combat Sports' },
  
  // Specialized Training
  { value: 'Women\'s Health', label: '👩‍💪 Women\'s Fitness' },
  { value: 'Senior Health', label: '👴 Senior Fitness' },
  
  // Lifestyle & Wellness
  { value: 'Wellness', label: '🧘‍♀️ Yoga & Wellness' },
  { value: 'Nutrition', label: '🥗 Nutrition & Meal Prep' },
  
  // General Categories
  { value: 'General', label: '💪 General Fitness' },
  { value: 'Beginner', label: '🌟 Fitness Beginners' },
]

export function CreateGroupForm() {
  const { isReadOnlyMode } = useReadOnlyMode()
  const checkReadOnlyGuard = useReadOnlyGuard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    // Check if user is in read-only mode
    if (!checkReadOnlyGuard('create community groups')) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await createCommunityGroup(formData)
      
      if (result.success) {
        // Redirect to the new group
        if (result.data?.id) {
          router.push(`/community/${result.data.id}`)
        } else {
          router.push('/community')
        }
      } else {
        if (result.errors) {
          setFieldErrors(result.errors)
        } else {
          setError(result.error || 'Failed to create group')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating group:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Create a New Community</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                name="name"
                placeholder={isReadOnlyMode ? "Upgrade to premium to create communities..." : "Enter a name for your community..."}
                required
                minLength={3}
                maxLength={50}
                disabled={isReadOnlyMode}
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupType">Community Type</Label>
              <Select name="groupType" required disabled={isReadOnlyMode}>
                <SelectTrigger>
                  <SelectValue placeholder={isReadOnlyMode ? "Upgrade required..." : "Select a community type..."} />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.groupType && (
                <p className="text-sm text-red-600">{fieldErrors.groupType[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={isReadOnlyMode ? "Upgrade to premium to create communities..." : "Describe what your community is about, what members can expect, and any guidelines..."}
                required
                minLength={10}
                maxLength={500}
                rows={4}
                disabled={isReadOnlyMode}
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-600">{fieldErrors.description[0]}</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={isSubmitting || isReadOnlyMode}
                className="flex-1"
              >
                {isReadOnlyMode ? (
                  'Upgrade Required'
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create Community
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
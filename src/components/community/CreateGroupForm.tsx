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

const GROUP_TYPES = [
  { value: 'Strength Training', label: '💪 Strength Training' },
  { value: 'Cardio', label: '🏃‍♂️ Cardio & Running' },
  { value: 'Yoga', label: '🧘‍♀️ Yoga & Wellness' },
  { value: 'CrossFit', label: '🔥 CrossFit' },
  { value: 'Bodybuilding', label: '🏋️‍♂️ Bodybuilding' },
  { value: 'Powerlifting', label: '🏆 Powerlifting' },
  { value: 'Nutrition', label: '🥗 Nutrition & Diet' },
  { value: 'Beginner', label: '🌟 Fitness Beginners' },
  { value: 'General', label: '💪 General Fitness' },
]

export function CreateGroupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
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
                placeholder="Enter a name for your community..."
                required
                minLength={3}
                maxLength={50}
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupType">Community Type</Label>
              <Select name="groupType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a community type..." />
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
                placeholder="Describe what your community is about, what members can expect, and any guidelines..."
                required
                minLength={10}
                maxLength={500}
                rows={4}
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
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
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
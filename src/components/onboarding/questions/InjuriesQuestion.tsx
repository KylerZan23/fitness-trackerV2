import { type QuestionProps } from '../types/onboarding-flow'

export function SessionDurationQuestion({ value, onChange, error }: QuestionProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600">Session Duration Question - Coming Soon</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg'
}

export function BackButton({ 
  className = "", 
  variant = "ghost", 
  size = "sm" 
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to home page if no history
      router.push('/')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`text-gray-600 hover:text-gray-900 hover:bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm ${className}`}
      onClick={handleBack}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Button>
  )
} 
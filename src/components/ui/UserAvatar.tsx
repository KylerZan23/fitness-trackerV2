'use client'

import { useState } from 'react'
import Link from 'next/link'

interface UserAvatarProps {
  name: string
  email?: string
  size?: number
}

export function UserAvatar({ name, email, size = 8 }: UserAvatarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Generate the initials from the user's name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  
  // Generate a consistent color based on the user's name
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
  
  const avatarColor = getColorFromName(name)
  
  return (
    <div className="relative flex items-center">
      <div 
        className={`relative ${avatarColor} h-${size} w-${size} rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {initials}
      </div>
      
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 py-2 px-3 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg z-10 text-sm whitespace-nowrap animate-fadeIn">
          <div className="font-medium">{name}</div>
          {email && <div className="text-gray-400 text-xs">{email}</div>}
          <div className="flex flex-col mt-2 gap-1">
            <Link href="/dashboard" className="text-xs hover:text-white/80">Dashboard</Link>
            <Link href="/profile" className="text-xs hover:text-white/80">Profile</Link>
          </div>
        </div>
      )}
    </div>
  )
} 
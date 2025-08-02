'use client' // Needed for onClick handlers like logout

import React from 'react'
import Link from 'next/link'
import { Home, Dumbbell, User, LogOut, Calendar, TrendingUp, Users, Brain, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  userName?: string
  userEmail?: string
  profilePictureUrl?: string | null
  onLogout: () => void
  className?: string
}

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/program', label: 'My Program', icon: Calendar },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, isPro: true },
  { href: '/ai-coach', label: 'AI Coach', icon: Brain },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar({
  userName = 'User',
  userEmail,
  profilePictureUrl,
  onLogout,
  className = '',
}: SidebarProps) {
  return (
    // Fixed sidebar, light background, dark text, padding, width, hidden on small screens (md:flex)
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white text-gray-900 border-r border-gray-200 hidden md:flex flex-col ${className}`}
    >
      {/* Sidebar Content */}
      <div className="flex flex-col h-full">
        {/* Logo/User Area - Adjust border and text colors */}
        <div className="p-4 flex flex-col items-center border-b border-gray-200">
          <UserAvatar
            name={userName}
            email={userEmail}
            profilePictureUrl={profilePictureUrl}
            size={16}
          />
          <p className="font-semibold text-lg text-gray-800 mt-2">{userName}</p> {/* Darker text */}
          {userEmail && <p className="text-sm text-gray-500">{userEmail}</p>}{' '}
          {/* Lighter gray text */}
        </div>
        {/* Navigation - Adjust text and hover colors */}
        <nav className="flex-grow p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center px-3 py-2 text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 group"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />{' '}
              {/* Icon color */}
              <span className="flex-1">{item.label}</span>
              {item.isPro && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Pro
                </span>
              )}
            </Link>
          ))}
        </nav>
        <Separator className="bg-gray-200" /> {/* Lighter separator */}
        {/* Logout Button - Adjust text and hover colors */}
        <div className="p-4 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />{' '}
            {/* Icon color */}
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}

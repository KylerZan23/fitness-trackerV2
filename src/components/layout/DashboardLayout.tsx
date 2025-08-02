'use client'

import React from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarProps: React.ComponentProps<typeof Sidebar> // Pass Sidebar props through
}

export function DashboardLayout({ children, sidebarProps }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      {/* Sidebar - Fixed on desktop, hidden on mobile (can add mobile drawer later) */}
      <Sidebar {...sidebarProps} />

      {/* Main Content Area */}
      {/* Adjust left margin based on sidebar width */}
      <main className="flex-1 md:ml-64">
        {/* Enhanced padding and spacing for better typography */}
        <div className="py-8 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

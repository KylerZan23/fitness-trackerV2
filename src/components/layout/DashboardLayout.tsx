import React from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarProps: React.ComponentProps<typeof Sidebar> // Pass Sidebar props through
}

export function DashboardLayout({ children, sidebarProps }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar - Fixed on desktop, hidden on mobile (can add mobile drawer later) */}
      <Sidebar {...sidebarProps} />

      {/* Main Content Area */}
      {/* Adjust left margin based on sidebar width */}
      <main className="flex-1 md:ml-64">
        {/* Add padding to the main content area */}
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
} 
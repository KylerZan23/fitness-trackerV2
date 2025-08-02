import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Brain } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AICoachLoading() {
  const sidebarProps = {
    userName: 'Loading...',
    userEmail: '',
    profilePictureUrl: null,
    onLogout: () => {},
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="space-y-8">
        {/* Page Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
              <p className="text-gray-600 mt-1">
                Loading your personalized coaching experience...
              </p>
            </div>
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
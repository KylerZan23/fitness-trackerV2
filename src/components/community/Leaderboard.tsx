'use client'

import { useState, useEffect } from 'react'
import { getLeaderboardData, getCurrentUserRank, type LeaderboardEntry, type LeaderboardLift, type UserRankData } from '@/app/_actions/leaderboardActions'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { Crown, Dumbbell, Target, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function LeaderboardTable({ lift }: { lift: LeaderboardLift }) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<UserRankData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRankLoading, setUserRankLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [leaderboardResult, userRankResult] = await Promise.all([
          getLeaderboardData(lift),
          getCurrentUserRank(lift)
        ])
        
        if (leaderboardResult.success) {
          setData(leaderboardResult.data || [])
        } else {
          setError(leaderboardResult.error || 'Failed to load leaderboard data')
        }
        
        if (userRankResult.success) {
          setUserRank(userRankResult.data || null)
        }
        // Note: We don't set error for user rank failure as it's optional
        
      } catch (err) {
        console.error('Error fetching leaderboard data:', err)
        setError('Unable to load leaderboard data. Please try again.')
      } finally {
        setLoading(false)
        setUserRankLoading(false)
      }
    }
    fetchData()
  }, [lift])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    // Re-fetch data
    const fetchData = async () => {
      try {
        const [leaderboardResult, userRankResult] = await Promise.all([
          getLeaderboardData(lift),
          getCurrentUserRank(lift)
        ])
        
        if (leaderboardResult.success) {
          setData(leaderboardResult.data || [])
        } else {
          setError(leaderboardResult.error || 'Failed to load leaderboard data')
        }
        
        if (userRankResult.success) {
          setUserRank(userRankResult.data || null)
        }
        
      } catch (err) {
        console.error('Error fetching leaderboard data:', err)
        setError('Unable to load leaderboard data. Please try again.')
      } finally {
        setLoading(false)
        setUserRankLoading(false)
      }
    }
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* User Rank Card Skeleton */}
        <Card className="border-2 border-blue-200 bg-blue-50 animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading leaderboard data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Unable to load leaderboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* User Rank Card */}
      {!userRankLoading && userRank && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Your Rank</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  #{userRank.rank}
                </Badge>
                <span className="text-gray-600">out of {data.length} athletes</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Your Best</div>
                <div className="text-xl font-bold text-blue-600">{Math.round(userRank.best_e1rm)} kg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Rank Row - Highlighted at the bottom */}
      {!userRankLoading && userRank && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Performance</h3>
          <Table>
            <TableBody>
              <TableRow className="bg-blue-50 border-2 border-blue-200">
                <TableCell className="font-medium text-lg">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    #{userRank.rank}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name="You" profilePictureUrl={null} size={8} />
                    <span className="font-medium text-blue-700">You</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-lg text-blue-600">{Math.round(userRank.best_e1rm)}</TableCell>
                <TableCell className="text-right text-sm text-gray-600">-</TableCell>
                <TableCell className="text-right text-sm text-gray-500">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Leaderboard Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Athlete</TableHead>
            <TableHead className="text-right">Best e1RM (kg)</TableHead>
            <TableHead className="text-right">Lift</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow 
              key={entry.user_id} 
              className={`${index < 3 ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer transition-colors`}
            >
              <TableCell className="font-medium text-lg">
                {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500" /> : entry.rank}
              </TableCell>
                          <TableCell>
              <Link href={`/p/${entry.user_id}`} className="block hover:bg-gray-50 rounded-md p-1 -m-1 transition-colors">
                <div className="flex items-center space-x-3">
                  <UserAvatar name={entry.name} profilePictureUrl={entry.profile_picture_url} size={8} />
                  <span className="font-medium text-blue-600 hover:text-blue-800 transition-colors">{entry.name}</span>
                </div>
              </Link>
            </TableCell>
              <TableCell className="text-right font-bold text-lg text-indigo-600">{Math.round(entry.best_e1rm)}</TableCell>
              <TableCell className="text-right text-sm text-gray-600">{entry.weight}kg x {entry.reps}</TableCell>
              <TableCell className="text-right text-sm text-gray-500">{formatDistanceToNow(new Date(entry.lift_date), { addSuffix: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Leaderboard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="squat">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="squat"><Dumbbell className="w-4 h-4 mr-2" />Squat</TabsTrigger>
            <TabsTrigger value="bench"><Dumbbell className="w-4 h-4 mr-2" />Bench Press</TabsTrigger>
            <TabsTrigger value="deadlift"><Dumbbell className="w-4 h-4 mr-2" />Deadlift</TabsTrigger>
          </TabsList>
          <TabsContent value="squat" className="mt-4"><LeaderboardTable lift="squat" /></TabsContent>
          <TabsContent value="bench" className="mt-4"><LeaderboardTable lift="bench" /></TabsContent>
          <TabsContent value="deadlift" className="mt-4"><LeaderboardTable lift="deadlift" /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 
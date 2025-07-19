'use client'

import { useState, useEffect } from 'react'
import { 
  getLeaderboardData, 
  getCurrentUserRank, 
  getOneRMLeaderboardData,
  getUserOneRMRank,
  type LeaderboardEntry, 
  type OneRMLeaderboardEntry,
  type LeaderboardLift, 
  type LeaderboardMode,
  type UserRankData,
  type UserOneRMRankData 
} from '@/app/_actions/leaderboardActions'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { Crown, Dumbbell, Target, Loader2, AlertCircle, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { kgToLbs } from '@/lib/units'
import { supabase } from '@/lib/supabase'

function LeaderboardTable({ lift }: { lift: LeaderboardLift }) {
  const [mode, setMode] = useState<LeaderboardMode>('e1rm')
  const [e1rmData, setE1rmData] = useState<LeaderboardEntry[]>([])
  const [oneRMData, setOneRMData] = useState<OneRMLeaderboardEntry[]>([])
  const [e1rmUserRank, setE1rmUserRank] = useState<UserRankData | null>(null)
  const [oneRMUserRank, setOneRMUserRank] = useState<UserOneRMRankData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRankLoading, setUserRankLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userWeightUnit, setUserWeightUnit] = useState<'kg' | 'lbs'>('kg')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get user's weight unit preference
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('weight_unit')
            .eq('id', user.id)
            .single()
          
          if (profile?.weight_unit) {
            setUserWeightUnit(profile.weight_unit as 'kg' | 'lbs')
          }
        }
        
        // Fetch both e1RM and 1RM data in parallel
        const [e1rmResult, oneRMResult, e1rmRankResult, oneRMRankResult] = await Promise.all([
          getLeaderboardData(lift),
          getOneRMLeaderboardData(lift),
          getCurrentUserRank(lift),
          getUserOneRMRank(lift)
        ])
        
        if (e1rmResult.success) {
          setE1rmData(e1rmResult.data || [])
        } else {
          console.error('e1RM leaderboard error:', e1rmResult.error)
        }

        if (oneRMResult.success) {
          setOneRMData(oneRMResult.data || [])
        } else {
          console.error('1RM leaderboard error:', oneRMResult.error)
        }
        
        if (e1rmRankResult.success) {
          setE1rmUserRank(e1rmRankResult.data || null)
        }

        if (oneRMRankResult.success) {
          setOneRMUserRank(oneRMRankResult.data || null)
        }

        // Set error only if both fail
        if (!e1rmResult.success && !oneRMResult.success) {
          setError('Failed to load leaderboard data')
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
  }, [lift])

  // Helper functions for unit conversion
  const convertWeight = (weightInKg: number): number => {
    return userWeightUnit === 'lbs' ? kgToLbs(weightInKg) : weightInKg
  }

  const formatWeight = (weightInKg: number): string => {
    const convertedWeight = convertWeight(weightInKg)
    return `${Math.round(convertedWeight)} ${userWeightUnit}`
  }

  const formatValue = (valueInKg: number): string => {
    const convertedValue = convertWeight(valueInKg)
    return `${Math.round(convertedValue)}`
  }

  const getUnitLabel = (): string => {
    return userWeightUnit
  }

  const getModeLabel = (): string => {
    return mode === 'e1rm' ? 'e1RM' : '1RM'
  }

  const currentData = mode === 'e1rm' ? e1rmData : oneRMData
  const currentUserRank = mode === 'e1rm' ? e1rmUserRank : oneRMUserRank

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    // Re-fetch data
    const fetchData = async () => {
      try {
        // Get user's weight unit preference
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('weight_unit')
            .eq('id', user.id)
            .single()
          
          if (profile?.weight_unit) {
            setUserWeightUnit(profile.weight_unit as 'kg' | 'lbs')
          }
        }
        
        const [e1rmResult, oneRMResult, e1rmRankResult, oneRMRankResult] = await Promise.all([
          getLeaderboardData(lift),
          getOneRMLeaderboardData(lift),
          getCurrentUserRank(lift),
          getUserOneRMRank(lift)
        ])
        
        if (e1rmResult.success) {
          setE1rmData(e1rmResult.data || [])
        }

        if (oneRMResult.success) {
          setOneRMData(oneRMResult.data || [])
        }
        
        if (e1rmRankResult.success) {
          setE1rmUserRank(e1rmRankResult.data || null)
        }

        if (oneRMRankResult.success) {
          setOneRMUserRank(oneRMRankResult.data || null)
        }

        if (!e1rmResult.success && !oneRMResult.success) {
          setError('Failed to load leaderboard data')
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
      {/* Mode Toggle */}
      <div className="flex items-center justify-center space-x-2 p-2 bg-gray-50 rounded-lg">
        <span className={`text-sm font-medium ${mode === 'e1rm' ? 'text-blue-600' : 'text-gray-500'}`}>
          e1RM (Calculated)
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode(mode === 'e1rm' ? '1rm' : 'e1rm')}
          className="p-1 h-8 w-12"
        >
          {mode === 'e1rm' ? (
            <ToggleLeft className="h-6 w-6 text-blue-600" />
          ) : (
            <ToggleRight className="h-6 w-6 text-green-600" />
          )}
        </Button>
        <span className={`text-sm font-medium ${mode === '1rm' ? 'text-green-600' : 'text-gray-500'}`}>
          1RM (Tested Only)
        </span>
      </div>

      {/* User Rank Card */}
      {!userRankLoading && currentUserRank && (
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
                  #{currentUserRank.rank}
                </Badge>
                <span className="text-gray-600">out of {currentData.length} athletes</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Your Best</div>
                <div className="text-xl font-bold text-blue-600">
                  {mode === 'e1rm' 
                    ? formatValue((currentUserRank as UserRankData).best_e1rm)
                    : formatValue((currentUserRank as UserOneRMRankData).one_rm_value)
                  } {getUnitLabel()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Rank Row - Highlighted at the bottom */}
      {!userRankLoading && currentUserRank && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Performance</h3>
          <Table>
            <TableBody>
              <TableRow className="bg-blue-50 border-2 border-blue-200">
                <TableCell className="font-medium text-lg">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    #{currentUserRank.rank}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name="You" profilePictureUrl={null} size={8} />
                    <span className="font-medium text-blue-700">You</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-lg text-blue-600">
                  {mode === 'e1rm' 
                    ? formatValue((currentUserRank as UserRankData).best_e1rm)
                    : formatValue((currentUserRank as UserOneRMRankData).one_rm_value)
                  }
                </TableCell>
                <TableCell className="text-right text-sm text-gray-600">
                  {mode === '1rm' ? 'Tested' : '-'}
                </TableCell>
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
            <TableHead className="text-right">Best {getModeLabel()} ({getUnitLabel()})</TableHead>
            <TableHead className="text-right">
              {mode === 'e1rm' ? 'Lift' : 'Assessment'}
            </TableHead>
            <TableHead className="text-right">
              {mode === 'e1rm' ? 'Date' : 'Verified'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((entry, index) => (
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
                    <UserAvatar name={entry.name} profilePictureUrl={entry.profile_picture_url} size={8} disableTooltipLinks />
                    <span className="font-medium text-blue-600 hover:text-blue-800 transition-colors">{entry.name}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right font-bold text-lg text-indigo-600">
                {mode === 'e1rm' 
                  ? formatValue((entry as LeaderboardEntry).best_e1rm)
                  : formatValue((entry as OneRMLeaderboardEntry).one_rm_value)
                }
              </TableCell>
              <TableCell className="text-right text-sm text-gray-600">
                {mode === 'e1rm' 
                  ? `${formatWeight((entry as LeaderboardEntry).weight)} x ${(entry as LeaderboardEntry).reps}`
                  : 'Tested'
                }
              </TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {mode === 'e1rm' 
                  ? formatDistanceToNow(new Date((entry as LeaderboardEntry).lift_date), { addSuffix: true })
                  : 'Tested'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {currentData.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            No {mode === 'e1rm' ? 'workout data' : 'tested 1RM data'} available for this lift.
            {mode === '1rm' && (
              <div className="mt-2 text-sm">
                Complete your onboarding with actual tested 1RM values to appear here!
                <br />
                <span className="text-xs text-gray-400">
                  (Estimated 1RM values are shown in the e1RM leaderboard)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
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
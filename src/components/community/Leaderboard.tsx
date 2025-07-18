'use client'

import { useState, useEffect } from 'react'
import { getLeaderboardData, type LeaderboardEntry, type LeaderboardLift } from '@/app/_actions/leaderboardActions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { Crown, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

function LeaderboardTable({ lift }: { lift: LeaderboardLift }) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getLeaderboardData(lift)
      if (result.success) {
        setData(result.data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [lift])

  if (loading) return <div>Loading leaderboard...</div>

  return (
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
          <TableRow key={entry.user_id} className={index < 3 ? 'bg-yellow-50' : ''}>
            <TableCell className="font-medium text-lg">
              {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500" /> : entry.rank}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3">
                <UserAvatar name={entry.name} profilePictureUrl={entry.profile_picture_url} size={8} />
                <span className="font-medium">{entry.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-bold text-lg text-indigo-600">{Math.round(entry.best_e1rm)}</TableCell>
            <TableCell className="text-right text-sm text-gray-600">{entry.weight}kg x {entry.reps}</TableCell>
            <TableCell className="text-right text-sm text-gray-500">{formatDistanceToNow(new Date(entry.lift_date), { addSuffix: true })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
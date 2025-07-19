'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { voteOnPost, getPostVoteCounts, getUserVoteOnPost } from '@/app/_actions/communityActions'
import { useRouter } from 'next/navigation'

interface VoteButtonsProps {
  postId: string
  className?: string
}

interface VoteCounts {
  upvotes: number
  downvotes: number
  totalVotes: number
}

export function VoteButtons({ postId, className = '' }: VoteButtonsProps) {
  const [counts, setCounts] = useState<VoteCounts>({ upvotes: 0, downvotes: 0, totalVotes: 0 })
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const router = useRouter()

  // Load initial vote data
  useEffect(() => {
    const loadVoteData = async () => {
      try {
        const [countsResult, userVoteResult] = await Promise.all([
          getPostVoteCounts(postId),
          getUserVoteOnPost(postId)
        ])

        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }

        if (userVoteResult.success) {
          setUserVote(userVoteResult.data)
        }
      } catch (error) {
        console.error('Error loading vote data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVoteData()
  }, [postId])

  const handleVote = async (voteType: 'up' | 'down') => {
    setIsVoting(true)

    try {
      const formData = new FormData()
      formData.append('postId', postId)
      formData.append('voteType', voteType)

      const result = await voteOnPost(formData)

      if (result.success) {
        // Refresh vote data
        const [countsResult, userVoteResult] = await Promise.all([
          getPostVoteCounts(postId),
          getUserVoteOnPost(postId)
        ])

        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }

        if (userVoteResult.success) {
          setUserVote(userVoteResult.data)
        }

        // Optionally refresh the page to update other components
        router.refresh()
      } else {
        console.error('Vote failed:', result.error)
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Thumbs Up Button */}
      <Button
        variant={userVote === 'up' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={`flex items-center space-x-1 transition-colors ${
          userVote === 'up' 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{counts.upvotes}</span>
      </Button>

      {/* Thumbs Down Button */}
      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={`flex items-center space-x-1 transition-colors ${
          userVote === 'down' 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{counts.downvotes}</span>
      </Button>

      {/* Vote Score (optional - shows net score) */}
      {counts.totalVotes > 0 && (
        <span className="text-sm text-gray-500 ml-2">
          {counts.upvotes - counts.downvotes > 0 && '+'}
          {counts.upvotes - counts.downvotes}
        </span>
      )}
    </div>
  )
} 
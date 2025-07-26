'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserSearchCard } from './UserSearchCard'
import { searchUsers, type FollowerProfile } from '@/app/_actions/followActions'

interface UserSearchBarProps {
  placeholder?: string
  className?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function UserSearchBar({ placeholder = "Search for people to follow...", className = "" }: UserSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FollowerProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const result = await searchUsers(query.trim(), 10)
      
      if (result.success && result.data) {
        setSearchResults(result.data)
      } else {
        setError(result.error || 'Failed to search users')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('An unexpected error occurred')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm, performSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsExpanded(value.length > 0)
  }

  const handleClear = () => {
    setSearchTerm('')
    setSearchResults([])
    setIsExpanded(false)
    setError(null)
  }

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update the local state to reflect the follow change
    setSearchResults(prev => 
      prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              followers_count: isFollowing 
                ? user.followers_count + 1 
                : Math.max(0, user.followers_count - 1)
            }
          : user
      )
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            className="pl-10 pr-10 py-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
          />
          {searchTerm && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="text-red-600 text-sm">{error}</div>
                <Button
                  onClick={() => performSearch(searchTerm)}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  Try again
                </Button>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-2 space-y-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                  {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                </div>
                {searchResults.map((user) => (
                  <UserSearchCard
                    key={user.id}
                    user={user}
                    onFollowChange={handleFollowChange}
                  />
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">No users found for "{searchTerm}"</p>
                <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
} 
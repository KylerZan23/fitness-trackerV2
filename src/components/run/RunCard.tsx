/**
 * Run Card Component
 * ------------------------------------------------
 * This component displays a Strava-like card for a run activity
 */

import { useState } from 'react';
import { RunMap } from './RunMap';
import { formatDistanceMiles, formatElevation, calculatePace } from '@/lib/units';
import Link from 'next/link';

interface SegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  achievement_count?: number;
  pr_rank?: number | null;
}

interface User {
  name: string;
  location?: string;
  imageUrl?: string;
}

interface RunCardProps {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain: number; // in meters
  start_date: string;
  start_date_local: string;
  polyline?: string;
  segment_efforts?: SegmentEffort[];
  user: User;
  className?: string;
}

export function RunCard({ 
  id,
  name,
  distance,
  moving_time,
  elapsed_time,
  total_elevation_gain,
  start_date_local,
  polyline,
  segment_efforts = [],
  user,
  className = ""
}: RunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Format date to readable format (Mar 16, 2025)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get time of day (5:16 PM)
  const formatTimeOfDay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get location if available (default to "Run" if not)
  const getLocation = (): string => {
    return user.location ?? '';
  };

  // Format achievements for display
  const getAchievements = (): number => {
    if (!segment_efforts) return 0;
    return segment_efforts.reduce((count, effort) => {
      return count + (effort.achievement_count ?? 0);
    }, 0);
  };

  // Format user's initial for avatar fallback
  const getUserInitial = (): string => {
    return user.name ? user.name.charAt(0).toUpperCase() : '?';
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 ${className}`}>
      {/* User Info Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              getUserInitial()
            )}
          </div>
          <div className="ml-3">
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">
              {formatDate(start_date_local)} at {formatTimeOfDay(start_date_local)}
              {getLocation() && ` • ${getLocation()}`}
            </div>
          </div>
        </div>
      </div>
      
      {/* Run Title */}
      <div className="p-4 pb-2">
        <h2 className="text-2xl font-serif">{name}</h2>
      </div>
      
      {/* Run Stats */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-500">Distance</div>
          <div className="text-xl font-medium">{formatDistanceMiles(distance)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Pace</div>
          <div className="text-xl font-medium">{calculatePace(distance, moving_time)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Time</div>
          <div className="text-xl font-medium">{formatTime(moving_time)}</div>
        </div>
      </div>
      
      {/* Map */}
      {polyline && (
        <RunMap 
          polyline={polyline} 
          height={isExpanded ? "400px" : "200px"}
        />
      )}
      
      {/* Segments and Achievements (if available) */}
      {segment_efforts && segment_efforts.length > 0 && (
        <div className="p-4 border-t border-white/10">
          {/* Only show one segment in collapsed view */}
          {!isExpanded && segment_efforts.slice(0, 1).map(effort => (
            <div key={effort.id} className="flex items-center mb-2">
              <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 3.75A.75.75 0 016.75 3h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 3.75zM6 8.25a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zM5.75 12a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">{effort.name}</div>
                <div className="text-sm text-gray-500">{formatTime(effort.elapsed_time)} {effort.pr_rank === 1 && '• PR'}</div>
              </div>
            </div>
          ))}
          
          {/* Show all segments in expanded view */}
          {isExpanded && segment_efforts.map(effort => (
            <div key={effort.id} className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 3.75A.75.75 0 016.75 3h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 3.75zM6 8.25a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zM5.75 12a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">{effort.name}</div>
                <div className="text-sm text-gray-500">{formatTime(effort.elapsed_time)}</div>
              </div>
              {effort.pr_rank === 1 && (
                <div className="ml-auto bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                  PR
                </div>
              )}
            </div>
          ))}
          
          {/* Show expand/collapse button if there are multiple segments */}
          {segment_efforts.length > 1 && (
            <button 
              onClick={toggleExpanded}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              {isExpanded ? 'Collapse' : `Show all segments (${segment_efforts.length})`}
            </button>
          )}
        </div>
      )}
      
      {/* Achievements Summary */}
      {getAchievements() > 0 && (
        <div className="p-4 border-t border-white/10 flex items-center">
          <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 3zm0 12a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm9-9a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0119 6zM3 7.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5H3zm14.25 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm-8.5 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm.75-6a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="font-medium">
            {getAchievements()} Achievement{getAchievements() !== 1 ? 's' : ''}
          </div>
        </div>
      )}
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 flex justify-between">
        <Link 
          href={`/run-logger?runId=${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          View Details
        </Link>
        <button
          onClick={toggleExpanded}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    </div>
  );
} 
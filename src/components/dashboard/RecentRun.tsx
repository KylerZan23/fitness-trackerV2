/**
 * Recent Run Component
 * ------------------------------------------------
 * Displays the user's most recent run on the dashboard
 */

import { useState, useEffect } from 'react';
import { getStravaActivities } from '@/lib/strava';
import { getTokensFromDatabase } from '@/lib/strava-token-store';
import { RunCard } from '@/components/run/RunCard';
import Link from 'next/link';

interface RecentRunProps {
  userId: string;
}

interface Run {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain: number; // in meters
  start_date: string;
  start_date_local: string;
  type: string;
  average_speed: number; // meters/second
  max_speed: number; // meters/second
  map?: {
    id: string;
    summary_polyline: string;
  };
  segment_efforts?: Array<{
    id: number;
    name: string;
    elapsed_time: number;
    achievement_count?: number;
    pr_rank?: number | null;
  }>;
}

export function RecentRun({ userId }: RecentRunProps) {
  const [recentRun, setRecentRun] = useState<Run | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get user info from local storage or hardcode for demo
  const userInfo = {
    name: 'Kyler Zanuck',
    location: 'Los Angeles, California'
  };
  
  useEffect(() => {
    async function fetchRecentRun() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get tokens from database
        const tokens = await getTokensFromDatabase(userId);
        
        if (!tokens) {
          setError('No Strava tokens found');
          return;
        }
        
        // Fetch activities (only runs) - limit to 1
        const activities = await getStravaActivities(tokens, 1, 1);
        const runActivities = activities.filter(activity => activity.type === 'Run');
        
        if (runActivities.length > 0) {
          setRecentRun(runActivities[0]);
        }
      } catch (err) {
        console.error('Error fetching recent run:', err);
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? String(err.message) 
          : 'An error occurred while fetching recent run';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecentRun();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white/70">Loading your recent run...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-serif mb-4">Your Recent Run</h3>
        <p className="text-gray-400 text-center py-2">
          Connect your Strava account to see your recent runs here.
        </p>
        <div className="mt-4 text-center">
          <Link 
            href="/run-logger"
            className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Go to Run Logger
          </Link>
        </div>
      </div>
    );
  }
  
  if (!recentRun) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-serif mb-4">Your Recent Run</h3>
        <p className="text-gray-400 text-center py-2">
          No recent runs found. Track your first run to see it here!
        </p>
        <div className="mt-4 text-center">
          <Link 
            href="/run-logger"
            className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Log a Run
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif">Your Recent Run</h3>
        <Link 
          href="/run-logger"
          className="text-sm text-white/60 hover:text-white"
        >
          View All Runs
        </Link>
      </div>
      
      <RunCard 
        id={recentRun.id}
        name={recentRun.name}
        distance={recentRun.distance}
        moving_time={recentRun.moving_time}
        elapsed_time={recentRun.elapsed_time}
        total_elevation_gain={recentRun.total_elevation_gain}
        start_date={recentRun.start_date}
        start_date_local={recentRun.start_date_local}
        polyline={recentRun.map?.summary_polyline}
        user={userInfo}
      />
    </div>
  );
} 
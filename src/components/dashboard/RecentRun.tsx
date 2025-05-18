/**
 * Recent Run Component
 * ------------------------------------------------
 * Displays the user's most recent run on the dashboard
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Correct: Import the initialized browser client
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
        
        // const supabase = createClient(); // No longer needed, supabase is imported directly
        // Get tokens from database
        const tokens = await getTokensFromDatabase(supabase, userId);
        
        if (!tokens) {
          // setError('No Strava tokens found. Please connect Strava in the Run Logger.'); // More specific error
          // For now, let's make it a bit more generic for the dashboard view
          setError('Connect Strava to see recent runs.');
          setRecentRun(null); // Ensure no old run is shown
          return;
        }
        
        // Fetch activities (only runs) - limit to 1
        const activities = await getStravaActivities(tokens, 1, 1);
        const runActivities = activities.filter(activity => activity.type === 'Run');
        
        if (runActivities.length > 0) {
          setRecentRun(runActivities[0]);
        } else {
          setRecentRun(null); // Explicitly set to null if no runs found
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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-500">Loading your recent run...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Recent Run</h3>
        <p className="text-sm text-gray-500 mb-3">{error}</p>
        <Link 
          href="/run-logger"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Go to Run Logger
        </Link>
      </div>
    );
  }
  
  if (!recentRun) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Recent Run</h3>
        <p className="text-sm text-gray-500 mb-3">
          No recent runs found. Track your first run to see it here!
        </p>
        <Link 
          href="/log-run" // Changed from /run-logger to /log-run as it seems more direct for logging
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Log a Run
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-700">Your Recent Run</h3>
        <Link 
          href="/run-logger"
          className="text-sm text-primary hover:text-primary/80 font-medium"
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
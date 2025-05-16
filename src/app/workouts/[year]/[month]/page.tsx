'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWorkoutsForMonth, getUserProfile, HistoricalWorkout } from '@/lib/db'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'

// Helper functions for calendar generation (can be moved to utils)
const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const monthNamesFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get day of week (0=Sun, 1=Mon...) adjusting to start week on Monday (0=Mon, 6=Sun)
function getDayOfWeekMondayStart(date: Date): number {
    const day = date.getDay();
    return (day === 0) ? 6 : day - 1;
}

// Helper to format run details
function formatRunDetails(workout: HistoricalWorkout, units: 'metric' | 'imperial' = 'metric'): string[] {
  const details = [];
  let distanceDisplay: string;
  let paceDisplay: string;
  const durationMin = workout.duration;

  if (units === 'imperial') {
    const distanceMiles = workout.distance ? (workout.distance / 1609.34).toFixed(2) : '0.00';
    distanceDisplay = `${distanceMiles} mi`;
    details.push(distanceDisplay);
    details.push(`${durationMin} min`);

    if (workout.distance && workout.distance > 0 && durationMin && durationMin > 0) {
      const paceMinPerMile = durationMin / (workout.distance / 1609.34);
      const paceMinutes = Math.floor(paceMinPerMile);
      const paceSeconds = Math.round((paceMinPerMile - paceMinutes) * 60);
      paceDisplay = `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}" /mi`;
      details.push(paceDisplay);
    } else {
      details.push('N/A pace');
    }
  } else { // Metric (default)
    const distanceKm = workout.distance ? (workout.distance / 1000).toFixed(2) : '0.00';
    distanceDisplay = `${distanceKm} km`;
    details.push(distanceDisplay);
    details.push(`${durationMin} min`);

    if (workout.distance && workout.distance > 0 && durationMin && durationMin > 0) {
      const paceMinPerKm = durationMin / (workout.distance / 1000);
      const paceMinutes = Math.floor(paceMinPerKm);
      const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
      paceDisplay = `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}" /km`;
      details.push(paceDisplay);
    } else {
      details.push('N/A pace');
    }
  }
  return details;
}

interface MonthlyWorkoutsPageParams {
  year: string;
  month: string;
}

export default function MonthlyWorkoutsPage({ params }: { params: Promise<MonthlyWorkoutsPageParams> }) {
  const resolvedParams = use(params); // params is the promise, use() unwraps it.
  // Keep the original string params by destructuring from the unwrapped object
  const { year: yearString, month: monthString } = resolvedParams; // Use resolvedParams

  const router = useRouter();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null);
  const [workouts, setWorkouts] = useState<HistoricalWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("Loading..."); // State for title

  // Validate and set title effect (uses destructured strings)
  useEffect(() => {
    const yearNum = parseInt(yearString, 10);
    const monthNum = parseInt(monthString, 10);
    const isValid = !isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 0 && monthNum <= 11;

    if (isValid) {
      setPageTitle(`${monthNamesFull[monthNum]} ${yearNum}`);
    } else {
      setPageTitle("Invalid Date");
      setError("Invalid year or month provided in URL.");
      setIsLoading(false); // Stop loading if params are invalid
    }
  }, [yearString, monthString]);

  // Fetch Profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Don't set page error for profile fetch unless critical
      }
    }
    fetchProfile();
  }, []);

  // Fetch Workouts for the specific month (uses destructured strings)
  useEffect(() => {
    // Parse and validate inside the effect
    const year = parseInt(yearString, 10);
    const monthIndex = parseInt(monthString, 10);
    const isValidParams = !isNaN(year) && !isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11;

    if (!isValidParams) {
      // Error already set by the title validation effect
      return; 
    }

    // Only proceed if loading state is still true (avoid refetch on profile load etc.)
    if (!isLoading) return;

    async function fetchMonthlyWorkouts() {
      // setLoading(true) // Already true initially
      setError(null); // Clear previous errors
      try {
        const data = await getWorkoutsForMonth(year, monthIndex);
        setWorkouts(data);
        console.log(`Fetched ${data.length} workouts for ${year}-${monthIndex + 1}`);
      } catch (err) {
        console.error(`Error fetching workouts for ${year}-${monthIndex + 1}:`, err);
        setError('Failed to load workout data for this month.');
        setWorkouts([]);
      } finally {
        // Only set loading to false if this effect actually ran the fetch
        setIsLoading(false);
      }
    }
    fetchMonthlyWorkouts();
  }, [yearString, monthString, isLoading]); // Depend on string params and isLoading

  // Group workouts by day for easy lookup
   const workoutsByDay = useMemo(() => {
     const map = new Map<number, HistoricalWorkout[]>();
     workouts.forEach(w => {
       try {
         const day = new Date(w.created_at).getDate(); // 1-31
         if (!map.has(day)) {
           map.set(day, []);
         }
         map.get(day)?.push(w);
       } catch (e) {
         console.error(`Error processing date for workout ${w.id}: ${w.created_at}`);
       }
     });
     return map;
   }, [workouts]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out.');
    }
  };

  // Prepare sidebar props
  const sidebarProps = profile
    ? {
        userName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
        userEmail: profile.email,
        profilePictureUrl: profile.profile_picture_url,
        onLogout: handleLogout,
      }
    : {
        userName: 'Loading...',
        userEmail: '',
        profilePictureUrl: null,
        onLogout: handleLogout,
      };

   // --- Calendar Grid Logic --- //
   const year = parseInt(yearString, 10);        // Parse again for render logic
   const monthIndex = parseInt(monthString, 10); // Parse again for render logic
   const isValidParams = !isNaN(year) && !isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11;

   const calendarCells = useMemo(() => {
       if (!isValidParams) return [];

       const daysInCurrentMonth = getDaysInMonth(year, monthIndex);
       const firstDayOfMonth = new Date(year, monthIndex, 1);
       const startingDayOfWeek = getDayOfWeekMondayStart(firstDayOfMonth);
       const cells = [];

       // Padding start
       for (let i = 0; i < startingDayOfWeek; i++) {
           cells.push(<div key={`pad-start-${i}`} className="border-b border-r border-gray-100 h-32 bg-gray-50"></div>);
       }
       // Day cells
       for (let day = 1; day <= daysInCurrentMonth; day++) {
           const dailyWorkouts = workoutsByDay.get(day) || [];
           cells.push(
               <div key={`day-${day}`} className="border-b border-r border-gray-200 h-32 p-2 relative flex flex-col bg-white">
                   <span className="text-xs font-semibold text-gray-600">{day}</span>
                   <div className="mt-1 flex-grow overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-white">
                       {/* Placeholder workout display */}
                       {dailyWorkouts.map(w => {
                           const isRun = w.type === 'run';
                           const bgColor = isRun ? 'bg-sky-100' : 'bg-green-100';
                           const textColor = isRun ? 'text-sky-800' : 'text-green-800';
                           const borderColor = isRun ? 'border-sky-300' : 'border-green-300';

                           if (isRun) {
                             // Assuming profile.preferred_units is 'metric' | 'imperial' or defaults to metric
                             // const unitPref = profile?.preferred_units === 'imperial' ? 'imperial' : 'metric';
                             const unitPref = profile?.weight_unit === 'lbs' ? 'imperial' : 'metric';
                             const runDetails = formatRunDetails(w, unitPref);
                             return (
                               <div 
                                 key={w.id} 
                                 title={`${w.exerciseName} - ${runDetails.join(', ')}`}
                                 className={`text-[10px] ${bgColor} ${textColor} p-1.5 rounded border ${borderColor} leading-tight flex flex-col space-y-0.5`}>
                                 <strong className="truncate">{w.exerciseName}</strong>
                                 {runDetails.map((detail, index) => (
                                   <span key={index} className="text-[9px]">{detail}</span>
                                 ))}
                               </div>
                             );
                           } else {
                             return (
                               <div 
                                 key={w.id} 
                                 title={`${w.exerciseName} (${w.duration}m - ${w.type})`} 
                                 className={`text-[10px] ${bgColor} ${textColor} p-1 rounded truncate leading-tight border ${borderColor}`}>
                                 {w.exerciseName}
                               </div>
                             );
                           }
                       })}
                   </div>
               </div>
           );
       }
       // Padding end
       const totalCells = startingDayOfWeek + daysInCurrentMonth;
       const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
       for (let i = 0; i < remainingCells; i++) {
           cells.push(<div key={`pad-end-${i}`} className="border-b border-r border-gray-100 h-32 bg-gray-50"></div>);
       }
       return cells;
   // Recalculate grid only if params or workout data change
   }, [isValidParams, year, monthIndex, workoutsByDay]);

  // --- Render --- //

  if (!isValidParams && !isLoading) {
      return (
          <DashboardLayout sidebarProps={sidebarProps}>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <h1 className="text-2xl font-semibold mb-4 text-destructive">{pageTitle}</h1>
              <p className="text-destructive mb-4">{error}</p>
              <Link href="/workouts">
                <Button variant="outline">Back to Workout History</Button>
              </Link>
            </div>
          </DashboardLayout>
      );
  }

  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))] ">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
           <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Month</h1>
           <p className="text-destructive mb-4">{error}</p>
           <Button onClick={() => window.location.reload()}>Try Again</Button>
           <Link href="/workouts" className="ml-2">
             <Button variant="outline">Back to Workout History</Button>
           </Link>
        </div>
     </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
        {/* TODO: Add Prev/Next Month Buttons */} 
        <Link href="/workouts">
          <Button variant="outline" size="sm">Back to Yearly View</Button>
        </Link>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-gray-200">
        {/* Header */}
        {daysOfWeek.map(day => (
            <div key={day} className="text-center p-2 text-xs font-medium text-gray-500 uppercase border-b border-r border-gray-200 bg-gray-50">{day}</div>
        ))}
        {/* Cells */}
        {calendarCells}
      </div>
    </DashboardLayout>
  );
} 
'use client'

import React from 'react'
import Link from 'next/link'
import { HistoricalWorkout } from '@/lib/db'

interface MonthLogCardProps {
  monthName: string;
  year: number;
  workouts: HistoricalWorkout[];
  totalDurationHours: number;
  maxDurationMinutes?: number; // Optional prop to control height scaling, defaults to 120
}

// Helper to get days in a month
function getDaysInMonth(year: number, monthIndex: number): number {
  // Month index is 0-based, Date uses 1-based day, setting day to 0 gets the last day of the previous month
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function MonthLogCard({
  monthName,
  year,
  workouts,
  totalDurationHours,
  maxDurationMinutes = 120 // Default max duration for 100% height
}: MonthLogCardProps) {

  // console.log(`MonthLogCard for ${monthName} ${year} received workouts:`, workouts);

  const monthIndex = new Date(Date.parse(monthName +" 1, "+ year)).getMonth(); // Get month index (0-11)
  const daysInMonth = getDaysInMonth(year, monthIndex);

  // Construct the link href
  const href = `/workouts/${year}/${monthIndex}`;

  return (
    // Wrap the div with Link
    <Link href={href} className="block group">
      {/* Add group class to Link, remove hover from div if handled by Link */}
      <div className="bg-gray-50 p-4 h-48 relative flex flex-col justify-between group-hover:shadow-md transition-shadow duration-150">
        {/* Top Left: Total Duration - Increased number size, adjusted label */}
        <div className="absolute top-4 left-4 z-10">
          <p className="text-4xl font-bold text-gray-800 group-hover:text-indigo-600">{totalDurationHours}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-light">HOURS</p>
        </div>

        {/* Top Right: Month Name - Adjusted styling */}
        <p className="absolute top-4 right-4 text-sm font-medium text-gray-400 uppercase z-10 group-hover:text-indigo-600">{monthName}</p>

        {/* Bottom Area: Activity Bars Container - Removed top border, adjusted height */}
        <div className="mt-auto h-2/5 pt-2 flex items-end overflow-hidden relative">
          {workouts.length === 0 ? (
            <p className="text-xs text-gray-400 w-full text-center self-center">No workouts logged.</p>
          ) : (
            workouts.map(workout => {
              // console.log(`Workout ID: ${workout.id}, Type: ${workout.type}, Original created_at: ${workout.created_at}`);
              // const workoutDateForLog = new Date(workout.created_at); // Renamed to avoid conflict in subsequent code
              // console.log(`For ${workout.id}: workoutDate.getFullYear() = ${workoutDateForLog.getFullYear()}, card year = ${year}`);
              // console.log(`For ${workout.id}: workoutDate.getMonth() = ${workoutDateForLog.getMonth()}, card monthIndex = ${monthIndex}`);
              // console.log(`For ${workout.id}: isNaN = ${isNaN(workoutDateForLog.getTime())}`);
              // console.log(`For ${workout.id}: Year Match = ${workoutDateForLog.getFullYear() === year}`);
              // console.log(`For ${workout.id}: Month Match = ${workoutDateForLog.getMonth() === monthIndex}`);

              let dayOfMonth = 1;
              let barHeightPercent = 0;
              try {
                const workoutDate = new Date(workout.created_at); // Changed workoutDateForLog back to workoutDate
                if (isNaN(workoutDate.getTime()) || workoutDate.getFullYear() !== year || workoutDate.getMonth() !== monthIndex) {
                   console.warn(`Workout ${workout.id} date ${workout.created_at} outside expected range ${year}-${monthIndex}. Skipping bar.`);
                   return null; 
                }
                dayOfMonth = workoutDate.getDate(); // 1-31
                barHeightPercent = Math.max(5, Math.min(100, (workout.duration / maxDurationMinutes) * 100)); // Ensure min height 5%
              } catch (e) {
                console.error(`Error processing date for workout ${workout.id}: ${workout.created_at}`, e);
                return null; 
              }

              const barLeftPercent = ((dayOfMonth - 1) / daysInMonth) * 100;

              // Determine bar color based on workout type
              const barColor = workout.type === 'run' 
                ? 'bg-sky-500 group-hover:bg-sky-600' // Changed to sky blue for better visibility
                : 'bg-gray-800 group-hover:bg-gray-900'; // Darker gray for lifts for contrast

              return (
                <div
                  key={workout.id}
                  className={`absolute bottom-0 ${barColor} transition-colors duration-150`}
                  style={{
                    left: `${barLeftPercent}%`,
                    height: `${barHeightPercent}%`,
                    width: `max(3px, ${100 / daysInMonth}%)`, // Simpler width, relative to days, min 3px
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </Link>
  );
} 
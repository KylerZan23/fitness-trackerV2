import React from 'react';
import { WeeklyMuscleComparisonItem } from '@/lib/db'; 
import { MuscleGroup } from '@/lib/types'; // Corrected import path for MuscleGroup
import { MuscleComparisonCard } from './MuscleComparisonCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'; // Added Chevron icons
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'; // Core date-fns functions
import { format as formatWithTz, toZonedTime } from 'date-fns-tz'; // Timezone specific functions

interface WeeklyComparisonProps {
  data: WeeklyMuscleComparisonItem[] | null;
  isLoading: boolean;
  error: string | null;
  weekOffset: number; // New prop
  userTimezone: string; // New prop
  onPreviousWeek: () => void; // New prop
  onNextWeek: () => void; // New prop
}

// Helper function to format the date range for the comparison title
function formatComparisonDateRange(weekOffset: number, userTimezone: string): string {
  const baseDate = subWeeks(new Date(), weekOffset);
  const baseDateInUserTz = toZonedTime(baseDate, userTimezone);
  
  const targetWeekStart = startOfWeek(baseDateInUserTz, { weekStartsOn: 1 });
  const targetWeekEnd = endOfWeek(baseDateInUserTz, { weekStartsOn: 1 });

  const startMonth = formatWithTz(targetWeekStart, 'MMM', { timeZone: userTimezone });
  const endMonth = formatWithTz(targetWeekEnd, 'MMM', { timeZone: userTimezone });
  const startDay = formatWithTz(targetWeekStart, 'd', { timeZone: userTimezone });
  const endDay = formatWithTz(targetWeekEnd, 'd', { timeZone: userTimezone });
  const year = formatWithTz(targetWeekStart, 'yyyy', { timeZone: userTimezone });

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

// Helper function for Key Insights
function generateKeyInsights(data: WeeklyMuscleComparisonItem[]): string[] {
  const insights: string[] = [];
  if (!data || data.length === 0) return insights;

  const significantIncrease = [...data]
    .filter(item => item.percentageChange > 0 && item.percentageChange !== Infinity && item.previousWeekSets > 0)
    .sort((a, b) => b.percentageChange - a.percentageChange);

  const significantDecrease = [...data]
    .filter(item => item.percentageChange < 0 && item.previousWeekSets > 0)
    .sort((a, b) => a.percentageChange - b.percentageChange); // Most negative first (smallest value)

  const newActivities = data.filter(item => item.previousWeekSets === 0 && item.currentWeekSets > 0);
  const stoppedActivities = data.filter(item => item.currentWeekSets === 0 && item.previousWeekSets > 0);
  const noChangeActivities = data.filter(item => item.changeInSets === 0 && item.currentWeekSets > 0);

  if (significantIncrease.length > 0) {
    const topIncrease = significantIncrease[0];
    insights.push(
      `${topIncrease.muscleGroup} training saw a notable increase of ${topIncrease.changeInSets} sets (+${(topIncrease.percentageChange * 100).toFixed(0)}%).`
    );
  } else if (newActivities.length > 0) {
     insights.push(
      `${newActivities.map(item => item.muscleGroup).join(', ')} ${newActivities.length > 1 ? 'were' : 'was'} introduced this week, indicating a new focus.`
    );
  }

  if (significantDecrease.length > 0) {
    const topDecrease = significantDecrease[0];
    insights.push(
      `${topDecrease.muscleGroup} training decreased by ${Math.abs(topDecrease.changeInSets)} sets (${(Math.abs(topDecrease.percentageChange) * 100).toFixed(0)}%).`
    );
  } else if (stoppedActivities.length > 0 && insights.length < 2) {
     insights.push(
      `Training for ${stoppedActivities.map(item => item.muscleGroup).join(', ')} ${stoppedActivities.length > 1 ? 'were' : 'was'} not performed this week, compared to the last.`
    );
  }

  if (noChangeActivities.length > 0 && insights.length < 2) {
    insights.push(
      `Training volume for ${noChangeActivities.map(item => item.muscleGroup).join(', ')} remained consistent with last week.`
    );
  }
  
  if (insights.length === 0 && data.length > 0) {
    insights.push("Overall training patterns remained similar to last week with no major shifts detected across muscle groups.");
  }

  return insights.slice(0, 3); // Limit to 3 insights
}

export function WeeklyComparison({
  data,
  isLoading,
  error,
  weekOffset,
  userTimezone,
  onPreviousWeek,
  onNextWeek,
}: WeeklyComparisonProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading weekly comparison...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-8 text-center">
        <h3 className="text-lg font-semibold text-red-700">Error Loading Comparison</h3>
        <p className="text-red-600 text-sm">Details: {error}</p>
        <p className="text-xs text-gray-500 mt-2">Please try refreshing the page or check back later.</p>
      </div>
    );
  }
  if (!data || data.filter(item => item.currentWeekSets > 0 || item.previousWeekSets > 0).length === 0) {
    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-700">Weekly Comparison</h2>
          {/* Date Navigation for No Data View */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPreviousWeek}
              className="p-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-600 w-40 text-center">
              {formatComparisonDateRange(weekOffset, userTimezone)}
            </span>
            <button
              onClick={onNextWeek}
              disabled={weekOffset === 0}
              className="p-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-center py-8 text-gray-500">No workout data available for this period to generate a comparison.</p>
      </div>
    );
  }

  // Filter out items where both current and previous week sets are 0, unless it's an explicit 'Other' or defined muscle group that just happens to be 0 for both
  const relevantData = data.filter(item => 
    item.currentWeekSets > 0 || 
    item.previousWeekSets > 0 || 
    Object.values(MuscleGroup).includes(item.muscleGroup) // Keep all defined muscle groups even if zero for both weeks
  );

  const preferredOrder: MuscleGroup[] = [MuscleGroup.OTHER, MuscleGroup.CHEST, MuscleGroup.SHOULDERS, MuscleGroup.ARMS, MuscleGroup.BACK, MuscleGroup.LEGS, MuscleGroup.CORE, MuscleGroup.CARDIO];
  
  const sortedData = [...relevantData].sort((a, b) => {
    // Determine trend group for a and b (1 for up, 2 for neutral, 3 for down)
    let trendGroupA: number;
    if (a.changeInSets > 0) trendGroupA = 1;
    else if (a.changeInSets === 0) trendGroupA = 2;
    else trendGroupA = 3;

    let trendGroupB: number;
    if (b.changeInSets > 0) trendGroupB = 1;
    else if (b.changeInSets === 0) trendGroupB = 2;
    else trendGroupB = 3;

    // Primary sort by trend group
    if (trendGroupA !== trendGroupB) {
      return trendGroupA - trendGroupB;
    }

    // Secondary sort within trend groups
    const getPreferredOrderIndex = (muscleGroup: MuscleGroup) => {
      const index = preferredOrder.indexOf(muscleGroup);
      return index === -1 ? Infinity : index; // Items not in preferredOrder go last
    };

    if (trendGroupA === 1) { // Upward trend
      if (a.percentageChange === Infinity && b.percentageChange !== Infinity) return -1;
      if (a.percentageChange !== Infinity && b.percentageChange === Infinity) return 1;
      // If both are Infinity or both are numbers, compare percentages or use preferred order for ties
      if (a.percentageChange === b.percentageChange) { // Also handles both Infinity
        return getPreferredOrderIndex(a.muscleGroup) - getPreferredOrderIndex(b.muscleGroup);
      }
      return (b.percentageChange || 0) - (a.percentageChange || 0); // Sort by percentage desc (|| 0 for safety if not Infinity)
    } else if (trendGroupA === 2) { // Neutral trend
      return getPreferredOrderIndex(a.muscleGroup) - getPreferredOrderIndex(b.muscleGroup);
    } else { // Downward trend (trendGroupA === 3)
      // Sort by percentageChange desc (e.g., -50% before -100%, so higher value is better)
      if (a.percentageChange === b.percentageChange) {
        return getPreferredOrderIndex(a.muscleGroup) - getPreferredOrderIndex(b.muscleGroup);
      }
      return (b.percentageChange || 0) - (a.percentageChange || 0);
    }
  });

  const insights = generateKeyInsights(sortedData);

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header with Title and Date Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-0">Weekly Comparison</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onPreviousWeek}
            aria-label="Previous comparison week"
            className="p-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-600 w-40 text-center tabular-nums">
            {formatComparisonDateRange(weekOffset, userTimezone)}
          </span>
          <button
            onClick={onNextWeek}
            disabled={weekOffset === 0}
            aria-label="Next comparison week"
            className="p-1.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-8">
        {sortedData.map((item) => (
          <MuscleComparisonCard key={item.muscleGroup} item={item} />
        ))}
      </div>

      {insights.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Key Insights</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 max-w-md sm:max-w-lg md:max-w-xl">
            {insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
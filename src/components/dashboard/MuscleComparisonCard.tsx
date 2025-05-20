import React from 'react';
import { WeeklyMuscleComparisonItem } from '@/lib/db';
import { MuscleGroup } from '@/lib/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MuscleComparisonCardProps {
  item: WeeklyMuscleComparisonItem;
}

export function MuscleComparisonCard({ item }: MuscleComparisonCardProps) {
  const { muscleGroup, currentWeekSets, previousWeekSets, changeInSets, percentageChange } = item;

  let arrowIcon, iconBgClass, textClass, description;
  
  // Determine icon, colors, and base description based on changeInSets
  if (changeInSets > 0) {
    arrowIcon = <ArrowUp size={20} className="text-green-600" />;
    iconBgClass = 'bg-green-100';
    textClass = 'text-green-700';
    description = `Increased focus on ${muscleGroup.toLowerCase()} training this week.`
  } else if (changeInSets < 0) {
    arrowIcon = <ArrowDown size={20} className="text-red-600" />;
    iconBgClass = 'bg-red-100';
    textClass = 'text-red-700';
    description = `Reduced ${muscleGroup.toLowerCase()} training compared to last week.`
    if (currentWeekSets === 0) {
      description = `${muscleGroup} not trained this week (was ${previousWeekSets} sets).`;
    }
  } else { // changeInSets === 0
    arrowIcon = <Minus size={20} className="text-gray-600" />;
    iconBgClass = 'bg-gray-100';
    textClass = 'text-gray-700';
    if (currentWeekSets > 0) {
        description = `Maintained consistent ${muscleGroup.toLowerCase()} training volume.`
    } else {
        description = `${muscleGroup} not trained this week (same as last week).`;
    }
  }

  // Format sets change and percentage text
  const setsChangeText = changeInSets === 0 ? `${currentWeekSets}` : (changeInSets > 0 ? `+${changeInSets}` : `${changeInSets}`);
  let percentageText = '';

  if (percentageChange === Infinity) {
    percentageText = '(New)'; // New activity
  } else if (previousWeekSets > 0 && currentWeekSets === 0 && changeInSets < 0) {
    percentageText = '(-100%)'; // Dropped activity completely
  } else if (previousWeekSets > 0 && changeInSets !== 0) {
    const pc = Math.round(percentageChange * 100);
    percentageText = `(${pc > 0 ? '+' : ''}${pc}%)${pc === 0 && changeInSets !== 0 ? ' (slight change)' : ''}`;
  } else if (changeInSets === 0 && currentWeekSets === 0) {
    percentageText = '(0 sets)';
  } else if (changeInSets === 0 && currentWeekSets > 0) {
    percentageText = '(No change)'
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-start space-x-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgClass} flex-shrink-0 mt-1`}>
        {arrowIcon}
      </div>
      <div className="flex-grow">
        <h4 className="font-semibold text-gray-800 text-md capitalize">{muscleGroup.toLowerCase()}</h4>
        <p className={`text-sm font-medium ${textClass}`}>
          {`${setsChangeText} sets `}
          {percentageText && <span className="font-normal">{percentageText}</span>}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
} 
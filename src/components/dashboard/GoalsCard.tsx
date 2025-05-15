'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { fetchCurrentWeekGoalsWithProgress } from '@/lib/goalsDb'
import type { GoalWithProgress } from '@/lib/types'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/button'
import { AddGoalModal } from './AddGoalModal'

// Remove test log
// console.log('TEST IMPORT getWorkoutStats:', getWorkoutStats);

// Remove mock data definition
// const mockGoals: Goal[] = [...];

// Update component props - no longer needs default mock data
interface GoalsCardProps {}

export function GoalsCard({}: GoalsCardProps) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedGoals = await fetchCurrentWeekGoalsWithProgress();
      setGoals(fetchedGoals);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setError(err instanceof Error ? err.message : 'Could not load goals.');
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Helper to calculate progress percentage
  const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min(Math.max((current / target) * 100, 0), 100);
  };

  // Helper to format the display value (e.g., "15/20 mi", "4/5 days")
  const formatValueDisplay = (goal: GoalWithProgress): string => {
    // Add more sophisticated formatting later if needed
    const current = Math.round(goal.current_value * 10) / 10; // Round to 1 decimal place
    const target = Math.round(goal.target_value * 10) / 10;
    return `${current}/${target} ${goal.target_unit ?? ''}`.trim();
  };

  // Helper to determine progress bar color based on metric type or label (can be customized)
  const getProgressColor = (metricType: string): string => {
    if (metricType.includes('distance') || metricType.includes('days')) {
      return 'bg-green-500';
    }
    if (metricType.includes('pace')) {
      return 'bg-yellow-500';
    }
    return 'bg-blue-500'; // Default color
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Goals (This Week)</h2>
        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Icon name="plus" className="mr-1 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center text-gray-500">
          <Icon name="loader" className="animate-spin mr-2" /> Loading Goals...
        </div>
      )}

      {!isLoading && error && (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-red-600">
            <Icon name="alert-triangle" className="mb-2 h-8 w-8" />
            <p className="font-medium">Error Loading Goals</p>
            <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!isLoading && !error && goals.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
              <Icon name="target" className="mb-2 h-8 w-8"/>
              <p className="font-medium">No Goals Set</p>
              <p className="text-sm mb-3">Set your weekly goals to track progress.</p>
              <Button variant="default" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  <Icon name="plus" className="mr-1 h-4 w-4" /> Add Your First Goal
              </Button>
          </div>
      )}

      {!isLoading && !error && goals.length > 0 && (
        <div className="space-y-5 flex-grow">
          {goals.map((goal) => {
            const progressPercent = calculateProgress(goal.current_value, goal.target_value);
            const displayValue = formatValueDisplay(goal);
            const progressColor = getProgressColor(goal.metric_type);
            // Use goal.label if available, otherwise generate one from metric_type
            const goalLabel = goal.label ?? goal.metric_type.replace('_', ' ').replace('weekly ', '').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

            return (
              <div key={goal.id}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-gray-600 whitespace-pre-line">
                    {goalLabel.replace(' ', '\n')} {/* Handle multi-line label */}
                  </span>
                  <span className="text-gray-800 font-medium text-right">
                    {displayValue}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`${progressColor} h-2.5 rounded-full`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onGoalAdded={loadGoals}
      />
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAICoachRecommendation } from '@/app/_actions/aiCoachActions';
import type { AICoachRecommendation as AICoachRecommendationType } from '@/app/_actions/aiCoachActions';
import { Button } from '@/components/ui/button';
import { Error as ErrorComponent } from '@/components/ui/error'; // Renamed to avoid conflict
// Assuming Icon component exists and has a 'loader' or similar, or we use text
// For now, using text for loading state. If an Icon component with a loader is available:
// import { Icon } from '@/components/ui/Icon';

// Re-define the interface here for clarity within the component, matching the server action
interface AICoachRecommendation extends AICoachRecommendationType {}

export function AICoachCard() {
  const [recommendations, setRecommendations] = useState<AICoachRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading true to fetch on mount
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAICoachRecommendation();
      if ('error' in result) {
        setError(result.error);
        setRecommendations(null);
      } else {
        setRecommendations(result);
      }
    } catch (e) {
      console.error("Failed to fetch AI coach recommendations:", e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      setRecommendations(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const renderRecommendationBlock = (
    title: string,
    details: string | undefined | null,
    icon: string,
    suggestedExercises?: string[]
  ) => {
    if (!details) return null;

    return (
      // Removed outer card styling from this block, keeping internal padding/styling for individual recs
      <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
        <h3 className="text-md font-semibold text-slate-700 mb-1">
          {icon} {title}
        </h3>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{details}</p>
        {suggestedExercises && suggestedExercises.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-slate-500">Suggested Exercises:</p>
            <ul className="list-disc list-inside pl-2">
              {suggestedExercises.map((ex, index) => (
                <li key={index} className="text-sm text-slate-600">{ex}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Main component return - remove outer div with card styling
  return (
    <>
      {/* Removed title and original button placement */}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          {/* If Icon component available: <Icon name="loader" className="animate-spin h-8 w-8 text-primary" /> */}
          <p className="text-primary animate-pulse">AI Coach is thinking...</p>
        </div>
      )}

      {error && !isLoading && (
        // Ensure ErrorComponent itself doesn't have conflicting card styling
        <ErrorComponent message={error} />
      )}

      {!isLoading && !error && recommendations && (
        <div className="space-y-3"> {/* Added space-y-3 for consistency if multiple blocks */}
          {renderRecommendationBlock(
            recommendations.workoutRecommendation.title,
            recommendations.workoutRecommendation.details,
            '🏋️', // Dumbbell emoji for workout
            recommendations.workoutRecommendation.suggestedExercises
          )}

          {recommendations.runRecommendation && renderRecommendationBlock(
            recommendations.runRecommendation.title,
            recommendations.runRecommendation.details,
            '🏃' // Runner emoji for run
          )}

          {renderRecommendationBlock(
            recommendations.generalInsight.title,
            recommendations.generalInsight.details,
            '💡' // Lightbulb emoji for insight
          )}

          {recommendations.focusAreaSuggestion && renderRecommendationBlock(
            recommendations.focusAreaSuggestion.title,
            recommendations.focusAreaSuggestion.details,
            '🎯' // Target emoji for focus area
          )}
        </div>
      )}
      
      {!isLoading && !error && !recommendations && (
        <p className="text-sm text-gray-500 py-4 text-center">No recommendations available at the moment. Try refreshing.</p>
      )}

      {/* "Get New Advice" button moved here, styled as primary action within content area */}
      <Button onClick={fetchRecommendations} disabled={isLoading} className="w-full mt-4">
        {isLoading ? 'Refreshing...' : 'Get New Advice'}
      </Button>
    </>
  );
} 
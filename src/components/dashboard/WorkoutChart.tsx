'use client'

import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { WorkoutTrend } from '@/lib/db'
import { format, parseISO, startOfWeek, addDays, addWeeks, formatISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Define the type for selectable trend metrics locally
export type TrendMetric = 'totalDuration' | 'totalWeight' | 'totalSets';

interface WorkoutChartProps {
  data: WorkoutTrend[];
  weightUnit: 'kg' | 'lbs';
}

export function WorkoutChart({ data, weightUnit }: WorkoutChartProps) {
  // State for week offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);
  // State for the active metric to display
  const [activeMetric, setActiveMetric] = useState<TrendMetric>('totalDuration');

  // --- Helper Functions ---

  // Get the start date (Monday) of the target week based on the offset
  const getTargetWeekStart = (offset: number): Date => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return addWeeks(currentWeekStart, offset);
  };

  // Generate labels and date info for the target week
  const createWeekLabels = (offset: number) => {
    const mondayOfTargetWeek = getTargetWeekStart(offset);
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(mondayOfTargetWeek, i);
      weekDays.push({
        date: format(day, 'yyyy-MM-dd'), // Keep YYYY-MM-DD for data matching
        label: format(day, 'EEE, MMM d'), // Format for display
        isPast: day < todayDateOnly,
      });
    }
    return weekDays;
  };

  // Format the date range string for the title
  const formatWeekTitle = (offset: number): string => {
    const weekStart = getTargetWeekStart(offset);
    const weekEnd = addDays(weekStart, 6);
    if (offset === 0) {
      return "Weekly Workout Trends (This Week)";
    }
    return `Weekly Workout Trends (Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`;
  };

  // --- Data Processing ---

  // Generate labels for the currently selected week offset
  const weekLabels = createWeekLabels(weekOffset);

  // Map incoming data to the generated week labels
  const mappedData = weekLabels.map(dayInfo => {
    const matchingData = data.find(item => item.date === dayInfo.date);
    const dayDate = new Date(dayInfo.date + "T00:00:00"); // For comparison
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return {
      date: dayInfo.date,
      label: dayInfo.label,
      isPast: dayDate < todayDateOnly,
      count: matchingData?.count ?? 0,
      duration: matchingData?.totalDuration ?? 0,
      weight: matchingData?.totalWeight ?? 0,
      sets: matchingData?.totalSets ?? 0,
      exerciseNames: matchingData?.exerciseNames ?? [],
      notes: matchingData?.notes ?? [],
      workoutNames: matchingData?.workoutNames ?? []
    };
  });

  // --- Chart Configuration ---

  const getCurrentMetricDisplayInfo = () => {
    switch (activeMetric) {
      case 'totalWeight':
        return {
          data: mappedData.map(item => item.weight),
          label: `Total Weight (${weightUnit})`,
          yAxisLabel: `Weight (${weightUnit})`,
          color: 'rgba(54, 162, 235, 0.7)', // Blue
          borderColor: 'rgba(54, 162, 235, 1)',
        };
      case 'totalSets':
        return {
          data: mappedData.map(item => item.sets),
          label: 'Total Sets',
          yAxisLabel: 'Sets',
          color: 'rgba(75, 192, 192, 0.7)', // Green
          borderColor: 'rgba(75, 192, 192, 1)',
        };
      case 'totalDuration':
      default:
        return {
          data: mappedData.map(item => item.duration),
          label: 'Duration (min)',
          yAxisLabel: 'Duration (min)',
          color: 'rgba(251, 146, 60, 0.7)', // Orange
          borderColor: 'rgba(251, 146, 60, 1)',
        };
    }
  };
  const currentMetricInfo = getCurrentMetricDisplayInfo();

  const chartData: ChartData<'bar'> = {
    labels: mappedData.map(item => item.label),
    datasets: [
      {
        label: currentMetricInfo.label,
        data: currentMetricInfo.data,
        backgroundColor: currentMetricInfo.color,
        borderColor: currentMetricInfo.borderColor,
        borderWidth: 1,
        borderRadius: 4,
      }
    ],
  }

  // Use a flag for light/dark mode detection if available, otherwise assume light
  // const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const axisColor = 'rgba(55, 65, 81, 0.7)'; // Dark gray for light theme
  const gridColor = 'rgba(209, 213, 219, 0.5)'; // Lighter gray for light theme grid
  const titleColor = 'rgba(17, 24, 39, 0.9)'; // Very dark gray for titles
  const legendColor = 'rgba(55, 65, 81, 0.7)'; // Dark gray for legend

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 15
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: legendColor,
          font: {
            family: 'system-ui',
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: formatWeekTitle(weekOffset),
        color: titleColor,
        font: {
          family: 'serif',
          size: 18
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: 'rgba(17, 24, 39, 0.9)',
        bodyColor: 'rgba(55, 65, 81, 0.8)',
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems: any[]) {
            const dataIndex = tooltipItems[0].dataIndex;
            if (!mappedData || dataIndex >= mappedData.length || dataIndex < 0) return ''; 
            const dataPoint = mappedData[dataIndex];
            const dateLabel = tooltipItems[0].label;
            
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              const workoutName = dataPoint.workoutNames[0] ?? 'Workout'; 
              return [`${dateLabel}`, `${workoutName}`];
            }
            
            return dateLabel;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            if (!mappedData || dataIndex >= mappedData.length || dataIndex < 0) return ''; 
            const dataPoint = mappedData[dataIndex];
            
            const lines = [`${label}: ${value}`];
            
            if (dataPoint.notes && dataPoint.notes.length > 0) {
              lines.push('');
              lines.push('📝 Notes:');
              
              dataPoint.notes.forEach((note, index) => {
                const truncatedNote = note && note.length > 80 ? note.substring(0, 80) + '...' : (note ?? '');
                
                const notePrefix = (dataPoint.workoutNames && dataPoint.workoutNames.length > 0 && index === 0) 
                  ? '📌 '
                  : '• ';
                
                lines.push(`${notePrefix}${truncatedNote}`);
              });
            } else if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              lines.push('');
              lines.push('📝 No notes for this workout');
            }
            
            if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              lines.push('');
              lines.push('Exercises:');
              dataPoint.exerciseNames.forEach(name => {
                lines.push(`- ${name ?? 'N/A'}`);
              });
            }
            
            return lines;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: axisColor,
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: currentMetricInfo.yAxisLabel,
          color: axisColor,
          font: {
            family: 'system-ui',
            size: 14
          }
        }
      },
      x: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: axisColor,
          callback: function(value: any, index: number) {
            if (!mappedData || index >= mappedData.length || index < 0) return '';
            const dataPoint = mappedData[index];
            const dateLabel = dataPoint.label;
            
            let workoutLabel = '';
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              workoutLabel = dataPoint.workoutNames[0] ?? 'Workout';
            } else if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              const exerciseName = dataPoint.exerciseNames[0] ?? 'Exercise'; 
              const formattedName = exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1);
              
              if (dataPoint.exerciseNames.length > 1) {
                workoutLabel = `${formattedName} Day`;
              } else {
                workoutLabel = formattedName;
              }
            }
            
            if (workoutLabel.length > 15) {
              workoutLabel = workoutLabel.substring(0, 15) + '...';
            }
            
            if (!workoutLabel) {
              if (dataPoint.isPast) {
                return [dateLabel, 'Rest Day'];
              } else {
                return [dateLabel, '—'];
              }
            }
            
            return [dateLabel, workoutLabel];
          },
          font: {
            size: 12
          },
          padding: 10
        },
        title: {
          display: true,
          text: 'Date',
          color: axisColor,
          font: {
            family: 'system-ui',
            size: 14
          }
        }
      }
    },
  }

  // --- Render ---

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2 px-2">
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={() => setWeekOffset(prev => prev - 1)}
           aria-label="Previous Week"
         >
           <ChevronLeft className="h-5 w-5" />
         </Button>
         
         {/* Metric Selection Buttons */}
         <div className="flex justify-center space-x-2">
          {(['totalDuration', 'totalWeight', 'totalSets'] as TrendMetric[]).map((metric) => {
            let buttonText = '';
            if (metric === 'totalDuration') buttonText = 'Duration';
            else if (metric === 'totalWeight') buttonText = `Weight (${weightUnit})`;
            else if (metric === 'totalSets') buttonText = 'Sets';
            
            return (
              <Button
                key={metric}
                variant={activeMetric === metric ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1 text-xs sm:text-sm ${activeMetric === metric ? 'bg-primary text-primary-foreground' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                {buttonText}
              </Button>
            );
          })}
        </div>

         <Button 
           variant="ghost" 
           size="icon" 
           onClick={() => setWeekOffset(prev => prev + 1)}
           disabled={weekOffset === 0}
           aria-label="Next Week"
         >
           <ChevronRight className="h-5 w-5" />
         </Button>
      </div>

      <div className="h-[400px] relative">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
} 
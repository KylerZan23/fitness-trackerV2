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

interface WorkoutChartProps {
  data: WorkoutTrend[]
}

export function WorkoutChart({ data }: WorkoutChartProps) {
  // State for week offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

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
      exerciseNames: matchingData?.exerciseNames ?? [],
      notes: matchingData?.notes ?? [],
      workoutNames: matchingData?.workoutNames ?? []
    };
  });

  // --- Chart Configuration ---

  const chartData: ChartData<'bar'> = {
    labels: mappedData.map(item => item.label),
    datasets: [
      {
        label: 'Duration (min)',
        data: mappedData.map(item => item.duration),
        backgroundColor: 'rgba(251, 146, 60, 0.7)',
        borderColor: 'rgba(251, 146, 60, 1)',
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
            
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              lines.push('');
              lines.push('Workout:');
              dataPoint.workoutNames.forEach(name => {
                lines.push(`- ${name ?? 'N/A'}`);
              });
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
          text: 'Duration (min)',
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
              
              if (dataPoint.workoutNames.length > 1) {
                workoutLabel += ` +${dataPoint.workoutNames.length - 1}`;
              }
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
      <div className="flex justify-between items-center mb-4 px-2">
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={() => setWeekOffset(prev => prev - 1)}
           aria-label="Previous Week"
         >
           <ChevronLeft className="h-5 w-5" />
         </Button>
         
         <div className="flex-1"></div>

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
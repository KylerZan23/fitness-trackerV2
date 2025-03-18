'use client'

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
import { format, parseISO, startOfWeek, addDays } from 'date-fns'

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
  period?: 'day' | 'week' | 'month'
}

export function WorkoutChart({ data, period = 'week' }: WorkoutChartProps) {
  // Define today variable for use throughout the component
  const today = new Date();
  
  // Create a Monday to Sunday week array of dates
  const createWeekLabels = () => {
    const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 represents Monday
    
    // Create a today date with time set to midnight for proper day comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(mondayOfThisWeek, i);
      weekDays.push({
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'EEE, MMM d'), // e.g., "Mon, Jan 1"
        isPast: day < todayDateOnly // Compare with today at midnight for true day comparison
      });
    }
    return weekDays;
  };
  
  const weekLabels = createWeekLabels();
  
  // Map our data to the week days
  const mappedData = weekLabels.map(day => {
    const matchingData = data.find(item => item.date === day.date);
    
    // Create Date objects with time set to midnight for accurate day comparison
    const dayDate = new Date(day.date + "T00:00:00");
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return {
      date: day.date,
      label: day.label,
      isPast: dayDate < todayDateOnly, // Compare Date objects at midnight
      // Use the matching data if found, otherwise use zeros
      count: matchingData ? matchingData.count : 0,
      duration: matchingData ? matchingData.totalDuration : 0,
      exerciseNames: matchingData && matchingData.exerciseNames ? matchingData.exerciseNames : [],
      notes: matchingData && matchingData.notes ? matchingData.notes : [],
      workoutNames: matchingData && matchingData.workoutNames ? matchingData.workoutNames : []
    };
  });

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
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'system-ui',
          }
        }
      },
      title: {
        display: true,
        text: 'Weekly Workout Trends (Monday-Sunday)',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          family: 'serif',
          size: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems: any[]) {
            const dataIndex = tooltipItems[0].dataIndex;
            const dataPoint = mappedData[dataIndex];
            const dateLabel = tooltipItems[0].label;
            
            // If we have a workout name, include it in the title
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              return [`${dateLabel}`, `${dataPoint.workoutNames[0]}`];
            }
            
            return dateLabel;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            const dataPoint = mappedData[dataIndex];
            
            // Create an array to store our lines
            const lines = [`${label}: ${value}`];
            
            // Add notes if available (prioritize notes by showing them first)
            if (dataPoint.notes && dataPoint.notes.length > 0) {
              lines.push('');
              lines.push('📝 Notes:');
              
              dataPoint.notes.forEach((note, index) => {
                // Show more characters from notes since they're the focus
                const truncatedNote = note.length > 80 ? note.substring(0, 80) + '...' : note;
                
                // Add emoji to distinguish between workout notes
                const notePrefix = (dataPoint.workoutNames && dataPoint.workoutNames.length > 0 && index === 0) 
                  ? '📌 ' // Mark likely workout group notes with a different emoji
                  : '• ';
                
                lines.push(`${notePrefix}${truncatedNote}`);
              });
            } else if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              // If no notes but we have exercises, add a message
              lines.push('');
              lines.push('📝 No notes for this workout');
            }
            
            // Add workout name if available (shown after notes)
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              lines.push('');
              lines.push('Workout:');
              dataPoint.workoutNames.forEach(name => {
                lines.push(`- ${name}`);
              });
            }
            
            // Add exercise names if available (shown last)
            if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              lines.push('');
              lines.push('Exercises:');
              dataPoint.exerciseNames.forEach(name => {
                lines.push(`- ${name}`);
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
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value: any, index: number) {
            const dataPoint = mappedData[index];
            // Get date label
            const dateLabel = dataPoint.label;
            
            // Show workout name if available, otherwise fall back to exercise name
            let workoutLabel = '';
            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              // Use the workout name directly
              workoutLabel = dataPoint.workoutNames[0];
              
              // If there are multiple workout names, indicate with a plus
              if (dataPoint.workoutNames.length > 1) {
                workoutLabel += ` +${dataPoint.workoutNames.length - 1}`;
              }
            } else if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              // Fall back to exercise name if no workout name is available
              const exerciseName = dataPoint.exerciseNames[0];
              const formattedName = exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1);
              
              if (dataPoint.exerciseNames.length > 1) {
                workoutLabel = `${formattedName} Day`;
              } else {
                workoutLabel = formattedName;
              }
            }
            
            // Truncate if too long
            if (workoutLabel.length > 15) {
              workoutLabel = workoutLabel.substring(0, 15) + '...';
            }
            
            // Only show "Rest Day" if the date is in the past and has no workout
            if (!workoutLabel) {
              // Check if this day is in the past
              if (dataPoint.isPast) {
                return [dateLabel, 'Rest Day'];
              } else {
                // For future days or today with no activity, show an empty space or dashes
                return [dateLabel, '—'];
              }
            }
            
            return [dateLabel, workoutLabel];
          },
          font: {
            size: 10
          },
          padding: 10
        }
      }
    },
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="h-[420px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
} 
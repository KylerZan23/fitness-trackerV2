import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Activity, Clock, Zap, Target, Trophy, Dumbbell, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a mapping for icons based on title or a specific prop
const iconMap = {
  'Total Workouts': Activity,
  'Personal Records': Trophy,
  'Avg Duration': Clock,
  '7-Day Volume': Zap,
  'Squat': Target,
  'Bench Press': Dumbbell,
  'Deadlift': TrendingUp,
  'Overhead Press': BarChart3,
};

type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ElementType | React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  isLoading?: boolean;
  colorScheme?: ColorScheme;
}

export function StatsCard({
  title,
  value,
  unit,
  subtitle,
  icon: IconComponent,
  trend,
  trendValue,
  className = '',
  isLoading = false,
  colorScheme = 'purple',
}: StatsCardProps) {
  const colorSchemes: Record<ColorScheme, Record<string, string>> = {
    blue: {
      bg: 'from-brand-blue-50 to-brand-blue-100',
      text: 'text-brand-blue-800',
      value: 'text-brand-blue-900',
      iconBg: 'bg-brand-blue-100',
      iconText: 'text-brand-blue-600',
      border: 'border-brand-blue-200',
    },
    green: {
      bg: 'from-brand-green-50 to-brand-green-100',
      text: 'text-brand-green-800',
      value: 'text-brand-green-900',
      iconBg: 'bg-brand-green-100',
      iconText: 'text-brand-green-600',
      border: 'border-brand-green-200',
    },
    purple: {
      bg: 'from-brand-purple-50 to-brand-purple-100',
      text: 'text-brand-purple-800',
      value: 'text-brand-purple-900',
      iconBg: 'bg-brand-purple-100',
      iconText: 'text-brand-purple-600',
      border: 'border-brand-purple-200',
    },
    orange: {
      bg: 'from-brand-orange-50 to-brand-orange-100',
      text: 'text-brand-orange-800',
      value: 'text-brand-orange-900',
      iconBg: 'bg-brand-orange-100',
      iconText: 'text-brand-orange-600',
      border: 'border-brand-orange-200',
    },
    red: {
      bg: 'from-red-50 to-red-100',
      text: 'text-red-800',
      value: 'text-red-900',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      border: 'border-red-200',
    },
    yellow: {
      bg: 'from-yellow-50 to-yellow-100',
      text: 'text-yellow-800',
      value: 'text-yellow-900',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      border: 'border-yellow-200',
    },
  };

  const colors = colorSchemes[colorScheme];
  const FallbackIcon = iconMap[title as keyof typeof iconMap] ?? Activity;

  // Handle both React.ElementType and React.ReactNode
  const renderIcon = () => {
    if (IconComponent) {
      if (React.isValidElement(IconComponent)) {
        // If it's a JSX element, clone it with our styling
        return React.cloneElement(IconComponent as React.ReactElement, {
          className: cn('w-5 h-5', colors.iconText)
        });
      } else if (typeof IconComponent === 'function') {
        // If it's a component type, render it
        const Icon = IconComponent as React.ElementType;
        return <Icon className={cn('w-5 h-5', colors.iconText)} />;
      }
    }
    // Fallback to title-based icon
    const Icon = FallbackIcon;
    return <Icon className={cn('w-5 h-5', colors.iconText)} />;
  };

  return (
    <Card
      className={cn(
        'relative p-5 rounded-xl border shadow-sm transition-all duration-300 transform',
        'hover:-translate-y-1 hover:shadow-lg group',
        'bg-gradient-to-br',
        colors.bg,
        colors.border,
        className,
        { 'animate-pulse': isLoading }
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.iconBg)}>
              {renderIcon()}
            </div>
            <h3 className={cn('text-sm font-semibold', colors.text)}>{title}</h3>
          </div>
          {trend && (
            <div className={cn('flex items-center text-xs font-semibold', {
              'text-green-600': trend === 'up',
              'text-red-600': trend === 'down',
              'text-gray-600': trend === 'neutral',
            })}>
              {trendValue && <span>{trendValue}</span>}
              {trend === 'up' && <TrendingUp className="w-4 h-4 ml-1" />}
              {trend === 'down' && <TrendingUp className="w-4 h-4 ml-1 transform rotate-180" />}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline space-x-1.5">
          <span className={cn('text-4xl font-bold tracking-tight', colors.value)}>
            {isLoading ? '—' : value}
          </span>
          {unit && <span className={cn('text-lg font-medium', colors.text)}>{unit}</span>}
        </div>
        
        {subtitle && (
          <p className={cn('text-xs mt-1', colors.text, 'opacity-80')}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized stats card for strength metrics
export interface StrengthStatsCardProps {
  liftName: string
  e1rmValue: number | null
  unit: 'kg' | 'lbs'
  confidence?: 'high' | 'medium' | 'low'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  lastTested?: string
  icon?: React.ReactNode
  className?: string
  isLoading?: boolean
}

export function StrengthStatsCard({
  liftName,
  e1rmValue,
  unit,
  confidence,
  trend,
  trendValue,
  lastTested,
  icon,
  className,
  isLoading = false
}: StrengthStatsCardProps) {
  // Confidence indicators
  const confidenceColors = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  const confidenceText = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence'
  }

  const displayValue = e1rmValue ? Math.round(e1rmValue) : '—'
  const subtitle = e1rmValue && lastTested 
    ? `Last tested ${lastTested}`
    : e1rmValue 
    ? 'Estimated 1RM'
    : 'No data available'

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {/* Header with lift name and icon */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {liftName} 1RM
        </h3>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* e1RM value */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className={cn(
          "text-2xl font-bold",
          e1rmValue ? "text-gray-900" : "text-gray-400"
        )}>
          {displayValue}
        </span>
        {e1rmValue && (
          <span className="text-lg font-medium text-gray-500">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom section with confidence and trend */}
      <div className="space-y-2">
        {/* Subtitle */}
        <p className="text-xs text-gray-500">
          {subtitle}
        </p>

        {/* Confidence and trend indicators */}
        <div className="flex items-center justify-between">
          {confidence && e1rmValue && (
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium border",
              confidenceColors[confidence]
            )}>
              {confidenceText[confidence]}
            </div>
          )}
          
          {trend && trendValue && e1rmValue && (
            <div className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === 'up' ? 'text-green-600 bg-green-50' :
              trend === 'down' ? 'text-red-600 bg-red-50' :
              'text-gray-600 bg-gray-50'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
               trend === 'down' ? <TrendingUp className="w-3 h-3" /> :
               <TrendingUp className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      )}
    </div>
  )
}

// Grid container for strength stats cards
export interface StrengthVitalsGridProps {
  children: React.ReactNode
  className?: string
}

export function StrengthVitalsGrid({ children, className }: StrengthVitalsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
      className
    )}>
      {children}
    </div>
  )
} 
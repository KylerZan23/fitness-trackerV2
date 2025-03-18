'use client'

import { Icon } from '@/components/ui/Icon'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  iconName?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, iconName, trend }: StatsCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {iconName && (
            <div className="mr-2 text-white/70">
              <Icon name={iconName} size={16} />
            </div>
          )}
          <h3 className="text-xs font-medium text-gray-400">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-1 flex items-baseline">
        <p className="text-xl font-semibold text-white">{value}</p>
        {description && (
          <p className="ml-1 text-xs text-gray-400">{description}</p>
        )}
      </div>
    </div>
  )
} 
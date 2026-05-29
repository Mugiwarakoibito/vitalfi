import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { ActivityItem } from '@/lib/insights'
import {
  Wallet,
  TrendingUp,
  Dumbbell,
  Utensils,
  Droplets,
  Moon,
  Target,
  Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface RecentActivityProps {
  items: ActivityItem[]
  currency: string
}

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  TrendingUp,
  Dumbbell,
  Utensils,
  Droplets,
  Moon,
  Target,
  Activity,
}

const colorMap: Record<string, string> = {
  primary: 'text-primary-light bg-primary/15',
  success: 'text-success-light bg-success/15',
  warning: 'text-warning-light bg-warning/15',
  accent: 'text-accent-light bg-accent/15',
  error: 'text-error-light bg-error/15',
}

export function RecentActivity({ items, currency }: RecentActivityProps) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted text-center py-6">
            No recent activity yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 max-h-[320px] overflow-auto">
        {items.map((item) => {
          const iconKey = item.icon || 'Activity'
          const colorKey = item.color || 'primary'
          const Icon = iconMap[iconKey] || Activity
          const colorClass = colorMap[colorKey] || colorMap.primary
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
              >
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted">{item.subtitle}</p>
              </div>
              {item.amount !== undefined && (
                <span className="text-sm font-medium text-white shrink-0">
                  {formatCurrency(item.amount, currency)}
                </span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

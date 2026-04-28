import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Wallet, Dumbbell, TrendingUp, Target } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-muted mt-1">Your financial and fitness overview.</p>
        </div>
        <Button variant="primary">+ Add Record</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Wallet className="h-5 w-5 text-primary-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Net Worth</p>
              <p className="text-lg font-semibold text-white">$0.00</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <TrendingUp className="h-5 w-5 text-accent-light" />
            </div>
            <div>
              <p className="text-xs text-muted">This Month</p>
              <p className="text-lg font-semibold text-white">$0.00</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
              <Dumbbell className="h-5 w-5 text-success-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Workouts</p>
              <p className="text-lg font-semibold text-white">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
              <Target className="h-5 w-5 text-warning-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Goals</p>
              <p className="text-lg font-semibold text-white">0/0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="primary" className="w-full justify-start gap-2">
              <Wallet size={16} /> Add Transaction
            </Button>
            <Button variant="accent" className="w-full justify-start gap-2">
              <Dumbbell size={16} /> Log Workout
            </Button>
            <Button className="w-full justify-start gap-2">
              <Target size={16} /> Set Goal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

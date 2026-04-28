import { Card, CardContent } from '@/components/ui/Card'
import { Dumbbell } from 'lucide-react'

export default function Fitness() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
          <Dumbbell className="h-5 w-5 text-success-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Fitness</h2>
          <p className="text-sm text-muted mt-1">Log workouts, nutrition, and body metrics.</p>
        </div>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted">Fitness module coming in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  )
}

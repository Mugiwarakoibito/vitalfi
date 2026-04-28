import { Card, CardContent } from '@/components/ui/Card'
import { Lightbulb } from 'lucide-react'

export default function Insights() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
          <Lightbulb className="h-5 w-5 text-warning-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Insights</h2>
          <p className="text-sm text-muted mt-1">AI-driven recommendations and analytics.</p>
        </div>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted">Insights module coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent } from '@/components/ui/Card'
import { Wallet } from 'lucide-react'

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Wallet className="h-5 w-5 text-primary-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Finance</h2>
          <p className="text-sm text-muted mt-1">Track accounts, transactions, and budgets.</p>
        </div>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted">Finance module coming in Phase 3.</p>
        </CardContent>
      </Card>
    </div>
  )
}

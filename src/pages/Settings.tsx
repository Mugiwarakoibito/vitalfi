import { Card, CardContent } from '@/components/ui/Card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/15">
          <Settings className="h-5 w-5 text-muted-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-muted mt-1">Manage your profile, data, and license.</p>
        </div>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted">Settings module coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { HydrationEntry } from '@/types/fitness'
import { Droplets, Plus, Trash2, GlassWater } from 'lucide-react'

interface HydrationTrackerProps {
  entries: HydrationEntry[]
  onEntriesChange: () => void
  dailyGoal?: number
}

const quickAmounts = [250, 500, 750, 1000]

export function HydrationTracker({ entries, onEntriesChange, dailyGoal = 2500 }: HydrationTrackerProps) {
  const [customAmount, setCustomAmount] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [entries, today]
  )

  const totalAmount = useMemo(() => todayEntries.reduce((sum, e) => sum + e.amount, 0), [todayEntries])
  const percentage = Math.min((totalAmount / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - totalAmount, 0)

  const addEntry = async (amount: number) => {
    const entry: HydrationEntry = {
      id: generateId(),
      date: today,
      amount,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('hydration', entry)
    setCustomAmount('')
    onEntriesChange()
  }

  const handleDelete = async (id: string) => {
    await storage.delete('hydration', id)
    onEntriesChange()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Hydration</h3>
          <p className="text-xs text-muted">{todayEntries.length} entries today</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
                <Droplets className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(totalAmount)} <span className="text-sm font-normal text-muted">ml</span></p>
                <p className="text-xs text-muted">Goal: {dailyGoal} ml &middot; {remaining > 0 ? `${remaining} ml to go` : 'Goal reached!'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-sky-400">{Math.round(percentage)}%</p>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <Button key={amount} variant="default" size="sm" onClick={() => addEntry(amount)}>
                <Plus size={12} className="mr-1" /> {amount} ml
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="glass-input flex-1 px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customAmount) {
                  addEntry(parseInt(customAmount) || 0)
                }
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => customAmount && addEntry(parseInt(customAmount) || 0)}
              disabled={!customAmount}
            >
              <GlassWater size={14} className="mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {todayEntries.length > 0 && (
        <div className="space-y-2">
          {todayEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-sky-400" />
                  <span className="text-sm text-white">{entry.amount} ml</span>
                  <span className="text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                  <Trash2 size={14} className="text-muted hover:text-red-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage'
import { generateId, formatSleepDuration } from '@/lib/utils'
import type { SleepEntry } from '@/types/fitness'
import { Moon, Trash2, Star, Clock, Plus } from 'lucide-react'

interface SleepLoggerProps {
  entries: SleepEntry[]
  onEntriesChange: () => void
}

export function SleepLogger({ entries, onEntriesChange }: SleepLoggerProps) {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('')
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [bedTime, setBedTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [notes, setNotes] = useState('')

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  )

  const avgDuration = useMemo(() => {
    if (entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + e.duration, 0) / entries.length
  }, [entries])

  const avgQuality = useMemo(() => {
    if (entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + e.quality, 0) / entries.length
  }, [entries])

  const reset = () => {
    setDate(new Date().toISOString().split('T')[0])
    setDuration('')
    setQuality(3)
    setBedTime('')
    setWakeTime('')
    setNotes('')
  }

  const handleSave = async () => {
    if (!duration || isNaN(parseFloat(duration))) return
    const entry: SleepEntry = {
      id: generateId(),
      date,
      duration: parseFloat(duration),
      quality,
      bedTime: bedTime || undefined,
      wakeTime: wakeTime || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('sleep', entry)
    reset()
    setShowForm(false)
    onEntriesChange()
  }

  const handleDelete = async (id: string) => {
    await storage.delete('sleep', id)
    onEntriesChange()
  }

  const qualityStars = (q: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={12}
        className={i < q ? 'fill-amber-400 text-amber-400' : 'text-white/10'}
      />
    ))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Sleep</h3>
          <p className="text-xs text-muted">{entries.length} entries</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> Log Sleep
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-violet-400" />
                <p className="text-xs text-muted">Avg Duration</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-white">{formatSleepDuration(avgDuration)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400" />
                <p className="text-xs text-muted">Avg Quality</p>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {qualityStars(Math.round(avgQuality))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Moon className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No sleep entries yet.</p>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="mt-3">
              Log your first night
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry) => (
            <Card key={entry.id} hover>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                    <Moon size={14} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {new Date(entry.date).toLocaleDateString()} &middot; {formatSleepDuration(entry.duration)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {qualityStars(entry.quality)}
                      {entry.bedTime && entry.wakeTime && (
                        <span className="ml-2 text-xs text-muted">
                          {entry.bedTime} - {entry.wakeTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                  <Trash2 size={14} className="text-muted hover:text-red-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); reset() }} title="Log Sleep">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
            </div>
            <Input label="Duration (hours)" type="number" step="0.1" placeholder="7.5" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Bed Time</label>
              <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="glass-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Wake Time</label>
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="glass-input w-full" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Quality</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 transition-all ${
                    quality === q
                      ? 'border-amber-500/40 bg-amber-500/15'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex">
                    {qualityStars(q)}
                  </div>
                  <span className={`text-[10px] font-medium ${quality === q ? 'text-amber-400' : 'text-muted'}`}>
                    {q === 1 ? 'Poor' : q === 2 ? 'Fair' : q === 3 ? 'Okay' : q === 4 ? 'Good' : 'Great'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Woke up once, room was cold..."
              className="glass-input w-full min-h-[80px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); reset() }} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!duration}>
              Save Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

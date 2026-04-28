import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory } from '@/lib/calculations'
import type { BodyMetric } from '@/types/fitness'
import { Plus, Trash2, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react'

interface BodyMetricsTrackerProps {
  metrics: BodyMetric[]
  onMetricsChange: () => void
  heightCm?: number
}

const measurementFields = [
  { key: 'chest', label: 'Chest (cm)' },
  { key: 'waist', label: 'Waist (cm)' },
  { key: 'hips', label: 'Hips (cm)' },
  { key: 'biceps', label: 'Biceps (cm)' },
  { key: 'thighs', label: 'Thighs (cm)' },
  { key: 'calves', label: 'Calves (cm)' },
  { key: 'neck', label: 'Neck (cm)' },
  { key: 'shoulders', label: 'Shoulders (cm)' },
]

export function BodyMetricsTracker({ metrics, onMetricsChange, heightCm }: BodyMetricsTrackerProps) {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})

  const sorted = useMemo(
    () => [...metrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [metrics]
  )

  const latest = sorted[0]
  const previous = sorted[1]

  const weightChange = latest && previous && latest.weight && previous.weight
    ? latest.weight - previous.weight
    : 0

  const reset = () => {
    setDate(new Date().toISOString().split('T')[0])
    setWeight('')
    setBodyFat('')
    setMeasurements({})
  }

  const handleSave = async () => {
    const numericMeasurements: Record<string, number> = {}
    Object.entries(measurements).forEach(([k, v]) => {
      const num = parseFloat(v)
      if (!isNaN(num) && num > 0) numericMeasurements[k] = num
    })

    const metric: BodyMetric = {
      id: generateId(),
      date,
      weight: weight ? parseFloat(weight) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      measurements: numericMeasurements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await storage.put('bodyMetrics', metric)
    reset()
    setShowForm(false)
    onMetricsChange()
  }

  const handleDelete = async (id: string) => {
    await storage.delete('bodyMetrics', id)
    onMetricsChange()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Body Metrics</h3>
          <p className="text-xs text-muted">{metrics.length} entries</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> Log Entry
        </Button>
      </div>

      {latest && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted">Current Weight</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{latest.weight?.toFixed(1) ?? '--'}</span>
                <span className="text-xs text-muted">kg</span>
              </div>
              {weightChange !== 0 && (
                <div className={`mt-1 flex items-center gap-1 text-xs ${weightChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {weightChange < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </div>
              )}
              {weightChange === 0 && previous && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Minus size={12} /> No change
                </div>
              )}
            </CardContent>
          </Card>

          {heightCm && latest.weight && (
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted">BMI</p>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-white">{calculateBMI(latest.weight, heightCm)}</span>
                </div>
                <p className={`mt-1 text-xs ${bmiCategory(calculateBMI(latest.weight, heightCm)).color}`}>
                  {bmiCategory(calculateBMI(latest.weight, heightCm)).label}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted">Body Fat</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{latest.bodyFat?.toFixed(1) ?? '--'}</span>
                <span className="text-xs text-muted">%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted">Entries</p>
              <div className="mt-1">
                <span className="text-2xl font-bold text-white">{metrics.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Since {sorted[sorted.length - 1]?.date ? new Date(sorted[sorted.length - 1].date).toLocaleDateString() : '--'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No body metrics logged yet.</p>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="mt-3">
              Log first entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => (
            <Card key={m.id} hover>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-white">{new Date(m.date).toLocaleDateString()}</div>
                  <div className="flex gap-3 text-sm">
                    {m.weight && <span className="text-gray-300">{m.weight.toFixed(1)} kg</span>}
                    {m.bodyFat && <span className="text-muted">{m.bodyFat.toFixed(1)}% fat</span>}
                    {Object.keys(m.measurements).length > 0 && (
                      <span className="text-muted">{Object.keys(m.measurements).length} measurements</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                  <Trash2 size={14} className="text-muted hover:text-red-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); reset() }} title="Log Body Metrics">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
            </div>
            <Input label="Weight (kg)" type="number" step="0.1" placeholder="0.0" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <Input label="Body Fat %" type="number" step="0.1" placeholder="Optional" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />

          <div>
            <p className="mb-2 text-sm font-medium text-muted">Measurements (cm)</p>
            <div className="grid grid-cols-2 gap-3">
              {measurementFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-muted">{field.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measurements[field.key] ?? ''}
                    onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="--"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); reset() }} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!date}>
              Save Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

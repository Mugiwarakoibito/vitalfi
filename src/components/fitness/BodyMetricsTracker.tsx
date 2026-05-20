import { useState, useMemo } from 'react'
import { Plus, Trash2, TrendingDown, TrendingUp, Minus, Activity, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory } from '@/lib/calculations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { BodyMetric } from '@/types/fitness'

interface BodyMetricsTrackerProps { heightCm?: number }
const measurementFields = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'thighs', label: 'Thighs' },
  { key: 'calves', label: 'Calves' },
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
]

export function BodyMetricsTracker({ heightCm }: BodyMetricsTrackerProps) {
  const { bodyMetrics, addBodyMetric, deleteBodyMetric } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [deletingEntry, setDeletingEntry] = useState<BodyMetric | null>(null)

  const sorted = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bodyMetrics])
  const latest = sorted[0]
  const previous = sorted[1]
  const weightChange = latest && previous && latest.weight && previous.weight ? latest.weight - previous.weight : 0

  const reset = () => { setDate(new Date().toISOString().split('T')[0]); setWeight(''); setBodyFat(''); setMeasurements({}) }

  const handleSave = async () => {
    const numericMeasurements: Record<string, number> = {}
    Object.entries(measurements).forEach(([k, v]) => { const num = parseFloat(v); if (!isNaN(num) && num > 0) numericMeasurements[k] = num })
    await addBodyMetric({ id: generateId(), date, weight: weight ? parseFloat(weight) : undefined, bodyFat: bodyFat ? parseFloat(bodyFat) : undefined, measurements: numericMeasurements, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    reset()
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    await deleteBodyMetric(deletingEntry.id)
    setDeletingEntry(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2"><Activity className="w-4 h-4" /><span>Current Weight</span></div>
            <div className="flex items-baseline gap-2"><p className="text-3xl font-bold text-white">{latest?.weight?.toFixed(1) ?? '--'}</p><span className="text-sm text-gray-500">kg</span></div>
            {weightChange !== 0 && <div className={`mt-1 flex items-center gap-1 text-xs ${weightChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{weightChange < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</div>}
            {weightChange === 0 && previous && <div className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Minus size={12} /> No change</div>}
          </div>
        </div>
        {heightCm && latest?.weight && (
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2"><Activity className="w-4 h-4" /><span>BMI</span></div>
              <p className="text-3xl font-bold text-white">{calculateBMI(latest.weight!, heightCm)}</p>
              <p className={`text-xs ${bmiCategory(calculateBMI(latest.weight!, heightCm)).color}`}>{bmiCategory(calculateBMI(latest.weight!, heightCm)).label}</p>
            </div>
          </div>
        )}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2"><Activity className="w-4 h-4" /><span>Body Fat</span></div>
            <div className="flex items-baseline gap-2"><p className="text-3xl font-bold text-white">{latest?.bodyFat?.toFixed(1) ?? '--'}</p><span className="text-sm text-gray-500">%</span></div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2"><Activity className="w-4 h-4" /><span>Entries</span></div>
            <p className="text-3xl font-bold text-white">{bodyMetrics.length}</p>
            <p className="text-xs text-gray-500 mt-1">{sorted[sorted.length - 1]?.date ? new Date(sorted[sorted.length - 1].date).toLocaleDateString() : '--'}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Body Metrics</h3>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Entry
        </Button>
      </div>

      {bodyMetrics.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-rose-400/50" /></div>
          <p className="text-gray-400 mb-1">No body metrics logged yet</p>
          <p className="text-gray-500 text-sm mb-4">Start tracking your progress</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Log Your First Entry
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 20px rgba(244,63,94,0.15)'}}><Activity className="w-5 h-5 text-rose-400" /></div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{new Date(m.date).toLocaleDateString()}</h4>
                      <div className="flex gap-3 text-sm">
                        {m.weight && <span className="text-gray-300">{m.weight.toFixed(1)} kg</span>}
                        {m.bodyFat && <span className="text-amber-400">{m.bodyFat.toFixed(1)}% fat</span>}
                        {Object.keys(m.measurements).length > 0 && <span className="text-gray-500">{Object.keys(m.measurements).length} measurements</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setDeletingEntry(m)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">Log Body Metrics</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-2">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-rose-500/50 focus:outline-none transition-all" /></div>
                <div><label className="block text-sm text-gray-400 mb-2">Weight (kg)</label><input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-rose-500/50 focus:outline-none transition-all" placeholder="75.0" /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-2">Body Fat %</label><input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-rose-500/50 focus:outline-none transition-all" placeholder="Optional" /></div>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Measurements (cm)</label>
                <div className="grid grid-cols-2 gap-3">
                  {measurementFields.map((field) => (
                    <div key={field.key}><label className="block text-xs text-gray-500 mb-1">{field.label}</label><input type="number" step="0.1" value={measurements[field.key] ?? ''} onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500/50 focus:outline-none transition-all" placeholder="--" /></div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); reset() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={!date} className="flex-1 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/30 transition-all disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingEntry(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Delete entry from {new Date(deletingEntry.date).toLocaleDateString()}?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingEntry(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
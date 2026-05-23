import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Trash2, TrendingDown, TrendingUp, Minus, Activity, AlertTriangle,
  Target, Ruler, Flame, ChevronUp, ChevronDown, Minus as MinusIcon,
  BarChart3, LineChart as LineChartIcon
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory } from '@/lib/calculations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { BodyMetric } from '@/types/fitness'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

const GOAL_STORAGE_KEY = 'vitalfi_body_goal_weight'

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

export function BodyMetricsTracker({ heightCm = 175 }: BodyMetricsTrackerProps) {
  const { bodyMetrics, addBodyMetric, deleteBodyMetric } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [deletingEntry, setDeletingEntry] = useState<BodyMetric | null>(null)
  const [targetWeight, setTargetWeight] = useState<string>(() => localStorage.getItem(GOAL_STORAGE_KEY) ?? '')

  useEffect(() => {
    localStorage.setItem(GOAL_STORAGE_KEY, targetWeight)
  }, [targetWeight])

  const sorted = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bodyMetrics])
  const chronological = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bodyMetrics])
  const latest = sorted[0]
  const previous = sorted[1]
  const weightChange = latest && previous && latest.weight != null && previous.weight != null ? latest.weight - previous.weight : 0

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]

  const entry7d = sorted.find(m => m.date >= sevenDaysAgo)
  const entry30d = sorted.find(m => m.date >= thirtyDaysAgo)
  const lastEntry = sorted[sorted.length - 1]

  const change7d = entry7d && latest?.weight != null && entry7d.weight != null ? latest.weight - entry7d.weight : null
  const change30d = entry30d && latest?.weight != null && entry30d.weight != null ? latest.weight - entry30d.weight : null
  const changeAll = lastEntry && latest?.weight != null && lastEntry.weight != null ? latest.weight - lastEntry.weight : null

  const goal = parseFloat(targetWeight)
  const goalPercent = goal && latest?.weight != null
    ? ((1 - Math.abs(latest.weight - goal) / Math.max(goal, latest.weight)) * 100)
    : null

  const chartData = useMemo(() => {
    return chronological.slice(-30).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weight,
      bodyFat: m.bodyFat,
      fullDate: m.date,
    }))
  }, [chronological])

  const bodyFatChartData = useMemo(() => {
    return chronological.slice(-30).filter(m => m.bodyFat != null).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyFat: m.bodyFat,
    }))
  }, [chronological])

  const reset = () => { setDate(new Date().toISOString().split('T')[0]); setWeight(''); setBodyFat(''); setMeasurements({}) }

  const handleSave = async () => {
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) return
    const bf = bodyFat ? parseFloat(bodyFat) : undefined
    if (bf != null && (isNaN(bf) || bf <= 0 || bf > 100)) return
    const numericMeasurements: Record<string, number> = {}
    Object.entries(measurements).forEach(([k, v]) => { const num = parseFloat(v); if (!isNaN(num) && num > 0) numericMeasurements[k] = num })
    await addBodyMetric({
      id: generateId(),
      date,
      weight: w,
      bodyFat: bf,
      measurements: numericMeasurements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    reset()
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    await deleteBodyMetric(deletingEntry.id)
    setDeletingEntry(null)
  }

  const bmi = latest?.weight && heightCm ? calculateBMI(latest.weight, heightCm) : null
  const bmiCat = bmi ? bmiCategory(bmi) : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2"><Activity className="w-4 h-4" /><span>Current Weight</span></div>
            <div className="flex items-baseline gap-2"><p className="text-3xl font-black text-white">{latest?.weight?.toFixed(1) ?? '--'}</p><span className="text-sm text-gray-500">kg</span></div>
            {weightChange !== 0 && <div className={`mt-1 flex items-center gap-1 text-xs ${weightChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{weightChange < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</div>}
            {weightChange === 0 && previous && <div className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Minus size={12} /> No change</div>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2"><BarChart3 className="w-4 h-4" /><span>BMI</span></div>
            <p className="text-3xl font-black text-white">{bmi != null ? bmi.toFixed(1) : '--'}</p>
            {bmiCat && <p className={`text-xs mt-1 ${bmiCat.color}`}>{bmiCat.label}</p>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2"><Flame className="w-4 h-4" /><span>Body Fat</span></div>
            <div className="flex items-baseline gap-2"><p className="text-3xl font-black text-white">{latest?.bodyFat?.toFixed(1) ?? '--'}</p><span className="text-sm text-gray-500">%</span></div>
            {previous?.bodyFat != null && latest?.bodyFat != null && (
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                {latest.bodyFat - previous.bodyFat > 0 ? <ChevronUp size={12} className="text-rose-400" /> : latest.bodyFat - previous.bodyFat < 0 ? <ChevronDown size={12} className="text-emerald-400" /> : null}
                {Math.abs(latest.bodyFat - previous.bodyFat).toFixed(1)}% change
              </div>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2"><Ruler className="w-4 h-4" /><span>Entries</span></div>
            <p className="text-3xl font-black text-white">{bodyMetrics.length}</p>
            <p className="text-xs text-gray-500 mt-1">{sorted[sorted.length - 1]?.date ? new Date(sorted[sorted.length - 1].date).toLocaleDateString() : '--'}</p>
          </div>
        </div>
      </div>

      {bodyMetrics.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex items-center gap-3 py-3 px-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${change7d != null && change7d < 0 ? 'bg-emerald-500/20' : change7d != null && change7d > 0 ? 'bg-rose-500/20' : 'bg-white/5'}`}>
              {change7d != null && change7d !== 0 ? (change7d < 0 ? <TrendingDown size={14} className="text-emerald-400" /> : <TrendingUp size={14} className="text-rose-400" />) : <MinusIcon size={14} className="text-gray-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">7-Day Change</p>
              <p className={`text-sm font-semibold ${change7d != null && change7d < 0 ? 'text-emerald-400' : change7d != null && change7d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                {change7d != null ? `${change7d > 0 ? '+' : ''}${change7d.toFixed(1)} kg` : '--'}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 py-3 px-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${change30d != null && change30d < 0 ? 'bg-emerald-500/20' : change30d != null && change30d > 0 ? 'bg-rose-500/20' : 'bg-white/5'}`}>
              {change30d != null && change30d !== 0 ? (change30d < 0 ? <TrendingDown size={14} className="text-emerald-400" /> : <TrendingUp size={14} className="text-rose-400" />) : <MinusIcon size={14} className="text-gray-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">30-Day Change</p>
              <p className={`text-sm font-semibold ${change30d != null && change30d < 0 ? 'text-emerald-400' : change30d != null && change30d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                {change30d != null ? `${change30d > 0 ? '+' : ''}${change30d.toFixed(1)} kg` : '--'}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 py-3 px-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${changeAll != null && changeAll < 0 ? 'bg-emerald-500/20' : changeAll != null && changeAll > 0 ? 'bg-rose-500/20' : 'bg-white/5'}`}>
              {changeAll != null && changeAll !== 0 ? (changeAll < 0 ? <TrendingDown size={14} className="text-emerald-400" /> : <TrendingUp size={14} className="text-rose-400" />) : <MinusIcon size={14} className="text-gray-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">All-Time Change</p>
              <p className={`text-sm font-semibold ${changeAll != null && changeAll < 0 ? 'text-emerald-400' : changeAll != null && changeAll > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                {changeAll != null ? `${changeAll > 0 ? '+' : ''}${changeAll.toFixed(1)} kg` : '--'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {goal && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-400" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Target Weight: {goal.toFixed(1)} kg</p>
              {latest?.weight != null && (
                <p className="text-xs text-gray-500">
                  {Math.abs(latest.weight - goal).toFixed(1)} kg {latest.weight > goal ? 'above' : 'below'} goal
                </p>
              )}
            </div>
            {goalPercent != null && (
              <span className="text-xs font-semibold text-emerald-400">{Math.max(0, Math.min(100, goalPercent)).toFixed(0)}%</span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, goalPercent ?? 0))}%` }}
            />
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center"><LineChartIcon className="w-4 h-4 text-rose-400" /></div>
            <h3 className="font-semibold text-white">Weight Trend</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Weight</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Trend</span>
          </div>
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
              <YAxis stroke="#ffffff40" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#f43f5e' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={2} fill="url(#weightGradient)" dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">Add more entries to see the weight trend</div>
        )}
      </Card>

      {bodyFatChartData.length > 1 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><Flame className="w-4 h-4 text-amber-400" /></div>
            <h3 className="font-semibold text-white">Body Fat Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bodyFatChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
              <YAxis stroke="#ffffff40" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} name="Body Fat %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Measurement History</h3>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Entry
        </Button>
      </div>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-gray-400">Goal Weight</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="glass-input w-24 text-sm text-right"
            placeholder="kg"
          />
          {targetWeight && (
            <button onClick={() => setTargetWeight('')} className="text-gray-500 hover:text-gray-300 text-xs">Clear</button>
          )}
        </div>
      </Card>

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
          {sorted.map((m, idx) => {
            const prevEntry = idx < sorted.length - 1 ? sorted[idx + 1] : null
            return (
              <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(244,63,94,0.15)' }}><Activity className="w-5 h-5 text-rose-400" /></div>
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                        <div className="flex gap-3 text-sm">
                          {m.weight && <span className="text-gray-300">{m.weight.toFixed(1)} kg</span>}
                          {m.bodyFat && <span className="text-amber-400">{m.bodyFat.toFixed(1)}% fat</span>}
                          {Object.keys(m.measurements).length > 0 && <span className="text-gray-500">{Object.keys(m.measurements).length} measurements</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDeletingEntry(m)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {Object.keys(m.measurements).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {measurementFields.map((field) => {
                        const val = m.measurements[field.key]
                        const prevVal = prevEntry?.measurements?.[field.key]
                        const change = val != null && prevVal != null ? val - prevVal : null
                        if (val == null) return null
                        return (
                          <div key={field.key} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                            <span className="text-xs text-gray-500">{field.label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-white">{val.toFixed(1)}</span>
                              {change !== null && (
                                change !== 0 ? (
                                  <span className={change > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                    {change > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </span>
                                ) : (
                                  <span className="text-gray-600"><MinusIcon size={12} /></span>
                                )
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {bmi != null && m.weight && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500">BMI: {calculateBMI(m.weight, heightCm)}</span>
                      <span className={`text-xs ${bmiCategory(calculateBMI(m.weight, heightCm)).color}`}>
                        {bmiCategory(calculateBMI(m.weight, heightCm)).label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">Log Body Metrics</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Weight (kg) *</label>
                  <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="glass-input w-full" placeholder="75.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Body Fat %</label>
                <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="glass-input w-full" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Measurements (cm)</label>
                <div className="grid grid-cols-2 gap-3">
                  {measurementFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                      <input type="number" step="0.1" value={measurements[field.key] ?? ''} onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })} className="glass-input w-full" placeholder="--" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); reset() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
                <button onClick={handleSave} disabled={!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0} className="flex-1 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/30 transition-all disabled:opacity-50 text-sm">Save</button>
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
              <button onClick={() => setDeletingEntry(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

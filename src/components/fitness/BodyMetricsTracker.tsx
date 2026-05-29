import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, TrendingDown, TrendingUp, Minus, Activity, AlertTriangle,
  Target, Flame, ChevronUp, ChevronDown, Minus as MinusIcon,
  LineChart as LineChartIcon, Gauge, ArrowRight, Sparkles, X,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory } from '@/lib/calculations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { BodyMetric } from '@/types/fitness'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'

const GOAL_STORAGE_KEY = 'vitalfi_body_goal_weight'
const GOAL_BF_KEY = 'vitalfi_body_goal_bf'

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
  const [showSettings, setShowSettings] = useState(false)
  const [goalBodyFat, setGoalBodyFat] = useState<string>(() => localStorage.getItem(GOAL_BF_KEY) ?? '')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => { localStorage.setItem(GOAL_STORAGE_KEY, targetWeight) }, [targetWeight])
  useEffect(() => { localStorage.setItem(GOAL_BF_KEY, goalBodyFat) }, [goalBodyFat])

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent p-6 shadow-lg shadow-rose-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/15 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="text-rose-400/80 text-xs font-medium uppercase tracking-wider mb-2">Current Weight</div>
            <p className="text-4xl font-bold text-rose-400 drop-shadow-lg shadow-rose-500/20">{latest?.weight?.toFixed(1) ?? '--'}<span className="text-sm text-gray-500 ml-1 font-normal">kg</span></p>
            {weightChange !== 0 && <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${weightChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{weightChange < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</div>}
            {weightChange === 0 && previous && <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500"><Minus size={16} /> No change</div>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-500/5 to-transparent p-6 shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="text-purple-400/80 text-xs font-medium uppercase tracking-wider mb-2">BMI</div>
            <p className="text-4xl font-bold text-purple-400 drop-shadow-lg">{bmi != null ? bmi.toFixed(1) : '--'}</p>
            {bmiCat && <p className={`text-sm font-medium mt-2 ${bmiCat.color}`}>{bmiCat.label}</p>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent p-6 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mb-2">Body Fat</div>
            <p className="text-4xl font-bold text-amber-400 drop-shadow-lg">{latest?.bodyFat?.toFixed(1) ?? '--'}<span className="text-sm text-gray-500 ml-1 font-normal">%</span></p>
            {previous?.bodyFat != null && latest?.bodyFat != null && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-400">
                {latest.bodyFat - previous.bodyFat > 0 ? <ChevronUp size={16} className="text-rose-400" /> : latest.bodyFat - previous.bodyFat < 0 ? <ChevronDown size={16} className="text-emerald-400" /> : null}
                {Math.abs(latest.bodyFat - previous.bodyFat).toFixed(1)}% change
              </div>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="text-gray-400/80 text-xs font-medium uppercase tracking-wider mb-2">Entries</div>
            <p className="text-4xl font-bold text-gray-400 drop-shadow-lg">{bodyMetrics.length}</p>
            <p className="text-sm text-gray-500 mt-2">{sorted[sorted.length - 1]?.date ? new Date(sorted[sorted.length - 1].date).toLocaleDateString() : '--'}</p>
          </div>
        </div>
      </div>

      {bodyMetrics.length >= 2 && (
      <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5 shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8 blur-md" />
            <div className="relative flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${change7d != null && change7d < 0 ? 'bg-emerald-500/20 shadow-emerald-500/10' : change7d != null && change7d > 0 ? 'bg-rose-500/20 shadow-rose-500/10' : 'bg-white/5'} shadow-lg`}>
                {change7d != null && change7d !== 0 ? (change7d < 0 ? <TrendingDown size={20} className="text-emerald-400" /> : <TrendingUp size={20} className="text-rose-400" />) : <MinusIcon size={20} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">7-Day</p>
                <p className={`text-lg font-bold ${change7d != null && change7d < 0 ? 'text-emerald-400' : change7d != null && change7d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {change7d != null ? `${change7d > 0 ? '+' : ''}${change7d.toFixed(1)} kg` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-5 shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 blur-md" />
            <div className="relative flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${change30d != null && change30d < 0 ? 'bg-emerald-500/20 shadow-emerald-500/10' : change30d != null && change30d > 0 ? 'bg-rose-500/20 shadow-rose-500/10' : 'bg-white/5'} shadow-lg`}>
                {change30d != null && change30d !== 0 ? (change30d < 0 ? <TrendingDown size={20} className="text-emerald-400" /> : <TrendingUp size={20} className="text-rose-400" />) : <MinusIcon size={20} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">30-Day</p>
                <p className={`text-lg font-bold ${change30d != null && change30d < 0 ? 'text-emerald-400' : change30d != null && change30d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {change30d != null ? `${change30d > 0 ? '+' : ''}${change30d.toFixed(1)} kg` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-5 shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 blur-md" />
            <div className="relative flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${change30d != null && change30d < 0 ? 'bg-emerald-500/20 shadow-emerald-500/10' : change30d != null && change30d > 0 ? 'bg-rose-500/20 shadow-rose-500/10' : 'bg-white/5'} shadow-lg`}>
                {change30d != null && change30d !== 0 ? (change30d < 0 ? <TrendingDown size={20} className="text-emerald-400" /> : <TrendingUp size={20} className="text-rose-400" />) : <MinusIcon size={20} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">30-Day</p>
                <p className={`text-lg font-bold ${change30d != null && change30d < 0 ? 'text-emerald-400' : change30d != null && change30d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {change30d != null ? `${change30d > 0 ? '+' : ''}${change30d.toFixed(1)} kg` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 blur-md" />
            <div className="relative flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${changeAll != null && changeAll < 0 ? 'bg-emerald-500/20 shadow-emerald-500/10' : changeAll != null && changeAll > 0 ? 'bg-rose-500/20 shadow-rose-500/10' : 'bg-white/5'} shadow-lg`}>
                {changeAll != null && changeAll !== 0 ? (changeAll < 0 ? <TrendingDown size={20} className="text-emerald-400" /> : <TrendingUp size={20} className="text-rose-400" />) : <MinusIcon size={20} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                <p className={`text-lg font-bold ${changeAll != null && changeAll < 0 ? 'text-emerald-400' : changeAll != null && changeAll > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {changeAll != null ? `${changeAll > 0 ? '+' : ''}${changeAll.toFixed(1)} kg` : '--'}
                </p>
              </div>
            </div>
          </div>
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

      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-transparent p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/[0.06] rounded-full -mr-24 -mt-24 blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/[0.04] rounded-full -ml-16 -mb-16 blur-xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/10"><LineChartIcon className="w-5 h-5 text-rose-400" /></div>
              <div>
                <h3 className="font-semibold text-white text-lg">Weight Trend</h3>
                <p className="text-xs text-gray-500">Last 30 entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span>Weight</span>
            </div>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                <YAxis stroke="#ffffff40" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} fill="url(#weightGradient)" dot={false} activeDot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#1a1a2e' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">Add more entries to see the weight trend</div>
          )}
        </div>
      </div>

      {bodyFatChartData.length > 1 && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-6">
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/[0.06] rounded-full -ml-20 -mt-20 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10"><Flame className="w-5 h-5 text-amber-400" /></div>
              <div>
                <h3 className="font-semibold text-white text-lg">Body Fat Trend</h3>
                <p className="text-xs text-gray-500">Last 30 entries</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={bodyFatChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                <YAxis stroke="#ffffff40" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#1a1a2e' }} name="Body Fat %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {goal && latest?.weight != null && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent p-6 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.06] rounded-full -mr-24 -mt-24 blur-xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/[0.04] rounded-full -ml-16 -mb-16 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10"><Sparkles className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <h3 className="font-semibold text-white text-lg">Goal Projection</h3>
                <p className="text-xs text-gray-500">{goal.toFixed(1)} kg target</p>
              </div>
              <div className="ml-auto text-right">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-400">{Math.max(0, Math.min(100, goalPercent ?? 0)).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-3xl font-bold text-white">{latest.weight.toFixed(1)} <span className="text-sm text-gray-500 font-normal">kg</span></p>
                <div className="flex items-center gap-2 mt-2 text-sm text-emerald-400">
                  <ArrowRight className="w-4 h-4" />
                  <span>{goal.toFixed(1)} kg target</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-3xl font-bold text-amber-400">{Math.abs(latest.weight - goal).toFixed(1)} <span className="text-sm text-gray-500 font-normal">kg</span></p>
                <p className="text-sm text-gray-400 mt-2">{latest.weight > goal ? 'to lose' : 'to gain'}</p>
              </div>
            </div>
            {change7d != null && Math.abs(change7d) > 0 && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-purple-500/10 border border-emerald-500/20 p-4 shadow-inner">
                <p className="text-sm text-gray-400">
                  At current rate (~<span className="text-white font-semibold">{Math.abs(change7d).toFixed(2)} kg/week</span>), you'll reach your goal in{' '}
                  <span className="text-emerald-400 font-bold text-lg">{Math.ceil(Math.abs(latest.weight - goal) / Math.abs(change7d))} weeks</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {chronological.length >= 3 && (() => {
        const measureChartData = chronological.slice(-20).map(m => {
          const entry: any = { date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
          measurementFields.forEach(f => { if (m.measurements?.[f.key] != null) entry[f.key] = m.measurements[f.key] })
          return entry
        })
        const hasMeasureData = measureChartData.some(d => measurementFields.some(f => d[f.key as string] != null))
        if (!hasMeasureData) return null
        const COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6']
        const activeFields = measurementFields.filter(f => measureChartData.some(d => d[f.key] != null))
        return (
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-6">
            <div className="absolute top-0 left-0 w-40 h-40 bg-violet-500/[0.06] rounded-full -ml-20 -mt-20 blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10"><Gauge className="w-5 h-5 text-violet-400" /></div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Measurements Trend</h3>
                  <p className="text-xs text-gray-500">{activeFields.map(f => f.label).join(', ')}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={measureChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                  <YAxis stroke="#ffffff40" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  {activeFields.map((f, i) => (
                    <Line key={f.key} type="monotone" dataKey={f.key} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#1a1a2e' }} name={f.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })()}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Measurement History</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4 h-4" />
          </button>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Entry
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5 shadow-lg shadow-emerald-500/5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-lg" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10"><Target className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-sm font-semibold text-white">Goal Weight</p>
              <p className="text-xs text-gray-500">Set your target weight</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-right font-medium focus:border-emerald-500/50 focus:outline-none transition-all placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="kg"
            />
            {targetWeight && (
              <button onClick={() => setTargetWeight('')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg"><Settings className="w-5 h-5 text-rose-400" /></div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Body Tracker Settings</h3>
                      <p className="text-xs text-gray-500">Goals & data management</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-5">
                  {/* Goal Weight */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Goal Weight (kg)</label>
                    <input type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/30 text-white font-semibold focus:border-emerald-400/60 focus:outline-none transition-all" placeholder="e.g. 75" />
                    {targetWeight && latest?.weight != null && (
                      <p className="mt-2 text-xs text-gray-500">
                        {Math.abs(latest.weight - parseFloat(targetWeight)).toFixed(1)} kg {latest.weight > parseFloat(targetWeight) ? 'above' : 'below'} goal
                      </p>
                    )}
                  </div>

                  {/* Goal Body Fat */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Goal Body Fat (%)</label>
                    <input type="number" step="0.1" min={3} max={50} value={goalBodyFat} onChange={(e) => setGoalBodyFat(e.target.value)} className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-amber-500/30 text-white font-semibold focus:border-amber-400/60 focus:outline-none transition-all" placeholder="e.g. 15" />
                    {goalBodyFat && latest?.bodyFat != null && (
                      <p className="mt-2 text-xs text-gray-500">
                        {Math.abs(latest.bodyFat - parseFloat(goalBodyFat)).toFixed(1)}% {latest.bodyFat > parseFloat(goalBodyFat) ? 'above' : 'below'} goal
                      </p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Entries</p>
                      <p className="text-xl font-bold text-white mt-1">{bodyMetrics.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date Range</p>
                      <p className="text-xs font-bold text-white mt-1">
                        {bodyMetrics.length > 1
                          ? `${new Date(sorted[sorted.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(sorted[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : bodyMetrics.length === 1 ? '1 entry' : 'No data'}
                      </p>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Data Management</h4>
                    {!confirmClear ? (
                      <button onClick={() => setConfirmClear(true)} className="w-full px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Clear All Body Data
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400/80 text-center">This permanently deletes all body metric entries.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmClear(false)} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs">Cancel</button>
                          <button onClick={() => { bodyMetrics.forEach(m => deleteBodyMetric(m.id)); setConfirmClear(false) }} className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-xs font-semibold">Delete All</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

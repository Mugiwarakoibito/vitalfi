import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Zap, Brain, Activity, Smile,
  Droplets, Plus, Trash2, X, AlertTriangle,
  CalendarDays, TrendingUp, Thermometer,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface RecoveryEntry {
  id: string
  date: string
  energy: number
  soreness: number
  stress: number
  mood: number
  sleepQuality: number
  domsAreas: string[]
  notes?: string
  createdAt: string
}

interface HydrationEntry {
  id: string
  date: string
  amount: number
  timestamp: string
  note?: string
  createdAt: string
  updatedAt: string
}

const MUSCLE_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
]

const STORAGE_KEY = 'vitalfi_recovery_entries'
const QUICK_WATER = [100, 250, 500, 750, 1000]
const HYDRATION_GOAL = 2500

function loadEntries(): RecoveryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function getReadiness(energy: number, soreness: number, stress: number, mood: number): { score: number; label: string; color: string } {
  const eScore = (energy / 10) * 30
  const soScore = Math.max(0, (1 - soreness / 10) * 25)
  const stScore = Math.max(0, (1 - stress / 10) * 25)
  const mScore = (mood / 5) * 20
  const total = Math.round(eScore + soScore + stScore + mScore)
  const label = total >= 85 ? 'Peak' : total >= 70 ? 'Ready' : total >= 50 ? 'Fair' : total >= 30 ? 'Tired' : 'Exhausted'
  const color = total >= 85 ? '#10b981' : total >= 70 ? '#06b6d4' : total >= 50 ? '#f59e0b' : total >= 30 ? '#f97316' : '#ef4444'
  return { score: total, label, color }
}

export function Recovery() {
  const { hydration, addHydration } = useAppStore()
  const [entries, setEntries] = useState<RecoveryEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ energy: 7, soreness: 3, stress: 4, mood: 4, sleepQuality: 4, domsAreas: [] as string[], notes: '' })
  const [deleteTarget, setDeleteTarget] = useState<RecoveryEntry | null>(null)
  const [waterAmount, setWaterAmount] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) }, [entries])

  const today = new Date().toISOString().split('T')[0]

  const todayEntry = useMemo(() => entries.find(e => e.date === today), [entries, today])

  const recentWeek = useMemo(() => {
    const days: { date: string; label: string; readiness: number; energy: number; soreness: number; sleepQuality: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const entry = entries.find(e => e.date === ds)
      days.push({
        date: ds,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        readiness: entry ? getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood).score : 0,
        energy: entry?.energy || 0,
        soreness: entry?.soreness || 0,
        sleepQuality: entry?.sleepQuality || 0,
      })
    }
    return days
  }, [entries])

  const avgReadiness = useMemo(() => {
    if (recentWeek.length === 0) return 0
    return Math.round(recentWeek.reduce((s, d) => s + d.readiness, 0) / recentWeek.filter(d => d.readiness > 0).length)
  }, [recentWeek])

  const readinessPrediction = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0).map(d => d.readiness)
    if (vals.length === 0) return null
    const predicted = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    const todaySleep = todayEntry?.sleepQuality ?? 0
    const avgSleep = recentWeek.filter(d => d.sleepQuality > 0).reduce((s, d) => s + d.sleepQuality, 0) / Math.max(recentWeek.filter(d => d.sleepQuality > 0).length, 1)
    const adjustment = todaySleep > 0 && todaySleep < avgSleep ? -Math.round((avgSleep - todaySleep) * 5) : 0
    return Math.max(0, Math.min(100, predicted + adjustment))
  }, [recentWeek, todayEntry])

  const domsHeatScore = useMemo(() => {
    if (!todayEntry) return null
    return Math.round((todayEntry.domsAreas.length / MUSCLE_AREAS.length) * 100)
  }, [todayEntry])

  const todayHydration = useMemo(() =>
    hydration.filter((h: HydrationEntry) => h.date === today).reduce((s: number, h: HydrationEntry) => s + h.amount, 0),
    [hydration, today]
  )

  const todayHydrationProgress = useMemo(() => Math.min(todayHydration / HYDRATION_GOAL, 1), [todayHydration])

  const todayReadiness = todayEntry ? getReadiness(todayEntry.energy, todayEntry.soreness, todayEntry.stress, todayEntry.mood) : null

  const saveEntry = () => {
    const entry: RecoveryEntry = {
      id: generateId(),
      date: today,
      ...formData,
      createdAt: new Date().toISOString(),
    }
    const existing = entries.findIndex(e => e.date === today)
    if (existing >= 0) {
      const updated = [...entries]
      updated[existing] = entry
      setEntries(updated)
    } else {
      setEntries([entry, ...entries])
    }
    setShowForm(false)
  }

  const addWater = (amount: number) => {
    addHydration({
      id: generateId(),
      date: today,
      amount,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const toggleDomArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      domsAreas: prev.domsAreas.includes(area)
        ? prev.domsAreas.filter(a => a !== area)
        : [...prev.domsAreas, area],
    }))
  }

  const Slider = ({ label, value, onChange, min = 1, max = 10, color }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-bold ${color || 'text-white'}`}>{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
        style={{ accentColor: color || '#8b5cf6' }} />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recovery</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track readiness, soreness, stress & hydration</p>
          {/* Sparkline under headline */}
          {recentWeek.some(d => d.readiness > 0) && (
            <div className="mt-1.5 h-7 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentWeek}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="readiness" stroke="#10b981" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
                  <YAxis hide domain={[0, 100]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {todayEntry ? 'Update' : 'Log'} Today
        </Button>
      </div>

      {/* Readiness Ring + Hydration Ring */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-6 shadow-lg shadow-emerald-500/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full -ml-16 -mb-16 blur-xl" />
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative flex-shrink-0">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={todayReadiness?.color || '#6b7280'} strokeWidth="8"
                strokeDasharray={`${((todayReadiness?.score || 0) / 100) * 327} 327`} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white drop-shadow-lg" style={{ color: todayReadiness?.color }}>{todayReadiness?.score || '--'}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">{todayReadiness?.label || 'No data'}</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="relative rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] to-transparent p-4 text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{todayEntry?.energy ?? '--'}</p>
              <p className="text-[10px] text-gray-500">Energy</p>
            </div>
            <div className="relative rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.12] to-transparent p-4 text-center">
              <Activity className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{todayEntry?.soreness ?? '--'}</p>
              <p className="text-[10px] text-gray-500">Soreness</p>
            </div>
            <div className="relative rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.12] to-transparent p-4 text-center">
              <Brain className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{todayEntry?.stress ?? '--'}</p>
              <p className="text-[10px] text-gray-500">Stress</p>
            </div>
            <div className="relative rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] to-transparent p-4 text-center">
              <Smile className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{todayEntry?.mood ?? '--'}</p>
              <p className="text-[10px] text-gray-500">Mood</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week Trend + DOMS + Prediction + Hydration Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">7-Day Readiness Trend</h4>
            <span className="text-xs text-gray-500 ml-auto">Avg: {avgReadiness}</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentWeek}>
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="readiness" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {recentWeek.map((entry, idx) => (
                    <rect key={idx} fill={entry.readiness > 0 ? '#10b981' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Readiness Prediction */}
          {readinessPrediction !== null && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-gray-500">Expected tomorrow:</span>
              <span className={`font-bold ${readinessPrediction >= 70 ? 'text-emerald-400' : readinessPrediction >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {readinessPrediction}
              </span>
              <span className="text-gray-600">/100</span>
              {todayEntry && todayEntry.sleepQuality < 3 && (
                <span className="text-amber-500/70 text-[10px]">(low sleep detected)</span>
              )}
            </div>
          )}
        </div>

        {/* DOMS Areas + Heat Score */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">DOMS Map</h4>
            {todayEntry && (
              <div className="flex items-center gap-2 ml-auto">
                {domsHeatScore !== null && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                    domsHeatScore >= 50 ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      : domsHeatScore >= 30 ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <Thermometer className="w-2.5 h-2.5" />
                    {domsHeatScore}%
                  </span>
                )}
                <span className="text-xs text-gray-500">{todayEntry.domsAreas.length} areas</span>
              </div>
            )}
          </div>
          {!todayEntry ? (
            <p className="text-sm text-gray-500 text-center py-4">Log today's recovery to track soreness</p>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {MUSCLE_AREAS.map(area => {
                const isSore = todayEntry.domsAreas.includes(area)
                return (
                  <div key={area} className={`rounded-lg p-2 text-center border transition-all ${
                    isSore ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white/[0.03] border-white/5'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${isSore ? 'bg-rose-400 shadow-sm shadow-rose-400/50' : 'bg-gray-600'}`} />
                    <p className={`text-[9px] font-medium ${isSore ? 'text-rose-300' : 'text-gray-600'}`}>{area}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hydration Section with Progress Ring */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] to-transparent p-5 shadow-lg shadow-sky-500/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
        <div className="relative flex flex-col md:flex-row items-center gap-5">
          {/* Hydration Goal Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#06b6d4" strokeWidth="6"
                strokeDasharray={`${todayHydrationProgress * 201} 201`} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Droplets className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Hydration</h4>
                <span className="text-xs text-gray-500">{todayHydration}ml / {HYDRATION_GOAL}ml</span>
              </div>
              <span className="text-xs font-bold text-sky-400">{Math.round(todayHydrationProgress * 100)}%</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
              {QUICK_WATER.map(amount => (
                <button key={amount} onClick={() => addWater(amount)}
                  className="py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all text-xs font-medium">
                  +{amount}ml
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input type="number" value={waterAmount} onChange={e => setWaterAmount(e.target.value)}
                placeholder="Custom ml" className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-sky-500/50 focus:outline-none transition-all" />
              <Button variant="primary" size="sm" onClick={() => { if (waterAmount) { addWater(Number(waterAmount)); setWaterAmount('') } }}>
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      {entries.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-400" />
            Recovery History
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entries.slice(0, 14).map(entry => {
              const r = getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood)
              return (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-all group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
                    style={{ borderColor: r.color }}>
                    <span className="text-xs font-bold text-white">{r.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span>E:{entry.energy}</span>
                      <span>S:{entry.soreness}</span>
                      <span>St:{entry.stress}</span>
                      <span>M:{entry.mood}</span>
                    </div>
                  </div>
                  <button onClick={() => setDeleteTarget(entry)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Log Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{todayEntry ? 'Update' : 'Log'} Recovery</h3>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <Slider label="Energy Level" value={formData.energy} onChange={v => setFormData(prev => ({ ...prev, energy: v }))} color="#f59e0b" />
              <Slider label="Muscle Soreness" value={formData.soreness} onChange={v => setFormData(prev => ({ ...prev, soreness: v }))} color="#ef4444" />
              <Slider label="Stress Level" value={formData.stress} onChange={v => setFormData(prev => ({ ...prev, stress: v }))} color="#8b5cf6" />
              <Slider label="Mood" value={formData.mood} onChange={v => setFormData(prev => ({ ...prev, mood: v }))} min={1} max={5} color="#10b981" />
              <Slider label="Sleep Quality" value={formData.sleepQuality} onChange={v => setFormData(prev => ({ ...prev, sleepQuality: v }))} min={1} max={5} color="#06b6d4" />
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">Soreness Areas (DOMS)</p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLE_AREAS.map(area => (
                    <button key={area} onClick={() => toggleDomArea(area)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        formData.domsAreas.includes(area)
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <input value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes (optional)" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
                <button onClick={saveEntry} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>{deleteTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={() => { setEntries(prev => prev.filter(e => e.id !== deleteTarget.id)); setDeleteTarget(null) }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}

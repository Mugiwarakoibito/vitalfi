import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, Clock, X, AlertTriangle, Calendar, TrendingUp,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Target, Flame, Activity,
  DollarSign, Layers, CalendarCheck, Download, Settings,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { generateId, cn } from '@/lib/utils'

interface Supplement {
  id: string
  name: string
  dosage: string
  frequency: 'daily' | 'weekly' | 'custom'
  times: string[]
  notes?: string
  refillDays?: number
  stack?: string
  cost?: number
  totalServings?: number
}

interface SupplementLog {
  id: string
  supplementId: string
  takenAt: string
  date: string
}

const TIMES_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night'] as const
type TimeOfDay = (typeof TIMES_OF_DAY)[number]

const TIME_ICONS: Record<TimeOfDay, typeof Sun> = { Morning: Sun, Afternoon: Sunrise, Evening: Sunset, Night: Moon }

const TIME_COLORS: Record<TimeOfDay, string> = {
  Morning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Afternoon: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Evening: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Night: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU' }, { name: 'Omega-3 Fish Oil', dosage: '2000mg' },
  { name: 'Creatine', dosage: '5g' }, { name: 'Whey Protein', dosage: '30g' },
  { name: 'Magnesium', dosage: '400mg' }, { name: 'Zinc', dosage: '30mg' },
  { name: 'Multivitamin', dosage: '1 tablet' }, { name: 'Collagen', dosage: '10g' },
  { name: 'Pre-workout', dosage: '1 scoop' }, { name: 'BCAA', dosage: '5g' },
]

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  )
}

function exportCSV(supplements: Supplement[], logs: SupplementLog[]) {
  const headers = 'Supplement,Dosage,Frequency,Times,Stack,Cost,TotalServings,LogCount\n'
  const rows = supplements.map(s => {
    const logCount = logs.filter(l => l.supplementId === s.id).length
    return `${s.name},${s.dosage},${s.frequency},${s.times.join(';')},${s.stack ?? ''},${s.cost ?? ''},${s.totalServings ?? ''},${logCount}`
  }).join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `vitalfi_supps_${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplement | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [formData, setFormData] = useState({
    name: '', dosage: '', frequency: 'daily' as Supplement['frequency'],
    times: [] as TimeOfDay[], notes: '', refillDays: '', stack: '', cost: '', totalServings: '',
  })
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '14d' | '30d'>('7d')
  const [showAdherencePanel, setShowAdherencePanel] = useState(false)
  const [showStackPanel, setShowStackPanel] = useState(false)
  const [showTimingPanel, setShowTimingPanel] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showRefillPanel, setShowRefillPanel] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    try {
      const stored = localStorage.getItem('supplements')
      if (stored) setSupplements(JSON.parse(stored))
      const logStored = localStorage.getItem('supplementLogs')
      if (logStored) setLogs(JSON.parse(logStored))
    } catch {}
  }, [])

  const persistSupplements = useCallback((data: Supplement[]) => { setSupplements(data); localStorage.setItem('supplements', JSON.stringify(data)) }, [])
  const persistLogs = useCallback((data: SupplementLog[]) => { setLogs(data); localStorage.setItem('supplementLogs', JSON.stringify(data)) }, [])

  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today])
  const takenTodayIds = useMemo(() => new Set(todayLogs.map((l) => l.supplementId)), [todayLogs])
  const takenTodayCount = takenTodayIds.size; const totalCount = supplements.length; const remainingCount = totalCount - takenTodayCount
  const dailySupps = useMemo(() => supplements.filter((s) => s.frequency === 'daily'), [supplements])

  const adherenceWeek = useMemo(() => {
    const days: { date: string; label: string; taken: number; total: number; pct: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr)
      const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      const total = dailySupps.length
      days.push({ date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'short' }), taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 })
    }
    return days
  }, [logs, dailySupps])

  const weekAdherence = useMemo(() => {
    const total = adherenceWeek.reduce((s, d) => s + d.total, 0); const taken = adherenceWeek.reduce((s, d) => s + d.taken, 0)
    return total > 0 ? Math.round((taken / total) * 100) : 0
  }, [adherenceWeek])

  const adherenceTrend = useMemo(() => {
    const days: { date: string; pct: number }[] = []; const now = new Date()
    const period = trendPeriod === '7d' ? 7 : trendPeriod === '14d' ? 14 : 30
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr)
      const taken = new Set(dayLogs.map((l) => l.supplementId)).size; const total = dailySupps.length
      days.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pct: total > 0 ? Math.round((taken / total) * 100) : 0 })
    }
    return days
  }, [logs, dailySupps, trendPeriod])

  const suppStreak = useMemo(() => {
    let streak = 0; const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr); const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      if (dailySupps.length > 0 && taken === dailySupps.length) streak++
      else if (dailySupps.length > 0) break
    }
    return streak
  }, [logs, dailySupps])

  const monthlyCost = useMemo(() => {
    return supplements.reduce((sum, s) => {
      if (s.cost && s.totalServings && s.totalServings > 0) return sum + (s.cost / s.totalServings) * 30
      return sum
    }, 0)
  }, [supplements])

  const supplementsByTime = useMemo(() => {
    const grouped: Record<TimeOfDay, Supplement[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] }
    for (const supp of supplements) { for (const t of supp.times) { const key = t as TimeOfDay; if (grouped[key]) grouped[key].push(supp) } }
    return grouped
  }, [supplements])

  const supplementsByStack = useMemo(() => {
    const grouped: Record<string, Supplement[]> = {}; const noStack: Supplement[] = []
    for (const supp of supplements) {
      if (supp.stack) { if (!grouped[supp.stack]) grouped[supp.stack] = []; grouped[supp.stack].push(supp) }
      else noStack.push(supp)
    }
    return { grouped, noStack }
  }, [supplements])

  const scheduleToday = useMemo(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return supplements.filter(s => { if (s.frequency === 'daily') return true; if (s.frequency === 'weekly') return s.times.some(t => t.toLowerCase() === todayName); return true })
  }, [supplements])

  const stackAdherence = useMemo(() => {
    const result: { stack: string; taken: number; total: number; pct: number }[] = []
    for (const [stack, supps] of Object.entries(supplementsByStack.grouped)) {
      const taken = supps.filter(s => takenTodayIds.has(s.id)).length
      result.push({ stack, taken, total: supps.length, pct: Math.round((taken / supps.length) * 100) })
    }
    if (supplementsByStack.noStack.length > 0) {
      const taken = supplementsByStack.noStack.filter(s => takenTodayIds.has(s.id)).length
      result.push({ stack: 'Other', taken, total: supplementsByStack.noStack.length, pct: Math.round((taken / supplementsByStack.noStack.length) * 100) })
    }
    return result
  }, [supplements, supplementsByStack, takenTodayIds])

  const refillSoon = useMemo(() => {
    const supps = supplements.filter(s => s.refillDays != null && s.refillDays <= 14)
    return supps.sort((a, b) => (a.refillDays ?? 999) - (b.refillDays ?? 999))
  }, [supplements])

  const logHistory = useMemo(() => {
    const days: { date: string; label: string; ids: string[] }[] = []; const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({ date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'short' }), ids: [...new Set(logs.filter((l) => l.date === dateStr).map((l) => l.supplementId))] })
    }
    return days
  }, [logs])

  const markAsTaken = (supp: Supplement) => {
    if (takenTodayIds.has(supp.id)) return
    const log: SupplementLog = { id: generateId(), supplementId: supp.id, takenAt: new Date().toISOString(), date: today }
    persistLogs([...logs, log])
  }

  const handleQuickAdd = (name: string, dosage: string) => { setFormData({ ...formData, name, dosage, times: formData.times.length ? formData.times : ['Morning'] }) }

  const toggleTime = (time: TimeOfDay) => { setFormData((prev) => ({ ...prev, times: prev.times.includes(time) ? prev.times.filter((t) => t !== time) : [...prev.times, time] })) }

  const resetForm = () => { setFormData({ name: '', dosage: '', frequency: 'daily', times: [], notes: '', refillDays: '', stack: '', cost: '', totalServings: '' }) }

  const addSupplement = () => {
    if (!formData.name.trim() || !formData.dosage.trim()) return
    const newSupp: Supplement = { id: generateId(), name: formData.name.trim(), dosage: formData.dosage.trim(), frequency: formData.frequency, times: formData.times.length ? [...formData.times] : ['Morning'], notes: formData.notes.trim() || undefined, refillDays: formData.refillDays ? parseInt(formData.refillDays) : undefined, stack: formData.stack.trim() || undefined, cost: formData.cost ? parseFloat(formData.cost) : undefined, totalServings: formData.totalServings ? parseInt(formData.totalServings) : undefined }
    persistSupplements([...supplements, newSupp]); setShowModal(false); resetForm()
  }

  const deleteSupplement = () => {
    if (!deleteTarget) return; const filtered = supplements.filter((s) => s.id !== deleteTarget.id)
    persistSupplements(filtered); persistLogs(logs.filter((l) => l.supplementId !== deleteTarget.id)); setDeleteTarget(null)
  }

  const timeOptions: { value: TimeOfDay; icon: typeof Sun }[] = TIMES_OF_DAY.map((t) => ({ value: t, icon: TIME_ICONS[t] }))

  const isToday = useCallback((dateStr: string) => dateStr === today, [today])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Supplements</h2>
          <p className="text-sm text-gray-400 mt-0.5">{totalCount} supplements tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {dailySupps.length > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${showAdherencePanel ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowAdherencePanel(p => !p)} title="Adherence & Trends">
              <TrendingUp className="w-5 h-5" />
            </button>
          )}
          {stackAdherence.length > 1 && (
            <button className={`p-2 rounded-xl border transition-all ${showStackPanel ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowStackPanel(p => !p)} title="Stack Adherence">
              <Layers className="w-5 h-5" />
            </button>
          )}
          {totalCount > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${showTimingPanel ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowTimingPanel(p => !p)} title="Timing Schedule">
              <Clock className="w-5 h-5" />
            </button>
          )}
          {totalCount > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${showHistoryPanel ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowHistoryPanel(p => !p)} title="7-Day History">
              <Calendar className="w-5 h-5" />
            </button>
          )}
          {refillSoon.length > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${showRefillPanel ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowRefillPanel(p => !p)} title="Refill Alerts">
              <AlertTriangle className="w-5 h-5" />
            </button>
          )}
          {supplements.length > 0 && (
            <button onClick={() => exportCSV(supplements, logs)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4 h-4" />
          </button>
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
      </motion.div>

      {/* 6 Stat Cards */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-purple-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-1">
                <Pill className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Total</span>
              </div>
              <p className="text-3xl font-bold text-purple-300 drop-shadow-lg">{totalCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">supplements</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
                <Check className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Taken Today</span>
              </div>
              <p className="text-3xl font-bold text-emerald-300 drop-shadow-lg">{takenTodayCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">{remainingCount} remaining</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
                <Target className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Remaining</span>
              </div>
              <p className="text-3xl font-bold text-amber-300 drop-shadow-lg">{remainingCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">left for today</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-violet-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Adherence</span>
              </div>
              <p className="text-3xl font-bold text-violet-300 drop-shadow-lg">{weekAdherence}%</p>
              <p className="text-xs text-gray-500 mt-0.5">this week</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Streak</span>
              </div>
              <p className="text-3xl font-bold text-amber-300 drop-shadow-lg">{suppStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
              <p className="text-xs text-gray-500 mt-0.5">perfect days</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Mo. Cost</span>
              </div>
              <p className="text-3xl font-bold text-emerald-300 drop-shadow-lg">${monthlyCost.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">estimated</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggleable Panels */}
      <AnimatePresence>
        {showAdherencePanel && dailySupps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Weekly Adherence</span>
              </div>
              <span className="text-sm font-bold text-violet-400">{weekAdherence}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${weekAdherence}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-400 to-purple-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Current Streak
                </div>
                <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{suppStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-violet-400" />
                    Trend
                  </div>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                    {(['7d', '14d', '30d'] as const).map(p => (
                      <button key={p} onClick={() => setTrendPeriod(p)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-medium transition-all ${trendPeriod === p ? 'bg-violet-500/20 text-violet-300' : 'text-gray-500 hover:text-white'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={adherenceTrend}>
                      <XAxis dataKey="date" tick={false} axisLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }} formatter={(value: number) => [`${value}%`, 'Adherence']} />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showStackPanel && stackAdherence.length > 1 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-purple-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Stack Adherence</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stackAdherence.map(sa => (
                <div key={sa.stack} className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{sa.stack}</p>
                  <p className="text-lg font-bold text-white">{sa.pct}%</p>
                  <p className="text-[10px] text-gray-500">{sa.taken}/{sa.total} taken</p>
                  <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${sa.pct >= 80 ? 'bg-emerald-500' : sa.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${sa.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showTimingPanel && totalCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Timing Schedule</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(supplementsByTime) as [TimeOfDay, Supplement[]][]).map(([time, supps]) => {
                const Icon = TIME_ICONS[time]
                return (
                  <div key={time} className={cn('rounded-xl border p-3', TIME_COLORS[time], supps.length === 0 && 'opacity-40')}>
                    <div className="flex items-center gap-1.5 mb-2"><Icon className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{time}</span></div>
                    {supps.length > 0 ? (
                      <ul className="space-y-1">{supps.map((s) => (
                        <li key={s.id} className="text-xs text-gray-300 flex items-center gap-1">
                          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', takenTodayIds.has(s.id) ? 'bg-green-400' : 'bg-gray-500')} />
                          {s.name}
                        </li>
                      ))}</ul>
                    ) : <p className="text-xs text-gray-500">No supplements</p>}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {showHistoryPanel && totalCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">7-Day History</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {logHistory.map((day) => {
                const pct = dailySupps.length > 0 ? Math.round((day.ids.length / dailySupps.length) * 100) : 0
                return (
                  <div key={day.date} className={cn('flex flex-col items-center rounded-xl p-2 border transition-all', isToday(day.date) ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/5 bg-white/[0.02]')}>
                    <span className="text-[10px] text-gray-500 mb-1">{day.label}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center mb-1 max-w-[28px]">
                      {dailySupps.slice(0, 4).map((s) => (
                        <span key={s.id} className={cn('w-2 h-2 rounded-full', day.ids.includes(s.id) ? 'bg-green-400' : 'bg-gray-600')} />
                      ))}
                    </div>
                    <span className={cn('text-[10px] font-semibold', pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-gray-500')}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {showRefillPanel && refillSoon.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-red-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Refill Alerts</span>
              <span className="text-xs text-red-400/80 ml-auto">{refillSoon.length} need refill</span>
            </div>
            <div className="space-y-1.5">
              {refillSoon.map(s => (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${(s.refillDays ?? 0) <= 7 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <div className={`w-2 h-2 rounded-full ${(s.refillDays ?? 0) <= 7 ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className="text-sm font-medium text-white flex-1">{s.name}</span>
                  <span className={`text-xs font-semibold ${(s.refillDays ?? 0) <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                    {(s.refillDays ?? 0) <= 0 ? 'Due today!' : `${s.refillDays}d left`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Schedule */}
      {totalCount > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Today's Schedule</span>
            <span className="text-xs text-gray-500 ml-auto">{scheduleToday.length} supplements</span>
          </div>
          <div className="space-y-1.5">
            {scheduleToday.map(s => {
              const taken = takenTodayIds.has(s.id)
              return (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${taken ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${taken ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-[11px] text-gray-500">{s.dosage} — {s.times.join(', ')}</p>
                  </div>
                  {s.frequency !== 'daily' && <span className="text-[10px] text-gray-500 capitalize">{s.frequency}</span>}
                  {!taken ? (
                    <button onClick={() => markAsTaken(s)} className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-medium">Take</button>
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status Banner */}
      {totalCount > 0 && (
        <div className={`relative overflow-hidden rounded-2xl border p-4 ${takenTodayCount === totalCount ? 'border-green-700/30 bg-green-900/10' : 'border-amber-700/30 bg-amber-900/10'}`}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {takenTodayCount === totalCount ? <Sparkles className="w-5 h-5 text-green-400" /> : <Target className="w-5 h-5 text-amber-400" />}
              <div>
                <p className="text-sm font-semibold text-white">{takenTodayCount}/{totalCount} supplements taken today</p>
                <p className="text-xs text-gray-400">{takenTodayCount === totalCount ? 'All done for today!' : `${remainingCount} remaining`}</p>
              </div>
            </div>
            <div className="h-2 w-28 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${totalCount > 0 ? (takenTodayCount / totalCount) * 100 : 0}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${takenTodayCount === totalCount ? 'bg-green-400' : 'bg-amber-400'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Supplement List or Empty State */}
      {totalCount === 0 ? (
        <Container>
          <div className="py-10 text-center">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
              <Pill className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <p className="text-gray-400 font-medium">No supplements tracked</p>
            <p className="text-gray-500 text-sm mt-1 mb-4">Track your daily vitamins, minerals, and supps</p>
            <Button variant="accent" size="sm" onClick={() => { resetForm(); setShowModal(true) }}><Plus className="w-4 h-4 mr-1" />Add Your First Supplement</Button>
          </div>
        </Container>
      ) : (
        <div className="space-y-4">
          {supplementsByStack.noStack.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Other</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplementsByStack.noStack.map((supp) => (
                  <SupplementCard key={supp.id} supp={supp} takenTodayIds={takenTodayIds} markAsTaken={markAsTaken} setDeleteTarget={setDeleteTarget} />
                ))}
              </div>
            </div>
          )}
          {Object.entries(supplementsByStack.grouped).map(([stackName, supps]) => (
            <div key={stackName}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stackName}</h4>
                <span className="text-[10px] text-gray-600">{supps.length} supps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supps.map((supp) => (
                  <SupplementCard key={supp.id} supp={supp} takenTodayIds={takenTodayIds} markAsTaken={markAsTaken} setDeleteTarget={setDeleteTarget} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplement Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title="Add Supplement">
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />Quick Add from Common
            </label>
            <div className="grid grid-cols-2 gap-2">
              {commonSupplements.map((s) => (
                <motion.button key={s.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleQuickAdd(s.name, s.dosage)}
                  className={cn('text-left px-3 py-2.5 rounded-xl text-xs border transition-all duration-200',
                    formData.name === s.name ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20')}>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.dosage}</div>
                </motion.button>
              ))}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Input label="Supplement Name" placeholder="e.g., Vitamin D3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} icon={<Pill className="w-4 h-4" />} />
          <Input label="Dosage" placeholder="e.g., 5000 IU" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
          <div>
            <label className="mb-2 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((freq) => (
                <button key={freq} type="button" onClick={() => setFormData({ ...formData, frequency: freq })}
                  className={cn('flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 capitalize',
                    formData.frequency === freq ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]')}>{freq}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Times of Day</label>
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map(({ value, icon: Icon }) => (
                <button key={value} type="button" onClick={() => toggleTime(value)}
                  className={cn('flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl text-xs font-medium border transition-all duration-200',
                    formData.times.includes(value) ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]')}>
                  <Icon className="w-4 h-4" />{value}
                </button>
              ))}
            </div>
          </div>
          <Input label="Stack (optional)" placeholder="e.g., Morning, Pre-Workout, Night" value={formData.stack} onChange={(e) => setFormData({ ...formData, stack: e.target.value })} icon={<Layers className="w-4 h-4" />} />
          <Input label="Notes (optional)" placeholder="Any notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Cost ($, optional)" placeholder="e.g., 29.99" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} icon={<DollarSign className="w-4 h-4" />} />
            <Input label="Total Servings (optional)" placeholder="e.g., 60" type="number" value={formData.totalServings} onChange={(e) => setFormData({ ...formData, totalServings: e.target.value })} />
          </div>
          {formData.cost && formData.totalServings && parseFloat(formData.cost) > 0 && parseInt(formData.totalServings) > 0 && (
            <p className="text-xs text-emerald-400">Cost per serving: <span className="font-bold">${(parseFloat(formData.cost) / parseInt(formData.totalServings)).toFixed(2)}</span></p>
          )}
          <Input label="Refill in (days, optional)" placeholder="e.g. 30" type="number" value={formData.refillDays} onChange={(e) => setFormData({ ...formData, refillDays: e.target.value })} />
          <Button variant="primary" onClick={addSupplement} className="w-full" disabled={!formData.name.trim() || !formData.dosage.trim()}><Plus className="w-4 h-4 mr-1" />Add Supplement</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl shadow-red-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
                    <AlertTriangle className="w-7 h-7 text-red-400 drop-shadow-sm" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Supplement?</h3>
                  <p className="text-sm text-gray-400 mb-1">Are you sure you want to delete</p>
                  <p className="text-base font-semibold text-white mb-4"><span className="text-rose-300">{deleteTarget.name}</span><span className="text-gray-500"> ({deleteTarget.dosage})</span></p>
                  <div className="px-4 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-5"><p className="text-xs text-gray-500"><X className="w-3 h-3 inline mr-1 text-rose-400/60" />This will also remove all logs.</p></div>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
                    <button onClick={deleteSupplement} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 transition-all text-sm font-semibold flex items-center justify-center gap-1.5"><Trash2 className="w-4 h-4" />Delete</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-lg"><Settings className="w-5 h-5 text-purple-400" /></div>
                    <div><h3 className="text-lg font-semibold text-white">Supplements Settings</h3><p className="text-xs text-gray-500">Export & data management</p></div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Export Data</p>
                    <button onClick={() => exportCSV(supplements, logs)}
                      className="w-full px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Export as CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Supplements</p>
                      <p className="text-lg font-bold text-white mt-1">{totalCount}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total Logs</p>
                      <p className="text-lg font-bold text-white mt-1">{logs.length}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Data Management</h4>
                    {!confirmClear ? (
                      <button onClick={() => setConfirmClear(true)}
                        className="w-full px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" /> Clear All Supplement Data
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400/80 text-center">This permanently deletes all supplements and logs.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmClear(false)}
                            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs">Cancel</button>
                          <button onClick={() => { setSupplements([]); setLogs([]); localStorage.removeItem('supplements'); localStorage.removeItem('supplementLogs'); setConfirmClear(false) }}
                            className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-xs font-semibold">Delete All</button>
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

function SupplementCard({ supp, takenTodayIds, markAsTaken, setDeleteTarget }: {
  supp: Supplement; takenTodayIds: Set<string>; markAsTaken: (s: Supplement) => void; setDeleteTarget: (s: Supplement) => void
}) {
  const taken = takenTodayIds.has(supp.id)
  const costPerServing = supp.cost && supp.totalServings && supp.totalServings > 0 ? supp.cost / supp.totalServings : null

  return (
    <motion.div layout whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <div className={`relative overflow-hidden rounded-2xl border transition-all p-4 ${taken ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/5'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${taken ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-gray-500'}`} />
              <h4 className="font-semibold text-white truncate">{supp.name}</h4>
              {supp.stack && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-300"><Layers className="w-2 h-2" />{supp.stack}</span>}
            </div>
            <p className="text-sm text-gray-400 ml-4.5">{supp.dosage}</p>
            {costPerServing !== null && <p className="text-[10px] text-emerald-400/70 ml-4.5 mt-0.5"><DollarSign className="w-2.5 h-2.5 inline" />${costPerServing.toFixed(2)}/serving</p>}
            <div className="flex flex-wrap gap-1.5 mt-2 ml-4.5">
              {supp.times.map((t) => {
                const Icon = TIME_ICONS[t as TimeOfDay] || Clock
                return <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.08] text-gray-400"><Icon className="w-2.5 h-2.5" />{t}</span>
              })}
            </div>
            {supp.notes && <p className="text-[11px] text-gray-500 mt-1.5 ml-4.5 italic truncate">{supp.notes}</p>}
            {supp.refillDays != null && (
              <div className={`ml-4.5 mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${supp.refillDays <= 7 ? 'bg-red-500/10 border border-red-500/20 text-red-300' : supp.refillDays <= 14 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                <Clock className="w-2.5 h-2.5" />Refill in {supp.refillDays}d
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {taken ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-4 h-4 text-emerald-400" /><span className="text-xs font-medium text-emerald-400">Taken</span>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => markAsTaken(supp)} className="whitespace-nowrap">
                <Check className="w-3.5 h-3.5 mr-1" />Take
              </Button>
            )}
            <button onClick={() => setDeleteTarget(supp)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

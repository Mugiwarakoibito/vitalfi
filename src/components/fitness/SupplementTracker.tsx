import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, Clock, X, AlertTriangle,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Target, Flame, Activity,
  DollarSign, Layers, CalendarCheck, Download, Settings,
  Brain, ShieldCheck, ShieldAlert, Info, Zap, Package,
  CheckCircle2, Dumbbell, TrendingUp, BarChart3,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { generateId, cn } from '@/lib/utils'

interface Supplement {
  id: string; name: string; dosage: string; frequency: 'daily' | 'weekly' | 'custom'
  times: string[]; notes?: string; refillDays?: number; stack?: string
  cost?: number; totalServings?: number
}

interface SupplementLog { id: string; supplementId: string; takenAt: string; date: string }

const TIMES_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night'] as const
type TimeOfDay = (typeof TIMES_OF_DAY)[number]
const TIME_ICONS: Record<TimeOfDay, typeof Sun> = { Morning: Sun, Afternoon: Sunrise, Evening: Sunset, Night: Moon }

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU' }, { name: 'Omega-3 Fish Oil', dosage: '2000mg' },
  { name: 'Creatine', dosage: '5g' }, { name: 'Whey Protein', dosage: '30g' },
  { name: 'Magnesium', dosage: '400mg' }, { name: 'Zinc', dosage: '30mg' },
  { name: 'Multivitamin', dosage: '1 tablet' }, { name: 'Collagen', dosage: '10g' },
  { name: 'Pre-workout', dosage: '1 scoop' }, { name: 'BCAA', dosage: '5g' },
]

const SUPP_INTERACTIONS: { a: string; b: string; type: 'synergy' | 'conflict' | 'timing'; message: string }[] = [
  { a: 'Vitamin D3', b: 'Magnesium', type: 'synergy', message: 'Magnesium activates Vitamin D' },
  { a: 'Vitamin D3', b: 'Omega-3 Fish Oil', type: 'synergy', message: 'Fat-soluble — take together' },
  { a: 'Creatine', b: 'Whey Protein', type: 'synergy', message: 'Mix together post-workout' },
  { a: 'Zinc', b: 'Magnesium', type: 'synergy', message: 'Both support sleep — night combo' },
  { a: 'Melatonin', b: 'Magnesium', type: 'synergy', message: 'Perfect nighttime duo' },
  { a: 'Collagen', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C is essential for collagen' },
  { a: 'Iron', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C 6x boosts iron absorption' },
  { a: 'Iron', b: 'Calcium', type: 'conflict', message: 'Calcium blocks iron — separate 2hrs' },
  { a: 'Zinc', b: 'Iron', type: 'conflict', message: 'Compete for absorption — separate' },
  { a: 'Magnesium', b: 'Calcium', type: 'timing', message: 'Ca in AM, Mg at night' },
  { a: 'Vitamin D3', b: 'Calcium', type: 'synergy', message: 'Vitamin D helps absorb calcium' },
  { a: 'Multivitamin', b: 'Iron', type: 'timing', message: 'Multi has iron — avoid doubling' },
  { a: 'Collagen', b: 'Whey Protein', type: 'timing', message: 'Both protein — spread across meals' },
  { a: 'Zinc', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C improves zinc uptake' },
  { a: 'Pre-workout', b: 'Whey Protein', type: 'timing', message: 'Pre 30min before, protein after' },
]

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
  const [activePanel, setActivePanel] = useState<'patterns' | 'coach' | null>(null)
  const [coachMode, setCoachMode] = useState<'insight' | 'refill' | 'stack'>('insight')
  const [showCoachModeDropdown, setShowCoachModeDropdown] = useState(false)
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '14d' | '30d'>('7d')

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

  const supplementInteractions = useMemo(() => {
    return SUPP_INTERACTIONS.filter(inter => {
      const hasA = supplements.some(s => s.name.toLowerCase().includes(inter.a.toLowerCase()))
      const hasB = supplements.some(s => s.name.toLowerCase().includes(inter.b.toLowerCase()))
      return hasA && hasB
    }).map(inter => {
      const suppA = supplements.find(s => s.name.toLowerCase().includes(inter.a.toLowerCase()))
      const suppB = supplements.find(s => s.name.toLowerCase().includes(inter.b.toLowerCase()))
      return { ...inter, suppA: suppA?.name || inter.a, suppB: suppB?.name || inter.b }
    })
  }, [supplements])

  const smartRecs = useMemo(() => {
    const total = scheduleToday.length
    const taken = takenTodayCount
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0
    const matched: { icon: typeof Dumbbell; title: string; text: string; category: string; priority: number }[] = []
    if (totalCount === 0) {
      matched.push({ icon: Pill, title: 'Get Started', text: 'Add your first supplement to begin tracking and unlock AI-powered insights.', category: 'General', priority: 10 })
    } else if (pct === 100) {
      matched.push({ icon: CheckCircle2, title: 'Perfect Day', text: `All ${total} supplements taken. You're operating at peak efficiency.`, category: 'Performance', priority: 10 })
    } else if (pct >= 50) {
      matched.push({ icon: Zap, title: 'Almost There', text: `${taken}/${total} done. ${total - taken} more to complete today's stack.`, category: 'Performance', priority: 8 })
    } else if (total > 0) {
      matched.push({ icon: AlertTriangle, title: 'Low Adherence', text: `Only ${taken}/${total} taken. Consistency compounds — each day matters.`, category: 'Recovery', priority: 9 })
    }
    if (suppStreak >= 7) matched.push({ icon: Flame, title: 'Streak Master', text: `${suppStreak}-day perfect streak. You're in the top tier of supplement discipline.`, category: 'Performance', priority: 7 })
    if (suppStreak >= 3 && suppStreak < 7) matched.push({ icon: Flame, title: 'Building Momentum', text: `${suppStreak}-day streak. 4 more days to hit the weekly milestone.`, category: 'Performance', priority: 6 })
    if (monthlyCost > 30) matched.push({ icon: DollarSign, title: 'Cost Optimization', text: `$${monthlyCost.toFixed(0)}/mo estimated. Consider stacking to reduce redundancy.`, category: 'Nutrition', priority: 5 })
    if (remainingCount > 0 && remainingCount <= 2) matched.push({ icon: Target, title: 'Final Push', text: `Just ${remainingCount} more — don't break the chain today.`, category: 'Performance', priority: 8 })
    return matched.sort((a, b) => b.priority - a.priority).slice(0, 5)
  }, [scheduleToday, takenTodayCount, suppStreak, monthlyCost, totalCount, remainingCount])

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

  const adherenceScore = totalCount > 0 ? Math.round((takenTodayCount / totalCount) * 100) : 0
  const scoreColor = adherenceScore >= 80 ? '#10b981' : adherenceScore >= 50 ? '#f59e0b' : '#ef4444'
  const scoreGlow = adherenceScore >= 80 ? 'shadow-emerald-500/30' : adherenceScore >= 50 ? 'shadow-amber-500/30' : 'shadow-red-500/30'
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (adherenceScore / 100) * circumference

  const timeOfDayNow = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : new Date().getHours() < 21 ? 'Evening' : 'Night'

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Supplements</h2>
          <p className="text-sm text-gray-400 mt-0.5">{totalCount} supplements tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${activePanel === 'patterns' ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setActivePanel(p => p === 'patterns' ? null : 'patterns')} title="Weekly Patterns">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          {totalCount > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${activePanel === 'coach' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setActivePanel(p => p === 'coach' ? null : 'coach')} title="AI Coach">
              <Brain className="w-5 h-5" />
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

      {/* Hero Ring */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] via-transparent to-cyan-500/[0.04] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-6">
            {/* SVG Ring */}
            <div className={`relative w-32 h-32 shrink-0 drop-shadow-2xl ${scoreGlow}`}>
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={scoreColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={scoreColor} stopOpacity="1" />
                  </linearGradient>
                  <filter id="ringGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <circle cx="60" cy="60" r="54" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                <motion.circle cx="60" cy="60" r="54" fill="transparent"
                  stroke="url(#ringGradient)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  filter="url(#ringGlow)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-4xl font-black text-white drop-shadow-lg">{adherenceScore}</motion.span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">percent</span>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-1.5 mb-2"><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Taken</span></div>
                <p className="text-2xl font-black text-emerald-300">{takenTodayCount}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">of {totalCount} today</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-1.5 mb-2"><Target className="w-3.5 h-3.5 text-amber-400" /><span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Left</span></div>
                <p className="text-2xl font-black text-amber-300">{remainingCount}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">remaining</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-1.5 mb-2"><Flame className="w-3.5 h-3.5 text-orange-400" /><span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Streak</span></div>
                <p className="text-2xl font-black text-orange-300">{suppStreak}<span className="text-sm font-normal text-gray-500 ml-1">d</span></p>
                <p className="text-[9px] text-gray-500 mt-0.5">perfect days</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-1.5 mb-2"><DollarSign className="w-3.5 h-3.5 text-violet-400" /><span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Cost</span></div>
                <p className="text-2xl font-black text-violet-300">${monthlyCost.toFixed(0)}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">per month</p>
              </motion.div>
            </div>
          </div>
          {/* Adherence bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Daily Progress</span>
              <span className="text-[9px] font-bold" style={{ color: scoreColor }}>{adherenceScore}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${adherenceScore}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`, boxShadow: `0 0 12px ${scoreColor}40` }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's Schedule */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Today's Schedule</span>
                  <p className="text-[10px] text-gray-500">{timeOfDayNow} — {scheduleToday.length} supplements</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">{takenTodayCount}/{scheduleToday.length}</span>
            </div>
            <div className="space-y-2">
              {scheduleToday.map((s, i) => {
                const taken = takenTodayIds.has(s.id)
                const TimeIcon = TIME_ICONS[s.times[0] as TimeOfDay] || Clock
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all group ${taken ? 'bg-emerald-500/[0.06] border-emerald-500/15' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${taken ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-white/[0.04] border border-white/[0.08] group-hover:bg-white/[0.06]'}`}>
                      {taken ? <Check className="w-5 h-5 text-emerald-400" /> : <TimeIcon className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${taken ? 'text-emerald-300' : 'text-white'}`}>{s.name}</p>
                        {s.stack && <span className="text-[8px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{s.stack}</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{s.dosage} · {s.times.join(', ')}</p>
                    </div>
                    {!taken ? (
                      <button onClick={() => markAsTaken(s)}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-xs font-semibold opacity-0 group-hover:opacity-100">
                        Take
                      </button>
                    ) : (
                      <div className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                        <span className="text-[10px] font-bold text-emerald-400">TAKEN</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Panels */}
      <AnimatePresence mode="wait">
        {/* Weekly Patterns Panel */}
        {activePanel === 'patterns' && totalCount > 0 && (
          <motion.div key="patterns" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-3xl border border-violet-500/15 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Weekly Patterns</span>
                    <p className="text-[10px] text-gray-500">Your supplement consistency</p>
                  </div>
                </div>
                <div className="flex gap-1 bg-white/5 rounded-xl p-0.5 border border-white/[0.06]">
                  {(['7d', '14d', '30d'] as const).map(p => (
                    <button key={p} onClick={() => setTrendPeriod(p)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${trendPeriod === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' : 'text-gray-500 hover:text-white border border-transparent'}`}>{p}</button>
                  ))}
                </div>
              </div>
              {/* 7-Day Bars */}
              <div className="grid grid-cols-7 gap-2 mb-5">
                {adherenceWeek.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] text-gray-500 uppercase font-medium">{day.label}</span>
                    <div className="w-full h-20 bg-white/[0.03] rounded-xl overflow-hidden flex items-end border border-white/[0.04]">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(day.pct, 4)}%` }} transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full rounded-t-lg ${day.pct >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : day.pct >= 50 ? 'bg-gradient-to-t from-amber-600 to-amber-400' : day.pct > 0 ? 'bg-gradient-to-t from-red-600/60 to-red-400/60' : 'bg-white/[0.03]'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${day.pct >= 80 ? 'text-emerald-400' : day.pct >= 50 ? 'text-amber-400' : 'text-gray-500'}`}>{day.pct}%</span>
                  </div>
                ))}
              </div>
              {/* Trend Line */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trend · {trendPeriod}</span>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={adherenceTrend}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={false} axisLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 12px' }}
                        itemStyle={{ color: '#fff', fontSize: 11, fontWeight: 700 }}
                        labelStyle={{ color: '#9ca3af', fontSize: 9, fontWeight: 600 }}
                        formatter={(value: number) => [`${value}%`, 'Adherence']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label} />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#000', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Summary chips */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-gray-400">Streak: <span className="text-white font-bold">{suppStreak}d</span></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5">
                  <Activity className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-gray-400">Week: <span className="text-white font-bold">{weekAdherence}%</span></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5">
                  <Pill className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-gray-400">Daily: <span className="text-white font-bold">{dailySupps.length}</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Coach Panel */}
        {activePanel === 'coach' && (
          <motion.div key="coach" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-violet-500/[0.03] pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/20 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">AI Supplement Coach</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Your personalized supplement intelligence</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowCoachModeDropdown(p => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${showCoachModeDropdown ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                    <span>{coachMode === 'insight' ? '\uD83E\uDDE0' : coachMode === 'refill' ? '\uD83D\uDCE6' : '\uD83D\uDCA1'}</span>
                    <span className="hidden sm:inline">{coachMode === 'insight' ? 'Insight' : coachMode === 'refill' ? 'Refill' : 'Stack'}</span>
                  </button>
                  {showCoachModeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachModeDropdown(false)} />
                      <div className="absolute right-0 top-10 z-20 w-56 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Switch Mode</p>
                        <div className="flex flex-col gap-1">
                          {([
                            { key: 'insight' as const, label: '\uD83E\uDDE0 AI Insight', desc: 'Smart daily recommendations' },
                            { key: 'refill' as const, label: '\uD83D\uDCE6 Refill Tracker', desc: 'Never run out' },
                            { key: 'stack' as const, label: '\uD83D\uDCA1 Stack Intel', desc: 'Interactions & overview' },
                          ]).map(opt => (
                            <button key={opt.key} onClick={() => { setCoachMode(opt.key); setShowCoachModeDropdown(false) }}
                              className={`text-left px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all ${coachMode === opt.key ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                              <div className="font-semibold">{opt.label}</div>
                              <div className="text-[9px] text-gray-500 mt-0.5">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mode: AI Insight */}
              {coachMode === 'insight' && (
                <div className="space-y-3">
                  {smartRecs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <Brain className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-[11px] text-gray-500">Add supplements to unlock AI-powered insights.</p>
                    </div>
                  ) : smartRecs.map((rec, i) => {
                    const Icon = rec.icon
                    const catColors: Record<string, string> = {
                      Performance: 'border-purple-500/15 bg-purple-500/[0.04]',
                      Recovery: 'border-emerald-500/15 bg-emerald-500/[0.04]',
                      Nutrition: 'border-amber-500/15 bg-amber-500/[0.04]',
                      General: 'border-gray-500/15 bg-gray-500/[0.04]',
                    }
                    const iconColors: Record<string, string> = {
                      Performance: 'text-purple-400 bg-purple-500/10',
                      Recovery: 'text-emerald-400 bg-emerald-500/10',
                      Nutrition: 'text-amber-400 bg-amber-500/10',
                      General: 'text-gray-400 bg-gray-500/10',
                    }
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className={`p-4 rounded-2xl border ${catColors[rec.category] || catColors.General} hover:bg-white/[0.04] transition-colors`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${iconColors[rec.category] || iconColors.General}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white/90 mb-0.5">{rec.title}</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">{rec.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Mode: Refill Tracker */}
              {coachMode === 'refill' && (
                <div className="space-y-3">
                  {supplements.filter(s => s.refillDays && s.refillDays > 0).length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <Package className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-[11px] text-gray-500">Set refill days on your supplements to track supply.</p>
                    </div>
                  ) : supplements.filter(s => s.refillDays && s.refillDays > 0).map((supp, i) => {
                    const daysLeft = supp.refillDays || 30
                    const pct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
                    const urgency = daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'
                    const barColor = daysLeft <= 3 ? 'from-red-600 to-red-400' : daysLeft <= 7 ? 'from-amber-600 to-amber-400' : 'from-emerald-600 to-emerald-400'
                    return (
                      <motion.div key={supp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${daysLeft <= 3 ? 'bg-red-400 animate-pulse' : daysLeft <= 7 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            <span className="text-[11px] font-bold text-white/80">{supp.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${urgency}`}>{daysLeft}d left</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`h-full rounded-full bg-gradient-to-r ${barColor}`} />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-gray-500">{supp.dosage}</span>
                          <span className="text-[9px] font-semibold" style={{ color: daysLeft <= 3 ? '#f87171' : daysLeft <= 7 ? '#fbbf24' : '#34d399' }}>
                            {daysLeft <= 3 ? 'Reorder now!' : daysLeft <= 7 ? 'Order soon' : 'Good supply'}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Mode: Stack Intelligence */}
              {coachMode === 'stack' && (
                <div className="space-y-4">
                  {/* Category Donut */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.04] to-purple-500/[0.04] border border-violet-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-violet-400" />
                      <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Stack Overview</span>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          {(() => {
                            const cats: Record<string, { count: number; color: string }> = {}
                            const colors = ['stroke-violet-500', 'stroke-cyan-500', 'stroke-amber-500', 'stroke-emerald-500', 'stroke-rose-500', 'stroke-indigo-500', 'stroke-orange-500']
                            let ci = 0
                            supplements.forEach(s => {
                              const cat = s.stack || 'Other'
                              if (!cats[cat]) { cats[cat] = { count: 0, color: colors[ci % colors.length] }; ci++ }
                              cats[cat].count++
                            })
                            const total = supplements.length
                            let offset = 0
                            return Object.entries(cats).map(([name, data]) => {
                              const p = (data.count / total) * 100
                              const seg = (
                                <circle key={name} cx="18" cy="18" r="15.915" fill="transparent"
                                  className={`${data.color} opacity-80`} strokeWidth="3"
                                  strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={`${-offset}`}
                                  style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                              )
                              offset += p
                              return seg
                            })
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-white/90">{supplements.length}</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {(() => {
                          const cats: Record<string, { count: number; color: string; dot: string }> = {}
                          const colors = ['bg-violet-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500', 'bg-orange-500']
                          const dots = ['text-violet-400', 'text-cyan-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400', 'text-indigo-400', 'text-orange-400']
                          let ci = 0
                          supplements.forEach(s => {
                            const cat = s.stack || 'Other'
                            if (!cats[cat]) { cats[cat] = { count: 0, color: colors[ci % colors.length], dot: dots[ci % dots.length] }; ci++ }
                            cats[cat].count++
                          })
                          return Object.entries(cats).sort((a, b) => b[1].count - a[1].count).map(([name, data]) => (
                            <div key={name} className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${data.color} shrink-0`} />
                              <span className="text-[10px] text-gray-400 truncate flex-1">{name}</span>
                              <span className={`text-[10px] font-bold ${data.dot}`}>{data.count}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Interactions */}
                  {supplementInteractions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] to-cyan-500/[0.04] border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Interactions</span>
                        <span className="text-[9px] text-emerald-400/60 ml-auto">{supplementInteractions.length} detected</span>
                      </div>
                      <div className="space-y-2">
                        {supplementInteractions.map((inter, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className={cn('flex items-start gap-2.5 px-3 py-2.5 rounded-xl border',
                              inter.type === 'synergy' && 'bg-emerald-500/[0.04] border-emerald-500/10',
                              inter.type === 'conflict' && 'bg-red-500/[0.04] border-red-500/10',
                              inter.type === 'timing' && 'bg-amber-500/[0.04] border-amber-500/10',
                            )}>
                            {inter.type === 'synergy' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                            {inter.type === 'conflict' && <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                            {inter.type === 'timing' && <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-white">{inter.suppA} + {inter.suppB}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">{inter.message}</p>
                            </div>
                            <span className={cn('text-[8px] font-bold uppercase tracking-wider shrink-0 mt-0.5',
                              inter.type === 'synergy' && 'text-emerald-400',
                              inter.type === 'conflict' && 'text-red-400',
                              inter.type === 'timing' && 'text-amber-400',
                            )}>{inter.type}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {supplementInteractions.length === 0 && (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <Layers className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-[11px] text-gray-500">Add more supplements to discover stack interactions.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {totalCount === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />
          <div className="relative">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
              <Pill className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <p className="text-gray-400 font-semibold text-lg">No supplements tracked</p>
            <p className="text-gray-500 text-sm mt-1 mb-5">Start your supplement stack to unlock AI-powered insights</p>
            <Button variant="accent" size="sm" onClick={() => { resetForm(); setShowModal(true) }}>
              <Plus className="w-4 h-4 mr-1" />Add Your First Supplement
            </Button>
          </div>
        </motion.div>
      )}

      {/* Supplement Cards */}
      {totalCount > 0 && (
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
            <label className="block text-[10px] font-medium text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />Quick Add from Common
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {commonSupplements.map((s) => (
                <motion.button key={s.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleQuickAdd(s.name, s.dosage)}
                  className={cn('text-left px-4 py-3 rounded-xl text-xs border transition-all duration-200',
                    formData.name === s.name ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20')}>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{s.dosage}</div>
                </motion.button>
              ))}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Input label="Supplement Name" placeholder="e.g., Vitamin D3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} icon={<Pill className="w-4 h-4" />} />
          <Input label="Dosage" placeholder="e.g., 5000 IU" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
          <div className="space-y-3">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((freq) => (
                <button key={freq} type="button" onClick={() => setFormData({ ...formData, frequency: freq })}
                  className={cn('flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 capitalize',
                    formData.frequency === freq ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]')}>{freq}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Times of Day</label>
            <div className="grid grid-cols-4 gap-2.5">
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
          <div className="pt-2">
            <Button variant="primary" onClick={addSupplement} className="w-full" disabled={!formData.name.trim() || !formData.dosage.trim()}><Plus className="w-4 h-4 mr-1" />Add Supplement</Button>
          </div>
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

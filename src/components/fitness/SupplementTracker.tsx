import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, AlertTriangle, Undo2, Clock,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Target, Flame, Activity,
  DollarSign, Layers, CalendarCheck,
  Brain, ShieldCheck, ShieldAlert, Info, Zap, Package,
  CheckCircle2, Dumbbell, TrendingUp, BarChart3, ChevronDown,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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
const TIME_COLORS: Record<TimeOfDay, { bg: string; border: string; text: string; icon: string; glow: string }> = {
  Morning: { bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/15', text: 'text-amber-300', icon: 'text-amber-400', glow: 'shadow-amber-500/10' },
  Afternoon: { bg: 'from-yellow-500/10 to-amber-500/5', border: 'border-yellow-500/15', text: 'text-yellow-300', icon: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
  Evening: { bg: 'from-orange-500/10 to-rose-500/5', border: 'border-orange-500/15', text: 'text-orange-300', icon: 'text-orange-400', glow: 'shadow-orange-500/10' },
  Night: { bg: 'from-indigo-500/10 to-violet-500/5', border: 'border-indigo-500/15', text: 'text-indigo-300', icon: 'text-indigo-400', glow: 'shadow-indigo-500/10' },
}

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU', emoji: '\u2600\uFE0F', color: 'from-amber-500/15 to-orange-500/10' },
  { name: 'Omega-3 Fish Oil', dosage: '2000mg', emoji: '\uD83D\uDC1F', color: 'from-blue-500/15 to-cyan-500/10' },
  { name: 'Creatine', dosage: '5g', emoji: '\uD83D\uDCAA', color: 'from-red-500/15 to-orange-500/10' },
  { name: 'Whey Protein', dosage: '30g', emoji: '\uD83E\uDDC0', color: 'from-yellow-500/15 to-amber-500/10' },
  { name: 'Magnesium', dosage: '400mg', emoji: '\u2728', color: 'from-violet-500/15 to-purple-500/10' },
  { name: 'Zinc', dosage: '30mg', emoji: '\uD83D\uDD11', color: 'from-gray-500/15 to-slate-500/10' },
  { name: 'Multivitamin', dosage: '1 tablet', emoji: '\uD83D\uDD36', color: 'from-emerald-500/15 to-teal-500/10' },
  { name: 'Collagen', dosage: '10g', emoji: '\uD83D\uDC8D', color: 'from-pink-500/15 to-rose-500/10' },
  { name: 'Pre-workout', dosage: '1 scoop', emoji: '\u26A1', color: 'from-yellow-500/15 to-orange-500/10' },
  { name: 'BCAA', dosage: '5g', emoji: '\uD83D\uDCA8', color: 'from-red-500/15 to-pink-500/10' },
]

const SUPP_INTERACTIONS: { a: string; b: string; type: 'synergy' | 'conflict' | 'timing'; message: string }[] = [
  { a: 'Vitamin D3', b: 'Magnesium', type: 'synergy', message: 'Magnesium activates Vitamin D' },
  { a: 'Vitamin D3', b: 'Omega-3 Fish Oil', type: 'synergy', message: 'Fat-soluble \u2014 take together' },
  { a: 'Creatine', b: 'Whey Protein', type: 'synergy', message: 'Mix together post-workout' },
  { a: 'Zinc', b: 'Magnesium', type: 'synergy', message: 'Both support sleep \u2014 night combo' },
  { a: 'Melatonin', b: 'Magnesium', type: 'synergy', message: 'Perfect nighttime duo' },
  { a: 'Collagen', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C is essential for collagen' },
  { a: 'Iron', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C 6x boosts iron absorption' },
  { a: 'Iron', b: 'Calcium', type: 'conflict', message: 'Calcium blocks iron \u2014 separate 2hrs' },
  { a: 'Zinc', b: 'Iron', type: 'conflict', message: 'Compete for absorption \u2014 separate' },
  { a: 'Magnesium', b: 'Calcium', type: 'timing', message: 'Ca in AM, Mg at night' },
  { a: 'Vitamin D3', b: 'Calcium', type: 'synergy', message: 'Vitamin D helps absorb calcium' },
  { a: 'Multivitamin', b: 'Iron', type: 'timing', message: 'Multi has iron \u2014 avoid doubling' },
  { a: 'Collagen', b: 'Whey Protein', type: 'timing', message: 'Both protein \u2014 spread across meals' },
  { a: 'Zinc', b: 'Vitamin C', type: 'synergy', message: 'Vitamin C improves zinc uptake' },
  { a: 'Pre-workout', b: 'Whey Protein', type: 'timing', message: 'Pre 30min before, protein after' },
]

const spring = { type: 'spring' as const, bounce: 0.4 }
const smooth = [0.16, 1, 0.3, 1] as const

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplement | null>(null)
  const [formData, setFormData] = useState({
    name: '', dosage: '', frequency: 'daily' as Supplement['frequency'],
    times: [] as TimeOfDay[], notes: '', refillDays: '', stack: '', cost: '', totalServings: '',
  })
  const [activePanel, setActivePanel] = useState<'patterns' | 'coach' | null>(null)
  const [coachMode, setCoachMode] = useState<'insight' | 'refill' | 'stack' | 'timing' | 'cost'>('insight')
  const [showCoachModeDropdown, setShowCoachModeDropdown] = useState(false)
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '14d' | '30d'>('7d')
  const [justTaken, setJustTaken] = useState<Supplement | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      days.push({ date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0), taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 })
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
      const dayLogs = logs.filter((l) => l.date === d.toISOString().split('T')[0])
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

  const monthlyCost = useMemo(() => supplements.reduce((sum, s) => { if (s.cost && s.totalServings && s.totalServings > 0) return sum + (s.cost / s.totalServings) * 30; return sum }, 0), [supplements])

  const scheduleToday = useMemo(() => {
    return supplements.filter(s => {
      if (s.frequency === 'daily') return true
      if (s.frequency === 'weekly') return true
      return true
    })
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

  const timingData = useMemo(() => {
    const groups: Record<string, { supps: string[]; total: number }> = {}
    supplements.forEach(s => {
      const t = s.times[0] || 'Morning'
      if (!groups[t]) groups[t] = { supps: [], total: 0 }
      groups[t].supps.push(s.name)
      groups[t].total++
    })
    return Object.entries(groups).sort((a, b) => {
      const order = ['Morning', 'Afternoon', 'Evening', 'Night']
      return order.indexOf(a[0]) - order.indexOf(b[0])
    })
  }, [supplements])

  const costBreakdown = useMemo(() => {
    return supplements
      .filter(s => s.cost && s.totalServings && s.totalServings > 0)
      .map(s => ({
        name: s.name,
        perServing: (s.cost! / s.totalServings!),
        perMonth: (s.cost! / s.totalServings!) * 30,
        totalCost: s.cost!,
        servings: s.totalServings!,
        daysLeft: Math.round(s.totalServings! / (s.frequency === 'daily' ? 1 : s.frequency === 'weekly' ? 1/7 : 1)),
      }))
      .sort((a, b) => b.perMonth - a.perMonth)
  }, [supplements])

  const weekHeatmap = useMemo(() => {
    const days: { date: string; dayName: string; pct: number; taken: number; total: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter(l => l.date === dateStr)
      const taken = new Set(dayLogs.map(l => l.supplementId)).size
      const total = dailySupps.length
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        taken, total,
        pct: total > 0 ? Math.round((taken / total) * 100) : 0,
      })
    }
    return days
  }, [logs, dailySupps])

  const consistencyScore = useMemo(() => {
    if (adherenceWeek.length === 0) return 0
    const pcts = adherenceWeek.map(d => d.pct)
    const avg = pcts.reduce((s, p) => s + p, 0) / pcts.length
    const variance = pcts.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / pcts.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.max(0, Math.round(100 - stdDev))
    return consistency
  }, [adherenceWeek])

  const bestWorstDays = useMemo(() => {
    if (adherenceWeek.length === 0) return { best: null, worst: null }
    const sorted = [...adherenceWeek].sort((a, b) => b.pct - a.pct)
    return { best: sorted[0], worst: sorted[sorted.length - 1] }
  }, [adherenceWeek])

  const smartRecs = useMemo(() => {
    const total = scheduleToday.length; const taken = takenTodayCount
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0
    const matched: { icon: typeof Dumbbell; title: string; text: string; category: string; priority: number }[] = []
    if (totalCount === 0) matched.push({ icon: Pill, title: 'Get Started', text: 'Add your first supplement to begin tracking.', category: 'General', priority: 10 })
    else if (pct === 100) matched.push({ icon: CheckCircle2, title: 'Perfect Day', text: `All ${total} taken. Peak efficiency.`, category: 'Performance', priority: 10 })
    else if (pct >= 50) matched.push({ icon: Zap, title: 'Almost There', text: `${taken}/${total} done. ${total - taken} more to go.`, category: 'Performance', priority: 8 })
    else if (total > 0) matched.push({ icon: AlertTriangle, title: 'Low Adherence', text: `Only ${taken}/${total} taken today.`, category: 'Recovery', priority: 9 })
    if (suppStreak >= 7) matched.push({ icon: Flame, title: 'Streak Master', text: `${suppStreak}-day perfect streak.`, category: 'Performance', priority: 7 })
    if (suppStreak >= 3 && suppStreak < 7) matched.push({ icon: Flame, title: 'Building Momentum', text: `${suppStreak}-day streak. 4 more days.`, category: 'Performance', priority: 6 })
    if (monthlyCost > 30) matched.push({ icon: DollarSign, title: 'Cost Optimization', text: `$${monthlyCost.toFixed(0)}/mo estimated.`, category: 'Nutrition', priority: 5 })
    if (remainingCount > 0 && remainingCount <= 2) matched.push({ icon: Target, title: 'Final Push', text: `Just ${remainingCount} more.`, category: 'Performance', priority: 8 })
    return matched.sort((a, b) => b.priority - a.priority).slice(0, 4)
  }, [scheduleToday, takenTodayCount, suppStreak, monthlyCost, totalCount, remainingCount])

  const markAsTaken = (supp: Supplement) => {
    if (takenTodayIds.has(supp.id)) return
    persistLogs([...logs, { id: generateId(), supplementId: supp.id, takenAt: new Date().toISOString(), date: today }])
    setJustTaken(supp)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setJustTaken(null), 4000)
  }

  const undoTake = () => {
    if (!justTaken) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    const todayLogs = logs.filter(l => l.date === today)
    const logToRemove = todayLogs.find(l => l.supplementId === justTaken.id)
    if (logToRemove) persistLogs(logs.filter(l => l.id !== logToRemove.id))
    setJustTaken(null)
  }

  const undoTakeById = (suppId: string) => {
    const logToRemove = logs.find(l => l.date === today && l.supplementId === suppId)
    if (logToRemove) persistLogs(logs.filter(l => l.id !== logToRemove.id))
  }

  const deleteFromSchedule = (supp: Supplement) => {
    persistSupplements(supplements.filter(s => s.id !== supp.id))
    persistLogs(logs.filter(l => l.supplementId !== supp.id))
  }

  const handleQuickAdd = (name: string, dosage: string) => setFormData({ ...formData, name, dosage, times: formData.times.length ? formData.times : ['Morning'] })
  const toggleTime = (time: TimeOfDay) => setFormData(prev => ({ ...prev, times: prev.times.includes(time) ? prev.times.filter(t => t !== time) : [...prev.times, time] }))
  const resetForm = () => setFormData({ name: '', dosage: '', frequency: 'daily', times: [], notes: '', refillDays: '', stack: '', cost: '', totalServings: '' })

  const addSupplement = () => {
    if (!formData.name.trim() || !formData.dosage.trim()) return
    persistSupplements([...supplements, { id: generateId(), name: formData.name.trim(), dosage: formData.dosage.trim(), frequency: formData.frequency, times: formData.times.length ? [...formData.times] : ['Morning'], notes: formData.notes.trim() || undefined, refillDays: formData.refillDays ? parseInt(formData.refillDays) : undefined, stack: formData.stack.trim() || undefined, cost: formData.cost ? parseFloat(formData.cost) : undefined, totalServings: formData.totalServings ? parseInt(formData.totalServings) : undefined }])
    setShowModal(false); resetForm()
  }

  const deleteSupplement = () => {
    if (!deleteTarget) return
    persistSupplements(supplements.filter(s => s.id !== deleteTarget.id))
    persistLogs(logs.filter(l => l.supplementId !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const timeOptions = TIMES_OF_DAY.map(t => ({ value: t, icon: TIME_ICONS[t] }))
  const adherenceScore = totalCount > 0 ? Math.round((takenTodayCount / totalCount) * 100) : 0
  const scoreColor = adherenceScore >= 80 ? '#10b981' : adherenceScore >= 50 ? '#f59e0b' : '#ef4444'


  return (
    <div className="space-y-5">

      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-none">Supplements</h1>
          <p className="text-[13px] text-gray-500 mt-1.5 font-medium">{totalCount} tracked · {scheduleToday.length} today</p>
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => setActivePanel(p => p === 'patterns' ? null : 'patterns')}
                className={cn('w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300', activePanel === 'patterns' ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/15' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white hover:border-white/15')}>
                <BarChart3 className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => setActivePanel(p => p === 'coach' ? null : 'coach')}
                className={cn('w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300', activePanel === 'coach' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/15' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white hover:border-white/15')}>
                <Brain className="w-4 h-4" />
              </motion.button>
            </>
          )}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { resetForm(); setShowModal(true) }}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </motion.button>
        </div>
      </motion.div>

      {/* ═══════ HERO: WELLNESS COMMAND CENTER ═══════ */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#08080f] shadow-[0_0_60px_-12px_rgba(0,0,0,0.8)]">

          {/* ── Layered background ── */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Radial pulse */}
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.02, 0.06] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-[15%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ backgroundColor: scoreColor }} />
            <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 right-[10%] w-[200px] h-[200px] rounded-full blur-[60px] bg-violet-500" />
            {/* Scanline */}
            <motion.div animate={{ y: ['-100%', '200%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-px opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${scoreColor}, transparent)` }} />
          </div>

          {/* ── Border glow ── */}
          <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${scoreColor}08, inset 0 1px 0 0 ${scoreColor}06` }} />

          <div className="relative p-5 pb-4">

            {/* ═══ ROW 1: Header bar ═══ */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Logo mark */}
                <div className="relative w-8 h-8 shrink-0">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-lg border border-dashed" style={{ borderColor: `${scoreColor}20` }} />
                  <div className="absolute inset-[2px] rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${scoreColor}15, ${scoreColor}05)` }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: scoreColor }} />
                  </div>
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-white tracking-tight leading-none">Wellness<span style={{ color: scoreColor }}>Pulse</span></h2>
                  <p className="text-[9px] text-gray-500 mt-0.5">{totalCount} supplement{totalCount !== 1 ? 's' : ''} tracked · {takenTodayCount} taken today</p>
                </div>
              </div>
              {/* Status cluster */}
              <div className="flex items-center gap-2">
                {suppStreak > 0 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/[0.06] border border-orange-500/10">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-orange-400">
                      <Flame className="w-3 h-3" />
                    </motion.div>
                    <span className="text-[10px] font-black text-orange-300 tabular-nums">{suppStreak}d</span>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreColor, boxShadow: `0 0 8px ${scoreColor}80` }} />
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Live</span>
                </motion.div>
              </div>
            </div>

            {/* ═══ ROW 2: Core Reactor ═══ */}
            <div className="flex gap-5 mb-4">

              {/* ── Reactor Core ── */}
              <div className="relative shrink-0 w-[140px] h-[140px] flex items-center justify-center">
                {/* Ring 4 - outermost orbit */}
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed" style={{ borderColor: `${scoreColor}08` }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: `${scoreColor}30` }} />
                </motion.div>
                {/* Ring 3 - dot orbit */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[8px] rounded-full border" style={{ borderColor: `${scoreColor}0a` }}>
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${scoreColor}40` }} />
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-400/30" />
                </motion.div>
                {/* Ring 2 - pulse wave */}
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[18px] rounded-full border" style={{ borderColor: `${scoreColor}20` }} />
                {/* Ring 1 - inner glow */}
                <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[28px] rounded-full" style={{ backgroundColor: `${scoreColor}08`, border: `1px solid ${scoreColor}15` }} />
                {/* Core glow */}
                <div className="absolute inset-[32px] rounded-full blur-xl" style={{ backgroundColor: `${scoreColor}15` }} />
                {/* Core body */}
                <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${scoreColor}18, ${scoreColor}05 70%)`, border: `1px solid ${scoreColor}20` }}>
                  <div className="absolute inset-[2px] rounded-full bg-[#08080f]/90 backdrop-blur-sm" />
                  {/* Score */}
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
                    className="relative text-center">
                    <div className="relative">
                      <span className="text-[26px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{adherenceScore}</span>
                      {/* Ghost duplicate for depth */}
                      <motion.span animate={{ opacity: [0.15, 0.05, 0.15], y: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 text-[26px] font-black tabular-nums leading-none blur-[1px]" style={{ color: scoreColor }}>{adherenceScore}</motion.span>
                    </div>
                    <div className="text-[6px] text-gray-500 uppercase tracking-[0.3em] font-bold mt-0.5">score</div>
                  </motion.div>
                </div>
                {/* Particle ring */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: `${scoreColor}80`,
                      top: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                      left: `${50 + 48 * Math.cos((deg * Math.PI) / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                    }} />
                ))}
              </div>

              {/* ── Right: Data Panel ── */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* Intake counter */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2 mb-2">
                    <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-[32px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{takenTodayCount}</motion.span>
                    <span className="text-[14px] font-bold text-gray-600">/ {totalCount}</span>
                    <span className="text-[10px] text-gray-500 ml-1">taken</span>
                  </div>
                  {/* Segmented bar */}
                  {scheduleToday.length > 0 && (
                    <div className="flex gap-[3px]">
                      {scheduleToday.map((s, i) => {
                        const taken = takenTodayIds.has(s.id)
                        return (
                        <motion.div key={s.id} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                          className="flex-1 h-[6px] rounded-full origin-left transition-all duration-500"
                          style={{ backgroundColor: taken ? `${scoreColor}` : 'rgba(255,255,255,0.04)', opacity: taken ? 0.9 : 1 }} />
                      )
                    })}
                    </div>
                  )}
                </div>

                {/* Status matrix */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Remaining', val: remainingCount, color: '#f59e0b', icon: Target },
                    { label: 'Streak', val: `${suppStreak}d`, color: '#f97316', icon: Flame },
                    { label: 'Monthly', val: `$${monthlyCost.toFixed(0)}`, color: '#a78bfa', icon: DollarSign },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                      className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-2.5">
                      <s.icon className="w-3 h-3 mb-1.5" style={{ color: s.color }} />
                      <div className="text-[13px] font-black text-white tabular-nums leading-none">{s.val}</div>
                      <div className="text-[7px] text-gray-500 uppercase tracking-[0.15em] font-bold mt-1">{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* EKG sparkline */}
                <div className="h-8 overflow-hidden rounded-lg bg-white/[0.015] border border-white/[0.03] px-2">
                  <svg viewBox="0 0 200 30" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={scoreColor} stopOpacity="0" />
                        <stop offset="20%" stopColor={scoreColor} stopOpacity="0.6" />
                        <stop offset="80%" stopColor={scoreColor} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M0,15 L20,15 L25,15 L30,8 L33,22 L36,5 L39,25 L42,15 L55,15 L80,15 L85,15 L90,9 L93,21 L96,6 L99,24 L102,15 L115,15 L140,15 L145,15 L150,10 L153,20 L156,7 L159,23 L162,15 L180,15 L200,15"
                      fill="none" stroke="url(#sparkGrad)" strokeWidth="1.2" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.6, ease: smooth }} />
                  </svg>
                </div>
              </div>
            </div>

            {/* ═══ ROW 3: Taking Today ═══ */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: scoreColor, boxShadow: `0 0 4px ${scoreColor}` }} />
                <p className="text-[8px] text-gray-500 uppercase tracking-[0.25em] font-bold">Active compounds</p>
                <div className="flex-1 h-px bg-white/[0.03]" />
                <span className="text-[8px] font-bold tabular-nums" style={{ color: `${scoreColor}80` }}>{takenTodayCount}/{scheduleToday.length}</span>
              </div>
              <div className="flex flex-wrap gap-[5px]">
                {scheduleToday.map((s, i) => {
                  const taken = takenTodayIds.has(s.id)
                  return (
                    <motion.button key={s.id} initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.03, type: 'spring', bounce: 0.4 }}
                      onClick={() => markAsTaken(s)} disabled={taken}
                      className={cn(
                        'group relative inline-flex items-center gap-[5px] px-3 py-[6px] rounded-full text-[10px] font-bold border transition-all duration-300',
                        taken
                          ? 'border-emerald-500/12 text-emerald-400/70 bg-emerald-500/[0.04]'
                          : 'border-white/[0.05] text-gray-500 hover:text-white hover:border-white/15 hover:bg-white/[0.04]'
                      )}>
                      {/* Pulse dot */}
                      {!taken && (
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-40" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-500" />
                        </span>
                      )}
                      {taken && <Check className="w-2.5 h-2.5 text-emerald-400/50 shrink-0" />}
                      <span className={cn(taken && 'line-through opacity-50')}>{s.name}</span>
                      {/* Hover glow */}
                      {!taken && <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 0 16px ${scoreColor}08` }} />}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TODAY'S SCHEDULE ─── */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0c0c14] shadow-xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/[0.03] rounded-full blur-[80px]" />
          </div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white">Today's Schedule</h3>
                  <p className="text-[10px] text-gray-500">{takenTodayCount} of {scheduleToday.length} taken</p>
                </div>
              </div>
              {/* Progress ring */}
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
                  <motion.circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${(takenTodayCount / Math.max(scheduleToday.length, 1)) * 94.25} ${94.25}`}
                    initial={{ strokeDashoffset: 94.25 }} animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1, ease: smooth }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-extrabold text-emerald-400 tabular-nums">{takenTodayCount}/{scheduleToday.length}</span>
                </div>
              </div>
            </div>

            {/* Grouped by time of day */}
            <div className="px-5 pb-5 space-y-4">
              {(TIMES_OF_DAY as readonly TimeOfDay[]).map(timeOfDay => {
                const items = scheduleToday.filter(s => s.times[0] === timeOfDay)
                if (items.length === 0) return null
                const TimeIcon = TIME_ICONS[timeOfDay]
                const tc = TIME_COLORS[timeOfDay]
                const takenInGroup = items.filter(s => takenTodayIds.has(s.id)).length
                const allTaken = takenInGroup === items.length

                return (
                  <div key={timeOfDay}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br ${tc.bg} border ${tc.border}`}>
                        <TimeIcon className={`w-2.5 h-2.5 ${tc.icon}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${allTaken ? 'text-emerald-400/60' : tc.text}`}>{timeOfDay}</span>
                      <span className="text-[9px] text-gray-600 font-medium">{takenInGroup}/{items.length}</span>
                      <div className="flex-1 h-px bg-white/[0.03]" />
                      {allTaken && <CheckCircle2 className="w-3 h-3 text-emerald-400/40" />}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {items.map((s, i) => {
                        const taken = takenTodayIds.has(s.id)
                        const freqLabel = s.frequency === 'daily' ? 'Daily' : s.frequency === 'weekly' ? 'Weekly' : 'Custom'
                        const freqColor = s.frequency === 'daily' ? 'text-cyan-400 bg-cyan-500/[0.06] border-cyan-500/10' : s.frequency === 'weekly' ? 'text-amber-400 bg-amber-500/[0.06] border-amber-500/10' : 'text-gray-400 bg-gray-500/[0.06] border-gray-500/10'
                        const refillUrgent = s.refillDays && s.refillDays <= 5
                        return (
                          <motion.div key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3, ease: smooth }}
                            className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
                              taken ? 'bg-emerald-500/[0.03] border-emerald-500/08' : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.025] hover:border-white/[0.06]'
                            }`}>
                            <div className="flex items-center gap-3 p-2.5">
                              {/* Checkbox */}
                              <button onClick={() => taken ? undoTakeById(s.id) : markAsTaken(s)}
                                className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                                  taken ? 'bg-emerald-500/15 border-emerald-500/20 hover:bg-red-500/15 hover:border-red-500/20 group/undo' : 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'
                                }`}>
                                {taken && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}><Check className="w-3 h-3 text-emerald-400 group-hover/undo:hidden" /></motion.div>}
                                {taken && <Undo2 className="w-3 h-3 text-red-400 hidden group-hover/undo:block" />}
                              </button>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[12px] font-semibold truncate ${taken ? 'text-emerald-300/70 line-through' : 'text-white'}`}>{s.name}</span>
                                  {s.stack && <span className="text-[7px] font-bold text-violet-400/70 bg-violet-500/[0.06] border border-violet-500/10 px-1 py-px rounded uppercase tracking-widest">{s.stack}</span>}
                                  <span className={`text-[7px] font-bold px-1 py-px rounded border ${freqColor}`}>{freqLabel}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[10px] text-gray-400 font-medium">{s.dosage}</span>
                                  {s.cost && s.totalServings && (
                                    <span className="text-[8px] text-violet-400/50 bg-violet-500/[0.04] px-1.5 py-0.5 rounded">${(s.cost / s.totalServings).toFixed(2)}/serving</span>
                                  )}
                                  {s.refillDays && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${refillUrgent ? 'text-red-400 bg-red-500/[0.06]' : 'text-gray-500 bg-white/[0.03]'}`}>
                                      {refillUrgent ? `Refill in ${s.refillDays}d` : `${s.refillDays}d supply`}
                                    </span>
                                  )}
                                </div>
                                {s.notes && (
                                  <p className="text-[9px] text-gray-600 italic mt-1 truncate">{s.notes}</p>
                                )}
                              </div>

                              {/* Delete on hover */}
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); deleteFromSchedule(s) }}
                                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200">
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── PANELS ─── */}
      <AnimatePresence mode="wait">
        {/* ═══ WEEKLY PATTERNS ═══ */}
        {activePanel === 'patterns' && totalCount > 0 && (
          <motion.div key="patterns" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: smooth }}
            className="relative overflow-hidden rounded-[20px] border border-violet-500/10 bg-[#0c0c14] shadow-xl">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-violet-500/[0.04] rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/[0.03] rounded-full blur-[60px]" />
            </div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white">Weekly Patterns</h3>
                    <p className="text-[10px] text-gray-500">7-day adherence analysis</p>
                  </div>
                </div>
                <div className="flex gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
                  {(['7d', '14d', '30d'] as const).map(p => (
                    <button key={p} onClick={() => setTrendPeriod(p)}
                      className={cn('px-3 py-1 rounded-md text-[10px] font-bold transition-all', trendPeriod === p ? 'bg-violet-500/15 text-violet-300' : 'text-gray-500 hover:text-white')}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Heatmap calendar */}
              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1 h-1 rounded-full bg-violet-400" />
                  <span className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold">Daily heatmap</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekHeatmap.map((day, i) => (
                    <motion.div key={day.date} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      className="flex flex-col items-center gap-1">
                      <span className="text-[8px] text-gray-600 font-bold">{day.dayName.charAt(0)}</span>
                      <div className="w-full aspect-square rounded-lg border border-white/[0.04] flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: day.pct >= 80 ? 'rgba(16,185,129,0.12)' : day.pct >= 50 ? 'rgba(245,158,11,0.1)' : day.pct > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)' }}>
                        {day.pct > 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.04 }}
                          className="absolute inset-0 rounded-lg" style={{ background: `radial-gradient(circle at center, ${day.pct >= 80 ? 'rgba(16,185,129,0.15)' : day.pct >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)'}, transparent 70%)` }} />}
                        <span className="text-[9px] font-bold text-white relative z-10">{day.pct > 0 ? `${day.pct}` : '-'}</span>
                      </div>
                      <span className="text-[7px] text-gray-600">{day.taken}/{day.total}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Consistency & Best/Worst */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 text-center">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Consistency</div>
                  <div className="text-[18px] font-black tabular-nums" style={{ color: consistencyScore >= 80 ? '#10b981' : consistencyScore >= 50 ? '#f59e0b' : '#ef4444' }}>{consistencyScore}%</div>
                  <div className="h-1 rounded-full bg-white/[0.04] mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${consistencyScore}%`, backgroundColor: consistencyScore >= 80 ? '#10b981' : consistencyScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="rounded-xl border border-emerald-500/08 bg-emerald-500/[0.02] p-3 text-center">
                  <div className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-bold mb-1">Best Day</div>
                  {bestWorstDays.best ? (
                    <>
                      <div className="text-[14px] font-black text-emerald-300">{bestWorstDays.best.label}</div>
                      <div className="text-[9px] text-emerald-400/50 mt-0.5">{bestWorstDays.best.pct}% \u00B7 {bestWorstDays.best.taken}/{bestWorstDays.best.total}</div>
                    </>
                  ) : <div className="text-[11px] text-gray-600">-</div>}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-xl border border-red-500/08 bg-red-500/[0.02] p-3 text-center">
                  <div className="text-[9px] text-red-400/70 uppercase tracking-wider font-bold mb-1">Worst Day</div>
                  {bestWorstDays.worst ? (
                    <>
                      <div className="text-[14px] font-black text-red-300">{bestWorstDays.worst.label}</div>
                      <div className="text-[9px] text-red-400/50 mt-0.5">{bestWorstDays.worst.pct}% \u00B7 {bestWorstDays.worst.taken}/{bestWorstDays.worst.total}</div>
                    </>
                  ) : <div className="text-[11px] text-gray-600">-</div>}
                </motion.div>
              </div>

              {/* Trend chart */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 mb-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Trend \u00B7 {trendPeriod}</span>
                  <div className="flex-1" />
                  <span className="text-[9px] font-bold text-violet-400 tabular-nums">{weekAdherence}% avg</span>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={adherenceTrend}>
                      <XAxis dataKey="date" tick={false} axisLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px' }}
                        itemStyle={{ color: '#fff', fontSize: 11, fontWeight: 700 }}
                        labelStyle={{ color: '#6b7280', fontSize: 9 }}
                        formatter={(v: number) => [`${v}%`, 'Adherence']}
                        labelFormatter={(l, p) => p?.[0]?.payload?.date || l} />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#000', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/[0.06]', border: 'border-orange-500/10', label: 'Streak', val: `${suppStreak}d` },
                  { icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/[0.06]', border: 'border-violet-500/10', label: 'Week', val: `${weekAdherence}%` },
                  { icon: Pill, color: 'text-cyan-400', bg: 'bg-cyan-500/[0.06]', border: 'border-cyan-500/10', label: 'Daily', val: `${dailySupps.length}` },
                  { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/10', label: 'Score', val: `${consistencyScore}%` },
                ].map((c, i) => (
                  <motion.div key={c.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                    className={`flex flex-col items-center gap-1 ${c.bg} border ${c.border} rounded-xl p-2.5`}>
                    <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                    <span className="text-[12px] font-black text-white tabular-nums">{c.val}</span>
                    <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold">{c.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ AI COACH ═══ */}
        {activePanel === 'coach' && (
          <motion.div key="coach" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: smooth }}
            className="relative overflow-hidden rounded-[20px] border border-cyan-500/10 bg-[#0c0c14] shadow-xl">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/[0.04] rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/[0.03] rounded-full blur-[60px]" />
            </div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-[#0c0c14] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white">AI Coach</h3>
                    <p className="text-[10px] text-gray-500">{smartRecs.length} insight{smartRecs.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowCoachModeDropdown(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-gray-400 hover:text-white transition-all">
                    {coachMode === 'insight' ? <Brain className="w-3 h-3" /> : coachMode === 'refill' ? <Package className="w-3 h-3" /> : coachMode === 'stack' ? <Layers className="w-3 h-3" /> : coachMode === 'timing' ? <Clock className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                    <span className="hidden sm:inline capitalize">{coachMode}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showCoachModeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachModeDropdown(false)} />
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 top-9 z-20 w-44 rounded-xl bg-gray-900 border border-white/[0.08] shadow-2xl p-1.5">
                        {([
                          { k: 'insight' as const, icon: Brain, label: 'Insights', desc: 'Smart tips' },
                          { k: 'timing' as const, icon: Clock, label: 'Timing', desc: 'Schedule' },
                          { k: 'cost' as const, icon: DollarSign, label: 'Cost', desc: 'Spending' },
                          { k: 'refill' as const, icon: Package, label: 'Refills', desc: 'Supply' },
                          { k: 'stack' as const, icon: Layers, label: 'Stack', desc: 'Interactions' },
                        ]).map(o => (
                          <button key={o.k} onClick={() => { setCoachMode(o.k); setShowCoachModeDropdown(false) }}
                            className={cn('w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center gap-2',
                              coachMode === o.k ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            <o.icon className="w-3 h-3 shrink-0" />
                            <div><div className="font-bold">{o.label}</div><div className="text-[8px] text-gray-600">{o.desc}</div></div>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {/* ═══ Insight Mode ═══ */}
              {coachMode === 'insight' && (
                <div className="space-y-2">
                  {smartRecs.length === 0 ? (
                    <div className="py-8 text-center"><Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Add supplements for insights.</p></div>
                  ) : smartRecs.map((rec, i) => {
                    const Icon = rec.icon
                    const catStyles: Record<string, { bg: string; icon: string; accent: string }> = {
                      Performance: { bg: 'bg-purple-500/[0.04] border-purple-500/10', icon: 'text-purple-400', accent: 'bg-purple-400' },
                      Recovery: { bg: 'bg-emerald-500/[0.04] border-emerald-500/10', icon: 'text-emerald-400', accent: 'bg-emerald-400' },
                      Nutrition: { bg: 'bg-amber-500/[0.04] border-amber-500/10', icon: 'text-amber-400', accent: 'bg-amber-400' },
                      General: { bg: 'bg-gray-500/[0.04] border-gray-500/10', icon: 'text-gray-400', accent: 'bg-gray-400' },
                    }
                    const cs = catStyles[rec.category] || catStyles.General
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn('group relative flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-white/[0.02]', cs.bg)}>
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cs.bg)}>
                          <Icon className={cn('w-3.5 h-3.5', cs.icon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white">{rec.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{rec.text}</p>
                        </div>
                        <div className={cn('w-1 h-8 rounded-full shrink-0 mt-0.5', cs.accent, 'opacity-30')} />
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* ═══ Timing Mode ═══ */}
              {coachMode === 'timing' && (
                <div className="space-y-3">
                  {timingData.length === 0 ? (
                    <div className="py-8 text-center"><Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Add supplements with times set.</p></div>
                  ) : timingData.map(([time, data], i) => {
                    const tc = TIME_COLORS[time as TimeOfDay]
                    const TimeIcon = TIME_ICONS[time as TimeOfDay]
                    return (
                      <motion.div key={time} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden">
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r ${tc.bg} border-b ${tc.border}`}>
                          <TimeIcon className={`w-3.5 h-3.5 ${tc.icon}`} />
                          <span className={`text-[11px] font-bold ${tc.text}`}>{time}</span>
                          <span className="text-[9px] text-gray-500">{data.total} supplement{data.total !== 1 ? 's' : ''}</span>
                          <div className="flex-1" />
                          <div className="flex -space-x-1">
                            {data.supps.slice(0, 4).map((_, j) => (
                              <div key={j} className="w-4 h-4 rounded-full border border-[#0c0c14] bg-white/[0.06]" />
                            ))}
                            {data.supps.length > 4 && <span className="text-[8px] text-gray-500 ml-1">+{data.supps.length - 4}</span>}
                          </div>
                        </div>
                        <div className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {data.supps.map(name => (
                              <span key={name} className="text-[9px] font-medium text-gray-400 bg-white/[0.03] border border-white/[0.04] px-2 py-1 rounded-md">{name}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  {/* Tip */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/08">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-white">Timing Tip</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Fat-soluble vitamins (D3, K2, fish oil) absorb better with meals. Take magnesium at night for sleep support.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Cost Mode ═══ */}
              {coachMode === 'cost' && (
                <div className="space-y-3">
                  {costBreakdown.length === 0 ? (
                    <div className="py-8 text-center"><DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Add cost & servings to track spending.</p></div>
                  ) : (
                    <>
                      {/* Total monthly */}
                      <div className="rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-violet-500/[0.02] border border-violet-500/10 p-4 text-center">
                        <p className="text-[9px] text-violet-300/70 uppercase tracking-wider font-bold mb-1">Monthly Estimate</p>
                        <div className="text-[28px] font-black text-violet-300 tabular-nums">${monthlyCost.toFixed(0)}</div>
                        <p className="text-[9px] text-gray-500 mt-1">{costBreakdown.length} supplement{costBreakdown.length !== 1 ? 's' : ''} tracked</p>
                      </div>
                      {/* Breakdown */}
                      {costBreakdown.map((item, i) => (
                        <motion.div key={item.name} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/[0.06] border border-violet-500/10 flex items-center justify-center shrink-0">
                            <DollarSign className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                            <p className="text-[9px] text-gray-500">${item.perServing.toFixed(2)}/serving \u00B7 {item.servings} servings</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] font-black text-white tabular-nums">${item.perMonth.toFixed(0)}</p>
                            <p className="text-[8px] text-gray-500">/month</p>
                          </div>
                        </motion.div>
                      ))}
                      {/* Tip */}
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/[0.03] border border-amber-500/08">
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-white">Cost Tip</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Buying larger quantities often saves 20-40%. Consider 90-day supplies for your daily staples.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ═══ Refill Mode ═══ */}
              {coachMode === 'refill' && (
                <div className="space-y-2">
                  {supplements.filter(s => s.refillDays && s.refillDays > 0).length === 0 ? (
                    <div className="py-8 text-center"><Package className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Set refill days to track supply.</p></div>
                  ) : supplements.filter(s => s.refillDays && s.refillDays > 0).map((supp, i) => {
                    const daysLeft = supp.refillDays || 30
                    const pct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
                    const urgency = daysLeft <= 3 ? { color: '#ef4444', bg: 'bg-red-500', label: 'Critical' } : daysLeft <= 7 ? { color: '#f59e0b', bg: 'bg-amber-500', label: 'Soon' } : { color: '#10b981', bg: 'bg-emerald-500', label: 'Good' }
                    return (
                      <motion.div key={supp.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${urgency.bg} ${daysLeft <= 3 ? 'animate-pulse' : ''}`} />
                            <span className="text-[11px] font-bold text-white">{supp.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: urgency.color, backgroundColor: `${urgency.color}15` }}>{urgency.label}</span>
                            <span className="text-[10px] font-bold" style={{ color: urgency.color }}>{daysLeft}d left</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                            className="h-full rounded-full" style={{ backgroundColor: urgency.color }} />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* ═══ Stack Mode ═══ */}
              {coachMode === 'stack' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-violet-500/[0.03] border border-violet-500/08">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-bold text-violet-300 uppercase tracking-wider">Stack Overview</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          {(() => {
                            const cats: Record<string, { count: number; color: string }> = {}
                            const colors = ['stroke-violet-500', 'stroke-cyan-500', 'stroke-amber-500', 'stroke-emerald-500', 'stroke-rose-500']
                            let ci = 0; supplements.forEach(s => { const c = s.stack || 'Other'; if (!cats[c]) { cats[c] = { count: 0, color: colors[ci % colors.length] }; ci++ }; cats[c].count++ })
                            const total = supplements.length; let off = 0
                            return Object.entries(cats).map(([n, d]) => { const p = (d.count / total) * 100; const seg = <circle key={n} cx="18" cy="18" r="15.915" fill="transparent" className={`${d.color} opacity-80`} strokeWidth="3" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={`${-off}`} />; off += p; return seg })
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-black text-white/80">{supplements.length}</span></div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1">
                        {(() => {
                          const cats: Record<string, { count: number; dot: string }> = {}
                          const dots = ['bg-violet-400', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400']
                          let ci = 0; supplements.forEach(s => { const c = s.stack || 'Other'; if (!cats[c]) { cats[c] = { count: 0, dot: dots[ci % dots.length] }; ci++ }; cats[c].count++ })
                          return Object.entries(cats).sort((a, b) => b[1].count - a[1].count).map(([n, d]) => (
                            <div key={n} className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
                              <span className="text-[9px] text-gray-400 truncate flex-1">{n}</span>
                              <span className="text-[9px] font-bold text-white">{d.count}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>

                  {supplementInteractions.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/08">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Interactions</span>
                        </div>
                        <span className="text-[9px] text-emerald-400/50">{supplementInteractions.length} found</span>
                      </div>
                      <div className="space-y-1.5">
                        {supplementInteractions.map((inter, i) => (
                          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-[10px]',
                              inter.type === 'synergy' && 'bg-emerald-500/[0.03] border-emerald-500/08',
                              inter.type === 'conflict' && 'bg-red-500/[0.03] border-red-500/08',
                              inter.type === 'timing' && 'bg-amber-500/[0.03] border-amber-500/08')}>
                            {inter.type === 'synergy' && <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />}
                            {inter.type === 'conflict' && <ShieldAlert className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
                            {inter.type === 'timing' && <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />}
                            <div className="flex-1"><p className="font-bold text-white">{inter.suppA} + {inter.suppB}</p><p className="text-gray-400">{inter.message}</p></div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {supplementInteractions.length === 0 && (
                    <div className="py-8 text-center"><Layers className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Add more supplements for interactions.</p></div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── EMPTY STATE ─── */}
      {totalCount === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0c0c14] p-10 text-center shadow-xl">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-cyan-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="relative">
            <motion.div animate={{ rotate: [0, -6, 6, -6, 0], y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 border border-white/[0.08] flex items-center justify-center mx-auto mb-5 shadow-2xl">
              <Pill className="w-8 h-8 text-gray-500" />
            </motion.div>
            <p className="text-white font-bold text-lg mb-1.5">No supplements yet</p>
            <p className="text-gray-500 text-[12px] mb-6 max-w-[260px] mx-auto">Start tracking your daily stack to unlock AI insights</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { resetForm(); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-bold shadow-lg shadow-violet-500/20 transition-all">
              <Plus className="w-4 h-4" /> Add First Supplement
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ─── ADD MODAL ─── */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title="">
        <div className="-mt-2">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/15 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/10">
              <Pill className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-[16px] font-extrabold text-white">Add Supplement</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Track your nutrition stack</p>
          </div>

          {/* Quick Add */}
          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-2.5">
              <Sparkles className="w-2.5 h-2.5 text-violet-400" /> Quick Add
            </label>
            <div className="grid grid-cols-2 gap-2">
              {commonSupplements.map(s => (
                <motion.button key={s.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleQuickAdd(s.name, s.dosage)}
                  className={cn('relative text-left px-3 py-3 rounded-[14px] text-[11px] border transition-all overflow-hidden',
                    formData.name === s.name ? 'border-violet-500/25 text-white' : 'border-white/[0.05] text-gray-400 hover:text-white hover:border-white/10')}>
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity', s.color, formData.name === s.name ? 'opacity-100' : 'group-hover:opacity-50')} />
                  <div className="relative flex items-center gap-2.5">
                    <span className="text-base">{s.emoji}</span>
                    <div>
                      <div className="font-bold leading-tight">{s.name}</div>
                      <div className="text-[9px] text-gray-500">{s.dosage}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-[#0d0d15] text-[8px] text-gray-600 uppercase tracking-widest font-semibold">manual</span>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <Input label="Supplement Name" placeholder="e.g., Vitamin D3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} icon={<Pill className="w-3.5 h-3.5" />} />
            <Input label="Dosage" placeholder="e.g., 5000 IU" value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value })} />
          </div>

          <div className="mt-4">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-2">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFormData({ ...formData, frequency: f })}
                  className={cn('flex-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all capitalize',
                    formData.frequency === f ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'border-white/[0.05] text-gray-500 hover:text-white hover:border-white/10')}>{f}</button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-2">Times of Day</label>
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map(({ value, icon: Icon }) => {
                const tc = TIME_COLORS[value]
                return (
                  <button key={value} type="button" onClick={() => toggleTime(value)}
                    className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-bold border transition-all',
                      formData.times.includes(value) ? `bg-gradient-to-br ${tc.bg} ${tc.border} ${tc.text}` : 'border-white/[0.05] text-gray-500 hover:text-white hover:border-white/10')}>
                    <Icon className="w-4 h-4" /> {value}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <Input label="Stack (optional)" placeholder="e.g., Morning, Pre-Workout" value={formData.stack} onChange={e => setFormData({ ...formData, stack: e.target.value })} icon={<Layers className="w-3.5 h-3.5" />} />
            <Input label="Notes (optional)" placeholder="Any notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cost ($)" placeholder="29.99" type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} icon={<DollarSign className="w-3.5 h-3.5" />} />
              <Input label="Servings" placeholder="60" type="number" value={formData.totalServings} onChange={e => setFormData({ ...formData, totalServings: e.target.value })} />
            </div>
            {formData.cost && formData.totalServings && parseFloat(formData.cost) > 0 && parseInt(formData.totalServings) > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Per serving: <b>${(parseFloat(formData.cost) / parseInt(formData.totalServings)).toFixed(2)}</b></span>
              </div>
            )}
            <Input label="Refill (days)" placeholder="30" type="number" value={formData.refillDays} onChange={e => setFormData({ ...formData, refillDays: e.target.value })} />
          </div>

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={addSupplement} disabled={!formData.name.trim() || !formData.dosage.trim()}
            className="w-full mt-5 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-extrabold uppercase tracking-wider shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Supplement
          </motion.button>
        </div>
      </Modal>

      {/* ─── DELETE MODAL ─── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 16 }}
              className="relative z-10 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-[20px] border border-red-500/10 bg-[#0c0c14] p-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-[50px]" />
                <div className="relative text-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-[16px] font-extrabold text-white mb-1">Delete?</h3>
                  <p className="text-[12px] text-gray-400 mb-0.5">Remove <span className="text-white font-bold">{deleteTarget.name}</span> ({deleteTarget.dosage})</p>
                  <p className="text-[10px] text-gray-500 mb-5">All logs will also be deleted.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white text-[12px] font-bold transition-all">Cancel</button>
                    <button onClick={deleteSupplement} className="flex-1 h-10 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-[12px] font-bold transition-all flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNDO TOAST ─── */}
      <AnimatePresence>
        {justTaken && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#14141f] border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{justTaken.name}</p>
              <p className="text-[9px] text-gray-500">Marked as taken</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={undoTake}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] font-bold hover:bg-violet-500/25 transition-all">
              Undo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

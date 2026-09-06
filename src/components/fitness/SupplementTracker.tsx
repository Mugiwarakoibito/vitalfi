import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, Clock, X, AlertTriangle,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Target, Flame, Activity,
  DollarSign, Layers, CalendarCheck,
  Brain, ShieldCheck, ShieldAlert, Info, Zap, Package,
  CheckCircle2, Dumbbell, TrendingUp, BarChart3,
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
const TIME_GRADIENTS: Record<TimeOfDay, string> = {
  Morning: 'from-amber-500/20 to-orange-500/10 border-amber-500/25 text-amber-300',
  Afternoon: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/25 text-yellow-300',
  Evening: 'from-orange-500/20 to-rose-500/10 border-orange-500/25 text-orange-300',
  Night: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/25 text-indigo-300',
}

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU', emoji: '\u2600\uFE0F' },
  { name: 'Omega-3 Fish Oil', dosage: '2000mg', emoji: '\uD83D\uDC1F' },
  { name: 'Creatine', dosage: '5g', emoji: '\uD83D\uDCAA' },
  { name: 'Whey Protein', dosage: '30g', emoji: '\uD83E\uDDC0' },
  { name: 'Magnesium', dosage: '400mg', emoji: '\u2728' },
  { name: 'Zinc', dosage: '30mg', emoji: '\uD83D\uDD11' },
  { name: 'Multivitamin', dosage: '1 tablet', emoji: '\uD83D\uDD36' },
  { name: 'Collagen', dosage: '10g', emoji: '\uD83D\uDC8D' },
  { name: 'Pre-workout', dosage: '1 scoop', emoji: '\u26A1' },
  { name: 'BCAA', dosage: '5g', emoji: '\uD83D\uDCA8' },
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

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const fadeIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }

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
    const matched: { icon: typeof Dumbbell; title: string; text: string; category: string; priority: number; gradient: string }[] = []
    if (totalCount === 0) {
      matched.push({ icon: Pill, title: 'Get Started', text: 'Add your first supplement to begin tracking and unlock AI-powered insights.', category: 'General', priority: 10, gradient: 'from-gray-500/20 to-gray-600/10' })
    } else if (pct === 100) {
      matched.push({ icon: CheckCircle2, title: 'Perfect Day', text: `All ${total} supplements taken. You\u2019re operating at peak efficiency.`, category: 'Performance', priority: 10, gradient: 'from-emerald-500/20 to-emerald-600/10' })
    } else if (pct >= 50) {
      matched.push({ icon: Zap, title: 'Almost There', text: `${taken}/${total} done. ${total - taken} more to complete today\u2019s stack.`, category: 'Performance', priority: 8, gradient: 'from-amber-500/20 to-amber-600/10' })
    } else if (total > 0) {
      matched.push({ icon: AlertTriangle, title: 'Low Adherence', text: `Only ${taken}/${total} taken. Consistency compounds \u2014 each day matters.`, category: 'Recovery', priority: 9, gradient: 'from-red-500/20 to-red-600/10' })
    }
    if (suppStreak >= 7) matched.push({ icon: Flame, title: 'Streak Master', text: `${suppStreak}-day perfect streak. You\u2019re in the top tier of supplement discipline.`, category: 'Performance', priority: 7, gradient: 'from-orange-500/20 to-orange-600/10' })
    if (suppStreak >= 3 && suppStreak < 7) matched.push({ icon: Flame, title: 'Building Momentum', text: `${suppStreak}-day streak. 4 more days to hit the weekly milestone.`, category: 'Performance', priority: 6, gradient: 'from-orange-500/20 to-orange-600/10' })
    if (monthlyCost > 30) matched.push({ icon: DollarSign, title: 'Cost Optimization', text: `$${monthlyCost.toFixed(0)}/mo estimated. Consider stacking to reduce redundancy.`, category: 'Nutrition', priority: 5, gradient: 'from-violet-500/20 to-violet-600/10' })
    if (remainingCount > 0 && remainingCount <= 2) matched.push({ icon: Target, title: 'Final Push', text: `Just ${remainingCount} more \u2014 don\u2019t break the chain today.`, category: 'Performance', priority: 8, gradient: 'from-cyan-500/20 to-cyan-600/10' })
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
  const scoreGlow = adherenceScore >= 80 ? 'shadow-[0_0_40px_rgba(16,185,129,0.3)]' : adherenceScore >= 50 ? 'shadow-[0_0_40px_rgba(245,158,11,0.3)]' : 'shadow-[0_0_40px_rgba(239,68,68,0.3)]'
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (adherenceScore / 100) * circumference

  const timeOfDayNow = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : new Date().getHours() < 21 ? 'Evening' : 'Night'

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Supplements</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">{totalCount} supplement{totalCount !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex items-center gap-2.5">
          {totalCount > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`relative p-2.5 rounded-2xl border transition-all duration-300 ${activePanel === 'patterns' ? 'bg-violet-500/20 border-violet-500/40 text-violet-400 shadow-lg shadow-violet-500/20' : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'}`}
              onClick={() => setActivePanel(p => p === 'patterns' ? null : 'patterns')} title="Weekly Patterns">
              <BarChart3 className="w-5 h-5" />
            </motion.button>
          )}
          {totalCount > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`relative p-2.5 rounded-2xl border transition-all duration-300 ${activePanel === 'coach' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'}`}
              onClick={() => setActivePanel(p => p === 'coach' ? null : 'coach')} title="AI Coach">
              <Brain className="w-5 h-5" />
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => { resetForm(); setShowModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 border border-violet-500/30">
            <Plus className="w-4 h-4" />Add
          </motion.button>
        </div>
      </motion.div>

      {/* Hero Ring */}
      {totalCount > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 backdrop-blur-2xl p-7 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-8">
            {/* SVG Ring */}
            <div className={`relative w-36 h-36 shrink-0 ${scoreGlow} rounded-full`}>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent" />
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 relative z-10">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={scoreColor} stopOpacity="0.4" />
                    <stop offset="50%" stopColor={scoreColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={scoreColor} stopOpacity="1" />
                  </linearGradient>
                  <filter id="ringGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <circle cx="60" cy="60" r="54" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <motion.circle cx="60" cy="60" r="54" fill="transparent"
                  stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                  filter="url(#ringGlow)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
                  className="text-5xl font-black text-white drop-shadow-2xl">{adherenceScore}</motion.span>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-semibold mt-0.5">percent</span>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {[
                { icon: Check, label: 'Taken', value: takenTodayCount, sub: `of ${totalCount} today`, color: 'emerald', delay: 0.15 },
                { icon: Target, label: 'Left', value: remainingCount, sub: 'remaining', color: 'amber', delay: 0.2 },
                { icon: Flame, label: 'Streak', value: suppStreak, sub: 'perfect days', color: 'orange', delay: 0.25, suffix: 'd' },
                { icon: DollarSign, label: 'Cost', value: `$${monthlyCost.toFixed(0)}`, sub: 'per month', color: 'violet', delay: 0.3 },
              ].map((stat) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay, duration: 0.4 }}
                  className={`group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-4 hover:from-white/[0.05] hover:to-white/[0.03] hover:border-white/[0.12] transition-all duration-300 cursor-default`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, var(--tw-gradient-stops))` }} />
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className={`p-1 rounded-lg bg-${stat.color}-500/10`}>
                      <stat.icon className={`w-3 h-3 text-${stat.color}-400`} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">{stat.label}</span>
                  </div>
                  <p className={`text-3xl font-black text-${stat.color}-300`}>{stat.value}{stat.suffix && <span className="text-sm font-medium text-gray-500 ml-0.5">{stat.suffix}</span>}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Adherence bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold">Daily Progress</span>
              <span className="text-xs font-black" style={{ color: scoreColor }}>{adherenceScore}%</span>
            </div>
            <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${adherenceScore}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${scoreColor}60, ${scoreColor})`, boxShadow: `0 0 20px ${scoreColor}50` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's Schedule */}
      {totalCount > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 backdrop-blur-2xl p-6 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-cyan-500/[0.01] pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/[0.05] rounded-full blur-[60px] pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Today's Schedule</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{timeOfDayNow} \u2014 {scheduleToday.length} supplement{scheduleToday.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-400">{takenTodayCount}/{scheduleToday.length}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {scheduleToday.map((s, i) => {
                const taken = takenTodayIds.has(s.id)
                const TimeIcon = TIME_ICONS[s.times[0] as TimeOfDay] || Clock
                const tod = (s.times[0] || 'Morning') as TimeOfDay
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 ${taken
                      ? 'bg-gradient-to-r from-emerald-500/[0.06] to-emerald-500/[0.02] border-emerald-500/15 hover:border-emerald-500/25'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'}`}>
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${taken
                      ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/25 shadow-lg shadow-emerald-500/10'
                      : `bg-gradient-to-br ${TIME_GRADIENTS[tod]} border shadow-lg shadow-${tod === 'Morning' ? 'amber' : tod === 'Afternoon' ? 'yellow' : tod === 'Evening' ? 'orange' : 'indigo'}-500/5`}`}>
                      {taken ? <Check className="w-5 h-5 text-emerald-400" /> : <TimeIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <p className={`text-sm font-bold truncate ${taken ? 'text-emerald-300' : 'text-white'}`}>{s.name}</p>
                        {s.stack && (
                          <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">{s.stack}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 font-medium">{s.dosage} \u00B7 {s.times.join(', ')}</p>
                    </div>
                    {!taken ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => markAsTaken(s)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 text-emerald-400 hover:from-emerald-500/20 hover:to-emerald-600/10 hover:border-emerald-500/30 transition-all text-xs font-bold opacity-0 group-hover:opacity-100 shadow-lg shadow-emerald-500/5">
                        Take
                      </motion.button>
                    ) : (
                      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Taken</span>
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
          <motion.div key="patterns" initial={{ opacity: 0, y: -15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[28px] border border-violet-500/15 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 backdrop-blur-2xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-purple-500/[0.02] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-40 h-40 bg-purple-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">Weekly Patterns</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">Your supplement consistency</p>
                  </div>
                </div>
                <div className="flex gap-1 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
                  {(['7d', '14d', '30d'] as const).map(p => (
                    <motion.button key={p} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setTrendPeriod(p)}
                      className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${trendPeriod === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/25 shadow-lg shadow-violet-500/10' : 'text-gray-500 hover:text-white border border-transparent'}`}>{p}</motion.button>
                  ))}
                </div>
              </div>
              {/* 7-Day Bars */}
              <div className="grid grid-cols-7 gap-2.5 mb-6">
                {adherenceWeek.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{day.label}</span>
                    <div className="w-full h-24 bg-white/[0.03] rounded-2xl overflow-hidden flex items-end border border-white/[0.05]">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(day.pct, 4)}%` }} transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full rounded-t-xl relative ${day.pct >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : day.pct >= 50 ? 'bg-gradient-to-t from-amber-600 to-amber-400' : day.pct > 0 ? 'bg-gradient-to-t from-red-600/70 to-red-400/70' : 'bg-white/[0.03]'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-xl" />
                      </motion.div>
                    </div>
                    <span className={`text-[11px] font-black ${day.pct >= 80 ? 'text-emerald-400' : day.pct >= 50 ? 'text-amber-400' : day.pct > 0 ? 'text-red-400/70' : 'text-gray-600'}`}>{day.pct}%</span>
                  </div>
                ))}
              </div>
              {/* Trend Line */}
              <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-violet-500/10">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Trend \u00B7 {trendPeriod}</span>
                </div>
                <div className="h-32">
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
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '10px 14px', backdropFilter: 'blur(20px)' }}
                        itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 700 }}
                        labelStyle={{ color: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        formatter={(value: number) => [`${value}%`, 'Adherence']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label} />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#000', strokeWidth: 2, className: 'drop-shadow-lg' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Summary chips */}
              <div className="flex items-center gap-3 mt-5">
                {[
                  { icon: Flame, color: 'orange', label: 'Streak', value: `${suppStreak}d` },
                  { icon: Activity, color: 'violet', label: 'Week', value: `${weekAdherence}%` },
                  { icon: Pill, color: 'cyan', label: 'Daily', value: dailySupps.length },
                ].map(chip => (
                  <div key={chip.label} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2">
                    <chip.icon className={`w-3.5 h-3.5 text-${chip.color}-400`} />
                    <span className="text-[10px] text-gray-500 font-medium">{chip.label}: <span className="text-white font-black">{chip.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Coach Panel */}
        {activePanel === 'coach' && (
          <motion.div key="coach" initial={{ opacity: 0, y: -15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[28px] border border-cyan-500/15 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 backdrop-blur-2xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-violet-500/[0.02] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/20 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/15">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-gray-950 animate-pulse shadow-lg shadow-emerald-400/50" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">AI Supplement Coach</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">Your personalized supplement intelligence</p>
                  </div>
                </div>
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCoachModeDropdown(p => !p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-bold transition-all duration-300 ${showCoachModeDropdown ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}>
                    <span className="text-sm">{coachMode === 'insight' ? '\uD83E\uDDE0' : coachMode === 'refill' ? '\uD83D\uDCE6' : '\uD83D\uDCA1'}</span>
                    <span>{coachMode === 'insight' ? 'Insight' : coachMode === 'refill' ? 'Refill' : 'Stack'}</span>
                  </motion.button>
                  {showCoachModeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachModeDropdown(false)} />
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute right-0 top-12 z-20 w-60 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Switch Mode</p>
                        <div className="flex flex-col gap-1.5">
                          {([
                            { key: 'insight' as const, emoji: '\uD83E\uDDE0', label: 'AI Insight', desc: 'Smart daily recommendations', color: 'cyan' },
                            { key: 'refill' as const, emoji: '\uD83D\uDCE6', label: 'Refill Tracker', desc: 'Never run out', color: 'amber' },
                            { key: 'stack' as const, emoji: '\uD83D\uDCA1', label: 'Stack Intel', desc: 'Interactions & overview', color: 'violet' },
                          ]).map(opt => (
                            <motion.button key={opt.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => { setCoachMode(opt.key); setShowCoachModeDropdown(false) }}
                              className={`text-left px-3 py-3 rounded-xl text-[11px] font-medium transition-all duration-200 ${coachMode === opt.key
                                ? `bg-${opt.color}-500/15 text-${opt.color}-300 border border-${opt.color}-500/25`
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-base">{opt.emoji}</span>
                                <div>
                                  <div className="font-bold">{opt.label}</div>
                                  <div className="text-[9px] text-gray-500 mt-0.5">{opt.desc}</div>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {/* Mode: AI Insight */}
              {coachMode === 'insight' && (
                <div className="space-y-3">
                  {smartRecs.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.05] text-center">
                      <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-[12px] text-gray-500 font-medium">Add supplements to unlock AI-powered insights.</p>
                    </div>
                  ) : smartRecs.map((rec, i) => {
                    const Icon = rec.icon
                    const catBorders: Record<string, string> = {
                      Performance: 'border-purple-500/15 hover:border-purple-500/25',
                      Recovery: 'border-emerald-500/15 hover:border-emerald-500/25',
                      Nutrition: 'border-amber-500/15 hover:border-amber-500/25',
                      General: 'border-gray-500/15 hover:border-gray-500/25',
                    }
                    const catIcons: Record<string, string> = {
                      Performance: 'text-purple-400 bg-purple-500/10',
                      Recovery: 'text-emerald-400 bg-emerald-500/10',
                      Nutrition: 'text-amber-400 bg-amber-500/10',
                      General: 'text-gray-400 bg-gray-500/10',
                    }
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.3 }}
                        className={`group p-4 rounded-2xl border bg-gradient-to-r ${rec.gradient} ${catBorders[rec.category] || catBorders.General} hover:bg-white/[0.04] transition-all duration-300`}>
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-xl shrink-0 ${catIcons[rec.category] || catIcons.General} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-white/90 mb-0.5">{rec.title}</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{rec.text}</p>
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
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.05] text-center">
                      <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-[12px] text-gray-500 font-medium">Set refill days on your supplements to track supply.</p>
                    </div>
                  ) : supplements.filter(s => s.refillDays && s.refillDays > 0).map((supp, i) => {
                    const daysLeft = supp.refillDays || 30
                    const pct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
                    const urgencyColor = daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'amber' : 'emerald'
                    return (
                      <motion.div key={supp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}
                        className={`group p-5 rounded-2xl bg-gradient-to-r from-white/[0.02] to-white/[0.01] border border-white/[0.06] hover:from-white/[0.04] hover:to-white/[0.02] hover:border-white/[0.12] transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-3 h-3 rounded-full ${daysLeft <= 3 ? `bg-${urgencyColor}-400 animate-pulse shadow-lg shadow-${urgencyColor}-400/50` : `bg-${urgencyColor}-400 shadow-lg shadow-${urgencyColor}-400/30`}`} />
                            <span className="text-[12px] font-bold text-white">{supp.name}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-xl bg-${urgencyColor}-500/10 border border-${urgencyColor}-500/20`}>
                            <span className={`text-[11px] font-black text-${urgencyColor}-400`}>{daysLeft}d left</span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden mb-3">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full bg-gradient-to-r from-${urgencyColor}-600 to-${urgencyColor}-400 relative`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-medium">{supp.dosage}</span>
                          <span className={`text-[10px] font-bold text-${urgencyColor}-400`}>
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
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/[0.04] to-purple-500/[0.03] border border-violet-500/10 hover:border-violet-500/20 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <Layers className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-[10px] font-bold text-violet-300 uppercase tracking-[0.15em]">Stack Overview</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 shrink-0">
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
                                  className={`${data.color} opacity-80`} strokeWidth="3.5"
                                  strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={`${-offset}`}
                                  style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                              )
                              offset += p
                              return seg
                            })
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black text-white/90">{supplements.length}</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-2">
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
                            <div key={name} className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${data.color} shrink-0`} />
                              <span className="text-[11px] text-gray-400 truncate flex-1 font-medium">{name}</span>
                              <span className={`text-[11px] font-black ${data.dot}`}>{data.count}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Interactions */}
                  {supplementInteractions.length > 0 && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] to-cyan-500/[0.03] border border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-[0.15em]">Interactions</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/60 font-medium">{supplementInteractions.length} detected</span>
                      </div>
                      <div className="space-y-2">
                        {supplementInteractions.map((inter, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className={cn('flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:scale-[1.01]',
                              inter.type === 'synergy' && 'bg-emerald-500/[0.04] border-emerald-500/10 hover:border-emerald-500/20',
                              inter.type === 'conflict' && 'bg-red-500/[0.04] border-red-500/10 hover:border-red-500/20',
                              inter.type === 'timing' && 'bg-amber-500/[0.04] border-amber-500/10 hover:border-amber-500/20',
                            )}>
                            {inter.type === 'synergy' && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                            {inter.type === 'conflict' && <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                            {inter.type === 'timing' && <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white">{inter.suppA} + {inter.suppB}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{inter.message}</p>
                            </div>
                            <span className={cn('text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5 px-2 py-0.5 rounded-md',
                              inter.type === 'synergy' && 'text-emerald-400 bg-emerald-500/10',
                              inter.type === 'conflict' && 'text-red-400 bg-red-500/10',
                              inter.type === 'timing' && 'text-amber-400 bg-amber-500/10',
                            )}>{inter.type}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {supplementInteractions.length === 0 && (
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.05] text-center">
                      <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-[12px] text-gray-500 font-medium">Add more supplements to discover stack interactions.</p>
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
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 backdrop-blur-2xl p-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <motion.div animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-xl" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shadow-2xl">
                <Pill className="w-10 h-10 text-gray-500" />
              </div>
            </motion.div>
            <p className="text-gray-300 font-bold text-xl mb-2">No supplements tracked</p>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Start your supplement stack to unlock AI-powered insights and track your daily routine</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { resetForm(); setShowModal(true) }}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 border border-violet-500/30">
              <Plus className="w-4.5 h-4.5" />Add Your First Supplement
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Supplement Cards */}
      {totalCount > 0 && (
        <div className="space-y-5">
          {supplementsByStack.noStack.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-lg bg-white/5">
                  <Layers className="w-3 h-3 text-gray-500" />
                </div>
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">Other</h4>
                <div className="flex-1 h-px bg-white/[0.05] ml-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplementsByStack.noStack.map((supp) => (
                  <SupplementCard key={supp.id} supp={supp} takenTodayIds={takenTodayIds} markAsTaken={markAsTaken} setDeleteTarget={setDeleteTarget} />
                ))}
              </div>
            </div>
          )}
          {Object.entries(supplementsByStack.grouped).map(([stackName, supps]) => (
            <div key={stackName}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-lg bg-violet-500/10">
                  <Layers className="w-3 h-3 text-violet-400" />
                </div>
                <h4 className="text-[11px] font-bold text-violet-400/80 uppercase tracking-[0.15em]">{stackName}</h4>
                <span className="text-[10px] text-gray-600 font-medium">{supps.length} supp{supps.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-violet-500/10 ml-2" />
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
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title="">
        <div className="space-y-6 -mt-1">
          {/* Modal Header */}
          <div className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/15">
              <Pill className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="text-lg font-black text-white">Add Supplement</h3>
            <p className="text-[11px] text-gray-500 mt-1">Track your daily nutrition stack</p>
          </div>

          {/* Quick Add */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />Quick Add
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {commonSupplements.map((s) => (
                <motion.button key={s.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleQuickAdd(s.name, s.dosage)}
                  className={cn('text-left px-4 py-3.5 rounded-2xl text-xs border transition-all duration-300',
                    formData.name === s.name
                      ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-white shadow-lg shadow-violet-500/15'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20')}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.emoji}</span>
                    <div>
                      <div className="font-bold">{s.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{s.dosage}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Manual Form */}
          <div className="space-y-4">
            <Input label="Supplement Name" placeholder="e.g., Vitamin D3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} icon={<Pill className="w-4 h-4" />} />
            <Input label="Dosage" placeholder="e.g., 5000 IU" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
          </div>

          <div>
            <label className="mb-2.5 block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((freq) => (
                <motion.button key={freq} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  type="button" onClick={() => setFormData({ ...formData, frequency: freq })}
                  className={cn('flex-1 px-3 py-3 rounded-2xl text-xs font-bold border transition-all duration-300 capitalize',
                    formData.frequency === freq
                      ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-white shadow-lg shadow-violet-500/15'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]')}>{freq}</motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2.5 block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Times of Day</label>
            <div className="grid grid-cols-4 gap-2.5">
              {timeOptions.map(({ value, icon: Icon }) => (
                <motion.button key={value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  type="button" onClick={() => toggleTime(value)}
                  className={cn('flex flex-col items-center gap-2 px-2 py-4 rounded-2xl text-xs font-bold border transition-all duration-300',
                    formData.times.includes(value)
                      ? `bg-gradient-to-br ${TIME_GRADIENTS[value]} shadow-lg`
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]')}>
                  <Icon className="w-5 h-5" /><span>{value}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Input label="Stack (optional)" placeholder="e.g., Morning, Pre-Workout, Night" value={formData.stack} onChange={(e) => setFormData({ ...formData, stack: e.target.value })} icon={<Layers className="w-4 h-4" />} />
          <Input label="Notes (optional)" placeholder="Any notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Cost ($)" placeholder="29.99" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} icon={<DollarSign className="w-4 h-4" />} />
            <Input label="Total Servings" placeholder="60" type="number" value={formData.totalServings} onChange={(e) => setFormData({ ...formData, totalServings: e.target.value })} />
          </div>

          {formData.cost && formData.totalServings && parseFloat(formData.cost) > 0 && parseInt(formData.totalServings) > 0 && (
            <motion.div {...fadeIn} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[11px] text-emerald-400">Cost per serving: <span className="font-black">${(parseFloat(formData.cost) / parseInt(formData.totalServings)).toFixed(2)}</span></p>
            </motion.div>
          )}

          <Input label="Refill in (days)" placeholder="e.g. 30" type="number" value={formData.refillDays} onChange={(e) => setFormData({ ...formData, refillDays: e.target.value })} />

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={addSupplement}
            disabled={!formData.name.trim() || !formData.dosage.trim()}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 border border-violet-500/30">
            <Plus className="w-4.5 h-4.5" />Add Supplement
          </motion.button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-[24px] border border-red-500/15 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-7 shadow-2xl shadow-red-500/5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full -mr-20 -mt-20 blur-[60px]" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center mb-5 shadow-lg shadow-red-500/15 border border-red-500/20">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Delete Supplement?</h3>
                  <p className="text-sm text-gray-400 mb-1">Are you sure you want to delete</p>
                  <p className="text-base font-bold text-white mb-5"><span className="text-rose-300">{deleteTarget.name}</span><span className="text-gray-500"> ({deleteTarget.dosage})</span></p>
                  <div className="px-5 py-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-6">
                    <p className="text-[11px] text-gray-500"><X className="w-3 h-3 inline mr-1 text-rose-400/60" />This will also remove all logs.</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setDeleteTarget(null)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold">
                      Cancel
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={deleteSupplement}
                      className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 transition-all text-sm font-bold flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />Delete
                    </motion.button>
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
    <motion.div layout whileHover={{ scale: 1.01, y: -2 }} transition={{ duration: 0.2 }}>
      <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 ${taken
        ? 'bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.02] border-emerald-500/15 hover:border-emerald-500/25 shadow-lg shadow-emerald-500/5'
        : 'bg-gradient-to-br from-white/[0.02] to-white/[0.01] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${taken ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-gray-500 shadow-lg shadow-gray-500/30'}`} />
              <h4 className="font-bold text-white truncate">{supp.name}</h4>
              {supp.stack && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  <Layers className="w-2 h-2" />{supp.stack}
                </span>
              )}
            </div>
            <p className="text-[13px] text-gray-400 ml-5.5 mt-1 font-medium">{supp.dosage}</p>
            {costPerServing !== null && (
              <p className="text-[10px] text-emerald-400/70 ml-5.5 mt-1 font-medium">
                <DollarSign className="w-2.5 h-2.5 inline" />${costPerServing.toFixed(2)}/serving
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2.5 ml-5.5">
              {supp.times.map((t) => {
                const Icon = TIME_ICONS[t as TimeOfDay] || Clock
                return (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-gray-400">
                    <Icon className="w-2.5 h-2.5" />{t}
                  </span>
                )
              })}
            </div>
            {supp.notes && <p className="text-[11px] text-gray-500 mt-2 ml-5.5 italic truncate">{supp.notes}</p>}
            {supp.refillDays != null && (
              <div className={`ml-5.5 mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${supp.refillDays <= 7 ? 'bg-red-500/10 border border-red-500/20 text-red-300' : supp.refillDays <= 14 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                <Clock className="w-2.5 h-2.5" />Refill in {supp.refillDays}d
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {taken ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-[11px] font-bold text-emerald-400">Taken</span>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => markAsTaken(supp)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 text-emerald-400 hover:from-emerald-500/20 hover:to-emerald-600/10 hover:border-emerald-500/30 transition-all text-xs font-bold whitespace-nowrap shadow-lg shadow-emerald-500/5">
                <Check className="w-3.5 h-3.5" />Take
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setDeleteTarget(supp)}
              className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

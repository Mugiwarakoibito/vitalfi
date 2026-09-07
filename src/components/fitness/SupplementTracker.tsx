import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, Clock, AlertTriangle,
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
  const timeOfDayNow = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : new Date().getHours() < 21 ? 'Evening' : 'Night'

  return (
    <div className="space-y-5">

      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight leading-none">Supplements</h1>
          <p className="text-[13px] text-gray-500 mt-1.5 font-medium">{totalCount} tracked \u00B7 {scheduleToday.length} today</p>
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

      {/* ─── HERO: INSANE WELLNESS PULSE ─── */}
      {totalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.05, ease: smooth }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#0c0c14] via-[#0e0e1a] to-[#0c0c14] shadow-2xl shadow-black/50">

          {/* ── Scanlines overlay ── */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />

          {/* ── Holographic border shimmer ── */}
          <motion.div animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${scoreColor}10, transparent, ${scoreColor}08, transparent)`, backgroundSize: '200% 100%', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1px' }} />

          {/* ── Ambient orbs ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -left-20 w-60 h-60 rounded-full blur-[100px]" style={{ backgroundColor: `${scoreColor}08` }} />
            <motion.div animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-[80px] bg-violet-500/[0.04]" />
          </div>

          {/* ── EKG Heartbeat line ── */}
          <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 800 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ekgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={scoreColor} stopOpacity="0" />
                  <stop offset="30%" stopColor={scoreColor} stopOpacity="0.15" />
                  <stop offset="50%" stopColor={scoreColor} stopOpacity="0.4" />
                  <stop offset="70%" stopColor={scoreColor} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,30 L100,30 L120,30 L140,10 L150,50 L160,5 L170,55 L180,30 L200,30 L350,30 L370,30 L390,12 L400,48 L410,8 L420,52 L430,30 L450,30 L600,30 L620,30 L640,14 L650,46 L660,10 L670,50 L680,30 L700,30 L800,30"
                fill="none" stroke="url(#ekgGrad)" strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.3, ease: smooth }} />
            </svg>
          </div>

          {/* ── Floating particles ── */}
          {[...Array(8)].map((_, i) => (
            <motion.div key={i}
              animate={{ x: [0, (i % 2 ? 1 : -1) * (20 + i * 8), 0], y: [0, -(15 + i * 6), 0], opacity: [0, 0.6, 0] }}
              transition={{ duration: 4 + i * 0.8, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: `${12 + i * 11}%`, top: `${30 + (i % 3) * 15}%`, backgroundColor: `${scoreColor}60` }} />
          ))}

          {/* ── Top grid line ── */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="relative p-6 pt-8">
            {/* Top: Greeting + Status Badge */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-[0.2em]">
                  {timeOfDayNow === 'Morning' ? '\u2600\uFE0F Morning' : timeOfDayNow === 'Afternoon' ? '\uD83C\uDF1E Afternoon' : timeOfDayNow === 'Evening' ? '\uD83C\uDF06 Evening' : '\uD83C\uDF19 Night'} // session
                </motion.p>
                <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="text-[20px] font-black text-white tracking-tight leading-none">
                  Wellness<span style={{ color: scoreColor }}>Pulse</span>
                </motion.h2>
              </div>
              <div className="flex items-center gap-2">
                {/* System status */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreColor, boxShadow: `0 0 6px ${scoreColor}` }} />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">System {adherenceScore >= 50 ? 'Online' : 'Degraded'}</span>
                </motion.div>
                {/* Streak */}
                {suppStreak > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, ...spring }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/[0.06] border border-orange-500/10">
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="text-[12px]">\uD83D\uDD25</motion.span>
                    <span className="text-[11px] font-black text-orange-300 tabular-nums">{suppStreak}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Main: Score Orb + Stats ── */}
            <div className="flex items-center gap-5 mb-6">
              {/* Score orb */}
              <div className="relative shrink-0">
                {/* Outermost ring - rotating dashes */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 rounded-full" style={{ border: `1.5px dashed ${scoreColor}12` }} />
                {/* Second ring - pulse */}
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -inset-2 rounded-full" style={{ border: `1px solid ${scoreColor}25` }} />
                {/* Glow */}
                <div className="absolute inset-0 rounded-full blur-2xl" style={{ backgroundColor: `${scoreColor}18` }} />
                {/* Core */}
                <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{ background: `conic-gradient(from 0deg, ${scoreColor}08, ${scoreColor}20, ${scoreColor}08)`, border: `1.5px solid ${scoreColor}25` }}>
                  {/* Inner glass */}
                  <div className="absolute inset-[3px] rounded-full bg-[#0c0c14]/80 backdrop-blur-sm" />
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
                    className="relative text-center">
                    {/* Glitch score */}
                    <div className="relative">
                      <span className="text-[28px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>{adherenceScore}</span>
                      <motion.span animate={{ clipPath: ['inset(0 0 65% 0)', 'inset(40% 0 0 0)', 'inset(0 0 65% 0)'] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                        className="absolute inset-0 text-[28px] font-black tabular-nums leading-none opacity-50" style={{ color: scoreColor, transform: 'translateX(1px)' }}>{adherenceScore}</motion.span>
                    </div>
                    <div className="text-[6px] text-gray-500 uppercase tracking-[0.25em] font-bold">percent</div>
                  </motion.div>
                </div>
              </div>

              {/* Right: breakdown */}
              <div className="flex-1 space-y-3">
                {/* Status text */}
                <div>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] font-bold text-white">{takenTodayCount} of {totalCount}</span>
                    <span className="text-[10px] text-gray-500">supplements taken</span>
                  </motion.div>
                  {/* Progress bar */}
                  <div className="h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${adherenceScore}%` }} transition={{ duration: 1.4, ease: smooth }}
                      className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${scoreColor}50, ${scoreColor})` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </motion.div>
                  </div>
                </div>

                {/* Cell grid - like a status matrix */}
                <div className="grid grid-cols-7 gap-1">
                  {scheduleToday.map((s, i) => {
                    const taken = takenTodayIds.has(s.id)
                    return (
                      <motion.button key={s.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.04, ...spring }}
                        onClick={() => markAsTaken(s)} disabled={taken}
                        className={cn('h-6 rounded-[4px] border transition-all duration-300 cursor-pointer',
                          taken ? 'border-emerald-500/20' : 'border-white/[0.04] hover:border-white/15'
                        )}
                        style={{ backgroundColor: taken ? `${scoreColor}15` : 'rgba(255,255,255,0.02)' }}
                        title={s.name}>
                        {taken && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center"><Check className="w-2.5 h-2.5" style={{ color: scoreColor }} /></motion.div>}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Stats row */}
                <div className="flex gap-1.5">
                  {[
                    { icon: Check, val: takenTodayCount, label: 'done', color: '#10b981' },
                    { icon: Target, val: remainingCount, label: 'left', color: '#f59e0b' },
                    { icon: DollarSign, val: `$${monthlyCost.toFixed(0)}/mo`, label: 'cost', color: '#a78bfa' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]">
                      <s.icon className="w-2.5 h-2.5" style={{ color: s.color }} />
                      <span className="text-[9px] font-bold text-white tabular-nums">{s.val}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Taking Today: pill tags ── */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: scoreColor }} />
                <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold">Taking today</p>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {scheduleToday.map((s, i) => {
                  const taken = takenTodayIds.has(s.id)
                  return (
                    <motion.button key={s.id} initial={{ opacity: 0, scale: 0.8, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.03, ...spring }}
                      onClick={() => markAsTaken(s)} disabled={taken}
                      className={cn(
                        'group relative inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[10px] font-bold border transition-all duration-300',
                        taken
                          ? 'bg-emerald-500/[0.06] border-emerald-500/12 text-emerald-400/70'
                          : 'bg-white/[0.02] border-white/[0.05] text-gray-400 hover:text-white hover:border-white/15 hover:bg-white/[0.05]'
                      )}>
                      {/* Glow on hover */}
                      {!taken && <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: `0 0 12px ${scoreColor}10` }} />}
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 transition-colors', taken ? 'bg-emerald-400' : 'bg-gray-600 group-hover:bg-gray-400')} />
                      {taken && <Check className="w-2.5 h-2.5 text-emerald-400/60" />}
                      <span className={taken ? 'line-through opacity-60' : ''}>{s.name}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Bottom: Wave decoration ── */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none overflow-hidden">
            <svg viewBox="0 0 400 20" className="w-full h-full" preserveAspectRatio="none">
              <motion.path d="M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 L400,20 L0,20 Z"
                animate={{ d: ['M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 L400,20 L0,20 Z', 'M0,10 Q50,20 100,10 T200,10 T300,10 T400,10 L400,20 L0,20 Z', 'M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 L400,20 L0,20 Z'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                fill={`${scoreColor}08`} />
            </svg>
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
                  <p className="text-[10px] text-gray-500">{timeOfDayNow} \u00B7 {scheduleToday.length} supplement{scheduleToday.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {/* Mini ring */}
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

            {/* Items */}
            <div className="px-5 pb-5 space-y-2">
              {scheduleToday.map((s, i) => {
                const taken = takenTodayIds.has(s.id)
                const TimeIcon = TIME_ICONS[s.times[0] as TimeOfDay] || Clock
                const tod = (s.times[0] || 'Morning') as TimeOfDay
                const tc = TIME_COLORS[tod]
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35, ease: smooth }}
                    className={`group relative flex items-center gap-3 rounded-[14px] border p-3 transition-all duration-300 ${
                      taken ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
                    }`}>
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      taken ? 'bg-emerald-500/10 border border-emerald-500/15' : `bg-gradient-to-br ${tc.bg} ${tc.border} border`
                    }`}>
                      {taken
                        ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring }}><Check className="w-4 h-4 text-emerald-400" /></motion.div>
                        : <TimeIcon className={`w-4 h-4 ${tc.icon}`} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-semibold truncate ${taken ? 'text-emerald-300' : 'text-white'}`}>{s.name}</span>
                        {s.stack && <span className="text-[8px] font-bold text-violet-400 bg-violet-500/8 border border-violet-500/15 px-1.5 py-0.5 rounded-md uppercase tracking-widest">{s.stack}</span>}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.dosage} \u00B7 {s.times.join(', ')}</p>
                    </div>

                    {/* Action */}
                    {!taken ? (
                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                        onClick={() => markAsTaken(s)}
                        className="shrink-0 h-8 px-4 rounded-lg bg-emerald-500 text-black text-[10px] font-extrabold uppercase tracking-wider opacity-0 group-hover:opacity-100 shadow-lg shadow-emerald-500/20 transition-all duration-200">
                        Take
                      </motion.button>
                    ) : (
                      <div className="shrink-0 h-7 px-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase">Done</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── PANELS ─── */}
      <AnimatePresence mode="wait">
        {/* Weekly Patterns */}
        {activePanel === 'patterns' && totalCount > 0 && (
          <motion.div key="patterns" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: smooth }}
            className="relative overflow-hidden rounded-[20px] border border-violet-500/10 bg-[#0c0c14] shadow-xl">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/[0.02] to-transparent" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white">Weekly Patterns</h3>
                    <p className="text-[10px] text-gray-500">Consistency overview</p>
                  </div>
                </div>
                <div className="flex gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
                  {(['7d', '14d', '30d'] as const).map(p => (
                    <button key={p} onClick={() => setTrendPeriod(p)}
                      className={cn('px-3 py-1 rounded-md text-[10px] font-bold transition-all', trendPeriod === p ? 'bg-violet-500/15 text-violet-300' : 'text-gray-500 hover:text-white')}>{p}</button>
                  ))}
                </div>
              </div>
              {/* Mini bars */}
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {adherenceWeek.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <div className="w-full h-16 bg-white/[0.025] rounded-lg overflow-hidden flex items-end border border-white/[0.04]">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(day.pct, 4)}%` }} transition={{ duration: 0.5, delay: i * 0.05, ease: smooth }}
                        className={`w-full rounded-t-md ${day.pct >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : day.pct >= 50 ? 'bg-gradient-to-t from-amber-600 to-amber-400' : day.pct > 0 ? 'bg-gradient-to-t from-red-600/60 to-red-400/60' : 'bg-white/[0.02]'}`} />
                    </div>
                    <span className="text-[8px] text-gray-600 font-bold">{day.label}</span>
                  </div>
                ))}
              </div>
              {/* Trend */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Trend \u00B7 {trendPeriod}</span>
                </div>
                <div className="h-24">
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
              {/* Chips */}
              <div className="flex gap-2 mt-4">
                {[
                  { icon: Flame, color: 'orange', label: 'Streak', val: `${suppStreak}d` },
                  { icon: Activity, color: 'violet', label: 'Week', val: `${weekAdherence}%` },
                  { icon: Pill, color: 'cyan', label: 'Daily', val: dailySupps.length },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-1.5 bg-white/[0.025] border border-white/[0.05] rounded-lg px-3 py-1.5">
                    <c.icon className={`w-3 h-3 text-${c.color}-400`} />
                    <span className="text-[9px] text-gray-500">{c.label}: <span className="text-white font-bold">{c.val}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Coach */}
        {activePanel === 'coach' && (
          <motion.div key="coach" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: smooth }}
            className="relative overflow-hidden rounded-[20px] border border-cyan-500/10 bg-[#0c0c14] shadow-xl">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-500/[0.02] to-transparent" />
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
                    <p className="text-[10px] text-gray-500">Personalized insights</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowCoachModeDropdown(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-gray-400 hover:text-white transition-all">
                    {coachMode === 'insight' ? '\uD83E\uDDE0' : coachMode === 'refill' ? '\uD83D\uDCE6' : '\uD83D\uDCA1'}
                    <span className="hidden sm:inline capitalize">{coachMode}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showCoachModeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachModeDropdown(false)} />
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 top-9 z-20 w-48 rounded-xl bg-gray-900 border border-white/[0.08] shadow-2xl p-1.5">
                        {([{ k: 'insight' as const, e: '\uD83E\uDDE0', l: 'Insight' }, { k: 'refill' as const, e: '\uD83D\uDCE6', l: 'Refill' }, { k: 'stack' as const, e: '\uD83D\uDCA1', l: 'Stack' }]).map(o => (
                          <button key={o.k} onClick={() => { setCoachMode(o.k); setShowCoachModeDropdown(false) }}
                            className={cn('w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-all',
                              coachMode === o.k ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            {o.e} {o.l}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {/* Insight mode */}
              {coachMode === 'insight' && (
                <div className="space-y-2">
                  {smartRecs.length === 0 ? (
                    <div className="py-8 text-center"><Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Add supplements for insights.</p></div>
                  ) : smartRecs.map((rec, i) => {
                    const Icon = rec.icon
                    const catBg: Record<string, string> = { Performance: 'bg-purple-500/8 border-purple-500/10', Recovery: 'bg-emerald-500/8 border-emerald-500/10', Nutrition: 'bg-amber-500/8 border-amber-500/10', General: 'bg-gray-500/8 border-gray-500/10' }
                    const catIcon: Record<string, string> = { Performance: 'text-purple-400', Recovery: 'text-emerald-400', Nutrition: 'text-amber-400', General: 'text-gray-400' }
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn('flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]', catBg[rec.category] || catBg.General)}>
                        <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', catIcon[rec.category] || catIcon.General)} />
                        <div><p className="text-[11px] font-bold text-white">{rec.title}</p><p className="text-[10px] text-gray-400">{rec.text}</p></div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Refill mode */}
              {coachMode === 'refill' && (
                <div className="space-y-2">
                  {supplements.filter(s => s.refillDays && s.refillDays > 0).length === 0 ? (
                    <div className="py-8 text-center"><Package className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Set refill days to track supply.</p></div>
                  ) : supplements.filter(s => s.refillDays && s.refillDays > 0).map((supp, i) => {
                    const daysLeft = supp.refillDays || 30; const pct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
                    const uc = daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'amber' : 'emerald'
                    return (
                      <motion.div key={supp.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${uc}-400 ${daysLeft <= 3 ? 'animate-pulse' : ''}`} />
                            <span className="text-[11px] font-bold text-white">{supp.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold text-${uc}-400`}>{daysLeft}d</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                            className={`h-full rounded-full bg-gradient-to-r from-${uc}-600 to-${uc}-400`} />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Stack mode */}
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
                          const dots = ['text-violet-400', 'text-cyan-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400']
                          let ci = 0; supplements.forEach(s => { const c = s.stack || 'Other'; if (!cats[c]) { cats[c] = { count: 0, dot: dots[ci % dots.length] }; ci++ }; cats[c].count++ })
                          return Object.entries(cats).sort((a, b) => b[1].count - a[1].count).map(([n, d]) => (
                            <div key={n} className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${d.dot.replace('text-', 'bg-')}`} />
                              <span className="text-[9px] text-gray-400 truncate flex-1">{n}</span>
                              <span className={`text-[9px] font-bold ${d.dot}`}>{d.count}</span>
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
                        <span className="text-[9px] text-emerald-400/50">{supplementInteractions.length}</span>
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
    </div>
  )
}

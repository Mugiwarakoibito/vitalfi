import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, AlertTriangle, Undo2, Clock,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Activity,
  DollarSign, Layers, CalendarCheck, Calendar,
  Brain, ShieldAlert, Zap, Package,
  CheckCircle2, BarChart3,
  ChevronLeft, ChevronRight, RotateCcw, Flame,
  TrendingUp, ChevronDown,
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { generateId, cn } from '@/lib/utils'

interface Supplement {
  id: string; name: string; dosage: string; frequency: 'daily' | 'weekly' | 'custom'
  times: string[]; notes?: string; refillDays?: number; stack?: string
  cost?: number; totalServings?: number; createdAt?: string
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

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
  const [weekOffset, setWeekOffset] = useState(0)
  const [coachMode, setCoachMode] = useState<'overview' | 'optimization' | 'planning'>('overview')
  const [coachDropdownOpen, setCoachDropdownOpen] = useState(false)

  const today = toLocalDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [justTaken, setJustTaken] = useState<Supplement | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('supplements')
      if (stored) setSupplements(JSON.parse(stored))
      const logStored = localStorage.getItem('supplementLogs')
      if (logStored) {
        const raw: SupplementLog[] = JSON.parse(logStored)
        const fixed = raw.map(l => {
          if (!l.date || l.date.length !== 10 || l.date[4] !== '-' || l.date[7] !== '-') {
            if (l.takenAt) {
              const d = new Date(l.takenAt)
              if (!isNaN(d.getTime())) return { ...l, date: toLocalDate(d) }
            }
            return { ...l, date: toLocalDate(new Date()) }
          }
          return l
        })
        setLogs(fixed)
        localStorage.setItem('supplementLogs', JSON.stringify(fixed))
      }
    } catch (e) { console.error('Failed to load supplements', e) }
  }, [])

  const persistSupplements = useCallback((data: Supplement[]) => { setSupplements(data); localStorage.setItem('supplements', JSON.stringify(data)) }, [])
  const persistLogs = useCallback((data: SupplementLog[]) => { setLogs(data); localStorage.setItem('supplementLogs', JSON.stringify(data)) }, [])

  const todayLogs = useMemo(() => logs.filter(l => l.date === selectedDate), [logs, selectedDate])
  const takenTodayIds = useMemo(() => new Set(todayLogs.map((l) => l.supplementId)), [todayLogs])
  const takenTodayCount = todayLogs.length > 0 ? new Set(todayLogs.map(l => l.supplementId)).size : 0; const totalCount = supplements.length
  const dailySupps = useMemo(() => supplements.filter((s) => s.frequency === 'daily'), [supplements])

  const suppStreak = useMemo(() => {
    let streak = 0; const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = toLocalDate(d)
      const dayLogs = logs.filter((l) => l.date === dateStr); const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      if (dailySupps.length > 0 && taken === dailySupps.length) streak++
      else if (dailySupps.length > 0) break
    }
    return streak
  }, [logs, dailySupps])

  const scheduleToday = useMemo(() => {
    const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const selectedDayName = dayNames[dayOfWeek]
    return supplements.filter(s => {
      if (s.frequency === 'daily') return true
      if (s.frequency === 'weekly') {
        const assignedDay = s.times[0]?.toLowerCase()
        return assignedDay === selectedDayName || !assignedDay
      }
      return true
    })
  }, [supplements, selectedDate])



  const markAsTaken = (supp: Supplement) => {
    if (takenTodayIds.has(supp.id)) return
    persistLogs([...logs, { id: generateId(), supplementId: supp.id, takenAt: new Date().toISOString(), date: selectedDate }])
    setJustTaken(supp)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setJustTaken(null), 4000)
  }

  const undoTake = () => {
    if (!justTaken) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    const logToRemove = logs.find(l => l.date === selectedDate && l.supplementId === justTaken.id)
    if (logToRemove) persistLogs(logs.filter(l => l.id !== logToRemove.id))
    setJustTaken(null)
  }

  const undoTakeById = (suppId: string) => {
    const logToRemove = logs.find(l => l.date === selectedDate && l.supplementId === suppId)
    if (logToRemove) {
      persistLogs(logs.filter(l => l.id !== logToRemove.id))
    }
    if (justTaken && justTaken.id === suppId) {
      if (undoTimer.current) clearTimeout(undoTimer.current)
      setJustTaken(null)
    }
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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => { const dt = new Date(selectedDate + 'T12:00:00'); dt.setDate(dt.getDate() - 1); setSelectedDate(toLocalDate(dt)) }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => { const dt = new Date(selectedDate + 'T12:00:00'); dt.setDate(dt.getDate() + 1); setSelectedDate(toLocalDate(dt)) }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {selectedDate !== today && (
            <button onClick={() => setSelectedDate(today)} className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
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

      {/* ─── PANELS ─── */}
      <AnimatePresence mode="wait">
        {/* ═══ WEEKLY WAVE ═══ */}
        {activePanel === 'patterns' && totalCount > 0 && (() => {
          const now = new Date(selectedDate + 'T12:00:00')
          const weekStart = new Date(now)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekOffset * 7))
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          const isCurrentWeek = weekOffset === 0
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart); d.setDate(d.getDate() + i)
            const dateStr = toLocalDate(d)
            const dayLogs = logs.filter(l => l.date === dateStr)
            const taken = new Set(dayLogs.map(l => l.supplementId)).size
            const total = dailySupps.length
            const morning = dayLogs.filter(l => { const s = supplements.find(s => s.id === l.supplementId); return s?.times[0] === 'Morning' }).length
            const afternoon = dayLogs.filter(l => { const s = supplements.find(s => s.id === l.supplementId); return s?.times[0] === 'Afternoon' }).length
            const evening = dayLogs.filter(l => { const s = supplements.find(s => s.id === l.supplementId); return s?.times[0] === 'Evening' }).length
            const night = dayLogs.filter(l => { const s = supplements.find(s => s.id === l.supplementId); return s?.times[0] === 'Night' }).length
            return {
              letter: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              taken, total, morning, afternoon, evening, night,
              pct: total > 0 ? Math.round((taken / total) * 100) : 0,
            }
          })
          const weekTaken = weekDays.reduce((s, d) => s + d.taken, 0)
          const weekTotal = weekDays.reduce((s, d) => s + d.total, 0)
          const weekPct = weekTotal > 0 ? Math.round((weekTaken / weekTotal) * 100) : 0
          let bestStreak = 0, cur = 0
          for (const d of weekDays) { if (d.pct === 100) { cur++; bestStreak = Math.max(bestStreak, cur) } else cur = 0 }

          const totalMorning = weekDays.reduce((s, d) => s + d.morning, 0)
          const totalAfternoon = weekDays.reduce((s, d) => s + d.afternoon, 0)
          const totalEvening = weekDays.reduce((s, d) => s + d.evening, 0)
          const totalNight = weekDays.reduce((s, d) => s + d.night, 0)


          const cx = 140, cy = 140, radius = 100
          const circlePts = weekDays.map((d, i) => {
            const angle = (i / 7) * Math.PI * 2 - Math.PI / 2
            const r = radius * (d.pct / 100)
            return {
              x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle),
              baseX: cx + radius * Math.cos(angle), baseY: cy + radius * Math.sin(angle),
              labelX: cx + (radius + 22) * Math.cos(angle), labelY: cy + (radius + 22) * Math.sin(angle),
            }
          })
          let wavePath = ''
          for (let i = 0; i < circlePts.length; i++) {
            const p = circlePts[i]
            const next = circlePts[(i + 1) % circlePts.length]
            const prev = circlePts[(i - 1 + circlePts.length) % circlePts.length]
            const next2 = circlePts[(i + 2) % circlePts.length]
            const cp1x = p.x + (next.x - prev.x) / 5, cp1y = p.y + (next.y - prev.y) / 5
            const cp2x = next.x - (next2.x - p.x) / 5, cp2y = next.y - (next2.y - p.y) / 5
            if (i === 0) wavePath = `M ${p.x} ${p.y}`
            wavePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
          }
          wavePath += ' Z'

          return (
          <motion.div key="patterns" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: smooth }}
            className="relative overflow-hidden rounded-[24px] border border-violet-500/10 bg-[#07070d] shadow-2xl shadow-violet-500/[0.08]">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-700/[0.07] rounded-full blur-[120px]" />
              <div className="absolute -bottom-40 -right-40 w-72 h-72 bg-indigo-700/[0.05] rounded-full blur-[100px]" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
            </div>

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                      {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={isCurrentWeek}
                      className={`p-1.5 rounded-xl border transition-all ${isCurrentWeek ? 'bg-white/[0.02] border-white/[0.04] text-gray-600 cursor-not-allowed' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => setWeekOffset(0)}
                      className={`p-1.5 rounded-xl border transition-all ${isCurrentWeek ? 'bg-white/[0.02] border-white/[0.04] text-gray-600' : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'}`}
                      title={isCurrentWeek ? 'Current week' : 'This week'}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const dosesMissed = weekTotal - weekTaken
                    const bestTimeLabel = [totalMorning, totalAfternoon, totalEvening, totalNight].every(c => c === 0) ? '—'
                      : totalMorning >= totalAfternoon && totalMorning >= totalEvening && totalMorning >= totalNight ? 'Morning'
                      : totalAfternoon >= totalEvening && totalAfternoon >= totalNight ? 'Afternoon'
                      : totalEvening >= totalNight ? 'Evening' : 'Night'
                    return (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 cursor-default">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[11px] font-black text-rose-300 tabular-nums">{dosesMissed}</span>
                          <span className="text-[9px] text-rose-400/60 font-bold">missed</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 cursor-default">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] font-black text-amber-300">{bestTimeLabel}</span>
                          <span className="text-[9px] text-amber-400/60 font-bold">peak</span>
                        </motion.div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="flex gap-4" style={{ height: '380px' }}>
                {/* Circular Adherence Radar */}
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-5 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">Adherence radar</span>
                    <div className="flex-1" />
                    {(() => {
                      const bestPct = Math.max(...weekDays.map(d => d.pct))
                      const bestDays = weekDays.filter(d => d.pct === bestPct)
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-black text-emerald-400">{bestDays.length}</span>
                          <span className="text-[8px] text-gray-600 font-bold">day{bestDays.length !== 1 ? 's' : ''} at {bestPct}%</span>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] h-full max-h-[280px]">
                      <defs>
                        <radialGradient id="cwFill" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                          <stop offset="70%" stopColor="#6d28d9" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.02} />
                        </radialGradient>
                        <linearGradient id="cwStroke" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#7c3aed" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
                        </linearGradient>
                        <filter id="cwGlow"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <filter id="cwSoftGlow"><feGaussianBlur stdDeviation="3" /></filter>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map(f => (
                        <circle key={f} cx={cx} cy={cy} r={radius * f} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={f < 1 ? '2 4' : 'none'} />
                      ))}
                      {circlePts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.baseX} y2={p.baseY} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                      <path d={wavePath} fill="url(#cwFill)" />
                      <path d={wavePath} fill="none" stroke="#7c3aed" strokeWidth="4" opacity="0.1" filter="url(#cwGlow)" />
                      <path d={wavePath} fill="none" stroke="url(#cwStroke)" strokeWidth="2" strokeLinejoin="round" />
                      {circlePts.map((p, i) => {
                        const d = weekDays[i]
                        const isPerfect = d.pct === 100
                        const nodeColor = isPerfect ? '#10b981' : d.pct >= 80 ? '#34d399' : d.pct >= 50 ? '#f59e0b' : '#ef4444'
                        return (
                          <g key={i}>
                            {isPerfect && <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4">
                              <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>}
                            <circle cx={p.x} cy={p.y} r="8" fill={nodeColor} opacity="0.15" filter="url(#cwSoftGlow)" />
                            <circle cx={p.x} cy={p.y} r="6" fill="#07070d" stroke={nodeColor} strokeWidth="2" />
                            <circle cx={p.x} cy={p.y} r="3" fill={nodeColor} />
                            <text x={p.labelX} y={p.labelY + 1} textAnchor="middle" dominantBaseline="middle" fill={isPerfect ? '#10b981' : '#9ca3af'} fontSize="11" fontWeight="800">{d.letter}</text>
                            <text x={p.labelX} y={p.labelY + 12} textAnchor="middle" dominantBaseline="middle" fill={nodeColor} fontSize="8" fontWeight="700" opacity="0.7">{d.pct}%</text>
                          </g>
                        )
                      })}
                      <circle cx={cx} cy={cy} r="28" fill="#0a0a14" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{weekPct}</text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="700" letterSpacing="0.1em">AVERAGE</text>
                    </svg>
                  </div>
                </div>

                {/* Consistency Ring + Time Distribution + Heatmap */}
                <div className="w-52 flex flex-col gap-3 shrink-0">
                  {/* Refill Tracker */}
                  <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden flex flex-col gap-2">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Refill soon</span>
                    </div>
                    {supplements.filter(s => s.refillDays && s.refillDays > 0).slice(0, 4).map(s => {
                      const daysSinceCreation = Math.floor((new Date(selectedDate).getTime() - new Date(s.createdAt || selectedDate).getTime()) / 86400000)
                      const daysLeft = (s.refillDays || 30) - daysSinceCreation
                      const urgent = daysLeft <= 5
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgent ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                          <span className="text-[9px] text-gray-300 truncate flex-1">{s.name}</span>
                          <span className={`text-[8px] font-bold tabular-nums ${urgent ? 'text-red-400' : 'text-gray-500'}`}>{daysLeft}d</span>
                        </div>
                      )
                    })}
                    {supplements.filter(s => s.refillDays && s.refillDays > 0).length === 0 && (
                      <p className="text-[8px] text-gray-600">Set refill days to track</p>
                    )}
                  </div>

                  {/* Time Distribution */}
                  <div className="flex-1 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden flex flex-col gap-2">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Time split</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      {[
                        { label: 'Morning', count: totalMorning, color: '#f97316', icon: Sun },
                        { label: 'Afternoon', count: totalAfternoon, color: '#8b5cf6', icon: Sparkles },
                        { label: 'Evening', count: totalEvening, color: '#06b6d4', icon: Sunset },
                        { label: 'Night', count: totalNight, color: '#6366f1', icon: Moon },
                      ].map(t => {
                        const maxCount = Math.max(totalMorning, totalAfternoon, totalEvening, totalNight, 1)
                        const pct = Math.round((t.count / maxCount) * 100)
                        const Icon = t.icon
                        return (
                          <div key={t.label} className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
                            <span className="text-[8px] font-bold text-gray-500 w-10 shrink-0">{t.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full" style={{ backgroundColor: t.color + '99' }} />
                            </div>
                            <span className="text-[9px] font-black tabular-nums w-3 text-right" style={{ color: t.color }}>{t.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Weekly Supplements Count */}
                  <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden flex flex-col gap-2.5">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />
                    <div className="flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Supps taken</span>
                    </div>
                    <div className="flex items-end gap-[3px] h-12">
                      {weekDays.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <span className="text-[7px] font-bold tabular-nums" style={{ color: d.pct >= 80 ? '#10b981' : d.pct >= 50 ? '#f59e0b' : '#ef4444' }}>{d.taken}</span>
                          <div className="w-full rounded-t transition-all duration-500" style={{
                            height: `${Math.max(d.pct, 4)}%`,
                            backgroundColor: d.pct >= 80 ? 'rgba(16,185,129,0.5)' : d.pct >= 50 ? 'rgba(245,158,11,0.45)' : d.pct > 0 ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.04)',
                          }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between px-0.5">
                      {weekDays.map((d, i) => (
                        <span key={i} className="text-[7px] text-gray-500 font-bold flex-1 text-center">{d.letter}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Supplements column */}
                <div className="w-56 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden flex flex-col shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <Pill className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Supplements</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
                    {dailySupps.map((s, i) => {
                      const takenInWeek = Array.from({ length: 7 }, (_, j) => {
                        const d = new Date(weekStart); d.setDate(d.getDate() + j)
                        return logs.some(l => l.supplementId === s.id && l.date === toLocalDate(d))
                      }).filter(Boolean).length
                      const pct = Math.round((takenInWeek / 7) * 100)
                      const dayDots = Array.from({ length: 7 }, (_, j) => {
                        const d = new Date(weekStart); d.setDate(d.getDate() + j)
                        return logs.some(l => l.supplementId === s.id && l.date === toLocalDate(d))
                      })
                      return (
                        <motion.div key={s.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          whileHover={{ x: -2, transition: { duration: 0.15 } }}
                          className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 hover:border-violet-500/20 hover:bg-white/[0.03] transition-all duration-200 cursor-default">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-semibold text-white truncate flex-1">{s.name}</span>
                            <span className="text-[9px] font-black tabular-nums" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                          </div>
                          <div className="flex gap-[3px] mb-2">
                            {dayDots.map((taken, j) => (
                              <div key={j} className={`flex-1 h-1 rounded-full transition-all duration-300 ${taken ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'bg-white/[0.06]'}`} />
                            ))}
                          </div>
                          <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                              className="h-full rounded-full" style={{ backgroundColor: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </motion.div>
                      )
                    })}
                    {dailySupps.length === 0 && (
                      <div className="py-6 text-center"><Pill className="w-6 h-6 text-gray-600 mx-auto mb-1.5" /><p className="text-[9px] text-gray-500">No daily supplements.</p></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )
        })()}

        {/* ═══ AI COACH 2.0 ═══ */}
        {activePanel === 'coach' && (() => {
          // ─── Predictive Intelligence ───
          const now = new Date(selectedDate + 'T12:00:00')
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now); d.setDate(d.getDate() - (6 - i))
            const dateStr = toLocalDate(d)
            const dayLogs = logs.filter(l => l.date === dateStr)
            const taken = new Set(dayLogs.map(l => l.supplementId)).size
            const total = dailySupps.length
            return {
              letter: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
              dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
              taken, total,
              pct: total > 0 ? Math.round((taken / total) * 100) : 0,
              date: dateStr,
              isToday: dateStr === today,
              isPast: dateStr < today
            }
          })

          // ─── Streak Intelligence ───
          let currentStreak = 0
          let bestStreak = 0
          let tempStreak = 0
          for (let i = 0; i < 30; i++) {
            const d = new Date(now); d.setDate(d.getDate() - i)
            const dateStr = toLocalDate(d)
            const dayLogs = logs.filter(l => l.date === dateStr)
            const taken = new Set(dayLogs.map(l => l.supplementId)).size
            const total = dailySupps.length
            const pct = total > 0 ? Math.round((taken / total) * 100) : 0
            if (pct === 100) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak) }
            else { tempStreak = 0 }
          }
          currentStreak = 0
          for (let i = 0; i < 30; i++) {
            const d = new Date(now); d.setDate(d.getDate() - i)
            const dateStr = toLocalDate(d)
            const dayLogs = logs.filter(l => l.date === dateStr)
            const taken = new Set(dayLogs.map(l => l.supplementId)).size
            const total = dailySupps.length
            const pct = total > 0 ? Math.round((taken / total) * 100) : 0
            if (pct === 100) currentStreak++
            else break
          }

          // ─── Per-Supplement Adherence (7-day & 30-day) ───
          const suppAdherence = supplements.map(s => {
            let taken7 = 0, total7 = 0, taken30 = 0, total30 = 0
            for (let i = 0; i < 30; i++) {
              const d = new Date(now); d.setDate(d.getDate() - i)
              const dateStr = toLocalDate(d)
              const dayLogs = logs.filter(l => l.date === dateStr && l.supplementId === s.id)
              const isTaken = dayLogs.length > 0
              if (i < 7) { total7++; if (isTaken) taken7++ }
              total30++; if (isTaken) taken30++
            }
            const rate7 = total7 > 0 ? Math.round((taken7 / total7) * 100) : 0
            const rate30 = total30 > 0 ? Math.round((taken30 / total30) * 100) : 0
            return { ...s, rate7, rate30, taken7, total7, taken30, total30 }
          })

          // ─── Weekly Trend (last 4 weeks) ───
          const weeklyTrend = Array.from({ length: 4 }, (_, wi) => {
            let taken = 0, total = 0
            for (let i = wi * 7; i < (wi + 1) * 7; i++) {
              const d = new Date(now); d.setDate(d.getDate() - i)
              const dateStr = toLocalDate(d)
              const dayLogs = logs.filter(l => l.date === dateStr)
              const dayTaken = new Set(dayLogs.map(l => l.supplementId)).size
              taken += dayTaken
              total += dailySupps.length
            }
            const pct = total > 0 ? Math.round((taken / total) * 100) : 0
            const label = wi === 0 ? 'This wk' : wi === 1 ? 'Last wk' : (wi + 1) + ' wk ago'
            return { label, pct, taken, total }
          }).reverse()



          // ─── Synergy Intelligence ───
          const synergyPairs = supplements.flatMap((s, i) =>
            supplements.slice(i + 1).map(s2 => {
              const inter = SUPP_INTERACTIONS.find(x =>
                (x.a.toLowerCase() === s.name.toLowerCase() && x.b.toLowerCase() === s2.name.toLowerCase()) ||
                (x.a.toLowerCase() === s2.name.toLowerCase() && x.b.toLowerCase() === s.name.toLowerCase())
              )
              return { a: s.name, b: s2.name, type: inter?.type || 'neutral', message: inter?.message || '' }
            })
          )
          const synergies = synergyPairs.filter(s => s.type === 'synergy')
          const conflicts = synergyPairs.filter(s => s.type === 'conflict')
          const timingPairs = synergyPairs.filter(s => s.type === 'timing')
          const synergyScore = Math.min(100, 50 + synergies.length * 15 - conflicts.length * 20)

          // ─── Cost Intelligence ───
          const totalCost = supplements.reduce((sum, s) => {
            if (s.cost && s.totalServings && s.totalServings > 0) return sum + s.cost
            return sum
          }, 0)
          const costPerDay = totalCost > 0 ? (totalCost / 30).toFixed(2) : '0'
          const costPerWeek = (parseFloat(costPerDay) * 7).toFixed(0)
          const monthlyProjection = totalCost > 0 ? totalCost.toFixed(0) : '0'
          const yearlyProjection = totalCost > 0 ? (totalCost * 12).toFixed(0) : '0'
          const costBreakdown = supplements.filter(s => s.cost && s.totalServings && s.totalServings > 0).map(s => ({
            name: s.name, cost: s.cost!, perDay: (s.cost! / 30).toFixed(2),
            pct: totalCost > 0 ? Math.round((s.cost! / totalCost) * 100) : 0
          })).sort((a, b) => b.cost - a.cost)

          // ─── Gap Analysis (Enhanced) ───
          const commonSupps = [
            { name: 'Vitamin D', why: 'Immune & bone health', priority: 'high' as const },
            { name: 'Omega-3', why: 'Heart & brain function', priority: 'high' as const },
            { name: 'Magnesium', why: 'Sleep & muscle recovery', priority: 'high' as const },
            { name: 'Probiotics', why: 'Gut health & immunity', priority: 'medium' as const },
            { name: 'Zinc', why: 'Immune & testosterone', priority: 'medium' as const },
            { name: 'B12', why: 'Energy & nerve health', priority: 'medium' as const },
            { name: 'Iron', why: 'Oxygen transport', priority: 'low' as const },
            { name: 'Collagen', why: 'Skin & joint health', priority: 'low' as const },
          ]
          const missing = commonSupps.filter(c => !supplements.some(s => s.name.toLowerCase().includes(c.name.toLowerCase())))

          // ─── Consistency Score ───
          const weekPct = weekDays.reduce((s, d) => s + d.taken, 0) > 0 ? Math.round((weekDays.reduce((s, d) => s + d.taken, 0) / Math.max(weekDays.reduce((s, d) => s + d.total, 0), 1)) * 100) : 0
          const consistencyScore = weekPct

          // ─── Trend Average ───
          const trendDiffs = weeklyTrend.map((w, i) => i > 0 ? w.pct - weeklyTrend[i-1].pct : 0).slice(1)
          const trendAvg = trendDiffs.length > 0 ? trendDiffs.reduce((a, b) => a + b, 0) / trendDiffs.length : 0

          // ─── takenAt: Real Timing Analysis ───
          const realTiming = supplements.map(s => {
            const suppLogs = logs.filter(l => l.supplementId === s.id && l.takenAt)
            const plannedTimes = s.times || []
            const actualHours = suppLogs.map(l => {
              const h = new Date(l.takenAt).getHours()
              return h
            }).filter(h => !isNaN(h))
            const avgHour = actualHours.length > 0 ? actualHours.reduce((a, b) => a + b, 0) / actualHours.length : null
            const timeCategory = (h: number) => h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night'
            const actualCategory = avgHour !== null ? timeCategory(avgHour) : 'Unknown'
            const plannedCategory = plannedTimes[0] || 'Not set'
            const isAligned = actualCategory !== 'Unknown' && plannedCategory !== 'Not set' &&
              (actualCategory === plannedCategory ||
               (actualCategory === 'Morning' && plannedCategory === 'Morning') ||
               (actualCategory === 'Night' && plannedCategory === 'Night'))
            const consistency = actualHours.length > 1 ? (() => {
              const sorted = [...actualHours].sort((a, b) => a - b)
              const range = sorted[sorted.length - 1] - sorted[0]
              return range < 2 ? 'Very consistent' : range < 4 ? 'Somewhat consistent' : 'Variable timing'
            })() : 'First dose logged'
            return { name: s.name, id: s.id, avgHour, actualCategory, plannedCategory, isAligned, consistency, doseCount: suppLogs.length, plannedTimes }
          })
          const timingAlignment = realTiming.filter(r => r.isAligned).length
          const timingAlignmentPct = realTiming.length > 0 ? Math.round((timingAlignment / realTiming.length) * 100) : 0

          // ─── Refill Intelligence ───
          const refillData = supplements.map(s => {
            if (!s.refillDays || s.refillDays <= 0) return null
            const created = s.createdAt ? new Date(s.createdAt) : null
            const daysSinceCreated = created ? Math.floor((Date.now() - created.getTime()) / 86400000) : 0
            const daysUntilRefill = s.refillDays - daysSinceCreated
            const urgency = daysUntilRefill <= 3 ? 'critical' : daysUntilRefill <= 7 ? 'warning' : 'ok'
            const pctUsed = Math.min(100, Math.round((daysSinceCreated / s.refillDays) * 100))
            return { name: s.name, id: s.id, refillDays: s.refillDays, daysSinceCreated, daysUntilRefill, urgency, pctUsed }
          }).filter(Boolean) as { name: string; id: string; refillDays: number; daysSinceCreated: number; daysUntilRefill: number; urgency: string; pctUsed: number }[]
          const criticalRefills = refillData.filter(r => r.urgency === 'critical')


          // ─── Today's Live Status ───
          const todayStatus = dailySupps.map(s => {
            const taken = takenTodayIds.has(s.id)
            const log = todayLogs.find(l => l.supplementId === s.id)
            const takenAtTime = log?.takenAt ? new Date(log.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
            return { name: s.name, id: s.id, dosage: s.dosage, times: s.times, taken, takenAtTime, frequency: s.frequency, notes: s.notes }
          })
          const todayProgress = todayStatus.filter(s => s.taken).length
          const todayTotal = todayStatus.length
          const todayPct = todayTotal > 0 ? Math.round((todayProgress / todayTotal) * 100) : 0
          const remainingToday = todayStatus.filter(s => !s.taken)

          // ─── Long-term Streak (365d) ───
          const longTermStreak = suppStreak

          // ─── Momentum Score (composite) ───
          const momentumScore = Math.round(
            (consistencyScore * 0.35) +
            (Math.min(longTermStreak, 30) / 30 * 100 * 0.25) +
            (timingAlignmentPct * 0.2) +
            (Math.max(0, trendAvg + 50) * 0.2)
          )

          // ─── Weak Days (cross-week pattern) ───
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const dayAdherence = Array.from({ length: 7 }, (_, dayIdx) => {
            const relevantLogs = logs.filter(l => {
              const d = new Date(l.date + 'T12:00:00')
              return d.getDay() === dayIdx
            })
            const uniqueDates = new Set(relevantLogs.map(l => l.date)).size
            const totalPossible = uniqueDates * dailySupps.length
            const taken = new Set(relevantLogs.map(l => l.supplementId + '_' + l.date)).size
            const pct = totalPossible > 0 ? Math.round((taken / totalPossible) * 100) : 0
            return { name: dayNames[dayIdx], pct, idx: dayIdx }
          })
          const weakDays = dayAdherence.filter(d => d.pct < 70 && d.pct > 0).sort((a, b) => a.pct - b.pct)

          // ─── Supplement Trend (7d vs 30d delta) ───
          const suppTrends = suppAdherence.map(s => {
            const delta = s.rate7 - s.rate30
            const trend = delta > 10 ? 'rising' : delta < -10 ? 'dropping' : 'stable'
            return { ...s, delta, trend }
          }).sort((a, b) => a.delta - b.delta)

          // ─── Smart Insights (auto-generated) ───
          const insights: string[] = []
          if (todayProgress === todayTotal && todayTotal > 0) insights.push('All done for today!')
          else if (remainingToday.length > 0) insights.push(remainingToday.length + ' left today: ' + remainingToday.map(r => r.name).join(', '))
          if (longTermStreak >= 7) insights.push(longTermStreak + 'd streak — keep the momentum')
          if (weakDays.length > 0) insights.push('Weakest day: ' + weakDays[0].name + ' (' + weakDays[0].pct + '%)')
          const dropping = suppTrends.filter(s => s.trend === 'dropping')
          if (dropping.length > 0) insights.push(dropping.length + ' supplement' + (dropping.length > 1 ? 's' : '') + ' declining: ' + dropping.map(s => s.name).join(', '))
          if (criticalRefills.length > 0) insights.push(criticalRefills.length + ' refill' + (criticalRefills.length > 1 ? 's' : '') + ' urgent')
          if (timingAlignmentPct < 50 && realTiming.length > 0) insights.push('Timing alignment low (' + timingAlignmentPct + '%) — check Optimize tab')




          return (
          <motion.div key="coach" initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: smooth }}
            className="relative overflow-hidden rounded-[24px] border border-violet-500/10 bg-[#07070d] shadow-2xl shadow-violet-500/[0.08]">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-700/[0.07] rounded-full blur-[120px]" />
              <div className="absolute -bottom-40 -right-40 w-72 h-72 bg-indigo-700/[0.05] rounded-full blur-[100px]" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
            </div>

            <div className="relative p-6">
              {/* ─── Header ─── */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/15 border border-violet-500/25 flex items-center justify-center relative">
                    <Brain className="w-4.5 h-4.5 text-violet-400" />
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white tracking-tight">AI Coach</h3>
                    <p className="text-[9px] text-gray-500">Intelligence · Timing · Synergy</p>
                  </div>
                </div>
                {/* Mode Selector */}
                <div className="relative">
                  <button onClick={() => setCoachDropdownOpen(!coachDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200">
                    {coachMode === 'overview' && <><Activity className="w-3 h-3 text-violet-400" /> Overview</>}
                    {coachMode === 'optimization' && <><Zap className="w-3 h-3 text-amber-400" /> Optimize</>}
                    {coachMode === 'planning' && <><DollarSign className="w-3 h-3 text-emerald-400" /> Planning</>}
                    <ChevronDown className={'w-3 h-3 text-gray-500 transition-transform duration-200 ' + (coachDropdownOpen ? 'rotate-180' : '')} />
                  </button>
                  {coachDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setCoachDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl bg-[#0e0e18] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">
                        {([
                          { key: 'overview' as const, label: 'Overview', icon: Activity, desc: 'Adherence & trends', color: 'text-violet-400' },
                          { key: 'optimization' as const, label: 'Optimize', icon: Zap, desc: 'Timing & synergy', color: 'text-amber-400' },
                          { key: 'planning' as const, label: 'Planning', icon: DollarSign, desc: 'Cost & gaps', color: 'text-emerald-400' },
                        ]).map(m => {
                          const Icon = m.icon
                          return (
                            <button key={m.key} onClick={() => { setCoachMode(m.key); setCoachDropdownOpen(false) }}
                              className={'w-full flex items-center gap-2 px-3 py-2 text-left transition-all duration-150 ' +
                                (coachMode === m.key ? 'bg-violet-500/10' : 'hover:bg-white/[0.04]')}>
                              <Icon className={'w-3.5 h-3.5 ' + m.color} />
                              <div>
                                <span className={'text-[10px] font-bold block ' + (coachMode === m.key ? 'text-white' : 'text-gray-300')}>{m.label}</span>
                                <span className="text-[8px] text-gray-500">{m.desc}</span>
                              </div>
                              {coachMode === m.key && <Check className="w-3 h-3 text-violet-400 ml-auto" />}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* ──── MODE: OVERVIEW ──── */}
              {coachMode === 'overview' && (() => {
                // Dynamic day name
                const dayLabel = selectedDate === today ? 'Today' :
                  selectedDate === (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDate(d) })() ? 'Yesterday' :
                  new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

                return (
                <div className="flex flex-col gap-2.5" style={{ maxHeight: '600px' }}>
                  {/* 1. MOMENTUM — enhanced design */}
                  <div className="rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.03] border border-violet-500/15 p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/[0.06] rounded-full blur-[60px]" />
                    <div className="flex items-center gap-5">
                      {/* Ring */}
                      <div className="relative w-[88px] h-[88px] shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#momGrad)" strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 42}
                            strokeDashoffset={2 * Math.PI * 42 * (1 - momentumScore / 100)} />
                          <defs>
                            <linearGradient id="momGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#a78bfa" />
                              <stop offset="50%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#6d28d9" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[26px] font-black text-white tabular-nums leading-none">{momentumScore}</span>
                          <span className="text-[8px] font-bold text-violet-300/60 mt-1 uppercase tracking-wider">Momentum</span>
                        </div>
                        {momentumScore >= 70 && <div className="absolute inset-0 rounded-full animate-ping opacity-[0.04] bg-violet-500" />}
                      </div>
                      {/* Stats */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Adherence</span>
                              <span className="text-[12px] font-black text-white tabular-nums">{consistencyScore}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: consistencyScore + '%' }} transition={{ duration: 0.8 }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-orange-500/[0.06] border border-orange-500/10">
                            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                            <div>
                              <span className="text-[13px] font-black text-orange-300 block tabular-nums leading-none">{longTermStreak}<span className="text-[8px] font-bold">d</span></span>
                              <span className="text-[7px] text-gray-500 font-bold uppercase">Streak</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/10">
                            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div>
                              <span className="text-[13px] font-black text-cyan-300 block tabular-nums leading-none">{timingAlignmentPct}<span className="text-[8px] font-bold">%</span></span>
                              <span className="text-[7px] text-gray-500 font-bold uppercase">Timing</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                            <TrendingUp className={'w-4 h-4 shrink-0 ' + (trendAvg > 3 ? 'text-emerald-400' : trendAvg < -3 ? 'text-rose-400' : 'text-amber-400')} />
                            <div>
                              <span className={'text-[13px] font-black block tabular-nums leading-none ' + (trendAvg > 3 ? 'text-emerald-300' : trendAvg < -3 ? 'text-rose-300' : 'text-amber-300')}>
                                {trendAvg > 3 ? '\u2191' : trendAvg < -3 ? '\u2193' : '\u2192'}{Math.abs(trendAvg).toFixed(0)}
                              </span>
                              <span className="text-[7px] text-gray-500 font-bold uppercase">Trend</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. TODAY / YESTERDAY / DAY — dynamic name */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
                    <div className="flex items-center gap-2 mb-2.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold text-white">{dayLabel}</span>
                      <div className="flex-1" />
                      <span className="text-[12px] font-black text-white tabular-nums">{todayProgress}/{todayTotal}</span>
                      <span className="text-[8px] text-gray-500">taken</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: todayPct + '%' }} transition={{ duration: 0.8 }}
                        className="h-full rounded-full" style={{ background: todayPct === 100 ? '#10b981' : todayPct >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {todayStatus.map(s => (
                        <div key={s.id} className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition-all ' +
                          (s.taken ? 'bg-emerald-500/10 text-emerald-400 line-through opacity-60' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]')}>
                          <div className={'w-2 h-2 rounded-full shrink-0 ' + (s.taken ? 'bg-emerald-400' : 'bg-gray-600')} />
                          <span>{s.name}</span>
                          {s.taken && s.takenAtTime && <span className="text-[8px] opacity-70 ml-0.5">{s.takenAtTime}</span>}
                          {!s.taken && s.dosage && <span className="text-[7px] opacity-50 ml-0.5">{s.dosage}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. SUPPLY HEALTH — decorative bar chart with glow */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500/[0.04] rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] font-bold text-white">Supply Health</span>
                      <div className="flex-1" />
                      {criticalRefills.length > 0 && <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg">{criticalRefills.length} urgent</span>}
                    </div>
                    {refillData.length > 0 ? (
                      <>
                        <div className="h-[110px] mb-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={refillData.sort((a, b) => a.daysUntilRefill - b.daysUntilRefill).slice(0, 4).map(r => ({
                              name: r.name.length > 12 ? r.name.substring(0, 12) + '..' : r.name,
                              pct: Math.max(100 - r.pctUsed, 5)
                            }))} layout="vertical" margin={{ top: 0, right: 45, bottom: 0, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 8, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={65} />
                              <Tooltip cursor={false} contentStyle={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                formatter={(value: number) => [value + '% remaining', 'Supply']} />
                              <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={18}>
                                {refillData.sort((a, b) => a.daysUntilRefill - b.daysUntilRefill).slice(0, 4).map((r, i) => (
                                  <Cell key={i} fill={r.urgency === 'critical' ? '#ef4444' : r.urgency === 'warning' ? '#f59e0b' : '#10b981'} fillOpacity={0.7} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex gap-1.5 flex-wrap pt-2 border-t border-white/[0.04]">
                          {refillData.filter(r => r.urgency !== 'ok').slice(0, 3).map(r => (
                            <div key={r.id} className={'flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-bold border ' +
                              (r.urgency === 'critical'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-300')}>
                              <div className={'w-2 h-2 rounded-full animate-pulse ' + (r.urgency === 'critical' ? 'bg-rose-400' : 'bg-amber-400')} />
                              {r.name}: {r.daysUntilRefill}d left
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-[8px] text-gray-500 italic">No refill data — add refill days to supplements</p>
                    )}
                  </div>

                  {/* 4. TRENDING — decorative recharts + sparklines */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-4 relative overflow-hidden flex-1 min-h-0">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                    <div className="absolute -top-8 -left-8 w-20 h-20 bg-cyan-500/[0.04] rounded-full blur-2xl" />
                    <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-500/[0.04] rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-[11px] font-bold text-white">Trending</span>
                      <div className="flex-1" />
                      <span className="text-[8px] text-gray-500">7d vs 30d</span>
                    </div>
                    {suppTrends.length > 0 ? (
                      <div className="space-y-2">
                        <div className="h-[110px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={suppTrends.slice(0, 4).map(s => ({
                              name: s.name.length > 12 ? s.name.substring(0, 12) + '..' : s.name,
                              delta: s.delta
                            }))} layout="vertical" margin={{ top: 0, right: 35, bottom: 0, left: 0 }}>
                              <defs>
                                <linearGradient id="trendGreen" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="trendRed" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 8, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={65} />
                              <Tooltip cursor={false} contentStyle={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                formatter={(value: number) => [value > 0 ? '+' + value : value, 'Delta']} />
                              <Bar dataKey="delta" radius={[0, 6, 6, 0]} maxBarSize={16}>
                                {suppTrends.slice(0, 4).map((s, i) => (
                                  <Cell key={i} fill={s.delta > 0 ? 'url(#trendGreen)' : 'url(#trendRed)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {suppTrends.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                              <div className={'w-2 h-8 rounded-full ' + (s.delta > 0 ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : s.delta < 0 ? 'bg-gradient-to-b from-rose-400 to-rose-600' : 'bg-gray-500')} />
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-bold text-white block truncate">{s.name}</span>
                                <span className={'text-[9px] font-black tabular-nums ' + (s.delta > 0 ? 'text-emerald-400' : s.delta < 0 ? 'text-rose-400' : 'text-gray-500')}>
                                  {s.delta > 0 ? '+' : ''}{s.delta}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[120px] flex items-center justify-center"><span className="text-[8px] text-gray-500">No trend data yet</span></div>
                    )}
                    {insights.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.04] space-y-1.5 mt-2">
                        {insights.slice(0, 3).map((insight, i) => (
                          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-violet-500/[0.04] border border-violet-500/10">
                            <Zap className="w-3 h-3 text-violet-400 shrink-0" />
                            <span className="text-[8px] text-gray-300">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )
              })()}

                                                        {/* ──── MODE: OPTIMIZATION ──── */}
              {coachMode === 'optimization' && (() => {
                const optData = [
                  { name: 'Aligned', value: timingAlignment, fill: '#10b981' },
                  { name: 'Misaligned', value: realTiming.length - timingAlignment, fill: '#f59e0b' },
                ]
                return (
                <div className="space-y-2.5">
                  {/* Real Timing Timeline */}
                  <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-bold text-white">Real Timing (from takenAt)</span>
                      <div className="flex-1" />
                      <span className="text-[8px] font-black text-cyan-300">{timingAlignmentPct}%</span>
                      <span className="text-[7px] text-gray-500">aligned</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIMES_OF_DAY.map(t => {
                        const Icon = TIME_ICONS[t]
                        const tc = TIME_COLORS[t]
                        const scheduled = realTiming.filter(r => r.plannedTimes.includes(t))
                        const alignedHere = scheduled.filter(r => r.actualCategory === t)
                        const misalignedHere = scheduled.filter(r => r.actualCategory !== t && r.actualCategory !== 'Unknown')
                        return (
                          <div key={t} className={'rounded-lg p-2 border relative overflow-hidden transition-all bg-gradient-to-br ' + tc.bg + ' ' + tc.border +
                            (alignedHere.length > 0 && misalignedHere.length === 0 ? ' shadow-md ' + tc.glow : '')}>
                            <div className="flex items-center gap-1 mb-1.5">
                              <Icon className={'w-3 h-3 ' + tc.icon} />
                              <span className={'text-[8px] font-bold ' + tc.text}>{t}</span>
                            </div>
                            <div className="space-y-0.5 min-h-[28px]">
                              {scheduled.length > 0 ? scheduled.map((r, j) => (
                                <div key={j} className="flex items-center gap-1">
                                  <div className={'w-1 h-1 rounded-full shrink-0 ' + (r.actualCategory === t ? 'bg-emerald-400' : r.actualCategory === 'Unknown' ? 'bg-gray-500' : 'bg-amber-400')} />
                                  <span className="text-[7px] text-gray-300 truncate">{r.name}</span>
                                  {r.actualCategory !== 'Unknown' && r.actualCategory !== t && (
                                    <span className="text-[5px] text-amber-400 shrink-0">{r.actualCategory}</span>
                                  )}
                                </div>
                              )) : <span className="text-[7px] text-gray-600 italic">Empty</span>}
                            </div>
                            {misalignedHere.length > 0 && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <span className="text-[6px] font-black text-amber-400">{misalignedHere.length}</span>
                              </div>
                            )}
                            {alignedHere.length > 0 && misalignedHere.length === 0 && scheduled.length > 0 && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Per-Supp Real vs Planned */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold text-white">Real vs Planned Timing</span>
                        <div className="flex-1" />
                        <span className="text-[7px] text-gray-500">{timingAlignment}/{realTiming.length} aligned</span>
                      </div>
                      <div className="space-y-1.5">
                        {realTiming.slice(0, 6).map((r, i) => (
                          <div key={i} className={'flex items-center gap-2 p-2 rounded-lg border transition-all ' +
                            (r.isAligned ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]')}>
                            <div className={'w-5 h-5 rounded flex items-center justify-center shrink-0 ' +
                              (r.isAligned ? 'bg-emerald-500/15' : r.actualCategory === 'Unknown' ? 'bg-gray-500/10' : 'bg-amber-500/10')}>
                              {r.isAligned ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                               r.actualCategory === 'Unknown' ? <Clock className="w-3 h-3 text-gray-500" /> :
                               <Clock className="w-3 h-3 text-amber-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-white truncate">{r.name}</span>
                                <span className="text-[6px] text-gray-500">{r.doseCount} doses logged</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {r.actualCategory !== 'Unknown' ? (
                                  <>
                                    <span className="text-[7px] text-cyan-400">{r.actualCategory}</span>
                                    {!r.isAligned && <span className="text-[7px] text-gray-600">{'\u2192'}</span>}
                                    {!r.isAligned && <span className="text-[7px] font-bold text-amber-400">Plan: {r.plannedCategory}</span>}
                                    {r.isAligned && <span className="text-[7px] text-emerald-400 font-bold">{'\u2713'}</span>}
                                  </>
                                ) : (
                                  <span className="text-[7px] text-gray-500 italic">No takenAt data yet</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[6px] text-gray-500">{r.consistency}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] font-bold text-white">Alignment</span>
                      </div>
                      <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={optData} cx="50%" cy="50%" innerRadius={22} outerRadius={35} paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {optData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.8} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-3 mt-1">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500" /><span className="text-[7px] text-gray-500">{timingAlignment} opt</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500" /><span className="text-[7px] text-gray-500">{realTiming.length - timingAlignment} fix</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Synergy Stats */}
                  <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="w-3 h-3 text-violet-400" />
                      <span className="text-[9px] font-bold text-white">Synergy Map</span>
                      <div className="flex-1" />
                      <span className="text-[8px] font-black text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{synergyScore}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      <div className="text-center p-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                        <span className="text-[14px] font-black text-emerald-400 block">{synergies.length}</span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase">Syn</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-rose-500/[0.04] border border-rose-500/10">
                        <span className="text-[14px] font-black text-rose-400 block">{conflicts.length}</span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase">Con</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                        <span className="text-[14px] font-black text-amber-400 block">{timingPairs.length}</span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase">Tim</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[14px] font-black text-gray-400 block">{synergyPairs.filter(s => s.type === 'neutral').length}</span>
                        <span className="text-[6px] text-gray-500 font-bold uppercase">Neu</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {synergies.slice(0, 2).map((s, i) => (
                        <div key={'sy' + i} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="text-[8px] text-emerald-300 font-bold truncate">{s.a} + {s.b}</span>
                          <span className="text-[7px] text-gray-500 ml-auto truncate">{s.message}</span>
                        </div>
                      ))}
                      {conflicts.slice(0, 1).map((s, i) => (
                        <div key={'co' + i} className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/10">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                          <span className="text-[8px] text-rose-300 font-bold truncate">{s.a} + {s.b}</span>
                          <span className="text-[7px] text-gray-500 ml-auto truncate">{s.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              })()}

              {/* ──── MODE: PLANNING ──── */}
              {coachMode === 'planning' && (() => {
                const COLORS = ['#f59e0b', '#f97316', '#8b5cf6', '#6366f1', '#06b6d4', '#10b981']
                const costPieData = costBreakdown.map((c, i) => ({ name: c.name, value: c.cost, fill: COLORS[i % COLORS.length] }))
                return (
                <div className="space-y-2.5">
                  {/* Refill Countdown */}
                  {refillData.length > 0 && (
                    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="w-3 h-3 text-rose-400" />
                        <span className="text-[9px] font-bold text-white">Refill Countdown</span>
                        <div className="flex-1" />
                        {criticalRefills.length > 0 && <span className="text-[7px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">{criticalRefills.length} urgent</span>}
                      </div>
                      <div className="space-y-1.5">
                        {refillData.sort((a, b) => a.daysUntilRefill - b.daysUntilRefill).map((r) => (
                          <div key={r.id} className={'flex items-center gap-2 p-2 rounded-lg border transition-all ' +
                            (r.urgency === 'critical' ? 'bg-rose-500/[0.06] border-rose-500/15' :
                             r.urgency === 'warning' ? 'bg-amber-500/[0.04] border-amber-500/10' :
                             'bg-white/[0.02] border-white/[0.04]')}>
                            <div className={'w-5 h-5 rounded flex items-center justify-center shrink-0 ' +
                              (r.urgency === 'critical' ? 'bg-rose-500/15' : r.urgency === 'warning' ? 'bg-amber-500/10' : 'bg-white/[0.03]')}>
                              {r.urgency === 'critical' ? <AlertTriangle className="w-3 h-3 text-rose-400" /> :
                               r.urgency === 'warning' ? <Clock className="w-3 h-3 text-amber-400" /> :
                               <CheckCircle2 className="w-3 h-3 text-gray-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-white truncate">{r.name}</span>
                                <span className={'text-[7px] font-bold ' + (r.urgency === 'critical' ? 'text-rose-400' : r.urgency === 'warning' ? 'text-amber-400' : 'text-gray-500')}>
                                  {r.daysUntilRefill <= 0 ? 'EMPTY' : r.daysUntilRefill + 'd left'}
                                </span>
                              </div>
                              <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1">
                                <div className={'h-full rounded-full transition-all ' + (r.urgency === 'critical' ? 'bg-rose-500' : r.urgency === 'warning' ? 'bg-amber-500' : 'bg-emerald-500/50')}
                                  style={{ width: Math.max(r.pctUsed, 2) + '%' }} />
                              </div>
                              <span className="text-[6px] text-gray-500">{r.pctUsed}% of {r.refillDays}-day supply used</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost Row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold text-white">Spending</span>
                      </div>
                      {costPieData.length > 0 ? (
                        <>
                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={costPieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                  {costPieData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.8} />)}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 mt-1">
                            {costBreakdown.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[6px] text-gray-500">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-24 flex items-center justify-center">
                          <span className="text-[8px] text-gray-600">No cost data</span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-2">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold text-white">Cost Overview</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[14px] font-black text-amber-300 block">{'$' + costPerDay}</span>
                          <span className="text-[6px] text-gray-500 font-bold uppercase">Per Day</span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[14px] font-black text-amber-300 block">{'$' + costPerWeek}</span>
                          <span className="text-[6px] text-gray-500 font-bold uppercase">Per Week</span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[14px] font-black text-amber-300 block">{'$' + monthlyProjection}</span>
                          <span className="text-[6px] text-gray-500 font-bold uppercase">Monthly</span>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[14px] font-black text-amber-300 block">{'$' + yearlyProjection}</span>
                          <span className="text-[6px] text-gray-500 font-bold uppercase">Yearly</span>
                        </div>
                      </div>
                      {costBreakdown.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                          {costBreakdown.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-[7px] text-gray-400 truncate w-14 shrink-0">{c.name}</span>
                              <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                                <div className="h-full rounded-full bg-amber-500/40" style={{ width: c.pct + '%' }} />
                              </div>
                              <span className="text-[7px] font-bold text-amber-300 tabular-nums w-6 text-right">{'$' + c.perDay + '/d'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {missing.length > 0 && (
                    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] p-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        <span className="text-[9px] font-bold text-white">Gap Analysis</span>
                        <div className="flex-1" />
                        <span className="text-[7px] text-gray-500">{missing.length} missing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {missing.slice(0, 4).map(m => (
                          <div key={m.name} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className={'w-1.5 h-1.5 rounded-full shrink-0 ' + (m.priority === 'high' ? 'bg-rose-400 shadow-[0_0_4px_rgba(239,68,68,0.4)]' : m.priority === 'medium' ? 'bg-amber-400' : 'bg-gray-500')} />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-white block truncate">{m.name}</span>
                              <span className="text-[7px] text-gray-500 truncate block">{m.why}</span>
                            </div>
                            <span className={'text-[6px] font-bold uppercase px-1 py-0.5 rounded shrink-0 ' +
                              (m.priority === 'high' ? 'bg-rose-500/10 text-rose-400' :
                               m.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                               'bg-gray-500/10 text-gray-400')}>{m.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl bg-gradient-to-br from-violet-500/[0.04] to-indigo-500/[0.01] border border-violet-500/10 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3 h-3 text-violet-400" />
                      <span className="text-[9px] font-bold text-white">Action Items</span>
                    </div>
                    <div className="space-y-1">
                      {realTiming.filter(r => !r.isAligned && r.actualCategory !== 'Unknown').slice(0, 2).map((r, i) => (
                        <div key={'ta' + i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                          <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="text-[8px] text-gray-300">Move <span className="font-bold text-white">{r.name}</span> from <span className="font-bold text-cyan-400">{r.actualCategory}</span> to <span className="font-bold text-emerald-400">{r.plannedCategory}</span></span>
                        </div>
                      ))}
                      {criticalRefills.slice(0, 1).map((r, i) => (
                        <div key={'ra' + i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/10">
                          <Package className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                          <span className="text-[8px] text-gray-300">Restock <span className="font-bold text-white">{r.name}</span> {'\u2014'} {r.daysUntilRefill <= 0 ? 'EMPTY' : r.daysUntilRefill + 'd remaining'}</span>
                        </div>
                      ))}
                      {remainingToday.length > 0 && (
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cyan-500/[0.04] border border-cyan-500/10">
                          <AlertTriangle className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                          <span className="text-[8px] text-gray-300">Still need: <span className="font-bold text-white">{remainingToday.map(r => r.name).join(', ')}</span></span>
                        </div>
                      )}
                      {missing.slice(0, 1).map((m, i) => (
                        <div key={'ma' + i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-500/[0.04] border border-violet-500/10">
                          <Plus className="w-2.5 h-2.5 text-violet-400 shrink-0" />
                          <span className="text-[8px] text-gray-300">Consider <span className="font-bold text-white">{m.name}</span> {'\u2014'} {m.why}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              })()}

            </div>
          </motion.div>
          )
        })()}


      </AnimatePresence>

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
                  <p className="text-[9px] text-gray-500 mt-0.5">{totalCount} supplement{totalCount !== 1 ? 's' : ''} tracked · {takenTodayCount} taken {selectedDate === today ? 'today' : 'on ' + new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
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
                  <h3 className="text-[13px] font-bold text-white">{selectedDate === today ? "Today's Schedule" : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
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

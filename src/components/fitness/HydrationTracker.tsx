import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Plus, Trash2, GlassWater, Target, AlertTriangle,
  Settings, TrendingUp, Zap, Flame, Clock, CheckCircle2,
  Sparkles, ChevronDown, CalendarDays, Ban, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { generateId, cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { HydrationEntry } from '@/types/fitness'

interface HydrationTrackerProps {
  dailyGoal?: number
}

const QUICK_AMOUNTS = [100, 250, 500, 750, 1000]
const WATER_TYPES = [
  { value: '', label: 'Plain', icon: '💧' },
  { value: 'sparkling', label: 'Sparkling', icon: '🫧' },
  { value: 'flavored', label: 'Flavored', icon: '🍋' },
] as const

const SCHEDULE_TIMES = [
  { label: '8 AM', hour: 8 },
  { label: '9:30 AM', hour: 9.5 },
  { label: '11 AM', hour: 11 },
  { label: '12:30 PM', hour: 12.5 },
  { label: '2 PM', hour: 14 },
  { label: '4 PM', hour: 16 },
  { label: '6 PM', hour: 18 },
  { label: '8 PM', hour: 20 },
]

const STORAGE_GOAL_KEY = 'vitalfi_hydration_goal'
const STORAGE_BEST_STREAK_KEY = 'vitalfi_hydration_best_streak'

function getStoredGoal(): number {
  try {
    const stored = localStorage.getItem(STORAGE_GOAL_KEY)
    return stored ? Number(stored) : 2500
  } catch {
    return 2500
  }
}

export function HydrationTracker({ dailyGoal: defaultGoal }: HydrationTrackerProps) {
  const { hydration, addHydration, deleteHydration } = useAppStore()
  const [dailyGoal, setDailyGoal] = useState(() => getStoredGoal() || defaultGoal || 2500)
  const [customAmount, setCustomAmount] = useState('')
  const [deletingEntry, setDeletingEntry] = useState<HydrationEntry | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(dailyGoal))
  const [waterType, setWaterType] = useState('')
  const [showWaterDropdown, setShowWaterDropdown] = useState(false)
  const [bestStreak, setBestStreak] = useState(() => {
    try {
      return Number(localStorage.getItem(STORAGE_BEST_STREAK_KEY)) || 0
    } catch { return 0 }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_GOAL_KEY, String(dailyGoal))
  }, [dailyGoal])

  const today = new Date().toISOString().split('T')[0]

  const todayEntries = useMemo(() =>
    hydration.filter((e) => e.date === today)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [hydration, today],
  )

  const totalAmount = useMemo(() =>
    todayEntries.reduce((sum, e) => sum + e.amount, 0),
    [todayEntries],
  )

  const percentage = Math.min((totalAmount / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - totalAmount, 0)
  const glassSize = dailyGoal / 8

  const getTotalForDate = useCallback((dateStr: string) =>
    hydration.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0),
    [hydration],
  )

  const currentStreak = useMemo(() => {
    let streak = 0
    const todayObj = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(todayObj)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (getTotalForDate(dateStr) >= dailyGoal) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [hydration, dailyGoal, getTotalForDate])

  useEffect(() => {
    if (currentStreak > bestStreak) {
      setBestStreak(currentStreak)
      localStorage.setItem(STORAGE_BEST_STREAK_KEY, String(currentStreak))
    }
  }, [currentStreak, bestStreak])

  const last7Days = useMemo(() => {
    const days = []
    const todayObj = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const total = getTotalForDate(dateStr)
      days.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: total,
        goal: dailyGoal,
        fill: total >= dailyGoal ? '#06b6d4' : '#8b5cf6',
      })
    }
    return days
  }, [hydration, dailyGoal, getTotalForDate])

  const scheduleStatus = useMemo(() =>
    SCHEDULE_TIMES.map((slot, i) => {
      const expectedAmount = (i + 1) * glassSize
      const full = totalAmount >= expectedAmount
      const partial = totalAmount > i * glassSize && totalAmount < expectedAmount
      const now = new Date()
      const currentHour = now.getHours() + now.getMinutes() / 60
      const isPast = slot.hour <= currentHour
      return { ...slot, expectedAmount, full, partial, isPast, index: i }
    }),
    [totalAmount, glassSize],
  )

  const addEntry = (amount: number) => {
    const note = waterType || undefined
    const entry: HydrationEntry = {
      id: generateId(),
      date: today,
      amount,
      timestamp: new Date().toISOString(),
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addHydration(entry)
    setCustomAmount('')
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    deleteHydration(deletingEntry.id)
    setDeletingEntry(null)
  }

  const handleSetGoal = () => {
    const val = Number(goalInput)
    if (val >= 100 && val <= 20000) {
      setDailyGoal(val)
      setShowGoalModal(false)
    }
  }

  const progressRingCircumference = 2 * Math.PI * 54
  const progressRingOffset = progressRingCircumference * (1 - percentage / 100)
  const isGoalMet = totalAmount >= dailyGoal

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Hydration Tracker</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isGoalMet ? 'Daily goal achieved!' : `${remaining}ml remaining`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{currentStreak}</span>
            </motion.div>
          )}
          <button
            onClick={() => { setGoalInput(String(dailyGoal)); setShowGoalModal(true) }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Goal', value: `${dailyGoal}ml`, icon: Target, color: 'from-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
          { label: 'Consumed', value: `${totalAmount}ml`, icon: Droplets, color: 'from-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
          { label: 'Remaining', value: `${remaining}ml`, icon: Sparkles, color: 'from-white/5', border: 'border-white/10', text: 'text-gray-300' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6"
            style={{
              borderColor: `color-mix(in srgb, ${stat.border.replace('border-', '')} 20%, transparent)`,
              backgroundImage: `linear-gradient(to bottom right, ${stat.color}, transparent)`,
            }}
          >
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">
                <stat.icon className="w-3.5 h-3.5" />
                <span>{stat.label}</span>
              </div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Ring + Quick Add Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col items-center justify-center"
        >
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={progressRingCircumference}
                initial={{ strokeDashoffset: progressRingCircumference }}
                animate={{ strokeDashoffset: progressRingOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={Math.round(percentage)}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                {Math.round(percentage)}%
              </motion.span>
              <span className="text-xs text-gray-400 mt-0.5">of goal</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <GlassWater className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-medium">{todayEntries.length}</span>
              <span>entries</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Add + Custom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Quick Add
          </h3>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_AMOUNTS.map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addEntry(amount)}
                className="py-2.5 rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-all text-xs"
              >
                <Plus className="w-3 h-3 mx-auto mb-0.5" />
                {amount}ml
              </motion.button>
            ))}
          </div>

          {/* Water Type + Custom Amount Row */}
          <div className="flex gap-3">
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowWaterDropdown(!showWaterDropdown)}
                className="h-full px-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 text-sm"
              >
                <span>{WATER_TYPES.find(w => w.value === waterType)?.icon || '💧'}</span>
                <span className="hidden sm:inline">{WATER_TYPES.find(w => w.value === waterType)?.label || 'Plain'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showWaterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute bottom-full mb-2 left-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[140px] z-10"
                  >
                    {WATER_TYPES.map((wt) => (
                      <button
                        key={wt.value}
                        onClick={() => { setWaterType(wt.value); setShowWaterDropdown(false) }}
                        className={cn(
                          'w-full px-4 py-2.5 text-sm flex items-center gap-2 transition-all hover:bg-white/5',
                          waterType === wt.value ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300',
                        )}
                      >
                        <span>{wt.icon}</span>
                        {wt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom ml"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-all text-sm"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => customAmount && addEntry(Number(customAmount))}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Hourly Water Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Daily Water Schedule
          <span className="text-xs text-gray-500 font-normal ml-auto">{(dailyGoal / 8).toFixed(0)}ml per glass</span>
        </h3>
        <div className="space-y-2">
          {scheduleStatus.map((slot) => {
            const isUpcoming = !slot.isPast
            const isMissed = slot.isPast && !slot.full && !slot.partial
            return (
              <div key={slot.label} className="flex items-center gap-3">
                <div className={cn(
                  'w-16 text-xs font-medium flex-shrink-0',
                  isUpcoming ? 'text-gray-500' : 'text-gray-300',
                )}>
                  {slot.label}
                </div>
                <div className="flex-1 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] relative overflow-hidden">
                  <motion.div
                    className={cn(
                      'absolute inset-0 rounded-lg',
                      slot.full ? 'bg-gradient-to-r from-cyan-500/30 to-cyan-400/20' :
                      slot.partial ? 'bg-gradient-to-r from-violet-500/20 to-violet-400/10' :
                      isMissed ? 'bg-gradient-to-r from-red-500/10 to-transparent' : '',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: slot.full ? '100%' : slot.partial ? '50%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="relative flex items-center gap-2 px-3 h-full">
                    {slot.full ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    ) : isMissed ? (
                      <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    ) : isUpcoming ? (
                      <GlassWater className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs',
                      slot.full ? 'text-cyan-300' : isMissed ? 'text-red-300' : isUpcoming ? 'text-gray-500' : 'text-violet-300',
                    )}>
                      {slot.full ? 'Done' : isMissed ? 'Missed' : isUpcoming ? `${(slot.expectedAmount).toFixed(0)}ml` : 'Partial'}
                    </span>
                    {!slot.full && !isMissed && (
                      <span className="text-[10px] text-gray-600 ml-auto">{(slot.expectedAmount).toFixed(0)}ml</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* 7-Day Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          7-Day Trend
        </h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number) => [`${value}ml`, 'Consumed']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {last7Days.map((entry, idx) => (
                  <rect key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-6"
        >
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            <Flame className="w-4 h-4" />
            <span>Current Streak</span>
          </div>
          <p className="text-3xl font-black text-amber-400">{currentStreak}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">consecutive days</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.03] to-transparent p-6"
        >
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            <Zap className="w-4 h-4" />
            <span>Best Streak</span>
          </div>
          <p className="text-3xl font-black text-violet-400">{bestStreak}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">all time</p>
        </motion.div>
      </div>

      {/* Today's Entries */}
      {todayEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5">
            <h4 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              Today's Entries
              <span className="text-xs text-gray-500 font-normal ml-auto">{todayEntries.length} entries</span>
            </h4>
            <div className="space-y-2">
              {todayEntries.map((entry) => {
                const wt = WATER_TYPES.find(w => w.value === (entry.note || ''))
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        entry.note === 'sparkling' ? 'bg-cyan-500/20' :
                        entry.note === 'flavored' ? 'bg-amber-500/20' :
                        'bg-sky-500/20',
                      )}>
                        <span className="text-base">{wt?.icon || '💧'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {entry.amount}ml
                          {entry.note && (
                            <span className="text-gray-400 font-normal ml-1.5">
                              {WATER_TYPES.find(w => w.value === entry.note)?.label || entry.note}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeletingEntry(entry)}
                      className="p-2 rounded-lg text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeletingEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Entry?</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Delete this {deletingEntry.amount}ml entry?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingEntry(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Settings Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowGoalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Daily Goal</h3>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">Set your daily water intake goal (100-20000ml)</p>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetGoal()}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-all text-sm mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetGoal}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium"
                >
                  Save Goal
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-gray-500">Recommended: 2000-3000ml per day</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

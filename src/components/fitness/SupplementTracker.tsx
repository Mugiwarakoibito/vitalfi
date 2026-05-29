import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Plus, Check, Clock, X, AlertTriangle, Calendar, TrendingUp, List,
  Trash2, Sunrise, Sunset, Moon, Sun, Sparkles, Target, Flame, Activity,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/Card'
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
}

interface SupplementLog {
  id: string
  supplementId: string
  takenAt: string
  date: string
}

const TIMES_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night'] as const
type TimeOfDay = (typeof TIMES_OF_DAY)[number]

const TIME_ICONS: Record<TimeOfDay, typeof Sun> = {
  Morning: Sun,
  Afternoon: Sunrise,
  Evening: Sunset,
  Night: Moon,
}

const TIME_COLORS: Record<TimeOfDay, string> = {
  Morning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Afternoon: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Evening: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Night: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU' },
  { name: 'Omega-3 Fish Oil', dosage: '2000mg' },
  { name: 'Creatine', dosage: '5g' },
  { name: 'Whey Protein', dosage: '30g' },
  { name: 'Magnesium', dosage: '400mg' },
  { name: 'Zinc', dosage: '30mg' },
  { name: 'Multivitamin', dosage: '1 tablet' },
  { name: 'Collagen', dosage: '10g' },
  { name: 'Pre-workout', dosage: '1 scoop' },
  { name: 'BCAA', dosage: '5g' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplement | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as Supplement['frequency'],
    times: [] as TimeOfDay[],
    notes: '',
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    try {
      const stored = localStorage.getItem('supplements')
      if (stored) setSupplements(JSON.parse(stored))
      const logStored = localStorage.getItem('supplementLogs')
      if (logStored) setLogs(JSON.parse(logStored))
    } catch {
      /* ignore corrupt data */
    }
  }, [])

  const persistSupplements = useCallback((data: Supplement[]) => {
    setSupplements(data)
    localStorage.setItem('supplements', JSON.stringify(data))
  }, [])

  const persistLogs = useCallback((data: SupplementLog[]) => {
    setLogs(data)
    localStorage.setItem('supplementLogs', JSON.stringify(data))
  }, [])

  const todayLogs = useMemo(
    () => logs.filter((l) => l.date === today),
    [logs, today],
  )

  const takenTodayIds = useMemo(
    () => new Set(todayLogs.map((l) => l.supplementId)),
    [todayLogs],
  )

  const takenTodayCount = takenTodayIds.size
  const totalCount = supplements.length
  const remainingCount = totalCount - takenTodayCount

  const dailySupps = useMemo(
    () => supplements.filter((s) => s.frequency === 'daily'),
    [supplements],
  )

  const adherenceWeek = useMemo(() => {
    const days: { date: string; label: string; taken: number; total: number; pct: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr)
      const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      const total = dailySupps.length
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        taken,
        total,
        pct: total > 0 ? Math.round((taken / total) * 100) : 0,
      })
    }
    return days
  }, [logs, dailySupps])

  const weekAdherence = useMemo(() => {
    const total = adherenceWeek.reduce((s, d) => s + d.total, 0)
    const taken = adherenceWeek.reduce((s, d) => s + d.taken, 0)
    return total > 0 ? Math.round((taken / total) * 100) : 0
  }, [adherenceWeek])

  const adherenceTrend = useMemo(() => {
    const days: { date: string; pct: number }[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr)
      const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      const total = dailySupps.length
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pct: total > 0 ? Math.round((taken / total) * 100) : 0,
      })
    }
    return days
  }, [logs, dailySupps])

  const suppStreak = useMemo(() => {
    let streak = 0
    const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr)
      const taken = new Set(dayLogs.map((l) => l.supplementId)).size
      if (dailySupps.length > 0 && taken === dailySupps.length) {
        streak++
      } else if (dailySupps.length > 0) {
        break
      }
    }
    return streak
  }, [logs, dailySupps])

  const supplementsByTime = useMemo(() => {
    const grouped: Record<TimeOfDay, Supplement[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    }
    for (const supp of supplements) {
      for (const t of supp.times) {
        const key = t as TimeOfDay
        if (grouped[key]) grouped[key].push(supp)
      }
    }
    return grouped
  }, [supplements])

  const logHistory = useMemo(() => {
    const days: { date: string; label: string; ids: string[] }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter((l) => l.date === dateStr).map((l) => l.supplementId)
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        ids: [...new Set(dayLogs)],
      })
    }
    return days
  }, [logs])

  const markAsTaken = (supp: Supplement) => {
    if (takenTodayIds.has(supp.id)) return
    const log: SupplementLog = {
      id: generateId(),
      supplementId: supp.id,
      takenAt: new Date().toISOString(),
      date: today,
    }
    persistLogs([...logs, log])
  }

  const handleQuickAdd = (name: string, dosage: string) => {
    setFormData({ ...formData, name, dosage, times: formData.times.length ? formData.times : ['Morning'] })
  }

  const toggleTime = (time: TimeOfDay) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time],
    }))
  }

  const resetForm = () => {
    setFormData({ name: '', dosage: '', frequency: 'daily', times: [], notes: '' })
  }

  const addSupplement = () => {
    if (!formData.name.trim() || !formData.dosage.trim()) return
    const newSupp: Supplement = {
      id: generateId(),
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      frequency: formData.frequency,
      times: formData.times.length ? [...formData.times] : ['Morning'],
      notes: formData.notes.trim() || undefined,
    }
    persistSupplements([...supplements, newSupp])
    setShowModal(false)
    resetForm()
  }

  const deleteSupplement = () => {
    if (!deleteTarget) return
    const filtered = supplements.filter((s) => s.id !== deleteTarget.id)
    persistSupplements(filtered)
    persistLogs(logs.filter((l) => l.supplementId !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const timeOptions: { value: TimeOfDay; icon: typeof Sun }[] = TIMES_OF_DAY.map((t) => ({
    value: t,
    icon: TIME_ICONS[t],
  }))

  const isToday = useCallback(
    (dateStr: string) => dateStr === today,
    [today],
  )

  return (
    <div className="space-y-5">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Stats Dashboard */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-500/5 to-transparent p-6 shadow-lg shadow-purple-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-violet-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
            <div className="relative">
              <div className="text-purple-400/80 text-xs font-medium uppercase tracking-wider mb-2">Total Doses</div>
              <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{totalCount}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent p-6 shadow-lg shadow-emerald-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
            <div className="relative">
              <div className="text-emerald-400/80 text-xs font-medium uppercase tracking-wider mb-2">Taken Today</div>
              <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{takenTodayCount}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent p-6 shadow-lg shadow-amber-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
            <div className="relative">
              <div className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mb-2">Remaining</div>
              <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{remainingCount}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent p-6 shadow-lg shadow-violet-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
            <div className="relative">
              <div className="text-violet-400/80 text-xs font-medium uppercase tracking-wider mb-2">Adherence</div>
              <p className="text-3xl font-bold text-violet-400 drop-shadow-lg">{weekAdherence}%</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Status Banner */}
        {totalCount > 0 && (
          <motion.div variants={itemVariants}>
            <Card
              className={cn(
                'border',
                takenTodayCount === totalCount
                  ? 'bg-green-900/10 border-green-700/30'
                  : 'bg-amber-900/10 border-amber-700/30',
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {takenTodayCount === totalCount ? (
                    <Sparkles className="w-5 h-5 text-green-400" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {takenTodayCount}/{totalCount} supplements taken today
                    </p>
                    <p className="text-xs text-gray-400">
                      {takenTodayCount === totalCount
                        ? 'All done for today!'
                        : `${remainingCount} remaining`}
                    </p>
                  </div>
                </div>
                <div className="h-2 w-28 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalCount > 0 ? (takenTodayCount / totalCount) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      takenTodayCount === totalCount ? 'bg-green-400' : 'bg-amber-400',
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Adherence Progress Bar */}
        {dailySupps.length > 0 && (
          <>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-semibold text-white">Weekly Adherence</span>
                    </div>
                    <span className="text-sm font-bold text-violet-400">{weekAdherence}%</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weekAdherence}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-400 to-purple-400"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Streak + Trend */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent p-6 shadow-lg shadow-amber-500/5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-lg" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Current Streak
                  </div>
                  <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{suppStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent p-6 shadow-lg shadow-violet-500/5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-lg" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    30-Day Trend
                  </div>
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adherenceTrend}>
                        <XAxis dataKey="date" tick={false} axisLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
                          formatter={(value: number) => [`${value}%`, 'Adherence']}
                      />
                      <Line type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </motion.div>
          </>
        )}

        {/* Timing Schedule */}
        {totalCount > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Timing Schedule</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.entries(supplementsByTime) as [TimeOfDay, Supplement[]][]).map(
                    ([time, supps]) => {
                      const Icon = TIME_ICONS[time]
                      return (
                        <div
                          key={time}
                          className={cn(
                            'rounded-xl border p-3',
                            TIME_COLORS[time],
                            supps.length === 0 && 'opacity-40',
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">{time}</span>
                          </div>
                          {supps.length > 0 ? (
                            <ul className="space-y-1">
                              {supps.map((s) => (
                                <li key={s.id} className="text-xs text-gray-300 flex items-center gap-1">
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                      takenTodayIds.has(s.id) ? 'bg-green-400' : 'bg-gray-500',
                                    )}
                                  />
                                  {s.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">No supplements</p>
                          )}
                        </div>
                      )
                    },
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Log History - 7 Day Mini Calendar */}
        {totalCount > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">7-Day History</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {logHistory.map((day) => {
                    const isTodayDay = isToday(day.date)
                    const pct =
                      dailySupps.length > 0
                        ? Math.round((day.ids.length / dailySupps.length) * 100)
                        : 0
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          'flex flex-col items-center rounded-xl p-2 border transition-all',
                          isTodayDay
                            ? 'border-purple-500/40 bg-purple-500/10'
                            : 'border-white/5 bg-white/[0.02]',
                        )}
                      >
                        <span className="text-[10px] text-gray-500 mb-1">{day.label}</span>
                        <div className="flex flex-wrap gap-0.5 justify-center mb-1 max-w-[28px]">
                          {dailySupps.slice(0, 4).map((s) => (
                            <span
                              key={s.id}
                              className={cn(
                                'w-2 h-2 rounded-full',
                                day.ids.includes(s.id) ? 'bg-green-400' : 'bg-gray-600',
                              )}
                            />
                          ))}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-semibold',
                            pct >= 80
                              ? 'text-green-400'
                              : pct >= 50
                                ? 'text-amber-400'
                                : 'text-gray-500',
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Header + Add Button */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Supplements</h3>
            <span className="text-xs text-gray-500">({totalCount})</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </motion.div>

        {/* Empty State */}
        {totalCount === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-10 text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Pill className="w-14 h-14 text-gray-600 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-400 font-medium">No supplements tracked</p>
                <p className="text-gray-500 text-sm mt-1 mb-4">
                  Track your daily vitamins, minerals, and supps
                </p>
                <Button variant="accent" size="sm" onClick={() => { resetForm(); setShowModal(true) }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Your First Supplement
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supplements.map((supp) => {
              const taken = takenTodayIds.has(supp.id)
              return (
                <motion.div
                  key={supp.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card
                    className={cn(
                      'border transition-all',
                      taken
                        ? 'bg-green-900/10 border-green-700/30'
                        : 'bg-gray-900/40 border-gray-700/40',
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'w-2.5 h-2.5 rounded-full flex-shrink-0',
                                taken ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-500',
                              )}
                            />
                            <h4 className="font-semibold text-white truncate">{supp.name}</h4>
                          </div>
                          <p className="text-sm text-gray-400 ml-4.5">{supp.dosage}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-4.5">
                            {supp.times.map((t) => {
                              const Icon = TIME_ICONS[t as TimeOfDay] || Clock
                              return (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.08] text-gray-400"
                                >
                                  <Icon className="w-2.5 h-2.5" />
                                  {t}
                                </span>
                              )
                            })}
                          </div>
                          {supp.notes && (
                            <p className="text-[11px] text-gray-500 mt-1.5 ml-4.5 italic truncate">
                              {supp.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {taken ? (
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-medium text-green-400">Taken</span>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => markAsTaken(supp)}
                              className="whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Take
                            </Button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(supp)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Add Supplement Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title="Add Supplement">
        <div className="space-y-5">
          {/* Quick Add */}
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Quick Add from Common
            </label>
            <div className="grid grid-cols-2 gap-2">
              {commonSupplements.map((s) => (
                <motion.button
                  key={s.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAdd(s.name, s.dosage)}
                  className={cn(
                    'text-left px-3 py-2.5 rounded-xl text-xs border transition-all duration-200',
                    formData.name === s.name
                      ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20',
                  )}
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.dosage}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Name */}
          <Input
            label="Supplement Name"
            placeholder="e.g., Vitamin D3"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<Pill className="w-4 h-4" />}
          />

          {/* Dosage */}
          <Input
            label="Dosage"
            placeholder="e.g., 5000 IU"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          />

          {/* Frequency */}
          <div>
            <label className="mb-2 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: freq })}
                  className={cn(
                    'flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 capitalize',
                    formData.frequency === freq
                      ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]',
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div>
            <label className="mb-2 block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Times of Day</label>
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTime(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl text-xs font-medium border transition-all duration-200',
                    formData.times.includes(value)
                      ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <Input
            label="Notes (optional)"
            placeholder="Any notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <Button
            variant="primary"
            onClick={addSupplement}
            className="w-full"
            disabled={!formData.name.trim() || !formData.dosage.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Supplement
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl shadow-red-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
                    <AlertTriangle className="w-7 h-7 text-red-400 drop-shadow-sm" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Supplement?</h3>
                  <p className="text-sm text-gray-400 mb-1">
                    Are you sure you want to delete
                  </p>
                  <p className="text-base font-semibold text-white mb-4">
                    <span className="text-rose-300">{deleteTarget.name}</span>
                    <span className="text-gray-500"> ({deleteTarget.dosage})</span>
                  </p>
                  <div className="px-4 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-5">
                    <p className="text-xs text-gray-500">
                      <X className="w-3 h-3 inline mr-1 text-rose-400/60" />
                      This will also remove all logs for this supplement.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteSupplement}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
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

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Star, Clock, Plus, Trash2, AlertTriangle, Brain, Target, TrendingUp, Sparkles, Activity, BarChart3 } from 'lucide-react'
import { generateId, formatSleepDuration } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { SleepEntry } from '@/types/fitness'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts'

const qualityLabel = (q: number) =>
  q === 1 ? 'Poor' : q === 2 ? 'Fair' : q === 3 ? 'Okay' : q === 4 ? 'Good' : 'Great'

const qualityColor = (q: number) =>
  q >= 4 ? 'text-green-400' : q >= 3 ? 'text-amber-400' : 'text-red-400'

function calcSleepScore(avgDuration: number, avgQuality: number): number {
  let durationScore = 0
  if (avgDuration >= 7 && avgDuration <= 9) durationScore = 50
  else if (avgDuration < 7) durationScore = (avgDuration / 7) * 50
  else durationScore = Math.max(0, 50 - (avgDuration - 9) * 25)
  const qualityScore = avgQuality * 10
  return Math.round(Math.min(100, durationScore + qualityScore))
}

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function SleepLogger() {
  const { sleep, addSleep, deleteSleep } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formDuration, setFormDuration] = useState('')
  const [formQuality, setFormQuality] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [formBedTime, setFormBedTime] = useState('')
  const [formWakeTime, setFormWakeTime] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [deletingEntry, setDeletingEntry] = useState<SleepEntry | null>(null)
  const [targetHours, setTargetHours] = useState(() => {
    const saved = localStorage.getItem('vitalfi_sleep_target')
    return saved ? parseFloat(saved) : 8
  })

  useEffect(() => {
    localStorage.setItem('vitalfi_sleep_target', targetHours.toString())
  }, [targetHours])

  const sorted = useMemo(
    () => [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sleep]
  )

  const avgDuration = useMemo(
    () => (sleep.length > 0 ? sleep.reduce((s, e) => s + e.duration, 0) / sleep.length : 0),
    [sleep]
  )

  const avgQuality = useMemo(
    () => (sleep.length > 0 ? sleep.reduce((s, e) => s + e.quality, 0) / sleep.length : 0),
    [sleep]
  )

  const sleepScore = useMemo(
    () => calcSleepScore(avgDuration, avgQuality),
    [avgDuration, avgQuality]
  )

  const last7Days = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = sleep.find(e => e.date === dateStr)
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        duration: entry ? entry.duration : 0,
        quality: entry ? entry.quality : 0,
        hasData: !!entry,
      })
    }
    return days
  }, [sleep])

  const last30Days = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = sleep.find(e => e.date === dateStr)
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration: entry ? entry.duration : null,
        quality: entry ? entry.quality : null,
        hasData: !!entry,
      })
    }
    return days
  }, [sleep])

  const weekComparison = useMemo(() => {
    if (sleep.length < 2) return null
    const sorted = [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const thisWeek = sorted.slice(0, 7)
    const lastWeek = sorted.slice(7, 14)
    if (thisWeek.length === 0 || lastWeek.length === 0) return null
    const thisAvg = thisWeek.reduce((s, e) => s + e.duration, 0) / thisWeek.length
    const lastAvg = lastWeek.reduce((s, e) => s + e.duration, 0) / lastWeek.length
    const thisQual = thisWeek.reduce((s, e) => s + e.quality, 0) / thisWeek.length
    const lastQual = lastWeek.reduce((s, e) => s + e.quality, 0) / lastWeek.length
    return { thisAvg, lastAvg, thisQual, lastQual, diffDuration: thisAvg - lastAvg, diffQuality: thisQual - lastQual }
  }, [sleep])

  const durationDist = useMemo(() => {
    const ranges = [
      { label: '<5', min: 0, max: 5 },
      { label: '5-6', min: 5, max: 6 },
      { label: '6-7', min: 6, max: 7 },
      { label: '7-8', min: 7, max: 8 },
      { label: '8-9', min: 8, max: 9 },
      { label: '9+', min: 9, max: 24 },
    ]
    return ranges.map(r => ({
      label: r.label,
      count: sleep.filter(e => e.duration >= r.min && e.duration < r.max).length,
    }))
  }, [sleep])

  const consistency = useMemo(() => {
    const withBed = sleep.filter(e => e.bedTime)
    if (withBed.length < 2) return { pct: 0, total: withBed.length }
    const avgMins = withBed.reduce((s, e) => s + timeToMinutes(e.bedTime!), 0) / withBed.length
    const consistent = withBed.filter(e => Math.abs(timeToMinutes(e.bedTime!) - avgMins) <= 60)
    return { pct: Math.round((consistent.length / withBed.length) * 100), total: withBed.length }
  }, [sleep])

  const sleepDebt = useMemo(() => {
    const debt = sleep.reduce((d, e) => (e.duration < targetHours ? d + (targetHours - e.duration) : d), 0)
    return Math.round(debt * 10) / 10
  }, [sleep, targetHours])

  const insights = useMemo(() => {
    const lines: { icon: typeof Brain; text: string; color: string }[] = []
    if (sleep.length < 3) {
      lines.push({ icon: Moon, text: 'Log 3+ nights to see personalized insights', color: 'text-gray-400' })
      return lines
    }
    const weekday = sleep.filter(e => {
      const d = new Date(e.date).getDay()
      return d >= 1 && d <= 5
    })
    const weekend = sleep.filter(e => {
      const d = new Date(e.date).getDay()
      return d === 0 || d === 6
    })
    if (weekday.length > 0 && weekend.length > 0) {
      const wdAvg = weekday.reduce((s, e) => s + e.duration, 0) / weekday.length
      const weAvg = weekend.reduce((s, e) => s + e.duration, 0) / weekend.length
      if (weAvg > wdAvg + 0.5)
        lines.push({ icon: Moon, text: `You sleep ${(weAvg - wdAvg).toFixed(1)}h longer on weekends`, color: 'text-violet-300' })
      else if (wdAvg > weAvg + 0.5)
        lines.push({ icon: Moon, text: `You sleep ${(wdAvg - weAvg).toFixed(1)}h longer on weekdays`, color: 'text-violet-300' })
    }
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2)
      const recent = sorted.slice(0, mid)
      const older = sorted.slice(mid)
      const rAvg = recent.reduce((s, e) => s + e.duration, 0) / recent.length
      const oAvg = older.reduce((s, e) => s + e.duration, 0) / older.length
      if (rAvg > oAvg + 0.3)
        lines.push({ icon: TrendingUp, text: `Duration improving (+${(rAvg - oAvg).toFixed(1)}h)`, color: 'text-green-400' })
      else if (oAvg > rAvg + 0.3)
        lines.push({ icon: TrendingUp, text: `Duration declining (${(rAvg - oAvg).toFixed(1)}h)`, color: 'text-red-400' })
      else
        lines.push({ icon: TrendingUp, text: 'Duration is stable', color: 'text-blue-400' })
    }
    const withNotes = sleep.filter(e => e.notes)
    if (withNotes.length > 0) {
      const stressNotes = withNotes.filter(e => e.notes!.toLowerCase().includes('stress'))
      if (stressNotes.length >= 2)
        lines.push({ icon: Brain, text: `Stress mentioned ${stressNotes.length}x in notes`, color: 'text-amber-400' })
    }
    if (consistency.total >= 3) {
      lines.push({
        icon: Clock,
        text: consistency.pct >= 70
          ? `Consistent bedtime (${consistency.pct}% within 1h)`
          : 'Try a fixed bedtime routine to improve consistency',
        color: consistency.pct >= 70 ? 'text-green-400' : 'text-amber-400',
      })
    }
    return lines
  }, [sleep, sorted, consistency])

  const hasBedWakeData = useMemo(
    () => sleep.filter(e => e.bedTime && e.wakeTime).length > 0,
    [sleep]
  )

  const bedWakeEntries = useMemo(
    () =>
      sleep
        .filter(e => e.bedTime && e.wakeTime)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14),
    [sleep]
  )

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0])
    setFormDuration('')
    setFormQuality(3)
    setFormBedTime('')
    setFormWakeTime('')
    setFormNotes('')
  }

  const handleSave = () => {
    if (!formDuration || isNaN(parseFloat(formDuration))) return
    addSleep({
      id: generateId(),
      date: formDate,
      duration: parseFloat(formDuration),
      quality: formQuality,
      bedTime: formBedTime || undefined,
      wakeTime: formWakeTime || undefined,
      notes: formNotes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    resetForm()
    setShowForm(false)
  }

  const handleDelete = () => {
    if (!deletingEntry) return
    deleteSleep(deletingEntry.id)
    setDeletingEntry(null)
  }

  const qualityStars = (q: number, size = 12, className = '') =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={
          i < q ? `fill-amber-400 text-amber-400 ${className}` : `text-white/10 ${className}`
        }
      />
    ))

  const goalMetCount = useMemo(
    () => sleep.filter(e => e.duration >= targetHours).length,
    [sleep, targetHours]
  )

  const goalMetPct = useMemo(
    () => (sleep.length > 0 ? Math.round((goalMetCount / sleep.length) * 100) : 0),
    [sleep.length, goalMetCount]
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    return (
      <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="text-white/80 text-xs font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.dataKey === 'quality' ? `${p.value}/5` : `${p.value}h`}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="text-violet-400/80 text-sm mb-2">Avg Duration</div>
            <p className="text-3xl font-bold text-violet-400">
              {sleep.length > 0 ? formatSleepDuration(avgDuration) : '--'}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="text-amber-400/80 text-sm mb-2">Avg Quality</div>
            <div className="flex items-center gap-1 mt-0.5">
              {qualityStars(Math.round(avgQuality), 14)}
              <span className="text-white/50 text-xs ml-1">{avgQuality > 0 ? avgQuality.toFixed(1) : ''}</span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="text-blue-400/80 text-sm mb-2">Sleep Score</div>
            <p className={`text-3xl font-bold tracking-tight ${scoreColor(sleepScore)}`}>
              {sleep.length > 0 ? sleepScore : '--'}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="text-gray-400/80 text-sm mb-2">Total Nights</div>
            <p className="text-3xl font-bold text-gray-400">{sleep.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Goal Setting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/5 to-transparent p-4 sm:p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Daily Sleep Goal</p>
              <p className="text-xs text-gray-500">
                {goalMetCount}/{sleep.length} nights met ({goalMetPct}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetHours(h => Math.max(4, +(h - 0.5).toFixed(1)))}
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center text-sm transition-all"
              >
                -
              </button>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min={4}
                  max={12}
                  value={targetHours}
                  onChange={e => setTargetHours(Math.max(4, Math.min(12, parseFloat(e.target.value) || 8)))}
                  className="w-16 text-center px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:border-violet-500/50 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">h</span>
              </div>
              <button
                onClick={() => setTargetHours(h => Math.min(12, +(h + 0.5).toFixed(1)))}
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center text-sm transition-all"
              >
                +
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">Avg:</span>
              <span className={`font-medium ${avgDuration >= targetHours ? 'text-green-400' : 'text-amber-400'}`}>
                {formatSleepDuration(avgDuration)}
              </span>
              <span className="text-gray-500">/ {formatSleepDuration(targetHours)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (avgDuration / targetHours) * 100)}%` }}
          />
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-Day Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5"
        >
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            7-Day Trend
          </h4>
          {last7Days.some(d => d.hasData) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} tickMargin={4} />
                <YAxis
                  yAxisId="left"
                  stroke="#8B5CF6"
                  fontSize={11}
                  domain={[0, 'auto']}
                  tickMargin={4}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  fontSize={11}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickMargin={4}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="duration"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#1a1a2e', strokeWidth: 2 }}
                  name="Duration"
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="quality"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#1a1a2e', strokeWidth: 2 }}
                  name="Quality"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              No data yet
            </div>
          )}
        </motion.div>

        {/* Duration Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5"
        >
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Duration Distribution
          </h4>
          {sleep.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={durationDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff40" fontSize={11} tickMargin={4} />
                <YAxis allowDecimals={false} stroke="#ffffff40" fontSize={11} tickMargin={4} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2ee6',
                    border: '1px solid #ffffff20',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                >
                  {durationDist.map((_, i) => (
                    <rect key={i} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Log sleep to see distribution
            </div>
          )}
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bed/Wake Time Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5"
        >
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Bed/Wake Patterns
          </h4>
          {hasBedWakeData ? (
            <div className="relative h-[200px]">
              {/* Hour grid lines */}
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
                <div
                  key={h}
                  className="absolute bottom-0 top-0 border-l border-white/[0.03] text-[10px] text-gray-600 pt-1"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  <span className="pl-1">{h === 24 ? '0' : h}</span>
                </div>
              ))}
              {/* Sleep bars */}
              {bedWakeEntries.map((e, i) => {
                const bedMins = timeToMinutes(e.bedTime!)
                const wakeMins = timeToMinutes(e.wakeTime!)
                const bedPct = (bedMins / (24 * 60)) * 100
                const durMins = wakeMins >= bedMins ? wakeMins - bedMins : wakeMins + 24 * 60 - bedMins
                const durPct = (durMins / (24 * 60)) * 100
                const barHeight = Math.max(12, 75 / bedWakeEntries.length)
                return (
                  <div
                    key={e.id}
                    className="absolute rounded-full transition-all hover:opacity-80"
                    style={{
                      left: `${bedPct}%`,
                      width: `${durPct}%`,
                      top: `${(i / bedWakeEntries.length) * 100}%`,
                      height: `${barHeight}%`,
                      maxHeight: '20px',
                      minHeight: '8px',
                      background: `linear-gradient(90deg, 
                        ${e.quality >= 4 ? 'rgba(74,222,128,0.5)' : e.quality >= 3 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)'}, 
                        ${e.quality >= 4 ? 'rgba(74,222,128,0.3)' : e.quality >= 3 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'})`,
                      border: `1px solid ${
                        e.quality >= 4
                          ? 'rgba(74,222,128,0.3)'
                          : e.quality >= 3
                          ? 'rgba(251,191,36,0.3)'
                          : 'rgba(248,113,113,0.3)'
                      }`,
                    }}
                    title={`${e.bedTime} - ${e.wakeTime} (${formatSleepDuration(e.duration)})`}
                  />
                )
              })}
              {/* Legend */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400/50" /> Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400/50" /> Okay
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400/50" /> Poor
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Log bed & wake times to see patterns
            </div>
          )}
        </motion.div>

        {/* Consistency + Sleep Debt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* Consistency */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Bedtime Consistency</span>
              </div>
              <span className={`text-lg font-bold ${consistency.pct >= 70 ? 'text-green-400' : consistency.pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {consistency.total >= 2 ? `${consistency.pct}%` : '--'}
              </span>
            </div>
            {consistency.total >= 2 ? (
              <>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${consistency.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {consistency.total} nights with bed time tracked
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Need at least 2 entries with bed time</p>
            )}
          </div>

          {/* Sleep Debt */}
          <div className="rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/5 to-transparent p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Cumulative Sleep Debt</span>
              </div>
              <div className="flex items-center gap-2">
                {sleepDebt > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium">
                    {sleepDebt.toFixed(1)}h owed
                  </span>
                )}
                <span className={`text-lg font-bold ${sleepDebt > 5 ? 'text-red-400' : sleepDebt > 2 ? 'text-amber-400' : 'text-green-400'}`}>
                  {sleepDebt > 0 ? `${sleepDebt.toFixed(1)}h` : '0h'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Against {formatSleepDuration(targetHours)} target per night
            </p>
          </div>
        </motion.div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/5 to-transparent p-4 sm:p-5"
        >
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            Sleep Insights
          </h4>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <insight.icon className={`w-4 h-4 shrink-0 ${insight.color}`} />
                <span className="text-gray-300">{insight.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 30-Day Trend */}
      {sleep.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5"
        >
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            30-Day Trend
          </h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last30Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="date" stroke="#ffffff40" fontSize={9} interval={4} tickMargin={2} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2ee6', border: '1px solid #ffffff20', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [name === 'duration' ? `${value.toFixed(1)}h` : `${value}/5`, name === 'duration' ? 'Duration' : 'Quality']}
              />
              <Bar dataKey="duration" radius={[3, 3, 0, 0]} maxBarSize={8}>
                {last30Days.map((entry, idx) => (
                  <rect key={idx} fill={entry.duration != null && entry.duration >= targetHours ? '#8B5CF6' : '#4B5563'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Week-over-Week Comparison */}
      {weekComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              Duration vs Last Week
            </div>
            <p className="text-2xl font-bold text-white">{formatSleepDuration(weekComparison.thisAvg)}</p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${weekComparison.diffDuration >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {weekComparison.diffDuration >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {weekComparison.diffDuration >= 0 ? '+' : ''}{weekComparison.diffDuration.toFixed(1)}h vs last week
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quality vs Last Week
            </div>
            <p className="text-2xl font-bold text-white">{weekComparison.thisQual.toFixed(1)}</p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${weekComparison.diffQuality >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {weekComparison.diffQuality >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {weekComparison.diffQuality >= 0 ? '+' : ''}{weekComparison.diffQuality.toFixed(2)} vs last week
            </div>
          </div>
        </motion.div>
      )}

      {/* History Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Sleep History</h3>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Log Sleep
        </Button>
      </div>

      {/* History List */}
      {sleep.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-violet-400/50" />
            </div>
            <p className="text-gray-400 mb-1">No sleep entries yet</p>
            <p className="text-gray-500 text-sm mb-4">Start tracking your sleep</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Log Your First Sleep
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((entry, i) => {
              const goalMet = entry.duration >= targetHours
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.02] to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg"
                          style={{ boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}
                        >
                          <Moon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white tracking-tight">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </h4>
                            {goalMet && (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-medium">
                                Goal met
                              </span>
                            )}
                            {!goalMet && entry.duration > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-medium">
                                {(targetHours - entry.duration).toFixed(1)}h short
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {formatSleepDuration(entry.duration)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1">
                        {qualityStars(entry.quality, 13)}
                        <span className={`text-xs ml-1 ${qualityColor(entry.quality)}`}>
                          {qualityLabel(entry.quality)}
                        </span>
                      </div>
                      {entry.bedTime && entry.wakeTime && (
                        <span className="text-xs text-gray-500">
                          {entry.bedTime} &rarr; {entry.wakeTime}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${scoreColor(calcSleepScore(entry.duration, entry.quality))}`}>
                        Score: {calcSleepScore(entry.duration, entry.quality)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">
                        &ldquo;{entry.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Log Sleep Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Log Sleep</h3>
              </div>

              <div className="space-y-5">
                {/* Date + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Duration (hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={24}
                      value={formDuration}
                      onChange={e => setFormDuration(e.target.value)}
                      className="glass-input w-full"
                      placeholder="7.5"
                    />
                  </div>
                </div>

                {/* Bed / Wake Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Bed Time</label>
                    <input
                      type="time"
                      value={formBedTime}
                      onChange={e => setFormBedTime(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Wake Time</label>
                    <input
                      type="time"
                      value={formWakeTime}
                      onChange={e => setFormWakeTime(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                {/* Star Quality Selector */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sleep Quality</label>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as const).map(q => (
                      <motion.button
                        key={q}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setFormQuality(q)}
                        className={`flex-1 p-3 rounded-xl text-center transition-all ${
                          formQuality === q
                            ? 'bg-violet-500/20 border border-violet-500/50 shadow-lg shadow-violet-500/10'
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={
                                i < q
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-white/10'
                              }
                            />
                          ))}
                        </div>
                        <span
                          className={`text-[10px] ${
                            formQuality === q ? 'text-violet-400' : 'text-gray-500'
                          }`}
                        >
                          {qualityLabel(q)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Woke up once, room was cold..."
                    className="glass-input w-full resize-none h-20"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={!formDuration}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 font-medium hover:bg-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    Save Entry
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeletingEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">
                Delete Sleep Entry?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Delete entry from{' '}
                {deletingEntry &&
                  new Date(deletingEntry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingEntry(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

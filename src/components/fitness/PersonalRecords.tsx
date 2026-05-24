import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Star, TrendingUp, Trash2, Award, Target,
  Dumbbell, Flame, Calculator, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'

interface PersonalRecord {
  id: string
  exerciseName: string
  weight: number
  reps: number
  date: string
  type: 'weight' | 'reps' | 'volume'
}

const STORAGE_KEY = 'personalRecords'

const defaultForm = {
  exerciseName: '',
  weight: '',
  reps: '',
  date: new Date().toISOString().split('T')[0],
  type: 'weight' as 'weight' | 'reps' | 'volume',
}

function estimateOneRM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

function getBadge(
  record: PersonalRecord,
  allRecords: PersonalRecord[],
): { label: string; cls: string } | null {
  const siblings = allRecords.filter(
    r => r.exerciseName === record.exerciseName && r.type === record.type,
  )
  let isBest = false
  if (record.type === 'weight') {
    isBest = record.weight >= Math.max(...siblings.map(r => r.weight))
  } else if (record.type === 'reps') {
    isBest = record.reps >= Math.max(...siblings.map(r => r.reps))
  } else {
    isBest =
      record.weight * record.reps >=
      Math.max(...siblings.map(r => r.weight * r.reps))
  }
  if (!isBest) return null
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const isRecent = new Date(record.date).getTime() > weekAgo
  return isRecent
    ? {
        label: 'New PR!',
        cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      }
    : {
        label: 'All-Time Best',
        cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      }
}

export function PersonalRecords() {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [chartExercise, setChartExercise] = useState('')
  const [chartMetric, setChartMetric] = useState<'weight' | 'reps' | 'volume'>('weight')
  const [formData, setFormData] = useState(defaultForm)
  const [calcWeight, setCalcWeight] = useState('')
  const [calcReps, setCalcReps] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as PersonalRecord[]
        setRecords(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const exercises = useMemo(
    () => [...new Set(records.map(r => r.exerciseName))].sort(),
    [records],
  )

  useEffect(() => {
    if (exercises.length > 0 && !chartExercise) {
      setChartExercise(exercises[0])
    }
    if (
      exercises.length > 0 &&
      selectedExercise &&
      !exercises.includes(selectedExercise)
    ) {
      setSelectedExercise(null)
    }
  }, [exercises, chartExercise, selectedExercise])

  const groupedRecords = useMemo(
    () =>
      records.reduce(
        (acc, r) => {
          if (!acc[r.exerciseName]) acc[r.exerciseName] = []
          acc[r.exerciseName].push(r)
          return acc
        },
        {} as Record<string, PersonalRecord[]>,
      ),
    [records],
  )

  const chartData = useMemo(
    () =>
      records
        .filter(r => r.exerciseName === chartExercise)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        .map(r => ({
          date: new Date(r.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          }),
          weight: r.weight,
          reps: r.reps,
          volume: r.weight * r.reps,
          estimated1RM: estimateOneRM(r.weight, r.reps),
        })),
    [records, chartExercise],
  )

  const volByExercise = useMemo(
    () =>
      exercises
        .map(ex => ({
          name: ex,
          volume: records
            .filter(r => r.exerciseName === ex)
            .reduce((sum, r) => sum + r.weight * r.reps, 0),
          entries: records.filter(r => r.exerciseName === ex).length,
        }))
        .sort((a, b) => b.volume - a.volume),
    [records, exercises],
  )

  const saveRecord = () => {
    const w = Number(formData.weight)
    const r = Number(formData.reps)
    if (!formData.exerciseName.trim() || w <= 0 || r <= 0) return
    const newRecord: PersonalRecord = {
      id:
        crypto.randomUUID?.() ??
        Math.random().toString(36).substring(2, 15),
      exerciseName: formData.exerciseName.trim(),
      weight: w,
      reps: r,
      date: formData.date,
      type: formData.type,
    }
    const updated = [...records, newRecord]
    setRecords(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setShowModal(false)
    setFormData({ ...defaultForm })
  }

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id)
    setRecords(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const calcResult = useMemo(() => {
    const w = Number(calcWeight)
    const r = Number(calcReps)
    if (w > 0 && r > 0) return { weight: w, reps: r, oneRM: estimateOneRM(w, r) }
    return null
  }, [calcWeight, calcReps])

  const chartMetricKey =
    chartMetric === 'volume'
      ? 'volume'
      : chartMetric === 'reps'
        ? 'reps'
        : 'weight'

  const chartColor =
    chartMetric === 'weight'
      ? '#F59E0B'
      : chartMetric === 'reps'
        ? '#A78BFA'
        : '#10B981'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Personal Records</h2>
          <p className="text-sm text-gray-400">
            Your strongest lifts, all in one place
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCalculator(!showCalculator)}
            className="glass-button px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            1RM
          </motion.button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add PR
          </Button>
        </div>
      </div>

      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
            <p className="text-xs text-amber-400/80 mb-1">Total PRs</p>
            <p className="text-2xl font-bold text-amber-400">{records.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
            <p className="text-xs text-purple-400/80 mb-1">Exercises</p>
            <p className="text-2xl font-bold text-purple-400">{exercises.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
            <p className="text-xs text-emerald-400/80 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-emerald-400">{records.reduce((s, r) => s + r.weight * r.reps, 0).toLocaleString()}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
            <p className="text-xs text-violet-400/80 mb-1">Best 1RM</p>
            <p className="text-2xl font-bold text-violet-400">{Math.max(...records.map(r => estimateOneRM(r.weight, r.reps)))}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-purple-900/10 to-transparent p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                1RM Calculator
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Weight (lbs)"
                type="number"
                placeholder="e.g. 225"
                value={calcWeight}
                onChange={e => setCalcWeight(e.target.value)}
              />
              <Input
                label="Reps"
                type="number"
                placeholder="e.g. 8"
                value={calcReps}
                onChange={e => setCalcReps(e.target.value)}
              />
              <div className="flex flex-col justify-end">
                {calcResult ? (
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">
                      Estimated 1RM
                    </p>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400">
                      {calcResult.oneRM} lbs
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {calcResult.weight} × (1 + {calcResult.reps}/30)
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-700/50 p-3 text-center">
                    <p className="text-xs text-gray-500">
                      Enter weight & reps
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Formula: 1RM = weight × (1 + reps/30) — Epley formula
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {records.length > 0 && exercises.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
              Progress
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 p-0.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
                {(['weight', 'reps', 'volume'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setChartMetric(m)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      chartMetric === m
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {m === 'weight'
                      ? 'Weight'
                      : m === 'reps'
                        ? 'Reps'
                        : 'Volume'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 p-0.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
                {exercises.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setChartExercise(ex)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      chartExercise === ex
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {ex.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="date"
                stroke="#ffffff40"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#ffffff40"
                fontSize={10}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 30, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey={chartMetricKey}
                stroke={chartColor}
                strokeWidth={2.5}
                dot={{ fill: chartColor, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: chartColor }}
                name={
                  chartMetric === 'weight'
                    ? 'Weight (lbs)'
                    : chartMetric === 'reps'
                      ? 'Reps'
                      : 'Volume'
                }
              />
              {chartMetric === 'weight' && (
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  opacity={0.5}
                  name="Est. 1RM"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {volByExercise.length > 1 && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Total Volume by Exercise
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volByExercise} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff08"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#ffffff40"
                fontSize={10}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#ffffff40"
                fontSize={10}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 30, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar
                dataKey="volume"
                fill="url(#volumeGradient)"
                radius={[0, 4, 4, 0]}
              />
              <defs>
                <linearGradient
                  id="volumeGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-purple-900/10 to-transparent p-10 text-center"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full -ml-8 -mb-8 blur-xl" />
          <div className="relative">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Records Yet
            </h3>
            <p className="text-gray-400 mb-1">
              Time to crush some PRs!
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Track your heaviest lifts, rep PRs, and total volume
            </p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First PR
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedRecords).map(([exercise, recs], idx) => {
            const bestWeight = Math.max(...recs.map(r => r.weight))
            const bestReps = Math.max(...recs.map(r => r.reps))
            const bestVolume = Math.max(...recs.map(r => r.weight * r.reps))
            const sorted = [...recs].sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            const latest = sorted[0]
            const hasNewPR = sorted.some(r => {
              const badge = getBadge(r, records)
              return badge?.label === 'New PR!'
            })
            return (
              <motion.button
                key={exercise}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedExercise(exercise)}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-purple-900/10 to-transparent p-5 text-left w-full"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-8 -mt-8 blur-sm" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full -ml-6 -mb-6 blur-sm" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-amber-400" />
                      <h4 className="font-semibold text-white">
                        {exercise}
                      </h4>
                    </div>
                    {hasNewPR && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-emerald-400/30 text-emerald-400">
                        New PR!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Weight
                      </p>
                      <p className="text-sm font-bold text-amber-300">
                        {bestWeight}
                      </p>
                      <p className="text-[10px] text-gray-600">lbs</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Reps
                      </p>
                      <p className="text-sm font-bold text-purple-300">
                        {bestReps}
                      </p>
                      <p className="text-[10px] text-gray-600">max</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Volume
                      </p>
                      <p className="text-sm font-bold text-emerald-300">
                        {bestVolume.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">total</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      {recs.length}{' '}
                      {recs.length === 1 ? 'entry' : 'entries'} · Last{' '}
                      {new Date(latest.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <Target className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise ?? ''}
      >
        {selectedExercise &&
          (() => {
            const exerciseRecs = records
              .filter(r => r.exerciseName === selectedExercise)
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
            const bestWeight = Math.max(...exerciseRecs.map(r => r.weight))
            const bestReps = Math.max(...exerciseRecs.map(r => r.reps))
            const bestVolume = Math.max(
              ...exerciseRecs.map(r => r.weight * r.reps),
            )
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Best Weight
                    </p>
                    <p className="text-lg font-bold text-amber-300">
                      {bestWeight}{' '}
                      <span className="text-xs text-gray-500">lbs</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Best Reps
                    </p>
                    <p className="text-lg font-bold text-purple-300">
                      {bestReps}{' '}
                      <span className="text-xs text-gray-500">reps</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Best Volume
                    </p>
                    <p className="text-lg font-bold text-emerald-300">
                      {bestVolume.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {exerciseRecs.map((r, i) => {
                    const badge = getBadge(r, records)
                    const volume = r.weight * r.reps
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="relative flex items-center gap-3 rounded-xl border border-gray-700/30 bg-gray-800/30 p-3 group hover:border-gray-600/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">
                              {new Date(r.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                              })}
                            </span>
                            {badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-amber-300 font-medium">
                              {r.weight} lbs
                            </span>
                            <span className="text-gray-600">&times;</span>
                            <span className="text-purple-300 font-medium">
                              {r.reps} reps
                            </span>
                            <span className="text-gray-500">&middot;</span>
                            <span className="text-emerald-300 font-medium">
                              {volume.toLocaleString()} vol
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            deleteRecord(r.id)
                          }}
                          className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setFormData({ ...defaultForm })
        }}
        title="Add Personal Record"
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="e.g., Bench Press"
            value={formData.exerciseName}
            onChange={e =>
              setFormData({ ...formData, exerciseName: e.target.value })
            }
            list="exercise-list"
          />
          <datalist id="exercise-list">
            {exercises.map(ex => (
              <option key={ex} value={ex} />
            ))}
          </datalist>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Weight (lbs)"
              type="number"
              placeholder="0"
              value={formData.weight}
              onChange={e =>
                setFormData({ ...formData, weight: e.target.value })
              }
              icon={<Dumbbell className="w-4 h-4" />}
            />
            <Input
              label="Reps"
              type="number"
              placeholder="0"
              value={formData.reps}
              onChange={e =>
                setFormData({ ...formData, reps: e.target.value })
              }
              icon={<Flame className="w-4 h-4" />}
            />
          </div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={e =>
              setFormData({ ...formData, date: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Record Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'weight' as const, label: 'Weight PR', icon: Award },
                { value: 'reps' as const, label: 'Reps PR', icon: Star },
                { value: 'volume' as const, label: 'Volume PR', icon: Flame },
              ]).map(({ value, label, icon: Icon }) => {
                const isActive = formData.type === value
                const borderCls = isActive
                  ? value === 'weight'
                    ? 'border-amber-500/50 bg-amber-500/20'
                    : value === 'reps'
                      ? 'border-purple-500/50 bg-purple-500/20'
                      : 'border-emerald-500/50 bg-emerald-500/20'
                  : 'border-gray-700/50 bg-gray-800/30'
                const iconCls = isActive
                  ? value === 'weight'
                    ? 'text-amber-400'
                    : value === 'reps'
                      ? 'text-purple-400'
                      : 'text-emerald-400'
                  : 'text-gray-500'
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: value })
                    }
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-all ${borderCls} ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:border-gray-600/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${iconCls}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Button variant="primary" onClick={saveRecord} className="w-full">
            <Trophy className="w-4 h-4 mr-1.5" />
            Save Record
          </Button>
        </div>
      </Modal>
    </div>
  )
}

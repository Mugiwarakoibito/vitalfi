import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy, Plus, Star, TrendingUp, Award, X,
  Dumbbell, Flame, BarChart3, Activity,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { useAppStore } from '@/store/useAppStore'

interface PR {
  id: string
  exerciseName: string
  weight: number
  reps: number
  date: string
  type: 'weight' | 'reps' | 'volume'
}

const STORAGE_KEY = 'vitalfi_progress_records'
const CONFETTI_COLORS = ['#F59E0B', '#A78BFA', '#10B981', '#EF4444', '#3B82F6']

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([])
  useEffect(() => {
    if (active) {
      const p = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
      }))
      setParticles(p)
      const timer = setTimeout(() => setParticles([]), 2000)
      return () => clearTimeout(timer)
    }
    setParticles([])
  }, [active])
  if (particles.length === 0) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id} initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0 }}
          animate={{ opacity: 0, y: '100vh', rotate: 720 }}
          transition={{ duration: 1.5 + p.delay, ease: 'easeIn' }}
          className="absolute" style={{ left: `${p.x}%`, top: -10 }}>
          <div className="rounded-sm" style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: '2px' }} />
        </motion.div>
      ))}
    </div>
  )
}

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function Progress() {
  const { workouts, bodyMetrics } = useAppStore()
  const [records, setRecords] = useState<PR[]>([])
  const [showModal, setShowModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [justAdded, setJustAdded] = useState('')
  const [formData, setFormData] = useState({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight' as 'weight' | 'reps' | 'volume' })
  const [chartMetric, setChartMetric] = useState<'weight' | 'reps' | 'volume'>('weight')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecords(JSON.parse(stored))
    } catch {}
  }, [])

  const exercises = useMemo(() => [...new Set(records.map(r => r.exerciseName))].sort(), [records])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  // Body weight trend from actual data
  const bodyWeightData = useMemo(() => {
    return [...bodyMetrics]
      .filter((m: any) => m.weight)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m: any) => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
      }))
  }, [bodyMetrics])

  // Workout volume trend
  const volumeTrend = useMemo(() => {
    const sorted = [...workouts].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.slice(-20).map((w: any) => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: w.exercises?.reduce((s: number, ex: any) => s + ex.sets.reduce((st: number, set: any) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0,
      name: w.name,
    }))
  }, [workouts])

  // PRs from workouts
  const autoPRs = useMemo(() => {
    const prs: { exercise: string; weight: number; reps: number; volume: number; date: string }[] = []
    workouts.forEach((w: any) => {
      w.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((set: any) => {
          if (set.weight && set.completed !== false) {
            const vol = (set.weight || 0) * (set.reps || 0)
            prs.push({ exercise: ex.name, weight: set.weight, reps: set.reps || 0, volume: vol, date: w.date })
          }
        })
      })
    })
    return prs
  }, [workouts])

  const totalVolume = useMemo(() =>
    workouts.reduce((s: number, w: any) => s + (w.exercises?.reduce((se: number, ex: any) => se + ex.sets.reduce((st: number, set: any) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0), 0),
    [workouts]
  )

  const best1RM = useMemo(() => {
    if (records.length === 0) return 0
    return Math.max(...records.map(r => estimate1RM(r.weight, r.reps)))
  }, [records])

  const chartData = useMemo(() =>
    records.filter(r => r.exerciseName === (exercises[0] || ''))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        weight: r.weight, reps: r.reps, volume: r.weight * r.reps, estimated1RM: estimate1RM(r.weight, r.reps),
      })),
    [records, exercises]
  )

  const saveRecord = () => {
    const w = Number(formData.weight); const r = Number(formData.reps)
    if (!formData.exerciseName.trim() || w <= 0 || r <= 0) return
    const newRecord: PR = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      exerciseName: formData.exerciseName.trim(), weight: w, reps: r, date: formData.date, type: formData.type,
    }
    setRecords(prev => [...prev, newRecord])
    setShowModal(false)
    setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight' })
    setConfettiTrigger(prev => prev + 1)
    setJustAdded(`${formData.exerciseName} — ${w}lbs × ${r} reps`)
    setTimeout(() => setJustAdded(''), 3000)
  }

  return (
    <div className="space-y-6">
      <Confetti active={confettiTrigger > 0} />

      {justAdded && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-amber-500/10 p-4 shadow-lg shadow-emerald-500/10">
          <div className="relative flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-sm font-bold text-white">New PR! {justAdded}</p>
            <button onClick={() => setJustAdded('')} className="ml-auto p-1 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Progress</h2>
          <p className="text-sm text-gray-400 mt-0.5">PRs, body trends & workout analytics</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />Add PR
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] to-transparent p-5 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-lg" />
          <div className="relative">
            <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider mb-1">Total PRs</p>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{records.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.12] to-transparent p-5 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-lg" />
          <div className="relative">
            <p className="text-xs text-purple-400/80 font-medium uppercase tracking-wider mb-1">Best 1RM</p>
            <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{best1RM} <span className="text-sm font-normal text-gray-500">lbs</span></p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] to-transparent p-5 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-lg" />
          <div className="relative">
            <p className="text-xs text-emerald-400/80 font-medium uppercase tracking-wider mb-1">Total Volume</p>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.12] to-transparent p-5 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full -mr-10 -mt-10 blur-lg" />
          <div className="relative">
            <p className="text-xs text-sky-400/80 font-medium uppercase tracking-wider mb-1">Body Logs</p>
            <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">{bodyMetrics.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume Trend */}
        {volumeTrend.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Workout Volume</h4>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Body Weight Trend */}
        {bodyWeightData.length > 1 && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Body Weight</h4>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyWeightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* PR Progress Chart */}
      {records.length > 0 && exercises.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />PR Progress
            </h4>
            <div className="flex gap-1">
              {(['weight', 'reps', 'volume'] as const).map(m => (
                <button key={m} onClick={() => setChartMetric(m)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${chartMetric === m ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey={chartMetric} stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} activeDot={{ r: 6 }} />
                {chartMetric === 'weight' && (
                  <Line type="monotone" dataKey="estimated1RM" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} opacity={0.5} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Auto PRs from Workouts */}
      {autoPRs.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-black/40 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Lifts (from workouts)</h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {autoPRs.slice(-20).reverse().map((pr, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2 text-xs">
                <Dumbbell className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="text-gray-400 font-medium min-w-[100px]">{pr.exercise}</span>
                <span className="text-amber-300 font-semibold">{pr.weight}lbs</span>
                <span className="text-gray-600">×</span>
                <span className="text-purple-300 font-semibold">{pr.reps} reps</span>
                <span className="text-gray-600 ml-auto">{new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PR Cards */}
      {records.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-10 text-center">
          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">No Records Yet</h3>
          <p className="text-gray-400 mb-1">Time to crush some PRs!</p>
          <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-1.5" />Add Your First PR
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...new Set(records.map(r => r.exerciseName))].sort().map((exercise, idx) => {
            const recs = records.filter(r => r.exerciseName === exercise)
            const bestW = Math.max(...recs.map(r => r.weight))
            const bestR = Math.max(...recs.map(r => r.reps))
            const bestV = Math.max(...recs.map(r => r.weight * r.reps))
            return (
              <motion.div key={exercise} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5 text-left w-full">
                <div className="relative">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-amber-400" />{exercise}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Weight</p>
                      <p className="text-sm font-bold text-amber-300">{bestW}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Reps</p>
                      <p className="text-sm font-bold text-purple-300">{bestR}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Volume</p>
                      <p className="text-sm font-bold text-emerald-300">{bestV.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add PR Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Personal Record">
        <div className="space-y-4">
          <Input label="Exercise" placeholder="e.g., Bench Press" value={formData.exerciseName}
            onChange={e => setFormData({ ...formData, exerciseName: e.target.value })}
            list="exercise-list" icon={<Dumbbell className="w-4 h-4" />} />
          <datalist id="exercise-list">{exercises.map(ex => <option key={ex} value={ex} />)}</datalist>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Weight (lbs)" type="number" placeholder="0" value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })} />
            <Input label="Reps" type="number" placeholder="0" value={formData.reps}
              onChange={e => setFormData({ ...formData, reps: e.target.value })} />
          </div>
          <Input label="Date" type="date" value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })} />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([{ value: 'weight', label: 'Weight PR', icon: Award }, { value: 'reps', label: 'Reps PR', icon: Star }, { value: 'volume', label: 'Volume PR', icon: Flame }] as const).map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setFormData({ ...formData, type: value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    formData.type === value
                      ? value === 'weight' ? 'border-amber-500/50 bg-amber-500/20' : value === 'reps' ? 'border-purple-500/50 bg-purple-500/20' : 'border-emerald-500/50 bg-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  } ${formData.type === value ? 'text-white' : 'text-gray-400'}`}>
                  <Icon className={`w-5 h-5 ${formData.type === value ? 'text-inherit' : 'text-gray-500'}`} />
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" onClick={saveRecord} className="w-full">
            <Trophy className="w-4 h-4 mr-1.5" />Save Record
          </Button>
        </div>
      </Modal>
    </div>
  )
}

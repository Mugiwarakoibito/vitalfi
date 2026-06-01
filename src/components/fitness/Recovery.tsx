import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Activity, Droplets, Plus, Trash2, X, AlertTriangle,
  CalendarDays, TrendingUp, Settings, Check, RefreshCw,
  ArrowUp, ArrowDown, Flame, Award, Download, Thermometer, ChevronRight,
  Clock, Sparkles, Pill, Moon, Upload,
  BarChart3, Star, Gift, Medal, Trophy,
} from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { generateId, cn } from '@/lib/utils'

interface RecoveryEntry {
  id: string; date: string
  energy: number; soreness: number; stress: number; mood: number; sleepQuality: number
  domsAreas: string[]
  domsSeverity?: Record<string, 'mild' | 'moderate' | 'severe'>
  hrv?: number; rhr?: number; bodyTemp?: number
  trainingLoad?: number
  recoveryProtocol?: string
  bodyWeight?: number
  notes?: string; journal?: string; createdAt: string
}

interface HydrationEntry {
  id: string; date: string; amount: number; timestamp: string
  note?: string; createdAt: string; updatedAt: string
}

const MUSCLE_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
]

const RECOVERY_PROTOCOLS = [
  'Active Recovery', 'Stretching', 'Foam Rolling', 'Ice Bath', 'Sauna',
  'Massage', 'Compression', 'Nap', 'Meditation', 'Yoga',
]

const ACCENT_COLORS = [
  { name: 'emerald', hex: '#10b981', from: 'from-emerald-500', ring: 'ring-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { name: 'cyan', hex: '#06b6d4', from: 'from-cyan-500', ring: 'ring-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { name: 'violet', hex: '#a855f7', from: 'from-violet-500', ring: 'ring-violet-500', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30' },
  { name: 'rose', hex: '#f43f5e', from: 'from-rose-500', ring: 'ring-rose-500', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  { name: 'amber', hex: '#f59e0b', from: 'from-amber-500', ring: 'ring-amber-500', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  { name: 'sky', hex: '#0ea5e9', from: 'from-sky-500', ring: 'ring-sky-500', bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/30' },
]

const ACHIEVEMENTS = [
  { id: 'first_log', label: 'First Step', icon: Star, desc: 'Logged your first recovery entry', check: (e: RecoveryEntry[]) => e.length >= 1 },
  { id: 'week_streak', label: 'Consistent', icon: Gift, desc: '7-day logging streak', check: (e: RecoveryEntry[]) => getStreak(e) >= 7 },
  { id: 'two_week_streak', label: 'Dedicated', icon: Medal, desc: '14-day logging streak', check: (e: RecoveryEntry[]) => getStreak(e) >= 14 },
  { id: 'month_streak', label: 'Legend', icon: Trophy, desc: '30-day logging streak', check: (e: RecoveryEntry[]) => getStreak(e) >= 30 },
  { id: 'perfect_week', label: 'Perfect Week', icon: Award, desc: '7 entries in 7 days', check: (e: RecoveryEntry[]) => { const w = e.filter(en => { const d = new Date(en.date); const wa = new Date(); wa.setDate(wa.getDate() - 7); return d >= wa }); return w.length >= 7 } },
  { id: 'peak_day', label: 'Peak Performance', icon: Trophy, desc: 'Achieved a 100 readiness score', check: (e: RecoveryEntry[]) => e.some(en => getReadiness(en.energy, en.soreness, en.stress, en.mood).score === 100) },
  { id: 'protocol_master', label: 'Protocol Master', icon: Pill, desc: 'Used 5+ different recovery protocols', check: (e: RecoveryEntry[]) => new Set(e.filter(en => en.recoveryProtocol).map(en => en.recoveryProtocol)).size >= 5 },
  { id: 'doms_tracker', label: 'Body Aware', icon: Activity, desc: 'Tracked DOMS 10+ times', check: (e: RecoveryEntry[]) => e.filter(en => en.domsAreas.length > 0).length >= 10 },
]

const STORAGE_KEY = 'vitalfi_recovery_entries'
const SETTINGS_KEY = 'vitalfi_recovery_settings'
const DEFAULT_HYDRATION_GOAL = 2500

interface RecoverySettings {
  hydrationGoal: number
  energyTarget: number; stressTarget: number; sorenessTarget: number; moodTarget: number; sleepQualityTarget: number
  enablePrediction: boolean; domsEnabled: boolean
  unit: 'ml' | 'oz'
  quickWaterAmounts: number[]
  readinessWeights: { energy: number; soreness: number; stress: number; mood: number }
  accentColor: string
  sleepNeed: number
  chronotype: 'morning' | 'evening' | 'neither'
  weeklyEntryGoal: number
  enableHRV: boolean; enableRHR: boolean; enableTrainingLoad: boolean; enableBodyWeight: boolean; enableProtocols: boolean
  enableBodyTemp: boolean; enableSleepDebt: boolean; compactMode: boolean; chartType: 'bar' | 'area'; reminderTime: string
  defaultEnergy: number; defaultSoreness: number; defaultStress: number; defaultMood: number; defaultSleepQuality: number
  showJournal: boolean
  tempUnit: '°C' | '°F'
  weightUnit: 'kg' | 'lbs'
  formulaPreset: 'balanced' | 'energy' | 'recovery' | 'custom'
}

function getStreak(entries: RecoveryEntry[]): number {
  let streak = 0; const d = new Date()
  while (streak < 365) {
    const ds = d.toISOString().split('T')[0]
    if (!entries.find(e => e.date === ds)) break
    streak++; d.setDate(d.getDate() - 1)
  }
  return streak
}

function loadSettings(): RecoverySettings {
  try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) return { ...defaultSettings(), ...JSON.parse(raw) } } catch {}
  return defaultSettings()
}

function defaultSettings(): RecoverySettings {
  return {
    hydrationGoal: DEFAULT_HYDRATION_GOAL, energyTarget: 7, stressTarget: 5, sorenessTarget: 5, moodTarget: 4, sleepQualityTarget: 4,
    enablePrediction: true, domsEnabled: true,
    unit: 'ml', quickWaterAmounts: [100, 250, 500, 750, 1000],
    readinessWeights: { energy: 30, soreness: 25, stress: 25, mood: 20 },
    accentColor: 'emerald', sleepNeed: 8, chronotype: 'neither', weeklyEntryGoal: 5,
    enableHRV: false, enableRHR: false, enableTrainingLoad: false, enableBodyWeight: false, enableProtocols: false,
    enableBodyTemp: false, enableSleepDebt: false, compactMode: false, chartType: 'bar', reminderTime: '',
    defaultEnergy: 7, defaultSoreness: 3, defaultStress: 4, defaultMood: 4, defaultSleepQuality: 4,
    showJournal: true,
    tempUnit: '°C',
    weightUnit: 'kg',
    formulaPreset: 'balanced',
  }
}

function loadEntries(): RecoveryEntry[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function getReadiness(energy: number, soreness: number, stress: number, mood: number, weights?: { energy: number; soreness: number; stress: number; mood: number }): { score: number; label: string; color: string } {
  const w = weights || { energy: 30, soreness: 25, stress: 25, mood: 20 }
  const totalW = w.energy + w.soreness + w.stress + w.mood || 1
  const eScore = (energy / 10) * (w.energy / totalW) * 100
  const soScore = Math.max(0, (1 - soreness / 10)) * (w.soreness / totalW) * 100
  const stScore = Math.max(0, (1 - stress / 10)) * (w.stress / totalW) * 100
  const mScore = (mood / 5) * (w.mood / totalW) * 100
  const total = Math.round(Math.min(100, Math.max(0, eScore + soScore + stScore + mScore)))
  const label = total >= 85 ? 'Peak' : total >= 70 ? 'Ready' : total >= 50 ? 'Fair' : total >= 30 ? 'Tired' : 'Exhausted'
  const color = total >= 85 ? '#10b981' : total >= 70 ? '#06b6d4' : total >= 50 ? '#f59e0b' : total >= 30 ? '#f97316' : '#ef4444'
  return { score: total, label, color }
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#06b6d4'
  if (score >= 50) return '#f59e0b'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

function getProtocolEffectiveness(entries: RecoveryEntry[]): { protocol: string; avgReadiness: number; count: number }[] {
  const protocolMap = new Map<string, { totalReadiness: number; count: number }>()
  const noProtocol = { totalReadiness: 0, count: 0 }
  entries.forEach(e => {
    const r = getReadiness(e.energy, e.soreness, e.stress, e.mood)
    if (e.recoveryProtocol) {
      const existing = protocolMap.get(e.recoveryProtocol) || { totalReadiness: 0, count: 0 }
      existing.totalReadiness += r.score; existing.count++
      protocolMap.set(e.recoveryProtocol, existing)
    } else {
      noProtocol.totalReadiness += r.score; noProtocol.count++
    }
  })
  const results = Array.from(protocolMap.entries())
    .filter(([_, data]) => data.count >= 2)
    .map(([protocol, data]) => ({ protocol, avgReadiness: Math.round(data.totalReadiness / data.count), count: data.count }))
    .sort((a, b) => b.avgReadiness - a.avgReadiness)
  if (noProtocol.count >= 2) results.push({ protocol: 'No protocol', avgReadiness: Math.round(noProtocol.totalReadiness / noProtocol.count), count: noProtocol.count })
  return results
}

function getAchievements(entries: RecoveryEntry[]): { id: string; label: string; icon: React.ElementType; desc: string; earned: boolean }[] {
  return ACHIEVEMENTS.map(a => ({ ...a, earned: a.check(entries) }))
}

function getSleepDebt(entries: RecoveryEntry[], sleepNeed: number): number {
  let debt = 0
  entries.forEach(e => {
    const sleepHours = e.sleepQuality * 1.6
    debt += Math.max(0, sleepNeed - sleepHours)
  })
  return Math.round(debt * 10) / 10
}

function DomsBodyMap({ domsSeverity, domsAreas, onToggle, readonly = false }: {
  domsSeverity: Record<string, 'mild' | 'moderate' | 'severe'>
  domsAreas: string[]
  onToggle: (area: string) => void
  readonly?: boolean
}) {
  const getColor = (area: string): string => {
    if (!domsAreas.includes(area)) return '#1e293b'
    const sev = domsSeverity[area]
    if (sev === 'severe') return '#be123c'
    if (sev === 'moderate') return '#d97706'
    return '#047857'
  }
  const getGlow = (area: string) => domsAreas.includes(area) ? `drop-shadow(0 0 ${domsSeverity[area] === 'severe' ? '8px #be123c' : domsSeverity[area] === 'moderate' ? '6px #d97706' : '4px #047857'})` : undefined
  const clickableProps = !readonly ? { className: 'cursor-pointer', whileHover: { scale: 1.08 }, whileTap: { scale: 0.92 }, onClick: (a: string) => onToggle(a) } as any : {}
  return (
    <svg viewBox="0 0 200 380" className="w-full max-w-[160px] mx-auto">
      <defs><radialGradient id="headG"><stop offset="0%" stopColor="#475569" /><stop offset="100%" stopColor="#334155" /></radialGradient></defs>
      <motion.g whileHover={!readonly ? { scale: 1.02 } : undefined}>
        <ellipse cx="100" cy="40" rx="28" ry="32" fill="url(#headG)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <ellipse cx="100" cy="42" rx="12" ry="6" fill="#1e293b" />
        <ellipse cx="94" cy="38" rx="2" ry="2.5" fill="#0f172a" />
        <ellipse cx="106" cy="38" rx="2" ry="2.5" fill="#0f172a" />
        <path d="M95 46 Q100 49 105 46" fill="none" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
      </motion.g>
      <motion.g whileHover={!readonly ? { scale: 1.02 } : undefined}>
        <path d="M74 72 Q74 65 80 65 L120 65 Q126 65 126 72 L126 140 Q126 146 120 146 L80 146 Q74 146 74 140 Z" fill="#334155" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </motion.g>
      {(['Chest', 'Shoulders', 'Core'] as const).map(area => {
        const p: Record<string, { x: number; y: number; w: number; h: number }> = { Shoulders: { x: 74, y: 67, w: 52, h: 22 }, Chest: { x: 78, y: 89, w: 44, h: 28 }, Core: { x: 80, y: 118, w: 40, h: 28 } }
        const pos = p[area]; if (!pos) return null
        return <motion.rect key={area} x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={8} fill={getColor(area)} fillOpacity={domsAreas.includes(area) ? 0.6 : 0} stroke={domsAreas.includes(area) ? getColor(area) : 'transparent'} strokeWidth={1.5} style={{ filter: getGlow(area) }} {...clickableProps} />
      })}
      <motion.g whileHover={!readonly ? { scale: 1.02 } : undefined}>
        <ellipse cx="100" cy="155" rx="24" ry="12" fill="#475569" fillOpacity={0.3} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </motion.g>
      {(['Biceps', 'Triceps'] as const).map(area => {
        const p: Record<string, { path: string }> = { Biceps: { path: 'M74 72 Q60 100 58 142 L70 142 Q72 100 80 72 Z' }, Triceps: { path: 'M126 72 Q140 100 142 142 L130 142 Q128 100 120 72 Z' } }
        const pos = p[area]; if (!pos) return null
        return <motion.path key={area} d={pos.path} fill={getColor(area)} fillOpacity={domsAreas.includes(area) ? 0.6 : 0} stroke={domsAreas.includes(area) ? getColor(area) : 'transparent'} strokeWidth={1.5} style={{ filter: getGlow(area) }} {...clickableProps} />
      })}
      {(['Quads', 'Hamstrings', 'Glutes', 'Calves'] as const).map(area => {
        const p: Record<string, { path: string }> = { Quads: { path: 'M78 162 Q72 200 72 260 L88 260 Q88 200 90 162 Z' }, Hamstrings: { path: 'M122 162 Q128 200 128 260 L112 260 Q112 200 110 162 Z' }, Glutes: { path: 'M78 162 Q84 175 100 175 Q116 175 122 162 L118 155 L82 155 Z' }, Calves: { path: 'M76 265 Q74 300 76 330 L90 330 Q88 300 88 270 Z' } }
        const pos = p[area]; if (!pos) return null
        return <motion.path key={area} d={pos.path} fill={getColor(area)} fillOpacity={domsAreas.includes(area) ? 0.6 : 0} stroke={domsAreas.includes(area) ? getColor(area) : 'transparent'} strokeWidth={1.5} style={{ filter: getGlow(area) }} {...clickableProps} />
      })}
    </svg>
  )
}

function BioSparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1
  const points = data.map((v, i) => { const x = (i / (data.length - 1)) * 100; const y = height - ((v - min) / range) * height; return `${x},${y}` }).join(' ')
  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs><linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={1} /></linearGradient></defs>
      <polyline points={points} fill="none" stroke={`url(#sg-${color.replace('#', '')})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
      {data.map((v, i) => <circle key={i} cx={(i / (data.length - 1)) * 100} cy={height - ((v - min) / range) * height} r={i === data.length - 1 ? 3 : 1.5} fill={i === data.length - 1 ? color : `${color}60`} />)}
    </svg>
  )
}

function WaterGlass({ progress }: { progress: number }) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  return (
    <div className="relative w-16 h-24 shrink-0">
      <div className="absolute inset-0 rounded-b-2xl rounded-t-lg border-2 border-cyan-500/25 overflow-hidden bg-slate-900/60">
        <motion.div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/45 via-cyan-400/25 to-transparent"
          initial={{ height: '0%' }} animate={{ height: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 14 }}
        >
          <motion.div className="absolute -top-[2px] left-0 right-0 h-[4px] bg-cyan-400/30 rounded-full blur-[1px]"
            animate={{ x: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </div>
      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-10 h-1 rounded-sm border border-cyan-500/15" />
      {pct > 60 && (
        <motion.div className="absolute top-[10%] left-[30%] w-1 h-1 rounded-full bg-cyan-300/20"
          animate={{ y: [-2, -8, -2], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
      )}
      {pct > 40 && (
        <motion.div className="absolute top-[20%] right-[35%] w-[3px] h-[3px] rounded-full bg-cyan-300/15"
          animate={{ y: [0, -6, 0], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      )}
    </div>
  )
}

export function Recovery() {
  const { hydration, addHydration } = useAppStore()
  const [settings, setSettings] = useState<RecoverySettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [entries, setEntries] = useState<RecoveryEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    energy: loadSettings().defaultEnergy, soreness: loadSettings().defaultSoreness,
    stress: loadSettings().defaultStress, mood: loadSettings().defaultMood, sleepQuality: loadSettings().defaultSleepQuality,
    domsAreas: [] as string[], domsSeverity: {} as Record<string, 'mild' | 'moderate' | 'severe'>,
    hrv: '', rhr: '', bodyTemp: '', trainingLoad: 5, recoveryProtocol: '', bodyWeight: '',
    notes: '', journal: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<RecoveryEntry | null>(null)
  const [waterAmount, setWaterAmount] = useState('')
  const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<'' | 'success' | 'error'>('')
  const [showHydrationPanel, setShowHydrationPanel] = useState(false)
  const [showTrendsPanel, setShowTrendsPanel] = useState(false)
  const [showBodyPanel, setShowBodyPanel] = useState(false)
  const [showAchievementsPanel, setShowAchievementsPanel] = useState(false)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) }, [entries])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

  const HYDRATION_GOAL = settings.hydrationGoal
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = useMemo(() => entries.find(e => e.date === today), [entries, today])
  const weights = settings.readinessWeights

  const getWeekDays = useCallback((daysBack: number, entriesList: RecoveryEntry[]) => {
    const days: { date: string; label: string; readiness: number; energy: number; soreness: number; stress: number; mood: number; sleepQuality: number; trainingLoad: number; hrv: number }[] = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const entry = entriesList.find(e => e.date === ds)
      days.push({
        date: ds, label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        readiness: entry ? getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood, weights).score : 0,
        energy: entry?.energy || 0, soreness: entry?.soreness || 0, stress: entry?.stress || 0, mood: entry?.mood || 0,
        sleepQuality: entry?.sleepQuality || 0, trainingLoad: entry?.trainingLoad || 0, hrv: entry?.hrv || 0,
      })
    }
    return days
  }, [weights])

  const recentDays = useMemo(() => getWeekDays(trendDays, entries), [trendDays, entries, getWeekDays])
  const recentWeek = useMemo(() => getWeekDays(7, entries), [entries, getWeekDays])

  const priorWeek = useMemo(() => {
    const days: number[] = []
    for (let i = 13; i >= 7; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const entry = entries.find(e => e.date === ds)
      if (entry) days.push(getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood, weights).score)
    }
    return days
  }, [entries, weights])

  const avgReadiness = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0)
    return vals.length > 0 ? Math.round(vals.reduce((s, d) => s + d.readiness, 0) / vals.length) : 0
  }, [recentWeek])

  const priorAvgReadiness = useMemo(() => priorWeek.length > 0 ? Math.round(priorWeek.reduce((s, v) => s + v, 0) / priorWeek.length) : null, [priorWeek])

  const readinessTrend = useMemo(() => {
    if (priorAvgReadiness === null) return null
    const diff = avgReadiness - priorAvgReadiness
    return { diff, arrow: diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat' as const }
  }, [avgReadiness, priorAvgReadiness])

  const bestReadinessDay = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0)
    return vals.length > 0 ? vals.reduce((b, d) => d.readiness > b.readiness ? d : b, vals[0]) : null
  }, [recentWeek])

  const worstReadinessDay = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0)
    return vals.length > 0 ? vals.reduce((w, d) => d.readiness < w.readiness ? d : w, vals[0]) : null
  }, [recentWeek])

  const readinessPrediction = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0).map(d => d.readiness)
    if (vals.length === 0) return null
    const predicted = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    const todaySleep = todayEntry?.sleepQuality ?? 0
    const avgSleep = recentWeek.filter(d => d.sleepQuality > 0).reduce((s, d) => s + d.sleepQuality, 0) / Math.max(recentWeek.filter(d => d.sleepQuality > 0).length, 1)
    const adjustment = todaySleep > 0 && todaySleep < avgSleep ? -Math.round((avgSleep - todaySleep) * 5) : 0
    const confidence = Math.min(90, Math.round(vals.length / 7 * 100))
    return { value: Math.max(0, Math.min(100, predicted + adjustment)), confidence }
  }, [recentWeek, todayEntry])

  const todayHydration = useMemo(() => hydration.filter((h: HydrationEntry) => h.date === today).reduce((s: number, h: HydrationEntry) => s + h.amount, 0), [hydration, today])
  const todayHydrationProgress = useMemo(() => Math.min(todayHydration / HYDRATION_GOAL, 1), [todayHydration, HYDRATION_GOAL])

  const hydrationWeek = useMemo(() => {
    const days: { date: string; label: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const total = hydration.filter((h: HydrationEntry) => h.date === ds).reduce((s: number, h: HydrationEntry) => s + h.amount, 0)
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), amount: total })
    }
    return days
  }, [hydration])

  const avgHydration = useMemo(() => {
    const daysWithData = hydrationWeek.filter(d => d.amount > 0)
    return daysWithData.length > 0 ? Math.round(daysWithData.reduce((s, d) => s + d.amount, 0) / daysWithData.length) : 0
  }, [hydrationWeek])

  const todayReadiness = todayEntry ? getReadiness(todayEntry.energy, todayEntry.soreness, todayEntry.stress, todayEntry.mood, weights) : null
  const protocolEffectiveness = useMemo(() => getProtocolEffectiveness(entries), [entries])
  const achievements = useMemo(() => getAchievements(entries), [entries])
  const earnedCount = useMemo(() => achievements.filter(a => a.earned).length, [achievements])
  const sleepDebt = useMemo(() => settings.enableSleepDebt ? getSleepDebt(entries, settings.sleepNeed) : 0, [entries, settings.sleepNeed, settings.enableSleepDebt])

  const loggingStreak = useMemo(() => {
    if (entries.length === 0) return 0
    let streak = 0; const d = new Date()
    while (streak < 365) {
      const ds = d.toISOString().split('T')[0]
      if (!entries.find(e => e.date === ds)) break
      streak++; d.setDate(d.getDate() - 1)
    }
    return streak
  }, [entries])

  const hydrationStreak = useMemo(() => {
    let streak = 0; const d = new Date()
    while (streak < 365) {
      const ds = d.toISOString().split('T')[0]
      const total = hydration.filter((h: HydrationEntry) => h.date === ds).reduce((s: number, h: HydrationEntry) => s + h.amount, 0)
      if (total < HYDRATION_GOAL - 100) break
      streak++; d.setDate(d.getDate() - 1)
    }
    return streak
  }, [hydration, HYDRATION_GOAL])

  const todayHydrationLogs = useMemo(() => {
    return [...hydration].filter((h: HydrationEntry) => h.date === today)
      .sort((a: HydrationEntry, b: HydrationEntry) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [hydration, today])

  const hrvTrend = useMemo(() => entries.filter(e => e.hrv).slice(0, 14).reverse().map(e => e.hrv!), [entries])
  const rhrTrend = useMemo(() => entries.filter(e => e.rhr).slice(0, 14).reverse().map(e => e.rhr!), [entries])
  const bodyTempTrend = useMemo(() => entries.filter(e => e.bodyTemp).slice(0, 14).reverse().map(e => e.bodyTemp!), [entries])

  const domsTrend = useMemo(() => {
    return entries.slice(0, 14).reverse().map(e => {
      const score = e.domsAreas.reduce((s, a) => { const sev = e.domsSeverity?.[a]; return s + (sev === 'severe' ? 3 : sev === 'moderate' ? 2 : 1) }, 0)
      return { date: e.date, domsScore: score, areaCount: e.domsAreas.length }
    })
  }, [entries])

  const sleepReadinessData = useMemo(() => {
    return entries.slice(0, 14).reverse().map(e => {
      const r = getReadiness(e.energy, e.soreness, e.stress, e.mood, weights)
      return { date: e.date, sleepQuality: e.sleepQuality, readiness: r.score, sleepLabel: `Q${e.sleepQuality}` }
    })
  }, [entries, weights])

  const weeklyComparison = useMemo(() => {
    const thisWeekEntries = entries.filter(e => { const d = new Date(e.date); const wa = new Date(); wa.setDate(wa.getDate() - 7); return d >= wa })
    const lastWeekEntries = entries.filter(e => { const d = new Date(e.date); const wa = new Date(); wa.setDate(wa.getDate() - 14); const wb = new Date(); wb.setDate(wb.getDate() - 7); return d >= wb && d < wa })
    const avg = (arr: RecoveryEntry[], key: 'energy' | 'soreness' | 'stress' | 'mood') => {
      const vals = arr.filter(e => e[key] > 0).map(e => e[key])
      return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null
    }
    return {
      energy: { this: avg(thisWeekEntries, 'energy'), last: avg(lastWeekEntries, 'energy') },
      soreness: { this: avg(thisWeekEntries, 'soreness'), last: avg(lastWeekEntries, 'soreness') },
      stress: { this: avg(thisWeekEntries, 'stress'), last: avg(lastWeekEntries, 'stress') },
      mood: { this: avg(thisWeekEntries, 'mood'), last: avg(lastWeekEntries, 'mood') },
    }
  }, [entries])

  const hUnit = (ml: number) => settings.unit === 'oz' ? Math.round(ml / 29.57) : ml
  const hLabel = settings.unit
  const displayTemp = (temp: number) => settings.tempUnit === '°F' ? Math.round(temp * 9 / 5 + 32) : temp
  const displayWeight = (weight: number) => settings.weightUnit === 'lbs' ? Math.round(weight * 2.20462 * 10) / 10 : weight

  const saveEntry = () => {
    const entry: RecoveryEntry = {
      id: generateId(), date: today,
      energy: formData.energy, soreness: formData.soreness, stress: formData.stress,
      mood: formData.mood, sleepQuality: formData.sleepQuality,
      domsAreas: formData.domsAreas, domsSeverity: formData.domsSeverity,
      hrv: formData.hrv ? parseInt(formData.hrv) : undefined,
      rhr: formData.rhr ? parseInt(formData.rhr) : undefined,
      bodyTemp: formData.bodyTemp ? parseFloat(formData.bodyTemp) : undefined,
      trainingLoad: settings.enableTrainingLoad ? formData.trainingLoad : undefined,
      recoveryProtocol: settings.enableProtocols ? formData.recoveryProtocol : undefined,
      bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
      notes: formData.notes || undefined, journal: formData.journal || undefined,
      createdAt: new Date().toISOString(),
    }
    const existing = entries.findIndex(e => e.date === today)
    if (existing >= 0) { const updated = [...entries]; updated[existing] = entry; setEntries(updated) }
    else setEntries([entry, ...entries])
    setShowForm(false)
  }

  const addWater = (amount: number) => {
    addHydration({ id: generateId(), date: today, amount, timestamp: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }

  const toggleDomArea = (area: string) => {
    setFormData(prev => {
      if (!prev.domsAreas.includes(area)) return { ...prev, domsAreas: [...prev.domsAreas, area], domsSeverity: { ...prev.domsSeverity, [area]: 'mild' } }
      const sev = prev.domsSeverity[area]
      if (!sev || sev === 'mild') return { ...prev, domsSeverity: { ...prev.domsSeverity, [area]: 'moderate' } }
      if (sev === 'moderate') return { ...prev, domsSeverity: { ...prev.domsSeverity, [area]: 'severe' } }
      const { [area]: _, ...rest } = prev.domsSeverity
      return { ...prev, domsAreas: prev.domsAreas.filter(a => a !== area), domsSeverity: rest }
    })
  }

  const exportCSV = () => {
    const headers = 'Date,Energy,Soreness,Stress,Mood,SleepQuality,DOMS,HRV,RHR,BodyTemp,TrainingLoad,Protocol,BodyWeight,Readiness,ReadinessLabel,Notes\n'
    const rows = entries.map(e => {
      const r = getReadiness(e.energy, e.soreness, e.stress, e.mood, weights)
      return `${e.date},${e.energy},${e.soreness},${e.stress},${e.mood},${e.sleepQuality},"${e.domsAreas.join(';')}",${e.hrv ?? ''},${e.rhr ?? ''},${e.bodyTemp ?? ''},${e.trainingLoad ?? ''},${e.recoveryProtocol ?? ''},${e.bodyWeight ?? ''},${r.score},${r.label},"${(e.notes || '').replace(/"/g, '""')}"`
    }).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `recovery-export-${today}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    const data = JSON.stringify({ entries, settings, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `recovery-backup-${today}.json`; a.click(); URL.revokeObjectURL(url)
  }

  const importJSON = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.entries && Array.isArray(data.entries)) {
            setEntries(data.entries)
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
            setImportStatus('success'); setTimeout(() => setImportStatus(''), 3000)
          } else { setImportStatus('error'); setTimeout(() => setImportStatus(''), 3000) }
        } catch { setImportStatus('error'); setTimeout(() => setImportStatus(''), 3000) }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const Minus = ({ className, size }: { className?: string; size?: number }) => (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
  )

  const Slider = ({ label, value, onChange, min = 1, max = 10, color, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string; hint?: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className={`font-bold ${color || 'text-white'}`}>{value}/{max}</span>
      </div>
      {hint && <p className="text-[9px] text-slate-600 -mt-1">{hint}</p>}
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30 accent-purple-500"
        style={{ accentColor: color || '#a855f7' }} />
    </div>
  )

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", enabled ? 'bg-emerald-500' : 'bg-slate-600')}>
      <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", enabled ? 'left-5' : 'left-0.5')} />
    </button>
  )

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5">
            <motion.div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center relative overflow-hidden" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <motion.div className="absolute inset-0 bg-emerald-500/10" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
              <Heart size={17} className="text-emerald-400 relative z-10" />
            </motion.div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Recovery</h2>
              {todayReadiness && <p className="text-[10px] text-slate-500">{todayReadiness.label} · {loggingStreak}d streak</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Hydration panel toggle */}
          <button onClick={() => setShowHydrationPanel(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showHydrationPanel ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Hydration Log">
            <Droplets size={16} />
          </button>
          {/* Trends panel toggle */}
          <button onClick={() => setShowTrendsPanel(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showTrendsPanel ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Trends & Insights">
            <BarChart3 size={16} />
          </button>
          {/* Body panel toggle */}
          <button onClick={() => setShowBodyPanel(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showBodyPanel ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Body & Recovery">
            <Activity size={16} />
          </button>
          {/* Achievements toggle */}
          {earnedCount > 0 && (
            <button onClick={() => setShowAchievementsPanel(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showAchievementsPanel ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Achievements">
              <Award size={16} />
            </button>
          )}
          <button onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Settings">
            <Settings size={16} />
          </button>
          <button onClick={() => { setFormData(prev => ({ ...prev, energy: settings.defaultEnergy, soreness: settings.defaultSoreness, stress: settings.defaultStress, mood: settings.defaultMood, sleepQuality: settings.defaultSleepQuality, domsAreas: [], domsSeverity: {}, hrv: '', rhr: '', bodyTemp: '', trainingLoad: 5, recoveryProtocol: '', bodyWeight: '', notes: '', journal: '' })); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all text-[10px] font-bold uppercase tracking-wider"
          ><Plus size={12} />{todayEntry ? 'Update' : 'Log Today'}</button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Readiness', value: todayReadiness ? `${todayReadiness.score}` : '--', sub: todayReadiness?.label || 'No data', color: todayReadiness?.color || '#6b7280', icon: Heart },
          { label: 'Week Avg', value: avgReadiness ? `${avgReadiness}` : '--', sub: readinessTrend ? `${readinessTrend.diff > 0 ? '+' : ''}${readinessTrend.diff} vs prior` : '', color: '#a855f7', icon: BarChart3 },
          { label: 'Streak', value: `${loggingStreak}d`, sub: `${earnedCount} badges`, color: '#f59e0b', icon: Flame },
          { label: 'Hydration', value: `${Math.round(todayHydrationProgress * 100)}%`, sub: `${hUnit(todayHydration)}/${hUnit(HYDRATION_GOAL)}${hLabel}`, color: '#06b6d4', icon: Droplets },
          { label: 'Sleep Debt', value: settings.enableSleepDebt ? `${sleepDebt}h` : '--', sub: settings.enableSleepDebt ? `need ${settings.sleepNeed}h` : 'off', color: '#6366f1', icon: Moon },
          { label: 'Balance', value: (() => { const w = recentWeek.filter(d => d.trainingLoad > 0 && d.readiness > 0); if (!w.length) return '--'; const r = Math.round(w.reduce((s, d) => s + d.readiness, 0) / w.length); const l = w.reduce((s, d) => s + d.trainingLoad, 0) / w.length; const sc = Math.round((r / 100) * 10 - l); return sc > 0 ? `+${sc}` : `${sc}` })(), sub: (() => { const w = recentWeek.filter(d => d.trainingLoad > 0 && d.readiness > 0); if (!w.length) return 'No data'; const r = Math.round(w.reduce((s, d) => s + d.readiness, 0) / w.length); const l = w.reduce((s, d) => s + d.trainingLoad, 0) / w.length; const sc = Math.round((r / 100) * 10 - l); const labels = ['Overreaching', 'Strained', 'Strained', 'Neutral', 'Neutral', 'Well balanced']; return labels[Math.min(5, Math.max(0, sc + 3))] })(), color: (() => { const w = recentWeek.filter(d => d.trainingLoad > 0 && d.readiness > 0); if (!w.length) return '#6b7280'; const r = Math.round(w.reduce((s, d) => s + d.readiness, 0) / w.length); const l = w.reduce((s, d) => s + d.trainingLoad, 0) / w.length; const sc = Math.round((r / 100) * 10 - l); return sc >= 2 ? '#10b981' : sc >= 0 ? '#f59e0b' : sc >= -3 ? '#f97316' : '#ef4444' })(), icon: Sparkles },
      ].map((stat) => (
        <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 blur-xl" style={{ background: `${stat.color}20` }} />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1" style={{ color: stat.color }}><stat.icon size={14} /><span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">{stat.label}</span></div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        </div>
      ))}
      </motion.div>

      {/* Hydration Panel */}
      <AnimatePresence>{showHydrationPanel && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-cyan-400" /><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hydration</h3>
              <span className="text-xs text-slate-500 ml-auto">{hUnit(todayHydration)}{hLabel} / {hUnit(HYDRATION_GOAL)}{hLabel}</span>
              <span className="text-xs font-bold text-cyan-400">{Math.round(todayHydrationProgress * 100)}%</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="shrink-0"><WaterGlass progress={Math.round(todayHydrationProgress * 100)} /></div>
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {settings.quickWaterAmounts.map(amount => (
                    <motion.button key={amount} onClick={() => addWater(amount)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-[9px] font-bold">+{hUnit(amount)}{hLabel}</motion.button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="number" value={waterAmount} onChange={e => setWaterAmount(e.target.value)} placeholder={`Custom (${hLabel})`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-xs focus:border-cyan-500/50 focus:outline-none transition-all" />
                  <motion.button onClick={() => { if (waterAmount) { addWater(Number(waterAmount)); setWaterAmount('') } }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 transition-all text-[9px] font-bold flex items-center gap-1"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Plus size={10} />Add</motion.button>
                </div>
                <div className="flex items-center gap-3">
                  {todayHydrationLogs.length > 0 && (
                    <div className="max-h-16 overflow-y-auto space-y-0.5 flex-1">
                      <p className="text-[7px] text-slate-600 uppercase tracking-wider">Today's logs</p>
                      {todayHydrationLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between text-[8px] text-slate-400">
                          <span>+{hUnit(log.amount)}{hLabel}</span><span>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {hydrationStreak > 0 && (
                    <div className="flex items-center gap-1 text-[8px] text-cyan-400/70 bg-cyan-500/10 px-2 py-1 rounded-lg shrink-0">
                      <Flame size={8} />{hydrationStreak} day streak
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Hydration history mini chart */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2"><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">7-Day History</h4><span className="text-[8px] text-slate-500 ml-auto">{avgHydration > 0 ? `Avg: ${hUnit(avgHydration)}${hLabel}` : ''}</span></div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hydrationWeek}>
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(value: number) => [`${hUnit(value)}${hLabel}`, 'Hydration']} />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={20}>
                      {hydrationWeek.map((entry, idx) => (<rect key={idx} fill={entry.amount > 0 ? '#06b6d4' : '#1e293b'} rx={3} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Trends Panel */}
      <AnimatePresence>{showTrendsPanel && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-purple-400" /><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trends & Insights</h3>
            </div>
            <div className="space-y-4">
              {/* Sleep-Readiness */}
              {sleepReadinessData.length >= 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Moon size={12} className="text-indigo-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Sleep vs Readiness</h4>
                  </div>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sleepReadinessData}>
                        <XAxis dataKey="sleepLabel" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="readiness" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {/* Readiness Trend */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={12} className="text-purple-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Readiness Trend</h4>
                  <div className="flex gap-1 ml-2">
                    {([7, 14, 30] as const).map(d => (
                      <button key={d} onClick={() => setTrendDays(d)}
                        className={cn("px-1.5 py-0.5 rounded text-[7px] font-bold transition-all", trendDays === d ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-600 hover:text-slate-400")}>{d}d</button>
                    ))}
                  </div>
                  <span className="text-[8px] text-slate-500 ml-auto">Avg: {avgReadiness}</span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    {settings.chartType === 'area' ? (
                      <AreaChart data={recentDays}>
                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} interval={trendDays > 14 ? 1 : 0} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <defs><linearGradient id="readGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="readiness" stroke="#a855f7" fill="url(#readGrad2)" strokeWidth={2} dot={{ fill: '#a855f7', r: 2 }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={recentDays}>
                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} interval={trendDays > 14 ? 1 : 0} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="readiness" radius={[3, 3, 0, 0]} maxBarSize={trendDays > 14 ? 10 : 22}>
                          {recentDays.map((entry, idx) => (<rect key={idx} fill={entry.readiness > 0 ? getScoreColor(entry.readiness) : '#334155'} rx={3} />))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                {readinessPrediction !== null && (
                  <div className="mt-2 flex items-center gap-2 text-[9px] flex-wrap">
                    <Clock size={8} className="text-slate-500" />
                    <span className="text-slate-500">Tomorrow:</span>
                    <span className={cn("font-bold", readinessPrediction.value >= 70 ? "text-emerald-400" : readinessPrediction.value >= 50 ? "text-amber-400" : "text-rose-400")}>{readinessPrediction.value}</span>
                    <span className="text-slate-600">/100 · {readinessPrediction.confidence}%</span>
                  </div>
                )}
              </div>
              {/* Weekly Comparison */}
              {weeklyComparison.energy.this !== null && (
                <div>
                  <div className="flex items-center gap-2 mb-2"><BarChart3 size={12} className="text-purple-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">This vs Last Week</h4></div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(['energy', 'soreness', 'stress', 'mood'] as const).map(key => {
                      const t = weeklyComparison[key].this; const l = weeklyComparison[key].last
                      if (t === null || l === null) return null
                      const diff = t - l; // const colors unused
                      const improved = key === 'soreness' || key === 'stress' ? diff < 0 : diff > 0
                      return (
                        <div key={key}>
                          <p className="text-[7px] text-slate-600 uppercase tracking-wider">{key}</p>
                          <div className="flex items-center justify-center gap-1"><span className="text-[9px] text-slate-500">{l}</span><span className="text-xs font-bold text-white">{t}</span></div>
                          <span className={cn("text-[8px] font-bold flex items-center justify-center gap-0.5", improved ? "text-emerald-400" : "text-rose-400")}>
                            {diff > 0 ? <ArrowUp size={7} /> : <ArrowDown size={7} />}{Math.abs(Math.round(diff * 10) / 10)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Body Panel */}
      <AnimatePresence>{showBodyPanel && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-rose-400" /><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Body & Recovery</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DOMS */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={12} className="text-rose-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">DOMS Map</h4>
                  {todayEntry && <span className="text-[8px] text-slate-500 ml-auto">{todayEntry.domsAreas.length} areas</span>}
                </div>
                {!todayEntry ? (
                  <p className="text-[9px] text-slate-500 text-center py-3">Log today to track soreness</p>
                ) : (
                  <div className="flex flex-col items-center">
                    <DomsBodyMap domsSeverity={todayEntry.domsSeverity || {}} domsAreas={todayEntry.domsAreas} onToggle={() => {}} readonly />
                    <div className="flex gap-2 mt-1.5">{(['mild', 'moderate', 'severe'] as const).map(sev => (
                      <div key={sev} className="flex items-center gap-1"><div className={cn("w-1.5 h-1.5 rounded-full", sev === 'severe' ? "bg-rose-500" : sev === 'moderate' ? "bg-amber-500" : "bg-emerald-500")} /><span className="text-[7px] text-slate-600 capitalize">{sev}</span></div>
                    ))}</div>
                  </div>
                )}
                {domsTrend.length >= 3 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[7px] text-slate-600 mb-1">DOMS trend</p>
                    {domsTrend.slice(-5).reverse().map(d => (
                      <div key={d.date} className="flex items-center gap-1.5 text-[7px]">
                        <span className="text-slate-600 w-8">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" initial={{ width: 0 }} animate={{ width: `${(d.domsScore / 15) * 100}%` }} transition={{ duration: 0.6 }} />
                        </div>
                        <span className="text-slate-500">{d.areaCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Bio Vitals */}
              <div>
                <div className="flex items-center gap-2 mb-2"><Activity size={12} className="text-sky-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Bio Vitals</h4></div>
                <div className="space-y-2">
                  {hrvTrend.length >= 2 ? (
                    <div><div className="flex justify-between text-[9px] mb-0.5"><span className="text-slate-400">HRV</span><span className="text-sky-400 font-bold">{hrvTrend[hrvTrend.length - 1]} ms</span></div><BioSparkline data={hrvTrend} color="#06b6d4" /></div>
                  ) : <p className="text-[8px] text-slate-600 text-center py-1">Enable HRV in settings</p>}
                  {rhrTrend.length >= 2 ? (
                    <div><div className="flex justify-between text-[9px] mb-0.5"><span className="text-slate-400">RHR</span><span className="text-rose-400 font-bold">{rhrTrend[rhrTrend.length - 1]} bpm</span></div><BioSparkline data={rhrTrend} color="#f43f5e" /></div>
                  ) : <p className="text-[8px] text-slate-600 text-center py-1">Enable RHR in settings</p>}
                  {settings.enableBodyTemp && bodyTempTrend.length >= 2 && (
                    <div><div className="flex justify-between text-[9px] mb-0.5"><span className="text-slate-400">Body Temp</span><span className="text-orange-400 font-bold">{displayTemp(bodyTempTrend[bodyTempTrend.length - 1])}{settings.tempUnit}</span></div><BioSparkline data={bodyTempTrend} color="#f97316" /></div>
                  )}
                </div>
              </div>
              {/* Protocols */}
              <div>
                {protocolEffectiveness.length > 1 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2"><Pill size={12} className="text-purple-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Protocols</h4></div>
                    <div className="space-y-1">
                      {protocolEffectiveness.slice(0, 5).map(p => (
                        <div key={p.protocol} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[8px]">
                          <span className="text-slate-300">{p.protocol}</span>
                          <span className={cn("font-bold ml-auto", p.avgReadiness >= 70 ? "text-emerald-400" : p.avgReadiness >= 50 ? "text-amber-400" : "text-rose-400")}>{p.avgReadiness}</span>
                          <span className="text-slate-600">({p.count}x)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Weekly summary mini */}
                <div>
                  <div className="flex items-center gap-2 mb-2"><Award size={12} className="text-amber-400" /><h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Week Summary</h4></div>
                  {recentWeek.some(d => d.readiness > 0) ? (
                    <div className="space-y-1">
                      {[
                        { label: 'Average', value: avgReadiness, color: 'text-white' },
                        { label: 'Best', value: bestReadinessDay ? `${bestReadinessDay.readiness}` : '--', color: 'text-emerald-400' },
                        { label: 'Worst', value: worstReadinessDay ? `${worstReadinessDay.readiness}` : '--', color: 'text-rose-400' },
                      ].map(s => (
                        <div key={s.label} className="flex justify-between text-[8px] px-2 py-1 rounded bg-white/[0.02]">
                          <span className="text-slate-500">{s.label}</span><span className={`font-bold ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[8px] text-slate-500 text-center py-2">No data this week</p>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Achievements Panel */}
      <AnimatePresence>{showAchievementsPanel && earnedCount > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-amber-400" /><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achievements ({earnedCount}/{achievements.length})</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {achievements.filter(a => a.earned).map(a => (
                <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/80" title={a.desc}>
                  <a.icon size={11} className="text-amber-400" />{a.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays size={12} className="text-purple-400" /> Logged Entries {entries.length > 0 && `(${entries.length})`}
          </h4>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <motion.button onClick={() => setShowHistory(!showHistory)} whileHover={{ x: showHistory ? 0 : 2 }}
                className="text-[9px] text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                {showHistory ? 'Hide' : 'View all'} <ChevronRight size={10} className={cn("transition-transform", showHistory && "rotate-90")} />
              </motion.button>
            )}
            {entries.length > 0 && (
              <motion.button onClick={exportCSV} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[9px]"><Download size={9} /> CSV</motion.button>
            )}
          </div>
        </div>
        {entries.length > 0 ? (
          <div className={cn("space-y-1 overflow-y-auto", showHistory ? "max-h-[32rem]" : "max-h-48")}>
            {entries.slice(0, showHistory ? entries.length : 10).map((entry, idx) => {
              const r = getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood, weights)
              const prev = idx < entries.length - 1 ? getReadiness(entries[idx + 1].energy, entries[idx + 1].soreness, entries[idx + 1].stress, entries[idx + 1].mood, weights) : null
              const delta = prev ? r.score - prev.score : null
              const isExpanded = expandedEntry === entry.id
              return (
                <motion.div key={entry.id}
                  className={cn("rounded-xl border border-white/5 bg-white/[0.02] transition-all cursor-pointer", isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.04]")}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-2.5 p-2.5">
                    <motion.div className="w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0" style={{ borderColor: r.color }} whileHover={{ scale: 1.1 }}>
                      <span className="text-[10px] font-bold text-white">{r.score}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0 text-[8px] text-slate-500">
                        <span className={entry.energy >= settings.energyTarget ? 'text-amber-400/80' : ''}>E:{entry.energy}</span>
                        <span className={entry.soreness <= settings.sorenessTarget ? 'text-rose-400/80' : ''}>S:{entry.soreness}</span>
                        <span className={entry.stress <= settings.stressTarget ? 'text-violet-400/80' : ''}>St:{entry.stress}</span>
                        <span className={entry.mood >= settings.moodTarget ? 'text-emerald-400/80' : ''}>M:{entry.mood}</span>
                        {entry.domsAreas.length > 0 && <span>· DOMS:{entry.domsAreas.length}</span>}
                        {entry.hrv && <span>· HRV:{entry.hrv}</span>}
                        {entry.rhr && <span>· RHR:{entry.rhr}</span>}
                      </div>
                    </div>
                    {delta !== null && (
                      <span className={cn("text-[8px] font-bold flex items-center gap-0.5 shrink-0", delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500")}>
                        {delta > 0 ? <ArrowUp size={8} /> : delta < 0 ? <ArrowDown size={8} /> : <Minus size={8} />}{Math.abs(delta)}
                      </span>
                    )}
                    <motion.button onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry) }} whileHover={{ scale: 1.2 }}
                      className="p-1 rounded-lg text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={11} /></motion.button>
                  </div>
                  {isExpanded && (entry.notes || entry.journal) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-3 pb-2.5 border-t border-white/5 pt-2">
                      {entry.journal && <p className="text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">{entry.journal}</p>}
                      {entry.notes && !entry.journal && <p className="text-[10px] text-slate-500 italic">{entry.notes}</p>}
                      <div className="flex gap-2 mt-1.5 text-[8px] text-slate-600 flex-wrap">
                        {entry.recoveryProtocol && <span>Protocol: {entry.recoveryProtocol}</span>}
                        {entry.hrv && <span>HRV: {entry.hrv}ms</span>}
                        {entry.rhr && <span>RHR: {entry.rhr}bpm</span>}
                        {entry.bodyTemp && <span>Temp: {displayTemp(entry.bodyTemp)}{settings.tempUnit}</span>}
                        {entry.bodyWeight && <span>Weight: {displayWeight(entry.bodyWeight)}{settings.weightUnit}</span>}
                        {entry.trainingLoad && <span>Load: {entry.trainingLoad}/10</span>}
                      </div>
                    </motion.div>
                  )}
                  {!isExpanded && (entry.notes || entry.journal) && (
                    <div className="px-3 pb-1.5 flex items-center gap-1 text-[8px] text-slate-600"><ChevronRight size={6} />{entry.journal ? 'Journal' : 'Notes'}</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Heart size={24} className="mx-auto mb-2 text-slate-600" />
            <p className="text-xs">No recovery entries yet</p>
            <p className="text-[10px] text-slate-600 mt-1">Log your first day to start tracking readiness</p>
          </div>
        )}
      </div>

      {/* Log Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}><Heart size={20} className="text-emerald-400" /></motion.div>
                </div>
                <div><h3 className="text-lg font-bold text-white">{todayEntry ? 'Update' : 'Log'} Recovery</h3><p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p></div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Energy Level" value={formData.energy} onChange={v => setFormData(prev => ({ ...prev, energy: v }))} color="#f59e0b" hint="Physical & mental energy" />
                <Slider label="Muscle Soreness" value={formData.soreness} onChange={v => setFormData(prev => ({ ...prev, soreness: v }))} color="#ef4444" hint="How sore are your muscles" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Stress Level" value={formData.stress} onChange={v => setFormData(prev => ({ ...prev, stress: v }))} color="#a855f7" hint="Mental & emotional stress" />
                <Slider label="Mood" value={formData.mood} onChange={v => setFormData(prev => ({ ...prev, mood: v }))} min={1} max={5} color="#10b981" hint="Overall emotional state" />
              </div>
              <Slider label="Sleep Quality" value={formData.sleepQuality} onChange={v => setFormData(prev => ({ ...prev, sleepQuality: v }))} min={1} max={5} color="#06b6d4" hint="How well you slept" />
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">DOMS Areas <span className="text-slate-600 font-normal">— tap to cycle</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLE_AREAS.map(area => {
                    const sev = formData.domsSeverity[area]
                    return (
                      <motion.button key={area} onClick={() => toggleDomArea(area)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all",
                          !formData.domsAreas.includes(area) ? "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                            : sev === 'severe' ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                              : sev === 'moderate' ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        )}>{area}{formData.domsAreas.includes(area) ? ` (${sev || 'mild'})` : ''}</motion.button>
                    )
                  })}
                </div>
              </div>
              {settings.enableTrainingLoad && (
                <Slider label="Training Load (RPE)" value={formData.trainingLoad} onChange={v => setFormData(prev => ({ ...prev, trainingLoad: v }))} color="#f97316" hint="Rate of perceived exertion" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {settings.enableHRV && (
                  <div><label className="text-[11px] text-slate-400 font-medium">HRV</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={13} className="text-sky-400 shrink-0" />
                      <input type="number" value={formData.hrv} onChange={e => setFormData(prev => ({ ...prev, hrv: e.target.value }))} placeholder="ms"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-sky-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                )}
                {settings.enableRHR && (
                  <div><label className="text-[11px] text-slate-400 font-medium">RHR</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart size={13} className="text-rose-400 shrink-0" />
                      <input type="number" value={formData.rhr} onChange={e => setFormData(prev => ({ ...prev, rhr: e.target.value }))} placeholder="bpm"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-rose-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {settings.enableBodyTemp && (
                  <div><label className="text-[11px] text-slate-400 font-medium">Body Temp</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Thermometer size={13} className="text-orange-400 shrink-0" />
                      <input type="number" step="0.1" value={formData.bodyTemp} onChange={e => setFormData(prev => ({ ...prev, bodyTemp: e.target.value }))} placeholder="°C"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-orange-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                )}
                {settings.enableBodyWeight && (
                  <div><label className="text-[11px] text-slate-400 font-medium">Body Weight</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Activity size={13} className="text-emerald-400 shrink-0" />
                      <input type="number" step="0.1" value={formData.bodyWeight} onChange={e => setFormData(prev => ({ ...prev, bodyWeight: e.target.value }))} placeholder="kg"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                )}
              </div>
              {settings.enableProtocols && (
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Recovery Protocol</label>
                  <select value={formData.recoveryProtocol} onChange={e => setFormData(prev => ({ ...prev, recoveryProtocol: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-all appearance-none">
                    <option value="" className="bg-slate-900">None</option>
                    {RECOVERY_PROTOCOLS.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Quick Notes</label>
                <input value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Brief notes (e.g., 'Leg day was brutal')"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
              </div>
              {settings.showJournal && (
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Recovery Journal</label>
                  <textarea value={formData.journal} onChange={e => setFormData(prev => ({ ...prev, journal: e.target.value }))}
                    placeholder="Write a longer reflection on your recovery today..."
                    rows={3} className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-emerald-500/50 focus:outline-none transition-all resize-none" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <motion.button onClick={() => setShowForm(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold">Cancel</motion.button>
                <motion.button onClick={saveEntry} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all text-sm font-bold flex items-center justify-center gap-2"><Heart size={16} /> Save</motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>{showSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Settings size={20} className="text-emerald-400" /></div>
                <div><h3 className="text-lg font-bold text-white">Recovery Settings</h3><p className="text-xs text-slate-500">Ultimate recovery configuration</p></div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
            </div>
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Accent Color</h4>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button key={c.name} onClick={() => setSettings(prev => ({ ...prev, accentColor: c.name }))}
                      className={cn("w-8 h-8 rounded-full transition-all", c.bg, settings.accentColor === c.name ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-50 hover:opacity-80")} />
                  ))}
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Hydration</h4>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-400">Daily water goal</span><span className="text-cyan-400 font-bold">{hUnit(settings.hydrationGoal)}{hLabel}</span></div>
                <input type="range" min={1000} max={5000} step={100} value={settings.hydrationGoal}
                  onChange={e => setSettings(prev => ({ ...prev, hydrationGoal: Number(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-cyan-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg" />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5"><span>1L</span><span>3L</span><span>5L</span></div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Readiness Score Weights</h4>
                <p className="text-[10px] text-slate-600 mb-2">How each metric contributes to your readiness score</p>
                <div className="space-y-3">
                  {(['energy', 'soreness', 'stress', 'mood'] as const).map(k => {
                    const colors: Record<string, string> = { energy: 'amber', soreness: 'rose', stress: 'violet', mood: 'emerald' }
                    return (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400 capitalize">{k} weight</span><span className={`text-${colors[k]}-400 font-bold`}>{settings.readinessWeights[k]}%</span></div>
                        <input type="range" min={0} max={100} step={5} value={settings.readinessWeights[k]}
                          onChange={e => setSettings(prev => ({ ...prev, readinessWeights: { ...prev.readinessWeights, [k]: Number(e.target.value) } }))}
                          className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400" />
                      </div>
                    )
                  })}
                  <p className="text-[9px] text-slate-600">Total: {Object.values(settings.readinessWeights).reduce((a, b) => a + b, 0)}% <span className={Object.values(settings.readinessWeights).reduce((a, b) => a + b, 0) === 100 ? 'text-emerald-400/60' : 'text-amber-400/60'}>(should be 100%)</span></p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Metric Targets</h4>
                <div className="space-y-3">
                  {[
                    { key: 'energyTarget', label: 'Energy target', max: 10, color: 'amber' },
                    { key: 'sorenessTarget', label: 'Max soreness target', max: 10, color: 'rose' },
                    { key: 'stressTarget', label: 'Max stress target', max: 10, color: 'violet' },
                    { key: 'moodTarget', label: 'Mood target', max: 5, color: 'emerald' },
                    { key: 'sleepQualityTarget', label: 'Sleep quality target', max: 5, color: 'sky' },
                  ].map(({ key, label, max, color }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{label}</span><span className={`text-${color}-400 font-bold`}>{settings[key as keyof RecoverySettings] as number}/{max}</span></div>
                      <input type="range" min={1} max={max} value={settings[key as keyof RecoverySettings] as number}
                        onChange={e => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Default Form Values</h4>
                <p className="text-[10px] text-slate-600 mb-2">Preset values when opening the log form</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'defaultEnergy' as const, label: 'Energy', max: 10, color: 'amber' },
                    { key: 'defaultSoreness' as const, label: 'Soreness', max: 10, color: 'rose' },
                    { key: 'defaultStress' as const, label: 'Stress', max: 10, color: 'violet' },
                    { key: 'defaultMood' as const, label: 'Mood', max: 5, color: 'emerald' },
                  ]).map(({ key, label, max, color }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{label}</span><span className={`text-${color}-400 font-bold`}>{settings[key]}/{max}</span></div>
                      <input type="range" min={1} max={max} value={settings[key]}
                        onChange={e => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Sleep Quality</span><span className="text-sky-400 font-bold">{settings.defaultSleepQuality}/5</span></div>
                  <input type="range" min={1} max={5} value={settings.defaultSleepQuality}
                    onChange={e => setSettings(prev => ({ ...prev, defaultSleepQuality: Number(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400" />
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Training & Lifestyle</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Sleep need</span><span className="text-cyan-400 font-bold">{settings.sleepNeed}h</span></div>
                    <input type="range" min={5} max={12} step={0.5} value={settings.sleepNeed}
                      onChange={e => setSettings(prev => ({ ...prev, sleepNeed: Number(e.target.value) }))}
                      className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-cyan-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Weekly entry goal</span><span className="text-purple-400 font-bold">{settings.weeklyEntryGoal}/week</span></div>
                    <input type="range" min={1} max={14} value={settings.weeklyEntryGoal}
                      onChange={e => setSettings(prev => ({ ...prev, weeklyEntryGoal: Number(e.target.value) }))}
                      className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Chronotype</span><span className="text-amber-400 font-bold capitalize">{settings.chronotype}</span></div>
                    <div className="flex gap-2">
                      {(['morning', 'evening', 'neither'] as const).map(c => (
                        <button key={c} onClick={() => setSettings(prev => ({ ...prev, chronotype: c }))}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                            settings.chronotype === c ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          )}>{c === 'morning' ? 'Morning' : c === 'evening' ? 'Evening' : 'Neutral'}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Advanced Metrics</h4>
                <p className="text-[10px] text-slate-600 mb-2">Enable additional fields in your recovery log</p>
                <div className="space-y-3">
                  {[
                    { key: 'enableHRV' as const, label: 'HRV tracking', desc: 'Heart rate variability (ms)' },
                    { key: 'enableRHR' as const, label: 'RHR tracking', desc: 'Resting heart rate (bpm)' },
                    { key: 'enableTrainingLoad' as const, label: 'Training load', desc: 'Daily RPE / strain score' },
                    { key: 'enableBodyWeight' as const, label: 'Body weight', desc: 'Daily weight tracking' },
                    { key: 'enableProtocols' as const, label: 'Recovery protocols', desc: 'Log recovery activities' },
                    { key: 'enableBodyTemp' as const, label: 'Body temperature', desc: 'Track body temp trends' },
                    { key: 'enableSleepDebt' as const, label: 'Sleep debt', desc: 'Track accumulated sleep debt' },
                    { key: 'showJournal' as const, label: 'Recovery journal', desc: 'Long-form daily recovery notes' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                      <div><span className="text-sm text-slate-400 group-hover:text-white transition-colors">{label}</span><p className="text-[10px] text-slate-600">{desc}</p></div>
                      <Toggle enabled={settings[key] as boolean} onChange={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Display</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-400">Chart type</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSettings(prev => ({ ...prev, chartType: 'bar' }))}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", settings.chartType === 'bar' ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-slate-400")}>Bar</button>
                      <button onClick={() => setSettings(prev => ({ ...prev, chartType: 'area' }))}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", settings.chartType === 'area' ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-slate-400")}>Area</button>
                    </div>
                  </label>
                  {[
                    { key: 'enablePrediction' as const, label: 'Readiness prediction' },
                    { key: 'domsEnabled' as const, label: 'DOMS body map' },
                    { key: 'compactMode' as const, label: 'Compact card mode' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-400">{label}</span>
                      <Toggle enabled={settings[key] as boolean} onChange={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Units & Quick Water</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['ml', 'oz'] as const).map(u => (
                      <button key={u} onClick={() => setSettings(prev => {
                        const goal = u === 'oz' ? Math.round(prev.hydrationGoal / 29.57) : prev.hydrationGoal * 29.57
                        const amounts = prev.quickWaterAmounts.map(a => u === 'oz' ? Math.round(a / 29.57) : Math.round(a * 29.57))
                        return { ...prev, unit: u, hydrationGoal: goal, quickWaterAmounts: amounts }
                      })}
                        className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", settings.unit === u ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white")}>{u.toUpperCase()}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.quickWaterAmounts.map((amount, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input type="number" value={amount} min={25} max={2000} step={25}
                          onChange={e => { const a = [...settings.quickWaterAmounts]; a[i] = Number(e.target.value); setSettings(prev => ({ ...prev, quickWaterAmounts: a })) }}
                          className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center focus:border-cyan-500/50 focus:outline-none" />
                        <span className="text-[10px] text-slate-500">{hLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Data Management</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={exportCSV} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center justify-center gap-1.5">
                    <Download size={13} /> Export CSV
                  </button>
                  <button onClick={exportJSON} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center justify-center gap-1.5">
                    <Download size={13} /> Backup JSON
                  </button>
                  <button onClick={importJSON} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center justify-center gap-1.5">
                    <Upload size={13} /> Import JSON
                  </button>
                  <button onClick={() => { if (confirm('Delete ALL recovery entries?')) { setEntries([]); localStorage.removeItem(STORAGE_KEY) } }}
                    className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs flex items-center justify-center gap-1.5">
                    <Trash2 size={13} /> Clear All
                  </button>
                </div>
                {importStatus === 'success' && (
                  <motion.p className="text-[10px] text-emerald-400 text-center mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Data imported successfully!</motion.p>
                )}
                {importStatus === 'error' && (
                  <motion.p className="text-[10px] text-rose-400 text-center mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Invalid file format. Please use a valid JSON backup.</motion.p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
              <button onClick={() => { setSettings(defaultSettings()) }} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center gap-1">
                <RefreshCw size={11} /> Reset
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all text-sm font-bold flex items-center gap-2">
                <Check size={16} /> Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>{deleteTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <motion.div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4"
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <AlertTriangle size={24} className="text-rose-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <motion.button onClick={() => setDeleteTarget(null)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-bold">Cancel</motion.button>
              <motion.button onClick={() => { setEntries(prev => prev.filter(e => e.id !== deleteTarget.id)); setDeleteTarget(null) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all font-bold">Delete</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}


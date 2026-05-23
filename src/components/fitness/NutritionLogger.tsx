import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet,
  Pencil, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, BarChart3, TrendingUp, Target, Info, RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { MealForm } from './MealForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Meal } from '@/types/fitness'

const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

const MEAL_TYPE_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  breakfast: { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', label: 'Breakfast', icon: '🍳' },
  lunch: { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30', label: 'Lunch', icon: '🥗' },
  dinner: { color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30', label: 'Dinner', icon: '🍽️' },
  snack: { color: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/30', label: 'Snack', icon: '🍎' },
}

const MEAL_TYPE_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }

function loadTargets(): typeof DEFAULT_TARGETS {
  try {
    const raw = localStorage.getItem('nutrition_targets')
    if (raw) return { ...DEFAULT_TARGETS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_TARGETS
}

function saveTargets(t: typeof DEFAULT_TARGETS) {
  localStorage.setItem('nutrition_targets', JSON.stringify(t))
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getWeekDates(ref: Date): string[] {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(ref)
    d.setDate(d.getDate() - i)
    dates.push(formatDate(d))
  }
  return dates
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const s = formatDate(d)
  if (s === formatDate(today)) return 'Today'
  if (s === formatDate(yesterday)) return 'Yesterday'
  if (s === formatDate(tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function NutritionLogger() {
  const { meals, addMeal, updateMeal, deleteMeal } = useAppStore()

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null)
  const [targets, setTargets] = useState(loadTargets)
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showWeekly, setShowWeekly] = useState(false)
  const [showCalcHelper, setShowCalcHelper] = useState(false)

  useEffect(() => { saveTargets(targets) }, [targets])

  const filteredMeals = useMemo(() => {
    return meals
      .filter((m) => m.date === selectedDate)
      .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType])
  }, [meals, selectedDate])

  const groupedMeals = useMemo(() => {
    const groups: Record<string, Meal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
    for (const m of filteredMeals) {
      if (groups[m.mealType]) groups[m.mealType].push(m)
      else groups.snack.push(m)
    }
    return groups
  }, [filteredMeals])

  const summary = useMemo(() => {
    return filteredMeals.reduce(
      (acc, m) => {
        acc.calories += m.calories
        acc.protein += m.protein
        acc.carbs += m.carbs
        acc.fat += m.fat
        acc.fiber += m.fiber || 0
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
  }, [filteredMeals])

  const macroPercentages = useMemo(() => {
    const proteinCals = summary.protein * 4
    const carbsCals = summary.carbs * 4
    const fatCals = summary.fat * 9
    const total = proteinCals + carbsCals + fatCals || 1
    return {
      protein: (proteinCals / total) * 100,
      carbs: (carbsCals / total) * 100,
      fat: (fatCals / total) * 100,
    }
  }, [summary])

  const progress = useMemo(() => {
    return {
      calories: Math.min(summary.calories / targets.calories, 1),
      protein: Math.min(summary.protein / targets.protein, 1),
      carbs: Math.min(summary.carbs / targets.carbs, 1),
      fat: Math.min(summary.fat / targets.fat, 1),
    }
  }, [summary, targets])

  const weeklyData = useMemo(() => {
    const weekDates = getWeekDates(new Date(selectedDate + 'T00:00:00'))
    return weekDates.map((date) => {
      const dayMeals = meals.filter((m) => m.date === date)
      const cal = dayMeals.reduce((a, m) => a + m.calories, 0)
      const pro = dayMeals.reduce((a, m) => a + m.protein, 0)
      const carb = dayMeals.reduce((a, m) => a + m.carbs, 0)
      const ft = dayMeals.reduce((a, m) => a + m.fat, 0)
      return {
        date,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(cal),
        protein: Math.round(pro),
        carbs: Math.round(carb),
        fat: Math.round(ft),
      }
    })
  }, [meals, selectedDate])

  const navigateDate = useCallback((direction: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev + 'T00:00:00')
      d.setDate(d.getDate() + direction)
      return formatDate(d)
    })
  }, [])

  const jumpToToday = useCallback(() => {
    setSelectedDate(formatDate(new Date()))
  }, [])

  const handleSave = useCallback(
    (meal: Meal) => {
      if (editingMeal) {
        updateMeal(meal)
      } else {
        addMeal(meal)
      }
      setShowForm(false)
      setEditingMeal(null)
    },
    [editingMeal, addMeal, updateMeal]
  )

  const handleDelete = useCallback(async () => {
    if (!deletingMeal) return
    deleteMeal(deletingMeal.id)
    setDeletingMeal(null)
  }, [deletingMeal, deleteMeal])

  const startEditTarget = useCallback((key: string, value: number) => {
    setEditingTarget(key)
    setEditValue(String(value))
  }, [])

  const saveTarget = useCallback(() => {
    if (!editingTarget) return
    const val = parseFloat(editValue)
    if (!isNaN(val) && val > 0) {
      setTargets((prev) => ({ ...prev, [editingTarget]: val }))
    }
    setEditingTarget(null)
  }, [editingTarget, editValue])

  const conicGradient = `conic-gradient(
    #f43f5e ${macroPercentages.protein}deg,
    #f97316 ${macroPercentages.protein}deg ${macroPercentages.protein + macroPercentages.carbs}deg,
    #38bdf8 ${macroPercentages.protein + macroPercentages.carbs}deg 360deg
  )`

  const macroCardConfigs = [
    { key: 'calories', label: 'Calories', icon: Flame, unit: 'kcal', border: 'border-rose-500/20', bg: 'from-rose-500/10', glow: 'bg-rose-500/10', text: 'text-rose-400', textMuted: 'text-rose-400/80', bar: 'bg-rose-500', value: summary.calories, target: targets.calories },
    { key: 'protein', label: 'Protein', icon: Beef, unit: 'g', border: 'border-emerald-500/20', bg: 'from-emerald-500/10', glow: 'bg-emerald-500/10', text: 'text-emerald-400', textMuted: 'text-emerald-400/80', bar: 'bg-emerald-500', value: summary.protein, target: targets.protein },
    { key: 'carbs', label: 'Carbs', icon: Wheat, unit: 'g', border: 'border-amber-500/20', bg: 'from-amber-500/10', glow: 'bg-amber-500/10', text: 'text-amber-400', textMuted: 'text-amber-400/80', bar: 'bg-amber-500', value: summary.carbs, target: targets.carbs },
    { key: 'fat', label: 'Fat', icon: Droplet, unit: 'g', border: 'border-sky-500/20', bg: 'from-sky-500/10', glow: 'bg-sky-500/10', text: 'text-sky-400', textMuted: 'text-sky-400/80', bar: 'bg-sky-500', value: summary.fat, target: targets.fat },
  ]

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Date Navigation */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium text-sm whitespace-nowrap">
              {getDayLabel(selectedDate)}
            </span>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {selectedDate !== formatDate(new Date()) && (
            <button
              onClick={jumpToToday}
              className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all"
              title="Jump to today"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeekly((p) => !p)}
            className={`p-2 rounded-xl border transition-all ${
              showWeekly
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Weekly summary"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>
      </motion.div>

      {/* Macro Distribution Ring + Daily Targets */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ring */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.07] to-transparent p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full -mr-20 -mt-20" />
          <div className="relative">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Macro Distribution</h4>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <div
                  className="w-28 h-28 rounded-full"
                  style={{ background: conicGradient }}
                />
                <div className="absolute inset-2 rounded-full bg-gray-950 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{Math.round(summary.calories)}</p>
                    <p className="text-[10px] text-gray-500 -mt-1">kcal</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-gray-400">Protein</span>
                  <span className="text-white font-medium ml-auto">{Math.round(macroPercentages.protein)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-gray-400">Carbs</span>
                  <span className="text-white font-medium ml-auto">{Math.round(macroPercentages.carbs)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-gray-400">Fat</span>
                  <span className="text-white font-medium ml-auto">{Math.round(macroPercentages.fat)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-400">Fiber</span>
                  <span className="text-white font-medium ml-auto">{Math.round(summary.fiber)}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Targets */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.07] to-transparent p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Daily Targets</h4>
              <Target className="w-4 h-4 text-blue-400/60" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
                <div key={key} className="relative">
                  <p className="text-xs text-gray-500 mb-1 capitalize">{key === 'calories' ? 'Calories (kcal)' : `${key} (g)`}</p>
                  {editingTarget === key ? (
                    <input
                      autoFocus
                      className="glass-input w-full text-sm py-1.5 px-2"
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveTarget}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(null) }}
                    />
                  ) : (
                    <button
                      onClick={() => startEditTarget(key, targets[key])}
                      className="w-full text-left px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <span className="text-lg font-bold text-white">{targets[key]}</span>
                      <span className="text-[10px] text-gray-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">click to edit</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macro Cards with Progress Bars */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {macroCardConfigs.map((macro) => {
          const progressPct = Math.round(progress[macro.key as keyof typeof progress] * 100)
          const Icon = macro.icon
          return (
            <div
              key={macro.key}
              className={`relative overflow-hidden rounded-2xl border ${macro.border} bg-gradient-to-br ${macro.bg} to-transparent p-6`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 ${macro.glow} rounded-full -mr-10 -mt-10`} />
              <div className="relative">
                <div className={`flex items-center gap-2 ${macro.textMuted} text-sm mb-2`}>
                  <Icon className="w-4 h-4" />
                  <span>{macro.label}</span>
                </div>
                <p className={`text-3xl font-black ${macro.text}`}>
                  {Math.round(macro.value)}
                  <span className="text-lg text-gray-500 ml-1">{macro.unit}</span>
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{progressPct}%</span>
                    <span className="text-gray-500">target: {macro.target}{macro.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${macro.bar} transition-all duration-500 ease-out`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Weekly Summary Toggle */}
      <AnimatePresence>
        {showWeekly && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/[0.07] to-transparent p-6"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -mr-20 -mt-20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Weekly Summary</h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Protein
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Carbs
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-sky-500" /> Fat
                  </span>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="protein" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="carbs" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="fat" fill="#38bdf8" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Calorie Trend Mini Line */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400/60" />
                  <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Calorie Trend</h5>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{
                          background: '#1f2937',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="calories"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 3 }}
                        activeDot={{ r: 5, fill: '#a855f7' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Macro Calculation Helper */}
      <button
        onClick={() => setShowCalcHelper((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-sm"
      >
        <Info className="w-4 h-4" />
        {showCalcHelper ? 'Hide' : 'Show'} Macro Calculation Helper
      </button>

      <AnimatePresence>
        {showCalcHelper && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-2xl font-bold text-rose-400">4</p>
                  <p className="text-gray-400">cal / g protein</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-400">4</p>
                  <p className="text-gray-400">cal / g carbs</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <p className="text-2xl font-bold text-sky-400">9</p>
                  <p className="text-gray-400">cal / g fat</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Did you know? Protein = {Math.round(summary.protein * 4)} cal | Carbs = {Math.round(summary.carbs * 4)} cal | Fat = {Math.round(summary.fat * 9)} cal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meals Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Meals</h3>
          <span className="text-sm text-gray-500">{filteredMeals.length} logged</span>
        </div>

        {filteredMeals.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-rose-400/50" />
            </div>
            <p className="text-gray-400 mb-1">No meals logged for this day</p>
            <p className="text-gray-500 text-sm mb-4">Start tracking what you eat</p>
            <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
              Log Your First Meal
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {(Object.entries(groupedMeals) as [string, Meal[]][]).map(([type, typeMeals]) => {
              if (typeMeals.length === 0) return null
              const config = MEAL_TYPE_CONFIG[type]
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{config.icon}</span>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{config.label}</h4>
                    <span className="text-xs text-gray-600">({typeMeals.length})</span>
                  </div>
                  <div className="space-y-3">
                    {typeMeals.map((meal) => {
                      const cfg = MEAL_TYPE_CONFIG[meal.mealType]
                      return (
                        <motion.div
                          key={meal.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center text-xl shadow-lg`}>
                                  {cfg.icon}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white tracking-tight">{meal.name}</h4>
                                  <p className="text-sm text-gray-400">{cfg.label}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditingMeal(meal); setShowForm(true) }}
                                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingMeal(meal)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                <p className="text-2xl font-bold text-white">{meal.calories}</p>
                                <p className="text-xs text-gray-500">kcal</p>
                              </div>
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <p className="text-2xl font-bold text-emerald-400">{meal.protein}g</p>
                                <p className="text-xs text-emerald-400/80">Protein</p>
                              </div>
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <p className="text-2xl font-bold text-amber-400">{meal.carbs}g</p>
                                <p className="text-xs text-amber-400/80">Carbs</p>
                              </div>
                              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                                <p className="text-2xl font-bold text-sky-400">{meal.fat}g</p>
                                <p className="text-xs text-sky-400/80">Fat</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      <MealForm isOpen={showForm} onClose={() => { setShowForm(false); setEditingMeal(null) }} onSave={handleSave} meal={editingMeal} />

      <AnimatePresence>
        {deletingMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeletingMeal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Meal?</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                This will permanently delete <span className="text-white font-medium">{deletingMeal.name}</span>. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingMeal(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

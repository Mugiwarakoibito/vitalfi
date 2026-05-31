import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet,
  Pencil, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, BarChart3, TrendingUp, Target, Info, RotateCcw,
  Activity, Gauge, Settings, X, Bookmark, BookmarkPlus, ChefHat,
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

interface SavedRecipe {
  id: string
  name: string
  mealType: Meal['mealType']
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  createdAt: string
}

function loadRecipes(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem('nutrition_recipes')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveRecipes(r: SavedRecipe[]) {
  localStorage.setItem('nutrition_recipes', JSON.stringify(r))
}

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
  const [showSettings, setShowSettings] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [dietaryPreset, setDietaryPreset] = useState<string>(() => localStorage.getItem('nutrition_preset') || 'balanced')
  const [mealReminder, setMealReminder] = useState(() => localStorage.getItem('nutrition_reminder') === 'true')
  const [recipes, setRecipes] = useState<SavedRecipe[]>(loadRecipes)
  const [showRecipes, setShowRecipes] = useState(false)

  useEffect(() => { saveRecipes(recipes) }, [recipes])
  useEffect(() => { saveTargets(targets) }, [targets])
  useEffect(() => { localStorage.setItem('nutrition_preset', dietaryPreset) }, [dietaryPreset])
  useEffect(() => { localStorage.setItem('nutrition_reminder', String(mealReminder)) }, [mealReminder])

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

  const saveAsRecipe = useCallback((meal: Meal) => {
    const existing = recipes.find(r => r.name.toLowerCase() === meal.name.toLowerCase() && r.mealType === meal.mealType)
    if (existing) return
    const recipe: SavedRecipe = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2),
      name: meal.name,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      createdAt: new Date().toISOString(),
    }
    setRecipes(prev => [recipe, ...prev])
  }, [recipes])

  const addRecipeToDay = useCallback((recipe: SavedRecipe) => {
    const meal: Meal = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2),
      date: selectedDate,
      name: recipe.name,
      mealType: recipe.mealType,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addMeal(meal)
  }, [selectedDate, addMeal])

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [])

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
          <button
            onClick={() => setShowRecipes((p) => !p)}
            className={`p-2 rounded-xl border transition-all ${
              showRecipes
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Saved recipes"
          >
            <ChefHat className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4 h-4" />
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
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.12] via-violet-500/[0.04] to-transparent p-8 shadow-lg shadow-violet-500/5">
          <div className="absolute top-0 right-0 w-60 h-60 bg-violet-500/10 rounded-full -mr-30 -mt-30 blur-xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/8 rounded-full -ml-20 -mb-20 blur-lg" />
          <div className="relative">
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-6">Macro Distribution</h4>
            <div className="flex items-center gap-8">
              <div className="relative w-36 h-36 shrink-0">
                <div
                  className="w-36 h-36 rounded-full shadow-xl shadow-violet-500/10"
                  style={{ background: conicGradient }}
                />
                <div className="absolute inset-3 rounded-full bg-gray-950 flex items-center justify-center border border-white/5">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white drop-shadow-lg">{Math.round(summary.calories)}</p>
                    <p className="text-xs text-gray-500 -mt-0.5">kcal</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm flex-1">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <span className="text-gray-400">Protein</span>
                  <span className="text-white font-semibold ml-auto">{Math.round(macroPercentages.protein)}%</span>
                  <span className="text-xs text-gray-500">({Math.round(summary.protein)}g)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span className="text-gray-400">Carbs</span>
                  <span className="text-white font-semibold ml-auto">{Math.round(macroPercentages.carbs)}%</span>
                  <span className="text-xs text-gray-500">({Math.round(summary.carbs)}g)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-4 h-4 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50" />
                  <span className="text-gray-400">Fat</span>
                  <span className="text-white font-semibold ml-auto">{Math.round(macroPercentages.fat)}%</span>
                  <span className="text-xs text-gray-500">({Math.round(summary.fat)}g)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  <span className="text-gray-400">Fiber</span>
                  <span className="text-white font-semibold ml-auto">{Math.round(summary.fiber)}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Targets */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.03] to-transparent p-6 shadow-lg shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-full -mr-24 -mt-24 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mb-16 blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-blue-400" /></div>
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-widest">Daily Targets</h4>
              </div>
              <span className="text-[10px] text-gray-500">Tap a value to edit</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => {
                const colors = key === 'calories'
                  ? { border: 'border-rose-500/30', hover: 'hover:border-rose-500/50', glow: 'hover:shadow-rose-500/5', bg: 'from-rose-500/10', input: 'border-rose-500/40' }
                  : key === 'protein'
                    ? { border: 'border-blue-500/30', hover: 'hover:border-blue-500/50', glow: 'hover:shadow-blue-500/5', bg: 'from-blue-500/10', input: 'border-blue-500/40' }
                    : key === 'carbs'
                      ? { border: 'border-amber-500/30', hover: 'hover:border-amber-500/50', glow: 'hover:shadow-amber-500/5', bg: 'from-amber-500/10', input: 'border-amber-500/40' }
                      : { border: 'border-purple-500/30', hover: 'hover:border-purple-500/50', glow: 'hover:shadow-purple-500/5', bg: 'from-purple-500/10', input: 'border-purple-500/40' }
                return (
                <div key={key} className="relative group">
                  <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{key === 'calories' ? 'Calories (kcal)' : `${key} (g)`}</p>
                  {editingTarget === key ? (
                    <input
                      autoFocus
                      className={`w-full text-sm py-2 px-3 rounded-xl bg-white/5 ${colors.input} text-white font-semibold focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveTarget}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(null) }}
                    />
                  ) : (
                    <button
                      onClick={() => startEditTarget(key, targets[key])}
                      className={`w-full text-left px-3 py-2 rounded-xl bg-gradient-to-br ${colors.bg} to-transparent ${colors.border} ${colors.hover} ${colors.glow} hover:bg-opacity-15 transition-all duration-300`}
                    >
                      <span className="text-xl font-bold text-white drop-shadow-sm">{targets[key]}</span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">click to edit</span>
                    </button>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macro Cards with Progress Bars */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macroCardConfigs.map((macro) => {
          const progressPct = Math.round(progress[macro.key as keyof typeof progress] * 100)
          return (
            <div
              key={macro.key}
              className={`relative overflow-hidden rounded-2xl border ${macro.border} bg-gradient-to-br ${macro.bg} via-transparent to-transparent p-6 shadow-lg ${macro.border.replace('border-', 'shadow-').replace('/20', '/5')}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${macro.glow} rounded-full -mr-16 -mt-16 blur-xl`} />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <macro.icon className={`w-5 h-5 ${macro.text}`} />
                  <div className={`${macro.textMuted} text-xs font-medium uppercase tracking-wider`}>{macro.label}</div>
                </div>
                <p className={`text-4xl font-bold ${macro.text} drop-shadow-lg`}>
                  {Math.round(macro.value)}
                  <span className="text-sm text-gray-500 ml-1 font-normal">{macro.unit}</span>
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">{progressPct}% of target</span>
                    <span className="text-gray-500">{macro.target}{macro.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full ${macro.bar} transition-all duration-700 ease-out shadow-sm`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Calorie Balance & Weekly Avg */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-6 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              Calorie Balance
            </div>
            <p className={`text-4xl font-bold drop-shadow-lg ${summary.calories <= targets.calories ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Math.abs(summary.calories - targets.calories).toLocaleString()}
              <span className="text-sm text-gray-500 ml-1 font-normal">kcal</span>
            </p>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {summary.calories <= targets.calories ? 'under' : 'over'} target
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.12] via-indigo-500/[0.04] to-transparent p-6 shadow-lg shadow-indigo-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Daily Avg (week)
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((k) => {
                const total = weeklyData.reduce((s, d) => s + d[k], 0)
                const avg = weeklyData.length > 0 ? Math.round(total / weeklyData.length) : 0
                const colors: Record<string, string> = { calories: 'text-rose-400', protein: 'text-emerald-400', carbs: 'text-amber-400', fat: 'text-sky-400' }
                const labels: Record<string, string> = { calories: 'Cal', protein: 'Pro', carbs: 'Carbs', fat: 'Fat' }
                return (
                  <div key={k} className="rounded-xl bg-white/[0.05] border border-white/5 p-3 text-center hover:bg-white/[0.08] transition-all">
                    <p className={`text-lg font-bold ${colors[k]}`}>{avg}{k === 'calories' ? '' : 'g'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{labels[k]}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Summary Toggle */}
      <AnimatePresence>
        {showWeekly && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16 }}
            className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.12] via-indigo-500/[0.04] to-transparent p-6 shadow-lg shadow-indigo-500/5"
          >
            <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full -mr-30 -mt-30 blur-xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/8 rounded-full -ml-20 -mb-20 blur-lg" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Weekly Summary</h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" /> Protein
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" /> Carbs
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50" /> Fat
                  </span>
                </div>
              </div>
              <div className="h-64">
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
                        backdropFilter: 'blur(12px)',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="protein" fill="#f43f5e" radius={[6, 6, 0, 0]} stackId="a" />
                    <Bar dataKey="carbs" fill="#f97316" radius={[6, 6, 0, 0]} stackId="a" />
                    <Bar dataKey="fat" fill="#38bdf8" radius={[6, 6, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Calorie Trend Mini Line */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Calorie Trend</h5>
                </div>
                <div className="h-32">
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
                          backdropFilter: 'blur(12px)',
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <defs>
                        <linearGradient id="calTrendGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="calories"
                        stroke="url(#calTrendGrad)"
                        strokeWidth={2.5}
                        dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: '#1f2937' }}
                        activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 2, stroke: '#1f2937' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipes Panel */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-6 shadow-lg shadow-emerald-500/5"
          >
            <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full -mr-30 -mt-30 blur-xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/8 rounded-full -ml-20 -mb-20 blur-lg" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Saved Recipes</h4>
                </div>
                <span className="text-xs text-gray-500">{recipes.length} recipes</span>
              </div>
              {recipes.length === 0 ? (
                <div className="text-center py-6">
                  <Bookmark className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No saved recipes yet</p>
                  <p className="text-xs text-gray-600 mt-1">Click the bookmark icon on any meal to save it</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="relative group rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-1">{recipe.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{MEAL_TYPE_CONFIG[recipe.mealType]?.label || recipe.mealType}</p>
                        </div>
                        <button onClick={() => deleteRecipe(recipe.id)} className="p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div><p className="text-xs font-bold text-white">{recipe.calories}</p><p className="text-[9px] text-gray-600">kcal</p></div>
                        <div><p className="text-xs font-bold text-emerald-400">{recipe.protein}g</p><p className="text-[9px] text-gray-600">pro</p></div>
                        <div><p className="text-xs font-bold text-amber-400">{recipe.carbs}g</p><p className="text-[9px] text-gray-600">carbs</p></div>
                        <div><p className="text-xs font-bold text-sky-400">{recipe.fat}g</p><p className="text-[9px] text-gray-600">fat</p></div>
                      </div>
                      <button
                        onClick={() => addRecipeToDay(recipe)}
                        className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-medium"
                      >
                        Add to today
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Macro Calculation Helper */}
      <button
        onClick={() => setShowCalcHelper((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all text-sm font-medium group"
      >
        <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all"><Info className="w-3.5 h-3.5 text-purple-400" /></div>
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
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-900/5 to-transparent p-5 shadow-lg shadow-purple-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center"><Info className="w-3.5 h-3.5 text-purple-400" /></div>
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">Caloric Values</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/20 to-transparent p-3 text-center shadow-lg shadow-rose-500/5">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-rose-300 to-rose-500 drop-shadow-lg">4</p>
                    <p className="text-xs text-gray-400 mt-0.5">cal / g protein</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-transparent p-3 text-center shadow-lg shadow-amber-500/5">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-500 drop-shadow-lg">4</p>
                    <p className="text-xs text-gray-400 mt-0.5">cal / g carbs</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-transparent p-3 text-center shadow-lg shadow-sky-500/5">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-500 drop-shadow-lg">9</p>
                    <p className="text-xs text-gray-400 mt-0.5">cal / g fat</p>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 text-center">
                    Protein = <span className="text-rose-400 font-semibold">{Math.round(summary.protein * 4)} cal</span>
                    <span className="mx-1.5 text-gray-600">|</span>
                    Carbs = <span className="text-amber-400 font-semibold">{Math.round(summary.carbs * 4)} cal</span>
                    <span className="mx-1.5 text-gray-600">|</span>
                    Fat = <span className="text-sky-400 font-semibold">{Math.round(summary.fat * 9)} cal</span>
                  </p>
                </div>
              </div>
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
                                  onClick={() => saveAsRecipe(meal)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Save as recipe"
                                >
                                  <BookmarkPlus className="w-4 h-4" />
                                </button>
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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-lg"><Settings className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Nutrition Settings</h3>
                      <p className="text-xs text-gray-500">Targets, presets & data</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-5">
                  {/* Dietary Preset */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Dietary Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'balanced', label: 'Balanced', icon: '⚖️' },
                        { id: 'keto', label: 'Keto', icon: '🥑' },
                        { id: 'vegan', label: 'Vegan', icon: '🌱' },
                        { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
                      ].map((p) => (
                        <button key={p.id} onClick={() => { setDietaryPreset(p.id) }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            dietaryPreset === p.id
                              ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="mr-1.5">{p.icon}</span>{p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Macro Targets Summary */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Current Targets</label>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(['calories', 'protein', 'carbs', 'fat'] as const).map((k) => (
                        <div key={k} className="rounded-lg bg-white/5 p-2">
                          <p className="text-[10px] text-gray-500 uppercase">{k === 'calories' ? 'Cal' : k}</p>
                          <p className="text-sm font-bold text-white">{targets[k]}{k === 'calories' ? '' : 'g'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal Reminder Toggle */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-white">Meal Reminder</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Daily reminder to log meals</p>
                      </div>
                      <button onClick={() => setMealReminder(!mealReminder)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${mealReminder ? 'bg-purple-500' : 'bg-white/10'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${mealReminder ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Data Management</h4>
                    {!confirmClear ? (
                      <button onClick={() => setConfirmClear(true)} className="w-full px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Clear All Meal Data
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400/80 text-center">This permanently deletes all meal entries.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmClear(false)} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs">Cancel</button>
                          <button onClick={() => { meals.forEach(m => deleteMeal(m.id)); setConfirmClear(false) }} className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-xs font-semibold">Delete All</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

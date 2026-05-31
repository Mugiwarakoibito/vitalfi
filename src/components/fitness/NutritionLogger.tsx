import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet,
  Pencil, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, BarChart3, Award, RotateCcw,
  Activity, Clock, ChefHat, Bookmark, BookmarkPlus,
  CalendarDays, Lightbulb, GlassWater, Zap,
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

const FOOD_SUGGESTIONS: Record<string, { name: string; protein: number; carbs: number; fat: number; calories: number; emoji: string }[]> = {
  high_protein: [
    { name: 'Chicken Breast', protein: 31, carbs: 0, fat: 3.6, calories: 165, emoji: '🍗' },
    { name: 'Greek Yogurt', protein: 10, carbs: 4, fat: 0.7, calories: 59, emoji: '🥛' },
    { name: 'Eggs', protein: 13, carbs: 1, fat: 11, calories: 155, emoji: '🥚' },
    { name: 'Tuna', protein: 30, carbs: 0, fat: 1, calories: 132, emoji: '🐟' },
    { name: 'Cottage Cheese', protein: 11, carbs: 3, fat: 4, calories: 98, emoji: '🧀' },
  ],
  high_carbs: [
    { name: 'Oats', protein: 17, carbs: 66, fat: 7, calories: 389, emoji: '🥣' },
    { name: 'Brown Rice', protein: 5, carbs: 45, fat: 1.6, calories: 216, emoji: '🍚' },
    { name: 'Sweet Potato', protein: 2, carbs: 26, fat: 0.1, calories: 112, emoji: '🍠' },
    { name: 'Banana', protein: 1, carbs: 27, fat: 0.3, calories: 105, emoji: '🍌' },
    { name: 'Quinoa', protein: 8, carbs: 39, fat: 3.6, calories: 222, emoji: '🌾' },
  ],
  healthy_fat: [
    { name: 'Avocado', protein: 2, carbs: 9, fat: 15, calories: 160, emoji: '🥑' },
    { name: 'Almonds', protein: 21, carbs: 22, fat: 50, calories: 579, emoji: '🥜' },
    { name: 'Olive Oil', protein: 0, carbs: 0, fat: 14, calories: 119, emoji: '🫒' },
    { name: 'Salmon', protein: 25, carbs: 0, fat: 13, calories: 208, emoji: '🐠' },
    { name: 'Chia Seeds', protein: 17, carbs: 42, fat: 31, calories: 486, emoji: '🌰' },
  ],
}

const WATER_GOAL_ML = 2500

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

function loadWater(): number {
  try { return parseInt(localStorage.getItem('nutrition_water_' + formatDate(new Date())) || '0') } catch { return 0 }
}

function saveWater(ml: number) {
  localStorage.setItem('nutrition_water_' + formatDate(new Date()), String(ml))
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
  const [recipes, setRecipes] = useState<SavedRecipe[]>(loadRecipes)
  const [showRecipes, setShowRecipes] = useState(false)
  const [waterMl, setWaterMl] = useState(loadWater)

  useEffect(() => { saveRecipes(recipes) }, [recipes])
  useEffect(() => { saveTargets(targets) }, [targets])
  useEffect(() => { saveWater(waterMl) }, [waterMl])

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

  const remaining = useMemo(() => ({
    calories: Math.max(0, targets.calories - summary.calories),
    protein: Math.max(0, targets.protein - summary.protein),
    carbs: Math.max(0, targets.carbs - summary.carbs),
    fat: Math.max(0, targets.fat - summary.fat),
  }), [summary, targets])

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

  // Smart meal suggestions based on remaining macros
  const suggestions = useMemo(() => {
    const result: { emoji: string; text: string; macro: string }[] = []
    if (remaining.protein > 20) {
      const deficit = remaining.protein
      const best = FOOD_SUGGESTIONS.high_protein.slice(0, 3)
      result.push({
        emoji: '💪',
        text: `Need ${Math.round(deficit)}g more protein — ${best.map(f => `${f.emoji} ${f.name} (~${f.protein}g/100g)`).join(', ')}`,
        macro: 'protein',
      })
    }
    if (remaining.carbs > 30) {
      const best = FOOD_SUGGESTIONS.high_carbs.slice(0, 2)
      result.push({
        emoji: '🌾',
        text: `Still need ${Math.round(remaining.carbs)}g carbs — ${best.map(f => `${f.emoji} ${f.name}`).join(', ')}`,
        macro: 'carbs',
      })
    }
    if (remaining.fat > 15) {
      const best = FOOD_SUGGESTIONS.healthy_fat.slice(0, 2)
      result.push({
        emoji: '🥑',
        text: `Need ${Math.round(remaining.fat)}g more fat — ${best.map(f => `${f.emoji} ${f.name}`).join(', ')}`,
        macro: 'fat',
      })
    }
    return result
  }, [remaining])

  // Meal Calendar Heatmap data
  const [heatmapYear, heatmapMonth] = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    return [d.getFullYear(), d.getMonth()] as const
  }, [selectedDate])

  const heatmapDays = useMemo(() => {
    const [year, month] = [heatmapYear, heatmapMonth]
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDow = firstDay.getDay()

    interface HeatCell {
      date: string
      day: number
      calories: number
      level: 0 | 1 | 2 | 3
    }

    const cells: (HeatCell | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)

    const calTarget = targets.calories || 2000

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d))
      const dayMeals = meals.filter(m => m.date === dateStr)
      const totalCal = dayMeals.reduce((a, m) => a + m.calories, 0)

      let level: 0 | 1 | 2 | 3 = 0
      if (totalCal > 0) {
        const ratio = totalCal / calTarget
        if (ratio <= 1.1) level = 1
        else if (ratio <= 1.3) level = 2
        else level = 3
      }

      cells.push({ date: dateStr, day: d, calories: totalCal, level })
    }

    return cells
  }, [meals, heatmapYear, heatmapMonth, targets.calories])

  // Meal Timing Analysis data
  const timingData = useMemo(() => {
    const totals: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    for (const m of filteredMeals) {
      totals[m.mealType] = (totals[m.mealType] || 0) + m.calories
    }
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1
    return {
      breakfast: { calories: totals.breakfast, pct: Math.round((totals.breakfast / total) * 100) },
      lunch: { calories: totals.lunch, pct: Math.round((totals.lunch / total) * 100) },
      dinner: { calories: totals.dinner, pct: Math.round((totals.dinner / total) * 100) },
      snack: { calories: totals.snack, pct: Math.round((totals.snack / total) * 100) },
    }
  }, [filteredMeals])

  // Goal Recommendation Engine
  const recommendation = useMemo(() => {
    const daysWithData = weeklyData.filter(d => d.calories > 0)
    if (daysWithData.length < 3) return null

    const overDays = daysWithData.filter(d => d.calories > targets.calories)
    const underDays = daysWithData.filter(d => d.calories < targets.calories)

    if (overDays.length >= 3) {
      const avgOver = Math.round(overDays.reduce((s, d) => s + (d.calories - targets.calories), 0) / overDays.length)
      return {
        type: 'warning' as const,
        title: 'Over Target Trend',
        message: `You're averaging ${avgOver} cal over target this week. Try reducing portion sizes or adding more vegetables.`,
      }
    }

    if (underDays.length >= 3) {
      const avgUnder = Math.round(underDays.reduce((s, d) => s + (targets.calories - d.calories), 0) / underDays.length)
      return {
        type: 'info' as const,
        title: 'Under Target Trend',
        message: `You're averaging ${avgUnder} cal under target this week. Consider adding a nutrient-dense snack.`,
      }
    }

    if (daysWithData.length >= 5) {
      const avgCal = Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      const diff = Math.abs(avgCal - targets.calories)
      if (diff < 100) {
        return {
          type: 'success' as const,
          title: 'Great Consistency!',
          message: `You're averaging ${avgCal} cal this week — right on target! Keep up the great work.`,
        }
      }
    }

    return null
  }, [weeklyData, targets.calories])

  // Meal Frequency Stats
  const frequencyStats = useMemo(() => {
    const weekDates = getWeekDates(new Date(selectedDate + 'T00:00:00'))
    const daysWithMeals = weekDates.map(d => meals.filter(m => m.date === d))
    const daysWithSomeData = daysWithMeals.filter(d => d.length > 0)

    const avgMealsPerDay = daysWithSomeData.length > 0
      ? Math.round((daysWithMeals.reduce((s, d) => s + d.length, 0) / daysWithMeals.length) * 10) / 10
      : 0

    const mealTypeCounts: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    for (const dayMeals of daysWithMeals) {
      const types = new Set(dayMeals.map(m => m.mealType))
      for (const t of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        if (!types.has(t)) mealTypeCounts[t]++
      }
    }
    const mostSkippedEntry = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1])[0]
    const mostSkipped = mostSkippedEntry ? mostSkippedEntry[0] : 'n/a'

    const calTarget = targets.calories || 2000
    const targetProteinPct = (targets.protein * 4) / calTarget * 100
    const targetCarbsPct = (targets.carbs * 4) / calTarget * 100
    const targetFatPct = (targets.fat * 9) / calTarget * 100

    let bestDayStr: string | null = null
    let bestScore = Infinity

    for (const day of weeklyData) {
      if (day.calories === 0) continue
      const dayCal = day.calories || 1
      const dayProteinPct = (day.protein * 4) / dayCal * 100
      const dayCarbsPct = (day.carbs * 4) / dayCal * 100
      const dayFatPct = (day.fat * 9) / dayCal * 100

      const score = Math.abs(dayProteinPct - targetProteinPct) + Math.abs(dayCarbsPct - targetCarbsPct) + Math.abs(dayFatPct - targetFatPct)
      if (score < bestScore) {
        bestScore = score
        bestDayStr = day.label
      }
    }

    return { avgMealsPerDay, mostSkipped, bestDay: bestDayStr }
  }, [meals, selectedDate, weeklyData, targets])

  const macroCardConfigs = [
    { key: 'calories', label: 'Calories', icon: Flame, unit: 'kcal', border: 'border-rose-500/20', bg: 'from-rose-500/10', glow: 'bg-rose-500/10', text: 'text-rose-400', textMuted: 'text-rose-400/80', bar: 'bg-rose-500', value: summary.calories, target: targets.calories },
    { key: 'protein', label: 'Protein', icon: Beef, unit: 'g', border: 'border-emerald-500/20', bg: 'from-emerald-500/10', glow: 'bg-emerald-500/10', text: 'text-emerald-400', textMuted: 'text-emerald-400/80', bar: 'bg-emerald-500', value: summary.protein, target: targets.protein },
    { key: 'carbs', label: 'Carbs', icon: Wheat, unit: 'g', border: 'border-amber-500/20', bg: 'from-amber-500/10', glow: 'bg-amber-500/10', text: 'text-amber-400', textMuted: 'text-amber-400/80', bar: 'bg-amber-500', value: summary.carbs, target: targets.carbs },
    { key: 'fat', label: 'Fat', icon: Droplet, unit: 'g', border: 'border-sky-500/20', bg: 'from-sky-500/10', glow: 'bg-sky-500/10', text: 'text-sky-400', textMuted: 'text-sky-400/80', bar: 'bg-sky-500', value: summary.fat, target: targets.fat },
  ]

  return (
    <motion.div className="space-y-5" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header: Date Nav + Quick Actions */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
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
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
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
          <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>
      </motion.div>

      {/* Smart Suggestions Banner */}
      {suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent p-4 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-xl" />
          <div className="relative flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Suggested for today</p>
              {suggestions.map((s, i) => (
                <p key={i} className="text-sm text-gray-300">{s.emoji} {s.text}</p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Macro Progress Cards + Remaining */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macroCardConfigs.map((macro) => {
          const progressPct = Math.round(progress[macro.key as keyof typeof progress] * 100)
          const remainingVal = remaining[macro.key as keyof typeof remaining]
          const isOver = macro.key === 'calories' ? summary.calories > targets.calories : remainingVal === 0
          return (
            <div
              key={macro.key}
              className={`relative overflow-hidden rounded-2xl border ${macro.border} bg-gradient-to-br ${macro.bg} via-transparent to-transparent p-5 shadow-lg ${macro.border.replace('border-', 'shadow-').replace('/20', '/5')}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${macro.glow} rounded-full -mr-16 -mt-16 blur-xl`} />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <macro.icon className={`w-5 h-5 ${macro.text}`} />
                  {editingTarget === macro.key ? (
                    <input
                      autoFocus
                      className={`w-20 text-xs py-0.5 px-2 rounded-lg bg-white/10 border ${macro.border.replace('/20', '/40')} text-white font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveTarget}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(null) }}
                    />
                  ) : (
                    <button onClick={() => startEditTarget(macro.key, macro.target)} className={`${macro.textMuted} text-xs font-medium uppercase tracking-wider hover:text-white transition-all`}>
                      {macro.label}
                    </button>
                  )}
                </div>
                <p className={`text-3xl font-bold ${macro.text} drop-shadow-lg`}>
                  {Math.round(macro.value)}
                  <span className="text-sm text-gray-500 ml-1 font-normal">/ {macro.target}{macro.unit}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full ${macro.bar} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 font-medium ${isOver ? 'text-rose-400' : 'text-gray-400'}`}>
                  {isOver
                    ? macro.key === 'calories' ? `Over by ${Math.round(summary.calories - targets.calories)}` : 'Hit target'
                    : `${Math.round(remainingVal)} ${macro.unit} remaining`
                  }
                </p>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Water Quick Tracker */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-cyan-500/[0.02] to-transparent p-4 shadow-lg shadow-cyan-500/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GlassWater className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Water Intake</p>
              <p className="text-lg font-bold text-cyan-300">{waterMl}ml <span className="text-xs text-gray-500 font-normal">/ {WATER_GOAL_ML}ml</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-36 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{ width: `${Math.min((waterMl / WATER_GOAL_ML) * 100, 100)}%` }} />
            </div>
            <button onClick={() => setWaterMl(p => Math.max(0, p - 250))} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs">−250</button>
            <button onClick={() => setWaterMl(p => p + 250)} className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-medium">+250ml</button>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="h-64">
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

      {/* Insights Grid: Timing + Frequency + Recommendation */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Meal Timing Analysis */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.12] via-cyan-500/[0.04] to-transparent p-5 shadow-lg shadow-cyan-500/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full -mr-20 -mt-20 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Meal Timing</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                const data = timingData[type]
                const iconMap: Record<string, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }
                const colorMap: Record<string, { text: string; bar: string }> = {
                  breakfast: { text: 'text-amber-400', bar: 'bg-amber-500' },
                  lunch: { text: 'text-emerald-400', bar: 'bg-emerald-500' },
                  dinner: { text: 'text-rose-400', bar: 'bg-rose-500' },
                  snack: { text: 'text-sky-400', bar: 'bg-sky-500' },
                }
                const c = colorMap[type]
                return (
                  <div key={type} className="rounded-lg bg-white/5 border border-white/5 p-2 text-center">
                    <span className="text-base">{iconMap[type]}</span>
                    <p className={`text-lg font-bold ${c.text}`}>{data.pct}%</p>
                    <p className="text-[9px] text-gray-500 capitalize">{type}</p>
                    <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${data.pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Meal Frequency Stats */}
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/[0.12] via-fuchsia-500/[0.04] to-transparent p-5 shadow-lg shadow-fuchsia-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-fuchsia-400" />
              <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Frequency</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 border border-white/5 p-2.5 text-center">
                <p className="text-lg font-bold text-fuchsia-300">{frequencyStats.avgMealsPerDay}</p>
                <p className="text-[9px] text-gray-500">avg / day</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/5 p-2.5 text-center">
                <p className="text-sm font-bold text-fuchsia-300 capitalize">{frequencyStats.mostSkipped === 'n/a' ? 'N/A' : frequencyStats.mostSkipped}</p>
                <p className="text-[9px] text-gray-500">most skipped</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/5 p-2.5 text-center">
                <p className="text-sm font-bold text-fuchsia-300">{frequencyStats.bestDay ?? 'N/A'}</p>
                <p className="text-[9px] text-gray-500">best macro day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation ? (
          <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg ${
            recommendation.type === 'warning'
              ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent shadow-amber-500/5'
              : recommendation.type === 'info'
              ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/[0.12] via-blue-500/[0.04] to-transparent shadow-blue-500/5'
              : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent shadow-emerald-500/5'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  recommendation.type === 'warning' ? 'bg-amber-500/20' : recommendation.type === 'info' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                }`}>
                  {recommendation.type === 'success' ? (
                    <Award className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${recommendation.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`} />
                  )}
                </div>
                <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Insight</h4>
              </div>
              <h5 className={`text-sm font-bold mb-1 ${
                recommendation.type === 'warning' ? 'text-amber-300' : recommendation.type === 'info' ? 'text-blue-300' : 'text-emerald-300'
              }`}>{recommendation.title}</h5>
              <p className="text-xs text-gray-400 leading-relaxed">{recommendation.message}</p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gradient-to-br from-gray-500/[0.08] via-gray-500/[0.02] to-transparent p-5 shadow-lg">
            <div className="relative flex items-center gap-3 h-full">
              <div className="w-7 h-7 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Log 3+ days of meals</p>
                <p className="text-[10px] text-gray-600">to see personalized insights</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Meal Calendar Heatmap */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.12] via-violet-500/[0.04] to-transparent p-5 shadow-lg shadow-violet-500/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full -mr-24 -mt-24 blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/8 rounded-full -ml-16 -mb-16 blur-lg" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-violet-400" />
            <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Monthly Heatmap</h4>
          </div>
          <div className="flex items-center justify-center">
            <div className="inline-grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="w-8 text-center text-[9px] text-gray-600 font-medium">{d}</div>
              ))}
              {heatmapDays.map((cell, idx) => {
                if (cell === null) {
                  return <div key={`e-${idx}`} className="w-8 h-8" />
                }
                const colorMap: Record<number, string> = {
                  0: 'bg-gray-800 border border-white/5',
                  1: 'bg-emerald-500/30 border border-emerald-500/40',
                  2: 'bg-amber-500/30 border border-amber-500/40',
                  3: 'bg-rose-500/30 border border-rose-500/40',
                }
                return (
                  <div
                    key={cell.date}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold cursor-default transition-all hover:scale-110 ${colorMap[cell.level]}`}
                    title={`${cell.date}: ${cell.calories} kcal`}
                  >
                    <span className={cell.level === 0 ? 'text-gray-600' : 'text-white'}>{cell.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-gray-800 border border-white/5" />
              <span className="text-[9px] text-gray-500">No data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
              <span className="text-[9px] text-gray-500">On target</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/40" />
              <span className="text-[9px] text-gray-500">Slightly over</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/40" />
              <span className="text-[9px] text-gray-500">Way over</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recipes Panel */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-5 shadow-lg shadow-emerald-500/5"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/8 rounded-full -ml-16 -mb-16 blur-lg" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Saved Recipes</h4>
                </div>
                <span className="text-[10px] text-gray-500">{recipes.length} recipes</span>
              </div>
              {recipes.length === 0 ? (
                <div className="text-center py-4">
                  <Bookmark className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">No saved recipes yet</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Click the bookmark icon on any meal to save it</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="relative group rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="text-xs font-semibold text-white line-clamp-1">{recipe.name}</p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider">{MEAL_TYPE_CONFIG[recipe.mealType]?.label || recipe.mealType}</p>
                        </div>
                        <button onClick={() => deleteRecipe(recipe.id)} className="p-0.5 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center mb-1.5">
                        <div><p className="text-[10px] font-bold text-white">{recipe.calories}</p><p className="text-[8px] text-gray-600">kcal</p></div>
                        <div><p className="text-[10px] font-bold text-emerald-400">{recipe.protein}g</p><p className="text-[8px] text-gray-600">pro</p></div>
                        <div><p className="text-[10px] font-bold text-amber-400">{recipe.carbs}g</p><p className="text-[8px] text-gray-600">carbs</p></div>
                        <div><p className="text-[10px] font-bold text-sky-400">{recipe.fat}g</p><p className="text-[8px] text-gray-600">fat</p></div>
                      </div>
                      <button
                        onClick={() => addRecipeToDay(recipe)}
                        className="w-full py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-medium"
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

      {/* Meals Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Meals</h3>
          <span className="text-xs text-gray-500">{filteredMeals.length} logged</span>
        </div>

        {filteredMeals.length === 0 ? (
          <Card className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6 text-rose-400/50" />
            </div>
            <p className="text-gray-400 text-sm mb-1">No meals logged for this day</p>
            <p className="text-gray-500 text-xs mb-3">Start tracking what you eat</p>
            <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
              Log Your First Meal
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {(Object.entries(groupedMeals) as [string, Meal[]][]).map(([type, typeMeals]) => {
              if (typeMeals.length === 0) return null
              const config = MEAL_TYPE_CONFIG[type]
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{config.icon}</span>
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{config.label}</h4>
                    <span className="text-[10px] text-gray-600">({typeMeals.length})</span>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => {
                      const cfg = MEAL_TYPE_CONFIG[meal.mealType]
                      return (
                        <motion.div
                          key={meal.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center text-base shadow-lg`}>
                                  {cfg.icon}
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-white tracking-tight">{meal.name}</h4>
                                </div>
                              </div>
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => saveAsRecipe(meal)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Save as recipe"
                                >
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditingMeal(meal); setShowForm(true) }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingMeal(meal)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                                <p className="text-lg font-bold text-white">{meal.calories}</p>
                                <p className="text-[9px] text-gray-500">kcal</p>
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <p className="text-lg font-bold text-emerald-400">{meal.protein}g</p>
                                <p className="text-[9px] text-emerald-400/80">Protein</p>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                                <p className="text-lg font-bold text-amber-400">{meal.carbs}g</p>
                                <p className="text-[9px] text-amber-400/80">Carbs</p>
                              </div>
                              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-center">
                                <p className="text-lg font-bold text-sky-400">{meal.fat}g</p>
                                <p className="text-[9px] text-sky-400/80">Fat</p>
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
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white text-center mb-1">Delete Meal?</h3>
              <p className="text-gray-400 text-xs text-center mb-5">
                This will permanently delete <span className="text-white font-medium">{deletingMeal.name}</span>. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingMeal(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm"
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

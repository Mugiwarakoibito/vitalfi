import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet,
  Pencil, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, BarChart3, Award, RotateCcw,
  ChefHat, Bookmark, BookmarkPlus,
  Lightbulb,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { MealForm } from './MealForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Meal } from '@/types/fitness'

const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

const MEAL_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  breakfast: { label: 'Breakfast', icon: '🍳' },
  lunch: { label: 'Lunch', icon: '🥗' },
  dinner: { label: 'Dinner', icon: '🍽️' },
  snack: { label: 'Snack', icon: '🍎' },
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

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const macroMeta: Record<string, { label: string; icon: React.ElementType; unit: string; color: string; bar: string }> = {
  calories: { label: 'Calories', icon: Flame, unit: 'kcal', color: 'text-rose-400', bar: 'bg-rose-500' },
  protein: { label: 'Protein', icon: Beef, unit: 'g', color: 'text-emerald-400', bar: 'bg-emerald-500' },
  carbs: { label: 'Carbs', icon: Wheat, unit: 'g', color: 'text-amber-400', bar: 'bg-amber-500' },
  fat: { label: 'Fat', icon: Droplet, unit: 'g', color: 'text-sky-400', bar: 'bg-sky-500' },
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

  useEffect(() => { saveRecipes(recipes) }, [recipes])
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

  const remaining = useMemo(() => ({
    calories: Math.max(0, targets.calories - summary.calories),
    protein: Math.max(0, targets.protein - summary.protein),
    carbs: Math.max(0, targets.carbs - summary.carbs),
    fat: Math.max(0, targets.fat - summary.fat),
  }), [summary, targets])

  const progress = useMemo(() => ({
    calories: Math.min(summary.calories / targets.calories, 1),
    protein: Math.min(summary.protein / targets.protein, 1),
    carbs: Math.min(summary.carbs / targets.carbs, 1),
    fat: Math.min(summary.fat / targets.fat, 1),
  }), [summary, targets])

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

  const suggestions = useMemo(() => {
    const result: { text: string; macro: string }[] = []
    if (remaining.protein > 20) {
      const best = FOOD_SUGGESTIONS.high_protein.slice(0, 2)
      result.push({
        text: `Need ${Math.round(remaining.protein)}g more protein — try ${best.map(f => `${f.emoji} ${f.name} (~${f.protein}g)`).join(' or ')}`,
        macro: 'protein',
      })
    }
    if (remaining.carbs > 30) {
      const best = FOOD_SUGGESTIONS.high_carbs.slice(0, 2)
      result.push({
        text: `Need ${Math.round(remaining.carbs)}g more carbs — ${best.map(f => `${f.emoji} ${f.name}`).join(', ')}`,
        macro: 'carbs',
      })
    }
    if (remaining.fat > 15) {
      const best = FOOD_SUGGESTIONS.healthy_fat.slice(0, 2)
      result.push({
        text: `Need ${Math.round(remaining.fat)}g more fat — ${best.map(f => `${f.emoji} ${f.name}`).join(', ')}`,
        macro: 'fat',
      })
    }
    return result
  }, [remaining])

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

  const recommendation = useMemo(() => {
    const daysWithData = weeklyData.filter(d => d.calories > 0)
    if (daysWithData.length < 3) return null

    const overDays = daysWithData.filter(d => d.calories > targets.calories)
    const underDays = daysWithData.filter(d => d.calories < targets.calories)

    if (overDays.length >= 3) {
      const avgOver = Math.round(overDays.reduce((s, d) => s + (d.calories - targets.calories), 0) / overDays.length)
      return { type: 'warning' as const, title: 'Over Target Trend', message: `Averaging ${avgOver} cal over this week.` }
    }
    if (underDays.length >= 3) {
      const avgUnder = Math.round(underDays.reduce((s, d) => s + (targets.calories - d.calories), 0) / underDays.length)
      return { type: 'info' as const, title: 'Under Target Trend', message: `Averaging ${avgUnder} cal under this week.` }
    }
    if (daysWithData.length >= 5) {
      const avgCal = Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      if (Math.abs(avgCal - targets.calories) < 100) {
        return { type: 'success' as const, title: 'Great Consistency!', message: `Averaging ${avgCal} cal — right on target.` }
      }
    }
    return null
  }, [weeklyData, targets.calories])

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

    return { avgMealsPerDay, mostSkipped }
  }, [meals, selectedDate])

  return (
    <motion.div className="space-y-4" initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium text-sm whitespace-nowrap">{getDayLabel(selectedDate)}</span>
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {selectedDate !== formatDate(new Date()) && (
            <button onClick={jumpToToday} className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredMeals.length > 0 && (
            <button onClick={() => setShowWeekly(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showWeekly ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Weekly view">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowRecipes(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showRecipes ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Recipes">
            <ChefHat className="w-5 h-5" />
          </button>
          <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Log Meal
          </Button>
        </div>
      </motion.div>

      {/* Today's Progress — single unified card */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Today's Progress</h3>
          {summary.calories > 0 && (
            <span className="text-xs text-gray-500">
              {summary.calories <= targets.calories
                ? `${Math.round(remaining.calories)} kcal remaining`
                : `${Math.round(summary.calories - targets.calories)} kcal over`
              }
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => {
            const m = macroMeta[key]
            const val = summary[key]
            const tgt = targets[key]
            const pct = Math.round(progress[key] * 100)
            const rem = remaining[key]
            const over = key === 'calories' ? summary.calories > targets.calories : rem === 0
            return (
              <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    {editingTarget === key ? (
                      <input autoFocus
                        className="w-16 text-[10px] py-0.5 px-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number" value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveTarget}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(null) }}
                      />
                    ) : (
                      <button onClick={() => startEditTarget(key, tgt)} className="text-[10px] text-gray-500 uppercase tracking-wider hover:text-white transition-all">{m.label}</button>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-600">{tgt}{m.unit}</span>
                </div>
                <p className={`text-2xl font-bold ${m.color}`}>{Math.round(val)}</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${m.bar} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className={`text-[10px] mt-1 ${over ? 'text-rose-400' : 'text-gray-500'}`}>
                  {over ? (key === 'calories' ? `${Math.round(summary.calories - targets.calories)} over` : 'Hit') : `${Math.round(rem)} ${m.unit} left`}
                </p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-amber-500/20 bg-black/60 backdrop-blur-xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Suggestions</p>
              {suggestions.map((s, i) => (
                <p key={i} className="text-xs text-gray-300">{s.text}</p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly View (toggleable) */}
      <AnimatePresence>
        {showWeekly && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Weekly View</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Protein</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Carbs</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500" /> Fat</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} labelStyle={{ color: '#9ca3af' }} />
                    <Bar dataKey="protein" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="carbs" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="fat" fill="#38bdf8" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} labelStyle={{ color: '#9ca3af' }} />
                    <defs><linearGradient id="calTrendGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} /></linearGradient></defs>
                    <Line type="monotone" dataKey="calories" stroke="url(#calTrendGrad)" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 2, stroke: '#1f2937' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Insights row below charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <h4 className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Meal Timing</h4>
                <div className="grid grid-cols-4 gap-1">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                    const data = timingData[type]
                    const iconMap: Record<string, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }
                    const colorMap: Record<string, string> = { breakfast: 'text-amber-400', lunch: 'text-emerald-400', dinner: 'text-rose-400', snack: 'text-sky-400' }
                    return (
                      <div key={type} className="text-center">
                        <span className="text-sm">{iconMap[type]}</span>
                        <p className={`text-sm font-bold ${colorMap[type]}`}>{data.pct}%</p>
                        <p className="text-[9px] text-gray-500 capitalize">{type}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <h4 className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Frequency</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{frequencyStats.avgMealsPerDay}</p>
                    <p className="text-[9px] text-gray-500">avg / day</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white capitalize">{frequencyStats.mostSkipped === 'n/a' ? 'N/A' : frequencyStats.mostSkipped}</p>
                    <p className="text-[9px] text-gray-500">most skipped</p>
                  </div>
                </div>
              </div>
              {recommendation ? (
                <div className={`rounded-xl border p-3 ${
                  recommendation.type === 'warning' ? 'border-amber-500/20 bg-amber-500/5'
                  : recommendation.type === 'info' ? 'border-blue-500/20 bg-blue-500/5'
                  : 'border-emerald-500/20 bg-emerald-500/5'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {recommendation.type === 'success' ? <Award className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className={`w-3.5 h-3.5 ${recommendation.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`} />}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      recommendation.type === 'warning' ? 'text-amber-300' : recommendation.type === 'info' ? 'text-blue-300' : 'text-emerald-300'
                    }`}>{recommendation.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{recommendation.message}</p>
                </div>
              ) : (
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gray-500/10 flex items-center justify-center"><span className="text-gray-500 text-[10px]">i</span></div>
                  <p className="text-[10px] text-gray-500">Log 3+ days for personalized insights</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipes Panel */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Saved Recipes</h3>
              <span className="text-[10px] text-gray-500">{recipes.length}</span>
            </div>
            {recipes.length === 0 ? (
              <div className="text-center py-4">
                <Bookmark className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">No saved recipes yet</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Click the bookmark icon on any meal to save it</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/[0.08] transition-all group">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-xs font-semibold text-white line-clamp-1">{recipe.name}</p>
                        <p className="text-[9px] text-gray-500">{MEAL_TYPE_CONFIG[recipe.mealType]?.label || recipe.mealType}</p>
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
                    <button onClick={() => addRecipeToDay(recipe)}
                      className="w-full py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-medium">
                      Add to today
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meals Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Meals</h3>
          <span className="text-xs text-gray-500">{filteredMeals.length}</span>
        </div>

        {filteredMeals.length === 0 ? (
          <Card className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6 text-rose-400/50" />
            </div>
            <p className="text-gray-400 text-sm mb-1">No meals logged</p>
            <p className="text-gray-500 text-xs mb-3">Tap Log Meal to start tracking</p>
            <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
              Log Your First Meal
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {(Object.entries(groupedMeals) as [string, Meal[]][]).map(([type, typeMeals]) => {
              if (typeMeals.length === 0) return null
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{MEAL_TYPE_CONFIG[type].icon}</span>
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{MEAL_TYPE_CONFIG[type].label}</h4>
                    <span className="text-[10px] text-gray-600">({typeMeals.length})</span>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <motion.div key={meal.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/[0.08] transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{meal.name}</h4>
                          </div>
                          <div className="flex gap-0.5">
                            <button onClick={() => saveAsRecipe(meal)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Save as recipe">
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditingMeal(meal); setShowForm(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeletingMeal(meal)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
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
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      <MealForm isOpen={showForm} onClose={() => { setShowForm(false); setEditingMeal(null) }} onSave={handleSave} meal={editingMeal} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingMeal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeletingMeal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white text-center mb-1">Delete Meal?</h3>
              <p className="text-gray-400 text-xs text-center mb-5">
                Permanently delete <span className="text-white font-medium">{deletingMeal.name}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingMeal(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

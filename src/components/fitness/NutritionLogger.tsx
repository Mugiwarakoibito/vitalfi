import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import {
  Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet,
  Pencil, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, BarChart3, RotateCcw,
  ChefHat, Bookmark, BookmarkPlus,
  Target, Ruler, Brain, ArrowRight, Check, Sparkles, RefreshCw, Settings,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Meal } from '@/types/fitness'

const MealForm = lazy(() => import('./MealForm').then(m => ({ default: m.MealForm })))

const STORAGE_PROFILE_KEY = 'nutrition_profile'

interface NutritionProfile {
  goal: 'lose' | 'maintain' | 'build'
  age: number
  gender: 'male' | 'female'
  weightKg: number
  heightCm: number
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  bmr: number
  tdee: number
  createdAt: string
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary (desk job, no exercise)',
  light: 'Light (1-3 days/week)',
  moderate: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very Active (2x/day, physical job)',
}

function calcBMR(gender: string, weightKg: number, heightCm: number, age: number): number {
  if (gender === 'male') return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5)
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
}

function calcTargets(profile: NutritionProfile) {
  const bmr = calcBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activity])
  let calorieTarget = tdee
  if (profile.goal === 'lose') calorieTarget = tdee - 500
  else if (profile.goal === 'build') calorieTarget = tdee + 300

  const proteinPerKg = profile.goal === 'build' ? 2.2 : profile.goal === 'lose' ? 2.0 : 1.6
  const protein = Math.round(proteinPerKg * profile.weightKg)
  const fatCalPct = profile.goal === 'lose' ? 0.25 : 0.30
  const fat = Math.round((calorieTarget * fatCalPct) / 9)
  const carbs = Math.round((calorieTarget - protein * 4 - fat * 9) / 4)

  return { bmr, tdee, calories: Math.max(calorieTarget, 1200), protein: Math.max(protein, 50), carbs: Math.max(carbs, 50), fat: Math.max(fat, 30) }
}

const GOAL_CONFIG = [
  { id: 'lose' as const, label: 'Lose Weight', desc: 'Calorie deficit to drop fat', emoji: '🔥', color: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'maintain' as const, label: 'Maintain', desc: 'Keep your current weight', emoji: '⚖️', color: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'build' as const, label: 'Build Muscle', desc: 'Calorie surplus for growth', emoji: '💪', color: 'text-emerald-400', border: 'border-emerald-500/30' },
]

const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

const MEAL_TYPE_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }

const FOOD_SUGGESTIONS: Record<string, { name: string; protein: number; carbs: number; fat: number; calories: number; emoji: string }[]> = {
  high_protein: [
    { name: 'Chicken Breast', protein: 31, carbs: 0, fat: 3.6, calories: 165, emoji: '🍗' },
    { name: 'Greek Yogurt', protein: 10, carbs: 4, fat: 0.7, calories: 59, emoji: '🥛' },
    { name: 'Eggs', protein: 13, carbs: 1, fat: 11, calories: 155, emoji: '🥚' },
    { name: 'Tuna', protein: 30, carbs: 0, fat: 1, calories: 132, emoji: '🐟' },
    { name: 'Cottage Cheese', protein: 11, carbs: 3, fat: 4, calories: 98, emoji: '🧀' },
    { name: 'Steak', protein: 26, carbs: 0, fat: 11, calories: 206, emoji: '🥩' },
    { name: 'Whey Shake', protein: 24, carbs: 3, fat: 1, calories: 120, emoji: '🥤' },
  ],
  high_carbs: [
    { name: 'Oats', protein: 17, carbs: 66, fat: 7, calories: 389, emoji: '🥣' },
    { name: 'Brown Rice', protein: 5, carbs: 45, fat: 1.6, calories: 216, emoji: '🍚' },
    { name: 'Sweet Potato', protein: 2, carbs: 26, fat: 0.1, calories: 112, emoji: '🍠' },
    { name: 'Banana', protein: 1, carbs: 27, fat: 0.3, calories: 105, emoji: '🍌' },
    { name: 'Quinoa', protein: 8, carbs: 39, fat: 3.6, calories: 222, emoji: '🌾' },
    { name: 'Whole Wheat Pasta', protein: 7, carbs: 42, fat: 1.5, calories: 210, emoji: '🍝' },
  ],
  healthy_fat: [
    { name: 'Avocado', protein: 2, carbs: 9, fat: 15, calories: 160, emoji: '🥑' },
    { name: 'Almonds', protein: 21, carbs: 22, fat: 50, calories: 579, emoji: '🥜' },
    { name: 'Olive Oil', protein: 0, carbs: 0, fat: 14, calories: 119, emoji: '🫒' },
    { name: 'Salmon', protein: 25, carbs: 0, fat: 13, calories: 208, emoji: '🐠' },
    { name: 'Peanut Butter', protein: 8, carbs: 7, fat: 16, calories: 190, emoji: '🥜' },
  ],
}

interface SuggestionItem {
  type: 'protein' | 'carbs' | 'fat'
  remaining: number
  target: number
  foods: { name: string; emoji: string; amount: number; unit: string; detail: string }[]
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

function loadProfile(): NutritionProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveProfile(p: NutritionProfile) {
  localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(p))
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
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

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function CustomTooltip({ active, payload, label, mode, calTarget }:
  { active?: boolean; payload?: { name: string; value: number; payload?: { meals?: Meal[] } }[]; label?: string; mode: string; calTarget?: number }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      {mode === 'macros' && payload.map((p) => (
        <p key={p.name} className="text-[11px]" style={{ color: p.name === 'protein' ? '#f43f5e' : p.name === 'carbs' ? '#f97316' : '#38bdf8' }}>
          {p.name}: {p.value}g
        </p>
      ))}
      {mode === 'calories' && (
        <>
          <p className="text-[11px] text-purple-400">{val} kcal</p>
          {calTarget && calTarget > 0 && (
            <p className={`text-[10px] ${val > calTarget * 1.1 ? 'text-rose-400' : val < calTarget * 0.9 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {Math.round((val / calTarget) * 100)}% of target
            </p>
          )}
        </>
      )}
      {mode === 'fiber' && <p className="text-[11px] text-emerald-400">{val}g fiber {val > 0 ? `(${Math.round((val / 25) * 100)}% of 25g)` : ''}</p>}
      {mode === 'meals' && (
        <>
          <p className="text-[11px] text-indigo-400">{val} meals</p>
          {payload[0]?.payload?.meals && payload[0].payload.meals.length > 0 && (
            <div className="flex gap-1 mt-1">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(t => {
                const count = payload[0]!.payload!.meals!.filter((m: Meal) => m.mealType === t).length
                const icon = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }[t]
                return count > 0 ? <span key={t} className="text-[10px]">{icon} {count}</span> : null
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const macroMeta: Record<string, { label: string; icon: React.ElementType; unit: string; color: string; bar: string }> = {
  calories: { label: 'Calories', icon: Flame, unit: 'kcal', color: 'text-rose-400', bar: 'bg-rose-500' },
  protein: { label: 'Protein', icon: Beef, unit: 'g', color: 'text-emerald-400', bar: 'bg-emerald-500' },
  carbs: { label: 'Carbs', icon: Wheat, unit: 'g', color: 'text-amber-400', bar: 'bg-amber-500' },
  fat: { label: 'Fat', icon: Droplet, unit: 'g', color: 'text-sky-400', bar: 'bg-sky-500' },
}

export function NutritionLogger() {
  const { meals, addMeal, updateMeal, deleteMeal } = useAppStore()

  const [profile, setProfile] = useState<NutritionProfile | null>(loadProfile)
  const [showWizard, setShowWizard] = useState(!loadProfile())
  const [wizardStep, setWizardStep] = useState(0)
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'build'>('maintain')
  const [age, setAge] = useState('30')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState<NutritionProfile['activity']>('moderate')
  const [useImperial, setUseImperial] = useState(false)

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null)
  const [targets, setTargets] = useState(loadTargets)
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showWeekly, setShowWeekly] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coachPreference, setCoachPreference] = useState<'balanced' | 'high_protein' | 'low_carb' | 'keto'>('balanced')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCoachSettings, setShowCoachSettings] = useState(false)
  const [chartMode, setChartMode] = useState<'macros' | 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'meals'>('calories')
  const [recipes, setRecipes] = useState<SavedRecipe[]>(loadRecipes)
  const [showRecipes, setShowRecipes] = useState(false)

  useEffect(() => { saveRecipes(recipes) }, [recipes])
  useEffect(() => { saveTargets(targets) }, [targets])

  const handleWizardComplete = useCallback(() => {
    const w = useImperial ? Math.round(parseFloat(weight) / 2.205) : parseFloat(weight)
    const h = useImperial ? Math.round(parseFloat(height) * 2.54) : parseFloat(height)
    const a = parseInt(age)
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
      setWizardStep(1)
      return
    }
    const p: NutritionProfile = {
      goal, age: a, gender,
      weightKg: w, heightCm: h, activity,
      bmr: 0, tdee: 0, createdAt: new Date().toISOString(),
    }
    const computed = calcTargets(p)
    p.bmr = computed.bmr
    p.tdee = computed.tdee
    saveProfile(p)
    setProfile(p)
    setTargets({ calories: computed.calories, protein: computed.protein, carbs: computed.carbs, fat: computed.fat })
    setShowWizard(false)
  }, [goal, age, gender, weight, height, activity, useImperial])

  // Derived wizard validation
  const wizardValid = useMemo(() => {
    if (wizardStep === 0) return true
    if (wizardStep === 1) {
      const w = parseFloat(weight)
      const h = parseFloat(height)
      const a = parseInt(age)
      return !isNaN(w) && w > 0 && !isNaN(h) && h > 0 && !isNaN(a) && a > 0 && a < 150
    }
    if (wizardStep === 2) return true
    return true
  }, [wizardStep, weight, height, age])

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
    const weekDates = getWeekDates(parseLocalDate(selectedDate))
    return weekDates.map((date) => {
      const dayMeals = meals.filter((m) => m.date === date)
      return {
        date,
        label: parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(dayMeals.reduce((a, m) => a + m.calories, 0)),
        protein: Math.round(dayMeals.reduce((a, m) => a + m.protein, 0)),
        carbs: Math.round(dayMeals.reduce((a, m) => a + m.carbs, 0)),
        fat: Math.round(dayMeals.reduce((a, m) => a + m.fat, 0)),
        fiber: Math.round(dayMeals.reduce((a, m) => a + (m.fiber ?? 0), 0)),
        mealCount: dayMeals.length,
        meals: dayMeals,
      }
    })
  }, [meals, selectedDate])

  const navigateDate = useCallback((direction: number) => {
    setSelectedDate((prev) => {
      const d = parseLocalDate(prev)
      d.setDate(d.getDate() + direction)
      return formatDate(d)
    })
  }, [])

  const jumpToToday = useCallback(() => {
    setSelectedDate(formatDate(new Date()))
  }, [])

  const handleSave = useCallback((meal: Meal) => {
    if (editingMeal) updateMeal(meal)
    else addMeal(meal)
    setShowForm(false)
    setEditingMeal(null)
  }, [editingMeal, addMeal, updateMeal])

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
    addMeal({
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
    })
  }, [selectedDate, addMeal])

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [])

  const rotate = <T,>(arr: T[], n: number) => [...arr.slice(n % arr.length), ...arr.slice(0, n % arr.length)]

  const suggestions = useMemo(() => {
    const result: SuggestionItem[] = []
    const limit = coachPreference === 'high_protein' ? 3 : 2
    const offset = refreshKey * 2

    if (remaining.protein > 20) {
      const pool = FOOD_SUGGESTIONS.high_protein
      const best = rotate(pool, offset).slice(0, limit)
      result.push({
        type: 'protein',
        remaining: Math.round(remaining.protein),
        target: targets.protein,
        foods: best.map(f => ({
          name: f.name,
          emoji: f.emoji,
          amount: f.protein,
          unit: 'protein',
          detail: `${f.emoji} ${f.name} (~${f.protein}g P · ${f.calories} kcal)`,
        })),
      })
    }

    const showCarbs = coachPreference !== 'keto' && coachPreference !== 'low_carb'
    if (showCarbs && remaining.carbs > 30) {
      const best = rotate(FOOD_SUGGESTIONS.high_carbs, offset).slice(0, 2)
      result.push({
        type: 'carbs',
        remaining: Math.round(remaining.carbs),
        target: targets.carbs,
        foods: best.map(f => ({
          name: f.name,
          emoji: f.emoji,
          amount: f.carbs,
          unit: 'carbs',
          detail: `${f.emoji} ${f.name} (~${f.carbs}g C · ${f.calories} kcal)`,
        })),
      })
    }

    if (remaining.fat > 15) {
      const count = coachPreference === 'keto' ? 3 : 2
      const best = rotate(FOOD_SUGGESTIONS.healthy_fat, offset).slice(0, count)
      result.push({
        type: 'fat',
        remaining: Math.round(remaining.fat),
        target: targets.fat,
        foods: best.map(f => ({
          name: f.name,
          emoji: f.emoji,
          amount: f.fat,
          unit: 'fat',
          detail: `${f.emoji} ${f.name} (~${f.fat}g F · ${f.calories} kcal)`,
        })),
      })
    }
    return result
  }, [remaining, coachPreference, refreshKey])

  
  // --- Wizard ---
  if (showWizard) {
    const w = useImperial ? Math.round(parseFloat(weight || '0') / 2.205) : parseFloat(weight || '0')
    const h = useImperial ? Math.round(parseFloat(height || '0') * 2.54) : parseFloat(height || '0')
    const preview = (w > 0 && h > 0 && age) ? calcTargets({ goal, age: parseInt(age), gender, weightKg: w, heightCm: h, activity, bmr: 0, tdee: 0, createdAt: '' }) : null

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto py-8">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s === wizardStep ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
              : s < wizardStep ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-gray-600 border border-white/10'
            }`}>
              {s < wizardStep ? <Check className="w-4 h-4" /> : s + 1}
            </div>
          ))}
          <div className="w-16 h-px bg-white/10 mx-1" />
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Setup</div>
        </div>

        <motion.div key={wizardStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

          {/* Step 0: Goal */}
          {wizardStep === 0 && (
            <>
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">What's your goal?</h2>
                <p className="text-sm text-gray-400 mt-1">Your targets will be calculated automatically</p>
              </div>
              <div className="space-y-2.5">
                {GOAL_CONFIG.map((g) => (
                  <button key={g.id} onClick={() => setGoal(g.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      goal === g.id
                        ? `${g.border} bg-white/10 shadow-lg`
                        : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{g.emoji}</span>
                      <div>
                        <p className={`text-sm font-bold ${goal === g.id ? g.color : 'text-white'}`}>{g.label}</p>
                        <p className="text-[11px] text-gray-500">{g.desc}</p>
                      </div>
                      {goal === g.id && <Check className={`w-5 h-5 ml-auto ${g.color}`} />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1: Stats */}
          {wizardStep === 1 && (
            <>
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center mx-auto mb-3">
                  <Ruler className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Your stats</h2>
                <p className="text-sm text-gray-400 mt-1">So I can calculate your needs</p>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setGender('male')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    gender === 'male' ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>Male</button>
                <button onClick={() => setGender('female')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    gender === 'female' ? 'bg-pink-500/15 border-pink-500/30 text-pink-300' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>Female</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Weight ({useImperial ? 'lbs' : 'kg'})</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Height ({useImperial ? 'inches' : 'cm'})</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <button onClick={() => setUseImperial(!useImperial)}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-all mt-1">
                Switch to {useImperial ? 'metric' : 'imperial'}
              </button>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block mt-3">Activity Level</label>
                <div className="space-y-1.5">
                  {(Object.keys(ACTIVITY_LABELS) as NutritionProfile['activity'][]).map((key) => (
                    <button key={key} onClick={() => setActivity(key)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                        activity === key ? 'bg-purple-500/15 border-purple-500/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/[0.08]'
                      }`}>
                      {ACTIVITY_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Results */}
          {wizardStep === 2 && preview && (
            <>
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Your custom plan</h2>
                <p className="text-sm text-gray-400 mt-1">Calculated from your stats and goal</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Basal Metabolic Rate</p>
                    <p className="text-lg font-bold text-white">{preview.bmr} <span className="text-xs font-normal text-gray-500">kcal</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Daily Energy</p>
                    <p className="text-lg font-bold text-purple-400">{preview.tdee} <span className="text-xs font-normal text-gray-500">kcal</span></p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Your Daily Targets</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ label: 'Calories', value: preview.calories, unit: 'kcal', color: 'text-rose-400' },
                      { label: 'Protein', value: preview.protein, unit: 'g', color: 'text-emerald-400' },
                      { label: 'Carbs', value: preview.carbs, unit: 'g', color: 'text-amber-400' },
                      { label: 'Fat', value: preview.fat, unit: 'g', color: 'text-sky-400' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-white/5 border border-white/10 p-2.5 text-center">
                        <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-[9px] text-gray-500">{m.unit}</p>
                        <p className="text-[8px] text-gray-600 uppercase tracking-wider">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                  <p className="text-[10px] text-amber-300/80 font-medium">
                    {goal === 'lose' ? `🔥 Target set to a 500 kcal deficit (TDEE − 500) — ∼${Math.round(500 * 7 / 7700 * 10) / 10}kg/week expected`
                    : goal === 'build' ? `💪 Target set to a 300 kcal surplus (TDEE + 300)`
                    : `⚖️ Target set to maintenance calories (TDEE)`}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Wizard navigation */}
        <div className="flex gap-3 mt-6">
          {wizardStep > 0 && (
            <button onClick={() => setWizardStep(s => s - 1)}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (wizardStep < 2) { setWizardStep(s => s + 1) }
              else handleWizardComplete()
            }}
            disabled={!wizardValid}
            className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              wizardValid
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}>
            {wizardStep < 2 ? <>Next <ArrowRight className="w-4 h-4" /></> : <>Start Tracking <Check className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>
    )
  }

  // --- Main Nutrition Tracker ---
  return (
    <motion.div className="space-y-4" initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
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
            <button onClick={() => setShowSuggestions(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSuggestions ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="MacroCoach">
              <Sparkles className="w-5 h-5" />
            </button>
          )}
          {filteredMeals.length > 0 && (
            <button onClick={() => setShowWeekly(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showWeekly ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="NutriScope">
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

      {/* Profile summary bar */}
      {profile && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="text-purple-300 font-medium">{profile.goal === 'lose' ? '🔥 Fat Loss' : profile.goal === 'build' ? '💪 Muscle Gain' : '⚖️ Maintenance'}</span>
            <span className="text-gray-600">|</span>
            <span>{profile.weightKg}kg · {profile.age}yrs · {profile.gender}</span>
            <span className="text-gray-600">|</span>
            <span>TDEE: <span className="text-white font-medium">{profile.tdee}</span> kcal</span>
          </div>
          <button onClick={() => { setShowWizard(true); setWizardStep(0) }}
            className="text-[10px] text-gray-500 hover:text-white transition-all">Recalculate</button>
        </motion.div>
      )}

      {/* Today's Progress */}
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

      {/* MacroCoach Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider">MacroCoach</p>
                  {remaining.calories > 0 && (
                    <span className="text-[10px] text-gray-500 ml-1">{Math.round(remaining.calories)} kcal left</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {suggestions.length > 0 && (
                    <button onClick={() => setRefreshKey(k => k + 1)}
                      className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
                      title="Refresh suggestions">
                      <RefreshCw className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                    </button>
                  )}
                  <div className="relative">
                    <button onClick={() => setShowCoachSettings(p => !p)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showCoachSettings ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                      title="Coach settings">
                      <Settings className="w-3 h-3" />
                    </button>
                    {showCoachSettings && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCoachSettings(false)} />
                        <div className="absolute right-0 top-8 z-20 w-52 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Preference</p>
                          <div className="flex flex-col gap-1">
                            {([
                              { key: 'balanced', label: '⚖️ Balanced' },
                              { key: 'high_protein', label: '💪 High Protein' },
                              { key: 'low_carb', label: '🥬 Low Carb' },
                              { key: 'keto', label: '🥑 Keto' },
                            ] as const).map(opt => (
                              <button key={opt.key} onClick={() => { setCoachPreference(opt.key); setShowCoachSettings(false) }}
                                className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${coachPreference === opt.key ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-1">
                      {suggestions.map(s => {
                        const dotMap: Record<string, string> = { protein: 'bg-rose-500', carbs: 'bg-amber-500', fat: 'bg-sky-500' }
                        return <div key={s.type} className={`w-2 h-2 rounded-full ${dotMap[s.type]} opacity-60`} />
                      })}

                    </div>
                  )}
                </div>
              </div>

              {suggestions.length === 0 && remaining.calories === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Check className="w-10 h-10 text-emerald-400 mb-3" />
                  <p className="text-sm text-emerald-300 font-medium">All macros met! 🎉</p>
                  <p className="text-[10px] text-gray-600 mt-1">You've hit your targets for the day</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Brain className="w-10 h-10 text-emerald-500/30 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No suggestions yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">Log some meals and MacroCoach will suggest what to eat next</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((s, i) => {
                    const cfg = {
                      protein: { label: 'Protein', bar: 'bg-gradient-to-r from-rose-500 to-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', icon: '🥩' },
                      carbs: { label: 'Carbs', bar: 'bg-gradient-to-r from-amber-500 to-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: '🌾' },
                      fat: { label: 'Fat', bar: 'bg-gradient-to-r from-sky-500 to-sky-400', border: 'border-sky-500/20', bg: 'bg-sky-500/5', icon: '🥑' },
                    }[s.type]
                    const pct = Math.min((s.target - s.remaining) / s.target * 100, 100)
                    return (
                      <motion.div key={s.type} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-lg">{cfg.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{cfg.label}</p>
                                <span className={`text-lg font-bold ${s.type === 'protein' ? 'text-rose-400' : s.type === 'carbs' ? 'text-amber-400' : 'text-sky-400'}`}>
                                  {s.remaining}<span className="text-[10px] font-normal text-gray-500 ml-0.5">g</span>
                                </span>
                              </div>
                              <div className="w-24 h-1 rounded-full bg-white/10 mt-1.5">
                                <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            {s.foods.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-1.5 justify-end">
                                <span className="text-xs text-gray-300 truncate max-w-[130px]">{f.emoji} {f.name}</span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${s.type === 'protein' ? 'bg-rose-500/10 text-rose-300' : s.type === 'carbs' ? 'bg-amber-500/10 text-amber-300' : 'bg-sky-500/10 text-sky-300'}`}>
                                  +{f.amount}g
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NutriScope */}
      <AnimatePresence>
        {showWeekly && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
            {(() => {
              const pastDays = weeklyData.filter(d => d.date !== selectedDate)
              return (
                <>
            {/* Header + Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">NutriScope</h3>
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-0.5 border border-white/10">
                {(['calories', 'macros', 'fiber', 'meals'] as const).map((mode) => (
                  <button key={mode} onClick={() => setChartMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${chartMode === mode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
                    {mode === 'calories' ? 'Calories' : mode === 'macros' ? 'Macros' : mode === 'fiber' ? 'Fiber' : 'Meals'}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-56">
              {pastDays.length === 0 || pastDays.every(d => d.calories === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-500 font-medium">No historical data yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">Log meals on different days to see weekly analytics</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'macros' ? (
                  <BarChart data={pastDays} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip mode="macros" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="protein" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="carbs" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="fat" fill="#38bdf8" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                ) : chartMode === 'calories' ? (
                  <BarChart data={pastDays} barGap={2} barCategoryGap="20%">
                    <ReferenceLine y={targets.calories} stroke="#a855f7" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Target', fill: '#a855f7', fontSize: 9, position: 'insideTopRight' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip mode="calories" calTarget={targets.calories} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                      {pastDays.map((entry) => (
                        <Cell key={entry.date} fill={entry.calories > targets.calories ? '#f43f5e' : entry.calories >= targets.calories * 0.9 ? '#34d399' : '#fbbf24'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartMode === 'fiber' ? (
                  <BarChart data={pastDays} barGap={2} barCategoryGap="30%">
                    <ReferenceLine y={25} stroke="#34d399" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: '25g goal', fill: '#34d399', fontSize: 9, position: 'insideTopRight' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip mode="fiber" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="fiber" radius={[4, 4, 0, 0]}>
                      {pastDays.map((entry) => (
                        <Cell key={entry.date} fill={entry.fiber >= 25 ? '#34d399' : entry.fiber >= 15 ? '#fbbf24' : '#f87171'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={pastDays} barGap={2} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip mode="meals" calTarget={targets.calories} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="mealCount" fill="#818cf8" radius={[4, 4, 0, 0]}>
                      {pastDays.map((entry, idx) => (
                        <Cell key={entry.date} fill={['#818cf8', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'][idx % 7]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
              )}
            </div>

            {/* Per-mode context strip */}
            {chartMode === 'calories' && (() => {
              const logged = pastDays.filter(d => d.calories > 0)
              if (!logged.length) return null
              const avg = Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length)
              const best = logged.reduce((a, b) => a.calories > b.calories ? a : b)
              const worst = logged.reduce((a, b) => a.calories < b.calories ? a : b)
              return (
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
                  <span>Avg <span className={`font-semibold ${avg > targets.calories ? 'text-rose-400' : 'text-emerald-400'}`}>{avg}</span> / {targets.calories} kcal</span>
                  <span>Best <span className="text-emerald-400 font-semibold">{best.label}</span> <span className="text-gray-600">({best.calories})</span></span>
                  <span>Low <span className="text-amber-400 font-semibold">{worst.label}</span> <span className="text-gray-600">({worst.calories})</span></span>
                </div>
              )
            })()}

            {chartMode === 'macros' && (
              <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-gray-500">
                <span><span className="text-rose-400 font-semibold">P</span> {targets.protein}g</span>
                <span><span className="text-amber-400 font-semibold">C</span> {targets.carbs}g</span>
                <span><span className="text-sky-400 font-semibold">F</span> {targets.fat}g</span>
              </div>
            )}

            {chartMode === 'fiber' && (() => {
              const logged = pastDays.filter(d => d.calories > 0)
              if (!logged.length) return null
              const avgFiber = Math.round(logged.reduce((s, d) => s + d.fiber, 0) / logged.length)
              const met = logged.filter(d => d.fiber >= 25).length
              return (
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
                  <span>Avg <span className={`font-semibold ${avgFiber >= 25 ? 'text-emerald-400' : avgFiber >= 15 ? 'text-amber-400' : 'text-rose-400'}`}>{avgFiber}g</span> / 25g goal</span>
                  <span><span className="text-white font-semibold">{met}</span>/{logged.length} days met</span>
                </div>
              )
            })()}

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
              {/* Card 1: Weekly Averages */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <h4 className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Weekly Averages</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    const logged = pastDays.filter(d => d.calories > 0)
                    if (!logged.length) return <div className="col-span-4 py-3 text-center"><p className="text-[10px] text-gray-500">Log meals to see weekly averages</p></div>
                    const avg = (key: 'calories' | 'protein' | 'carbs' | 'fat') => Math.round(logged.reduce((s, d) => s + d[key], 0) / logged.length)
                    return (
                      <>
                        {[
                          { label: 'Cal', value: avg('calories'), target: targets.calories, color: 'text-rose-400', bar: 'bg-rose-500', unit: '' },
                          { label: 'Pro', value: avg('protein'), target: targets.protein, color: 'text-emerald-400', bar: 'bg-emerald-500', unit: 'g' },
                          { label: 'Carbs', value: avg('carbs'), target: targets.carbs, color: 'text-amber-400', bar: 'bg-amber-500', unit: 'g' },
                          { label: 'Fat', value: avg('fat'), target: targets.fat, color: 'text-sky-400', bar: 'bg-sky-500', unit: 'g' },
                        ].map(s => {
                          const pct = s.target > 0 ? Math.round((s.value / s.target) * 100) : 0
                          return (
                            <div key={s.label} className="text-center">
                              <p className={`text-lg font-bold ${s.color}`}>{s.value}{s.unit}</p>
                              <p className="text-[9px] text-gray-500">{s.label}</p>
                              <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Card 2: Insights */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <h4 className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Insights</h4>
                {(() => {
                  const logged = pastDays.filter(d => d.calories > 0)
                  if (!logged.length) return <div className="text-center"><p className="text-[10px] text-gray-500 py-3">Log meals to see insights</p></div>
                  const onTarget = logged.filter(d => d.calories >= targets.calories * 0.9 && d.calories <= targets.calories * 1.1)
                  const pct = Math.round((onTarget.length / logged.length) * 100)
                  let streak = 0
                  for (let i = weeklyData.length - 1; i >= 0; i--) {
                    if (weeklyData[i].calories > 0 && weeklyData[i].date !== selectedDate) streak++
                    else break
                  }
                  return (
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span><span className="text-white font-medium">{pct}%</span> on target</span>
                      <span><span className="text-white font-medium">{streak}</span> day streak</span>
                      <span><span className="text-purple-400 font-medium">{logged.length}</span> logged</span>
                    </div>
                  )
                })()}
              </div>
            </div>
                </>
              )
            })()}
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
                        <p className="text-[9px] text-gray-500">{recipe.mealType}</p>
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
                    <span className="text-base">{type === 'breakfast' ? '🍳' : type === 'lunch' ? '🥗' : type === 'dinner' ? '🍽️' : '🍎'}</span>
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{type}</h4>
                    <span className="text-[10px] text-gray-600">({typeMeals.length})</span>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <motion.div key={meal.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/[0.08] transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-semibold text-white">{meal.name}</h4>
                          <div className="flex gap-0.5">
                            <button onClick={() => saveAsRecipe(meal)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all" title="Save as recipe">
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

      <Suspense fallback={null}>
        <MealForm isOpen={showForm} onClose={() => { setShowForm(false); setEditingMeal(null) }} onSave={handleSave} meal={editingMeal} defaultDate={selectedDate} />
      </Suspense>

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

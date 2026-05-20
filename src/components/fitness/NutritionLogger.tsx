import { useState, useMemo } from 'react'
import { Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet, Pencil, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { MealForm } from './MealForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Meal } from '@/types/fitness'

export function NutritionLogger() {
  const { meals, addMeal, deleteMeal } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const todayMeals = useMemo(() => {
    return meals.filter((m) => m.date === today).sort((a, b) => {
      const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }
      return order[a.mealType] - order[b.mealType]
    })
  }, [meals, today])

  const summary = useMemo(() => {
    return todayMeals.reduce((acc, m) => {
      acc.calories += m.calories
      acc.protein += m.protein
      acc.carbs += m.carbs
      acc.fat += m.fat
      acc.fiber += m.fiber || 0
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }, [todayMeals])

  const handleSave = (meal: Meal) => {
    addMeal(meal)
    setShowForm(false)
    setEditingMeal(null)
  }

  const handleDelete = async () => {
    if (!deletingMeal) return
    deleteMeal(deletingMeal.id)
    setDeletingMeal(null)
  }

  const mealTypeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    breakfast: { icon: '🍳', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', label: 'Breakfast' },
    lunch: { icon: '🥗', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30', label: 'Lunch' },
    dinner: { icon: '🍽️', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30', label: 'Dinner' },
    snack: { icon: '🍎', color: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/30', label: 'Snack' },
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2">
              <Flame className="w-4 h-4" />
              <span>Calories</span>
            </div>
            <p className="text-3xl font-bold text-white">{Math.round(summary.calories)}</p>
            <p className="text-xs text-gray-500 mt-1">kcal</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <Beef className="w-4 h-4" />
              <span>Protein</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{Math.round(summary.protein)}g</p>
            <p className="text-xs text-gray-500 mt-1">{todayMeals.length} meals</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2">
              <Wheat className="w-4 h-4" />
              <span>Carbs</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">{Math.round(summary.carbs)}g</p>
            <p className="text-xs text-gray-500 mt-1">carbohydrates</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <Droplet className="w-4 h-4" />
              <span>Fat</span>
            </div>
            <p className="text-3xl font-bold text-sky-400">{Math.round(summary.fat)}g</p>
            <p className="text-xs text-gray-500 mt-1">lipids</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Today's Meals</h3>
        <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Log Meal
        </Button>
      </div>

      {todayMeals.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-rose-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No meals logged today</p>
          <p className="text-gray-500 text-sm mb-4">Start tracking what you eat</p>
          <Button variant="primary" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
            Log Your First Meal
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {todayMeals.map((meal) => {
            const config = mealTypeConfig[meal.mealType]
            return (
              <div key={meal.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center text-xl shadow-lg`} style={{boxShadow: '0 0 20px rgba(16,185,129,0.15)'}}>
                        {config.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{meal.name}</h4>
                        <p className="text-sm text-gray-400">{config.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMeal(meal); setShowForm(true) }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingMeal(meal)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
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
              </div>
            )
          })}
        </div>
      )}

      <MealForm isOpen={showForm} onClose={() => { setShowForm(false); setEditingMeal(null) }} onSave={handleSave} meal={editingMeal} />

      {deletingMeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingMeal(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Meal?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingMeal.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingMeal(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { storage } from '@/lib/storage'
import { MealForm } from './MealForm'
import type { Meal } from '@/types/fitness'
import { Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplet } from 'lucide-react'

interface NutritionLoggerProps {
  meals: Meal[]
  onMealsChange: () => void
}

export function NutritionLogger({ meals, onMealsChange }: NutritionLoggerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const todayMeals = useMemo(() => {
    return meals
      .filter((m) => m.date === today)
      .sort((a, b) => {
        const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }
        return order[a.mealType] - order[b.mealType]
      })
  }, [meals, today])

  const summary = useMemo(() => {
    return todayMeals.reduce(
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
  }, [todayMeals])

  const handleSave = async (meal: Meal) => {
    await storage.put('meals', meal)
    setShowForm(false)
    setEditingMeal(null)
    onMealsChange()
  }

  const handleDelete = async (id: string) => {
    await storage.delete('meals', id)
    onMealsChange()
  }

  const mealTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    breakfast: { icon: <Utensils size={12} />, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    lunch: { icon: <Beef size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    dinner: { icon: <Flame size={12} />, color: 'text-rose-400', bg: 'bg-rose-500/15' },
    snack: { icon: <Wheat size={12} />, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Nutrition</h3>
          <p className="text-xs text-muted">{meals.length} meals logged</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditingMeal(null); setShowForm(true) }}>
          <Plus size={14} className="mr-1" /> Log Meal
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-rose-400" />
              <p className="text-xs text-muted">Calories</p>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{Math.round(summary.calories)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Beef size={14} className="text-emerald-400" />
              <p className="text-xs text-muted">Protein</p>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{Math.round(summary.protein)}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Wheat size={14} className="text-amber-400" />
              <p className="text-xs text-muted">Carbs</p>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{Math.round(summary.carbs)}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Droplet size={14} className="text-sky-400" />
              <p className="text-xs text-muted">Fat</p>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{Math.round(summary.fat)}g</p>
          </CardContent>
        </Card>
      </div>

      {todayMeals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No meals logged today.</p>
            <Button variant="primary" size="sm" onClick={() => { setEditingMeal(null); setShowForm(true) }} className="mt-3">
              Log your first meal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todayMeals.map((meal) => (
            <Card key={meal.id} hover>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${mealTypeConfig[meal.mealType].bg} ${mealTypeConfig[meal.mealType].color}`}>
                    {mealTypeConfig[meal.mealType].icon}
                    {meal.mealType}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{meal.name}</p>
                    <p className="text-xs text-muted">{meal.calories} kcal &middot; P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingMeal(meal); setShowForm(true) }}>
                    <Plus size={14} className="rotate-45 text-muted hover:text-white" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(meal.id)}>
                    <Trash2 size={14} className="text-muted hover:text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MealForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingMeal(null) }}
        onSave={handleSave}
        meal={editingMeal}
      />
    </div>
  )
}

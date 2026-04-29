import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface MealPlan {
  id: string
  day: string
  meals: { type: string; name: string; calories: number }[]
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const sampleMeals = {
  Breakfast: ['Oatmeal with Berries', 'Eggs & Toast', 'Greek Yogurt Bowl', 'Protein Smoothie', 'Avocado Toast'],
  Lunch: ['Grilled Chicken Salad', 'Turkey Wrap', 'Quinoa Bowl', 'Chicken Rice', 'Salmon with Veggies'],
  Dinner: ['Steak & Potatoes', 'Pasta Primavera', 'Fish Tacos', ' Stir Fry', 'Grilled Chicken with Rice'],
  Snack: ['Protein Bar', 'Mixed Nuts', 'Apple & Peanut Butter', 'Cottage Cheese', 'Rice Cakes'],
}

export function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedType, setSelectedType] = useState('Breakfast')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    initMealPlan()
  }

  const initMealPlan = () => {
    const plan: MealPlan[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      plan.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        day: d.toISOString().split('T')[0],
        meals: [],
      })
    }
    setMealPlan(plan)
  }

  const addMealToPlan = (name: string, calories: number) => {
    const updated = mealPlan.map((day, i) => {
      if (i === selectedDay) {
        return {
          ...day,
          meals: [...day.meals, { type: selectedType, name, calories }],
        }
      }
      return day
    })
    setMealPlan(updated)
    setShowModal(false)
  }

  const removeMeal = (dayIndex: number, mealIndex: number) => {
    const updated = mealPlan.map((day, i) => {
      if (i === dayIndex) {
        return {
          ...day,
          meals: day.meals.filter((_, mi) => mi !== mealIndex),
        }
      }
      return day
    })
    setMealPlan(updated)
  }

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getTotalCalories = (day: MealPlan) => {
    return day.meals.reduce((sum, m) => sum + m.calories, 0)
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-4">Weekly Meal Plan</h4>
          <div className="space-y-4">
            {mealPlan.map((day, dayIndex) => {
              const total = getTotalCalories(day)
              return (
                <div key={day.id} className="border border-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{getDayName(day.day)}</span>
                    <span className={`text-sm ${total > 2000 ? 'text-orange-400' : total > 1500 ? 'text-green-400' : 'text-gray-400'}`}>
                      {total} cal
                    </span>
                  </div>
                  <div className="space-y-2">
                    {day.meals.length === 0 ? (
                      <p className="text-gray-500 text-sm">No meals planned</p>
                    ) : (
                      day.meals.map((meal, mi) => (
                        <div key={mi} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            <span className="text-purple-400">{meal.type}:</span> {meal.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{meal.calories} cal</span>
                            <button onClick={() => removeMeal(dayIndex, mi)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => { setSelectedDay(dayIndex); setShowModal(true) }}
                      className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add meal
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Meal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`p-2 rounded-lg text-sm ${
                    selectedType === t
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Add</label>
            <div className="space-y-2">
              {(sampleMeals[selectedType as keyof typeof sampleMeals] || []).map((meal) => (
                <button
                  key={meal}
                  onClick={() => addMealToPlan(meal, selectedType === 'Snack' ? 150 : 500)}
                  className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-left hover:border-purple-500/50 transition-all"
                >
                  <span className="text-white">{meal}</span>
                  <span className="text-gray-500 text-sm ml-2">~{selectedType === 'Snack' ? 150 : 500} cal</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm mb-2">Or create custom:</p>
            <Input
              placeholder="Meal name"
              className="mb-2"
              id="customMeal"
            />
            <Input
              placeholder="Calories"
              type="number"
              className="mb-2"
              id="customCalories"
            />
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                const name = (document.getElementById('customMeal') as HTMLInputElement).value
                const cal = Number((document.getElementById('customCalories') as HTMLInputElement).value) || 300
                if (name) addMealToPlan(name, cal)
              }}
            >
              Add Custom Meal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
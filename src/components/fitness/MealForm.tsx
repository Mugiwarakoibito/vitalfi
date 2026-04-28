import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import type { Meal } from '@/types/fitness'

interface MealFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (meal: Meal) => void
  meal?: Meal | null
}

export function MealForm({ isOpen, onClose, onSave, meal }: MealFormProps) {
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<Meal['mealType']>('breakfast')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (meal) {
      setName(meal.name)
      setMealType(meal.mealType)
      setCalories(meal.calories.toString())
      setProtein(meal.protein.toString())
      setCarbs(meal.carbs.toString())
      setFat(meal.fat.toString())
      setFiber(meal.fiber?.toString() ?? '')
      setDate(meal.date)
    } else {
      resetForm()
    }
  }, [meal, isOpen])

  const resetForm = () => {
    setName('')
    setMealType('breakfast')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setFiber('')
    setDate(new Date().toISOString().split('T')[0])
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!calories || isNaN(parseFloat(calories))) newErrors.calories = 'Valid calories required'
    if (!protein || isNaN(parseFloat(protein))) newErrors.protein = 'Valid protein required'
    if (!carbs || isNaN(parseFloat(carbs))) newErrors.carbs = 'Valid carbs required'
    if (!fat || isNaN(parseFloat(fat))) newErrors.fat = 'Valid fat required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const m: Meal = {
      id: meal?.id || generateId(),
      name: name.trim(),
      mealType,
      date,
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
      fiber: fiber ? parseFloat(fiber) : undefined,
      createdAt: meal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(m)
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meal ? 'Edit Meal' : 'Log Meal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Meal Name" placeholder="e.g. Grilled chicken salad" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Meal Type</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value as Meal['mealType'])} className="glass-input w-full">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Calories" type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} error={errors.calories} />
          <Input label="Protein (g)" type="number" step="0.1" placeholder="g" value={protein} onChange={(e) => setProtein(e.target.value)} error={errors.protein} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Carbs (g)" type="number" step="0.1" placeholder="g" value={carbs} onChange={(e) => setCarbs(e.target.value)} error={errors.carbs} />
          <Input label="Fat (g)" type="number" step="0.1" placeholder="g" value={fat} onChange={(e) => setFat(e.target.value)} error={errors.fat} />
          <Input label="Fiber (g)" type="number" step="0.1" placeholder="Optional" value={fiber} onChange={(e) => setFiber(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">
            {meal ? 'Update' : 'Log'} Meal
          </Button>
        </div>
      </form>
    </Modal>
  )
}

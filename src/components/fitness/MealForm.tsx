import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import { Search, Plus, Trash2, ChefHat } from 'lucide-react'
import type { Meal } from '@/types/fitness'

interface MealFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (meal: Meal) => void
  meal?: Meal | null
}

interface FoodItem {
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

const FOOD_DB: FoodItem[] = [
  // Meat & Poultry
  { name: 'Chicken Breast', category: 'Meat', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Chicken Thigh', category: 'Meat', calories: 209, protein: 26, carbs: 0, fat: 11 },
  { name: 'Ground Beef 90/10', category: 'Meat', calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: 'Ground Beef 80/20', category: 'Meat', calories: 254, protein: 24, carbs: 0, fat: 17 },
  { name: 'Steak (sirloin)', category: 'Meat', calories: 206, protein: 26, carbs: 0, fat: 11 },
  { name: 'Pork Chop', category: 'Meat', calories: 231, protein: 26, carbs: 0, fat: 14 },
  { name: 'Turkey Breast', category: 'Meat', calories: 135, protein: 30, carbs: 0, fat: 1 },
  { name: 'Bacon', category: 'Meat', calories: 541, protein: 37, carbs: 1, fat: 42 },
  { name: 'Lamb Chop', category: 'Meat', calories: 209, protein: 25, carbs: 0, fat: 12 },

  // Fish & Seafood
  { name: 'Salmon', category: 'Fish', calories: 208, protein: 25, carbs: 0, fat: 13 },
  { name: 'Tuna (canned)', category: 'Fish', calories: 132, protein: 28, carbs: 0, fat: 1 },
  { name: 'Shrimp', category: 'Fish', calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { name: 'Cod', category: 'Fish', calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: 'Tilapia', category: 'Fish', calories: 96, protein: 20, carbs: 0, fat: 1.7 },
  { name: 'Mackerel', category: 'Fish', calories: 205, protein: 19, carbs: 0, fat: 14 },

  // Eggs & Dairy
  { name: 'Egg (whole)', category: 'Dairy', calories: 155, protein: 13, carbs: 1, fat: 11 },
  { name: 'Egg White', category: 'Dairy', calories: 52, protein: 11, carbs: 1, fat: 0 },
  { name: 'Greek Yogurt (plain)', category: 'Dairy', calories: 59, protein: 10, carbs: 4, fat: 0.7 },
  { name: 'Cottage Cheese', category: 'Dairy', calories: 98, protein: 11, carbs: 3, fat: 4 },
  { name: 'Milk (whole)', category: 'Dairy', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: 'Milk (skim)', category: 'Dairy', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: 'Cheese (cheddar)', category: 'Dairy', calories: 404, protein: 25, carbs: 1, fat: 33 },
  { name: 'Cheese (mozzarella)', category: 'Dairy', calories: 280, protein: 28, carbs: 3, fat: 17 },
  { name: 'Whey Protein (powder)', category: 'Dairy', calories: 400, protein: 80, carbs: 10, fat: 5 },
  { name: 'Casein Protein (powder)', category: 'Dairy', calories: 370, protein: 74, carbs: 7, fat: 4 },

  // Grains & Carbs
  { name: 'Oats', category: 'Grains', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  { name: 'Brown Rice (cooked)', category: 'Grains', calories: 123, protein: 2.7, carbs: 26, fat: 1 },
  { name: 'White Rice (cooked)', category: 'Grains', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Quinoa (cooked)', category: 'Grains', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Pasta (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Whole Wheat Bread', category: 'Grains', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
  { name: 'White Bread', category: 'Grains', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Tortilla (flour)', category: 'Grains', calories: 300, protein: 8, carbs: 50, fat: 7 },
  { name: 'Couscous (cooked)', category: 'Grains', calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },

  // Vegetables
  { name: 'Broccoli', category: 'Veggies', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { name: 'Spinach', category: 'Veggies', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: 'Kale', category: 'Veggies', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, fiber: 3.6 },
  { name: 'Sweet Potato', category: 'Veggies', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3 },
  { name: 'Potato (white)', category: 'Veggies', calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2 },
  { name: 'Carrots', category: 'Veggies', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: 'Bell Pepper', category: 'Veggies', calories: 26, protein: 1, carbs: 6, fat: 0.2, fiber: 2.1 },
  { name: 'Onion', category: 'Veggies', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7 },
  { name: 'Tomato', category: 'Veggies', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: 'Cucumber', category: 'Veggies', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { name: 'Asparagus', category: 'Veggies', calories: 20, protein: 2.2, carbs: 4, fat: 0.1, fiber: 2.1 },
  { name: 'Green Beans', category: 'Veggies', calories: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7 },
  { name: 'Cauliflower', category: 'Veggies', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2 },
  { name: 'Mixed Salad Greens', category: 'Veggies', calories: 17, protein: 1.5, carbs: 3, fat: 0.3, fiber: 2 },

  // Fruits
  { name: 'Banana', category: 'Fruit', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: 'Apple', category: 'Fruit', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: 'Blueberries', category: 'Fruit', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { name: 'Strawberries', category: 'Fruit', calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2 },
  { name: 'Orange', category: 'Fruit', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: 'Grapes', category: 'Fruit', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: 'Avocado', category: 'Fruit', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7 },
  { name: 'Pineapple', category: 'Fruit', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },

  // Legumes
  { name: 'Black Beans (cooked)', category: 'Legumes', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  { name: 'Lentils (cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: 'Chickpeas (cooked)', category: 'Legumes', calories: 139, protein: 7.6, carbs: 23, fat: 2.4, fiber: 6.4 },
  { name: 'Edamame', category: 'Legumes', calories: 122, protein: 12, carbs: 9, fat: 5, fiber: 5.2 },
  { name: 'Tofu (firm)', category: 'Legumes', calories: 76, protein: 8, carbs: 2, fat: 4.8, fiber: 0.3 },
  { name: 'Tempeh', category: 'Legumes', calories: 193, protein: 19, carbs: 9, fat: 11, fiber: 0 },

  // Nuts & Seeds
  { name: 'Almonds', category: 'Nuts', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: 'Peanuts', category: 'Nuts', calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  { name: 'Walnuts', category: 'Nuts', calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: 'Cashews', category: 'Nuts', calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: 'Chia Seeds', category: 'Nuts', calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 },
  { name: 'Flax Seeds', category: 'Nuts', calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },
  { name: 'Peanut Butter', category: 'Nuts', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },

  // Oils & Fats
  { name: 'Olive Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Coconut Oil', category: 'Fats', calories: 862, protein: 0, carbs: 0, fat: 100 },
  { name: 'Butter', category: 'Fats', calories: 717, protein: 0.9, carbs: 0, fat: 81 },
  { name: 'Ghee', category: 'Fats', calories: 900, protein: 0, carbs: 0, fat: 100 },

  // Condiments & Sauces
  { name: 'Honey', category: 'Condiments', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: 'Maple Syrup', category: 'Condiments', calories: 260, protein: 0, carbs: 67, fat: 0 },
  { name: 'Soy Sauce', category: 'Condiments', calories: 53, protein: 8, carbs: 5, fat: 0 },
  { name: 'Hot Sauce', category: 'Condiments', calories: 50, protein: 0, carbs: 10, fat: 0 },
  { name: 'BBQ Sauce', category: 'Condiments', calories: 160, protein: 1, carbs: 38, fat: 1 },
  { name: 'Ketchup', category: 'Condiments', calories: 101, protein: 1, carbs: 23, fat: 0.1 },
  { name: 'Mustard', category: 'Condiments', calories: 66, protein: 4, carbs: 6, fat: 3 },
  { name: 'Mayonnaise', category: 'Condiments', calories: 700, protein: 1, carbs: 0.6, fat: 78 },

  // Snacks & Misc
  { name: 'Dark Chocolate (70%)', category: 'Snacks', calories: 598, protein: 7.8, carbs: 46, fat: 43, fiber: 11 },
  { name: 'Granola', category: 'Snacks', calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 6 },
  { name: 'Rice Cakes', category: 'Snacks', calories: 392, protein: 8, carbs: 82, fat: 3, fiber: 3 },
  { name: 'Hummus', category: 'Snacks', calories: 166, protein: 8, carbs: 14, fat: 10, fiber: 6 },
  { name: 'Trail Mix', category: 'Snacks', calories: 462, protein: 12, carbs: 44, fat: 29, fiber: 6 },
]

interface IngredientRow {
  id: string
  food: FoodItem
  grams: number
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
  const [mode, setMode] = useState<'quick' | 'build'>('quick')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [addingGrams, setAddingGrams] = useState('100')

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
      setMode('quick')
      setIngredients([])
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
    setMode('quick')
    setIngredients([])
    setSearch('')
    setSelectedCategory('')
    setAddingGrams('100')
  }

  const categories = useMemo(() => [...new Set(FOOD_DB.map(f => f.category))], [])

  const filteredFoods = useMemo(() => {
    let result = FOOD_DB
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(f => f.name.toLowerCase().includes(q))
    }
    if (selectedCategory) {
      result = result.filter(f => f.category === selectedCategory)
    }
    return result.slice(0, 12)
  }, [search, selectedCategory])

  const addIngredient = (food: FoodItem) => {
    const grams = parseFloat(addingGrams) || 100
    setIngredients(prev => [...prev, { id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2), food, grams }])
    setSearch('')
    setSelectedCategory('')
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  const updateGrams = (id: string, grams: string) => {
    const val = parseFloat(grams)
    if (!isNaN(val) && val > 0) {
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, grams: val } : i))
    } else if (grams === '') {
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, grams: 0 } : i))
    }
  }

  const ingredientTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    for (const ing of ingredients) {
      const ratio = ing.grams / 100
      totals.calories += Math.round(ing.food.calories * ratio)
      totals.protein += Math.round(ing.food.protein * ratio * 10) / 10
      totals.carbs += Math.round(ing.food.carbs * ratio * 10) / 10
      totals.fat += Math.round(ing.food.fat * ratio * 10) / 10
      totals.fiber += Math.round((ing.food.fiber || 0) * ratio * 10) / 10
    }
    return totals
  }, [ingredients])

  const applyIngredients = () => {
    setCalories(String(ingredientTotals.calories))
    setProtein(String(ingredientTotals.protein))
    setCarbs(String(ingredientTotals.carbs))
    setFat(String(ingredientTotals.fat))
    setFiber(String(ingredientTotals.fiber))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (mode === 'quick') {
      if (!calories || isNaN(parseFloat(calories))) newErrors.calories = 'Required'
      if (!protein || isNaN(parseFloat(protein))) newErrors.protein = 'Required'
      if (!carbs || isNaN(parseFloat(carbs))) newErrors.carbs = 'Required'
      if (!fat || isNaN(parseFloat(fat))) newErrors.fat = 'Required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'build' && ingredients.length > 0) {
      applyIngredients()
    }
    if (!validate()) return

    const finalCal = parseFloat(mode === 'build' && ingredients.length > 0 ? String(ingredientTotals.calories) : calories)
    const finalPro = parseFloat(mode === 'build' && ingredients.length > 0 ? String(ingredientTotals.protein) : protein)
    const finalCarb = parseFloat(mode === 'build' && ingredients.length > 0 ? String(ingredientTotals.carbs) : carbs)
    const finalFat = parseFloat(mode === 'build' && ingredients.length > 0 ? String(ingredientTotals.fat) : fat)
    const finalFib = mode === 'build' && ingredients.length > 0 ? ingredientTotals.fiber : (fiber ? parseFloat(fiber) : undefined)

    const m: Meal = {
      id: meal?.id || generateId(),
      name: name.trim(),
      mealType,
      date,
      calories: finalCal,
      protein: finalPro,
      carbs: finalCarb,
      fat: finalFat,
      fiber: finalFib || undefined,
      createdAt: meal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(m)
    resetForm()
    onClose()
  }

  const hasIngredients = ingredients.length > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meal ? 'Edit Meal' : 'Log Meal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Toggle */}
        {!meal && (
          <div className="flex gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1">
            <button type="button" onClick={() => setMode('quick')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                mode === 'quick' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}>Quick Log</button>
            <button type="button" onClick={() => setMode('build')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                mode === 'build' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <ChefHat className="w-3 h-3 inline mr-1" />Build Meal
            </button>
          </div>
        )}

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

        {/* Ingredient Builder */}
        {mode === 'build' && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Ingredients</p>
              {hasIngredients && (
                <span className="text-[9px] text-gray-500">{ingredients.length} items</span>
              )}
            </div>

            {/* Search & Add */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search foods..." autoComplete="off"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-1 flex-wrap">
              <button type="button" onClick={() => setSelectedCategory('')}
                className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${!selectedCategory ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => { setSelectedCategory(cat); setSearch('') }}
                  className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${selectedCategory === cat ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Food list */}
            {search || selectedCategory ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredFoods.map(food => (
                  <button key={food.name} type="button" onClick={() => addIngredient(food)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/[0.08] border border-white/5 transition-all group">
                    <div className="text-left">
                      <p className="text-xs font-medium text-white">{food.name}</p>
                      <p className="text-[9px] text-gray-600">{food.calories} kcal · P{food.protein} C{food.carbs} F{food.fat} /100g</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={addingGrams} onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setAddingGrams(e.target.value)}
                        className="w-14 text-[10px] py-1 px-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[9px] text-gray-500">g</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </div>
                  </button>
                ))}
                {filteredFoods.length === 0 && (
                  <p className="text-[10px] text-gray-500 text-center py-2">No foods found</p>
                )}
              </div>
            ) : hasIngredients ? null : (
              <p className="text-[10px] text-gray-500 text-center py-2">Search or select a category to add ingredients</p>
            )}

            {/* Added ingredients */}
            {hasIngredients && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-xs font-medium text-white flex-1 truncate">{ing.food.name}</span>
                    <div className="flex items-center gap-1">
                      <input type="number" value={ing.grams} onChange={(e) => updateGrams(ing.id, e.target.value)}
                        className="w-14 text-[10px] py-0.5 px-1.5 rounded bg-white/10 border border-white/20 text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[9px] text-gray-500">g</span>
                    </div>
                    <button type="button" onClick={() => removeIngredient(ing.id)}
                      className="p-0.5 rounded text-gray-600 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Running total */}
            {hasIngredients && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Running Total</span>
                  <button type="button" onClick={applyIngredients}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-medium transition-all">
                    Apply to meal
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-sm font-bold text-rose-400">{ingredientTotals.calories}</p><p className="text-[8px] text-gray-600">kcal</p></div>
                  <div><p className="text-sm font-bold text-emerald-400">{ingredientTotals.protein}g</p><p className="text-[8px] text-gray-600">protein</p></div>
                  <div><p className="text-sm font-bold text-amber-400">{ingredientTotals.carbs}g</p><p className="text-[8px] text-gray-600">carbs</p></div>
                  <div><p className="text-sm font-bold text-sky-400">{ingredientTotals.fat}g</p><p className="text-[8px] text-gray-600">fat</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Macro Fields (shown in Quick mode, or always visible for manual override) */}
        {mode === 'quick' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Calories" type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} error={errors.calories} />
              <Input label="Protein (g)" type="number" step="0.1" placeholder="g" value={protein} onChange={(e) => setProtein(e.target.value)} error={errors.protein} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Carbs (g)" type="number" step="0.1" placeholder="g" value={carbs} onChange={(e) => setCarbs(e.target.value)} error={errors.carbs} />
              <Input label="Fat (g)" type="number" step="0.1" placeholder="g" value={fat} onChange={(e) => setFat(e.target.value)} error={errors.fat} />
              <Input label="Fiber (g)" type="number" step="0.1" placeholder="Optional" value={fiber} onChange={(e) => setFiber(e.target.value)} />
            </div>
          </>
        )}

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

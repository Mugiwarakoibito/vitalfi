import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import { Search, Plus, Trash2 } from 'lucide-react'
import type { Meal } from '@/types/fitness'

interface MealFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (meal: Meal) => void
  meal?: Meal | null
  defaultDate?: string
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
  // Meat
  { name: 'Chicken Breast', category: 'Meat', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Chicken Thigh', category: 'Meat', calories: 209, protein: 26, carbs: 0, fat: 11 },
  { name: 'Chicken Wing', category: 'Meat', calories: 203, protein: 30, carbs: 0, fat: 8 },
  { name: 'Ground Beef 90/10', category: 'Meat', calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: 'Ground Beef 80/20', category: 'Meat', calories: 254, protein: 24, carbs: 0, fat: 17 },
  { name: 'Steak (ribeye)', category: 'Meat', calories: 271, protein: 25, carbs: 0, fat: 19 },
  { name: 'Steak (sirloin)', category: 'Meat', calories: 206, protein: 26, carbs: 0, fat: 11 },
  { name: 'Pork Chop', category: 'Meat', calories: 231, protein: 26, carbs: 0, fat: 14 },
  { name: 'Pork Belly', category: 'Meat', calories: 518, protein: 9, carbs: 0, fat: 53 },
  { name: 'Ham (deli)', category: 'Meat', calories: 145, protein: 20, carbs: 1, fat: 7 },
  { name: 'Turkey Breast', category: 'Meat', calories: 135, protein: 30, carbs: 0, fat: 1 },
  { name: 'Bacon', category: 'Meat', calories: 541, protein: 37, carbs: 1, fat: 42 },
  { name: 'Lamb Chop', category: 'Meat', calories: 209, protein: 25, carbs: 0, fat: 12 },
  { name: 'Lamb Mince', category: 'Meat', calories: 282, protein: 24, carbs: 0, fat: 20 },
  { name: 'Duck Breast', category: 'Meat', calories: 200, protein: 25, carbs: 0, fat: 11 },
  { name: 'Venison', category: 'Meat', calories: 158, protein: 30, carbs: 0, fat: 3 },
  { name: 'Salami', category: 'Meat', calories: 407, protein: 22, carbs: 2, fat: 33 },
  { name: 'Chorizo', category: 'Meat', calories: 455, protein: 24, carbs: 2, fat: 38 },

  // Fish
  { name: 'Salmon', category: 'Fish', calories: 208, protein: 25, carbs: 0, fat: 13 },
  { name: 'Tuna (canned)', category: 'Fish', calories: 132, protein: 28, carbs: 0, fat: 1 },
  { name: 'Shrimp', category: 'Fish', calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { name: 'Cod', category: 'Fish', calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: 'Tilapia', category: 'Fish', calories: 96, protein: 20, carbs: 0, fat: 1.7 },
  { name: 'Mackerel', category: 'Fish', calories: 205, protein: 19, carbs: 0, fat: 14 },
  { name: 'Sardines (canned)', category: 'Fish', calories: 208, protein: 25, carbs: 0, fat: 11 },
  { name: 'Haddock', category: 'Fish', calories: 82, protein: 19, carbs: 0, fat: 0.6 },
  { name: 'Trout', category: 'Fish', calories: 148, protein: 21, carbs: 0, fat: 7 },
  { name: 'Crab', category: 'Fish', calories: 87, protein: 19, carbs: 0, fat: 1 },
  { name: 'Lobster', category: 'Fish', calories: 89, protein: 19, carbs: 0, fat: 1 },
  { name: 'Mussels', category: 'Fish', calories: 86, protein: 12, carbs: 4, fat: 2 },
  { name: 'Clams', category: 'Fish', calories: 74, protein: 13, carbs: 3, fat: 1 },
  { name: 'Octopus', category: 'Fish', calories: 82, protein: 15, carbs: 3, fat: 1 },
  { name: 'Anchovies', category: 'Fish', calories: 131, protein: 20, carbs: 0, fat: 5 },

  // Dairy
  { name: 'Egg (whole)', category: 'Dairy', calories: 155, protein: 13, carbs: 1, fat: 11 },
  { name: 'Egg White', category: 'Dairy', calories: 52, protein: 11, carbs: 1, fat: 0 },
  { name: 'Greek Yogurt (plain)', category: 'Dairy', calories: 59, protein: 10, carbs: 4, fat: 0.7 },
  { name: 'Cottage Cheese', category: 'Dairy', calories: 98, protein: 11, carbs: 3, fat: 4 },
  { name: 'Milk (whole)', category: 'Dairy', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: 'Milk (skim)', category: 'Dairy', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: 'Cheese (cheddar)', category: 'Dairy', calories: 404, protein: 25, carbs: 1, fat: 33 },
  { name: 'Cheese (mozzarella)', category: 'Dairy', calories: 280, protein: 28, carbs: 3, fat: 17 },
  { name: 'Feta Cheese', category: 'Dairy', calories: 264, protein: 14, carbs: 4, fat: 21 },
  { name: 'Parmesan Cheese', category: 'Dairy', calories: 431, protein: 38, carbs: 4, fat: 29 },
  { name: 'Cream Cheese', category: 'Dairy', calories: 342, protein: 6, carbs: 4, fat: 34 },
  { name: 'Ricotta Cheese', category: 'Dairy', calories: 174, protein: 11, carbs: 3, fat: 13 },
  { name: 'Sour Cream', category: 'Dairy', calories: 198, protein: 3, carbs: 5, fat: 19 },
  { name: 'Heavy Cream', category: 'Dairy', calories: 340, protein: 3, carbs: 3, fat: 36 },
  { name: 'Whey Protein (powder)', category: 'Dairy', calories: 400, protein: 80, carbs: 10, fat: 5 },
  { name: 'Casein Protein (powder)', category: 'Dairy', calories: 370, protein: 74, carbs: 7, fat: 4 },

  // Grains
  { name: 'Oats', category: 'Grains', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  { name: 'Brown Rice (cooked)', category: 'Grains', calories: 123, protein: 2.7, carbs: 26, fat: 1 },
  { name: 'White Rice (cooked)', category: 'Grains', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Quinoa (cooked)', category: 'Grains', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Pasta (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Whole Wheat Bread', category: 'Grains', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
  { name: 'White Bread', category: 'Grains', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Sourdough Bread', category: 'Grains', calories: 266, protein: 10, carbs: 50, fat: 3 },
  { name: 'Tortilla (flour)', category: 'Grains', calories: 300, protein: 8, carbs: 50, fat: 7 },
  { name: 'Tortilla (corn)', category: 'Grains', calories: 218, protein: 6, carbs: 44, fat: 3 },
  { name: 'Pita Bread', category: 'Grains', calories: 275, protein: 9, carbs: 55, fat: 2 },
  { name: 'Naan Bread', category: 'Grains', calories: 262, protein: 9, carbs: 45, fat: 6 },
  { name: 'Couscous (cooked)', category: 'Grains', calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  { name: 'Bulgur (cooked)', category: 'Grains', calories: 83, protein: 3.1, carbs: 18, fat: 0.2, fiber: 4 },
  { name: 'Barley (cooked)', category: 'Grains', calories: 123, protein: 3.6, carbs: 28, fat: 0.4, fiber: 6 },
  { name: 'Buckwheat (cooked)', category: 'Grains', calories: 110, protein: 4, carbs: 23, fat: 0.7, fiber: 3 },
  { name: 'Rice Noodles (cooked)', category: 'Grains', calories: 108, protein: 2, carbs: 24, fat: 0.2 },

  // Veggies
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
  { name: 'Zucchini', category: 'Veggies', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1 },
  { name: 'Eggplant', category: 'Veggies', calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3 },
  { name: 'Mushrooms', category: 'Veggies', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },
  { name: 'Cabbage', category: 'Veggies', calories: 25, protein: 1.3, carbs: 6, fat: 0.1, fiber: 2.5 },
  { name: 'Brussels Sprouts', category: 'Veggies', calories: 43, protein: 3.4, carbs: 9, fat: 0.3, fiber: 3.8 },
  { name: 'Corn (sweet)', category: 'Veggies', calories: 86, protein: 3.2, carbs: 19, fat: 1.4, fiber: 2.7 },
  { name: 'Peas', category: 'Veggies', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.7 },
  { name: 'Celery', category: 'Veggies', calories: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6 },
  { name: 'Beets', category: 'Veggies', calories: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: 'Radish', category: 'Veggies', calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6 },

  // Fruit
  { name: 'Banana', category: 'Fruit', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: 'Apple', category: 'Fruit', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: 'Blueberries', category: 'Fruit', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { name: 'Strawberries', category: 'Fruit', calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2 },
  { name: 'Orange', category: 'Fruit', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: 'Grapes', category: 'Fruit', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: 'Avocado', category: 'Fruit', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7 },
  { name: 'Pineapple', category: 'Fruit', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
  { name: 'Mango', category: 'Fruit', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: 'Watermelon', category: 'Fruit', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4 },
  { name: 'Papaya', category: 'Fruit', calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: 'Kiwi', category: 'Fruit', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3 },
  { name: 'Pear', category: 'Fruit', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1 },
  { name: 'Peach', category: 'Fruit', calories: 39, protein: 0.9, carbs: 10, fat: 0.3, fiber: 1.5 },
  { name: 'Cherries', category: 'Fruit', calories: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6 },
  { name: 'Raspberries', category: 'Fruit', calories: 52, protein: 1.2, carbs: 12, fat: 0.7, fiber: 6.5 },
  { name: 'Blackberries', category: 'Fruit', calories: 43, protein: 1.4, carbs: 10, fat: 0.5, fiber: 5.3 },
  { name: 'Coconut (flesh)', category: 'Fruit', calories: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9 },

  // Legumes
  { name: 'Black Beans (cooked)', category: 'Legumes', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  { name: 'Lentils (cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: 'Chickpeas (cooked)', category: 'Legumes', calories: 139, protein: 7.6, carbs: 23, fat: 2.4, fiber: 6.4 },
  { name: 'Edamame', category: 'Legumes', calories: 122, protein: 12, carbs: 9, fat: 5, fiber: 5.2 },
  { name: 'Tofu (firm)', category: 'Legumes', calories: 76, protein: 8, carbs: 2, fat: 4.8, fiber: 0.3 },
  { name: 'Tempeh', category: 'Legumes', calories: 193, protein: 19, carbs: 9, fat: 11, fiber: 0 },
  { name: 'Kidney Beans (cooked)', category: 'Legumes', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4 },
  { name: 'Pinto Beans (cooked)', category: 'Legumes', calories: 143, protein: 9, carbs: 26, fat: 0.7, fiber: 9 },
  { name: 'Mung Beans (cooked)', category: 'Legumes', calories: 105, protein: 7, carbs: 19, fat: 0.4, fiber: 7.6 },
  { name: 'Soybeans (cooked)', category: 'Legumes', calories: 173, protein: 17, carbs: 10, fat: 9, fiber: 6 },

  // Nuts
  { name: 'Almonds', category: 'Nuts', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: 'Peanuts', category: 'Nuts', calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  { name: 'Walnuts', category: 'Nuts', calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: 'Cashews', category: 'Nuts', calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: 'Pecans', category: 'Nuts', calories: 691, protein: 9, carbs: 14, fat: 72, fiber: 10 },
  { name: 'Macadamia', category: 'Nuts', calories: 718, protein: 8, carbs: 14, fat: 76, fiber: 9 },
  { name: 'Pistachios', category: 'Nuts', calories: 560, protein: 20, carbs: 27, fat: 45, fiber: 10 },
  { name: 'Brazil Nuts', category: 'Nuts', calories: 659, protein: 14, carbs: 12, fat: 67, fiber: 8 },
  { name: 'Chia Seeds', category: 'Nuts', calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 },
  { name: 'Flax Seeds', category: 'Nuts', calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },
  { name: 'Hemp Seeds', category: 'Nuts', calories: 553, protein: 32, carbs: 9, fat: 49, fiber: 4 },
  { name: 'Sunflower Seeds', category: 'Nuts', calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 9 },
  { name: 'Pumpkin Seeds', category: 'Nuts', calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6 },
  { name: 'Peanut Butter', category: 'Nuts', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
  { name: 'Tahini', category: 'Nuts', calories: 595, protein: 17, carbs: 21, fat: 53, fiber: 9 },

  // Fats
  { name: 'Olive Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Coconut Oil', category: 'Fats', calories: 862, protein: 0, carbs: 0, fat: 100 },
  { name: 'Avocado Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Sesame Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Butter', category: 'Fats', calories: 717, protein: 0.9, carbs: 0, fat: 81 },
  { name: 'Ghee', category: 'Fats', calories: 900, protein: 0, carbs: 0, fat: 100 },
  { name: 'Lard', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Duck Fat', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },

  // Condiments
  { name: 'Honey', category: 'Condiments', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: 'Maple Syrup', category: 'Condiments', calories: 260, protein: 0, carbs: 67, fat: 0 },
  { name: 'Soy Sauce', category: 'Condiments', calories: 53, protein: 8, carbs: 5, fat: 0 },
  { name: 'Hot Sauce', category: 'Condiments', calories: 50, protein: 0, carbs: 10, fat: 0 },
  { name: 'BBQ Sauce', category: 'Condiments', calories: 160, protein: 1, carbs: 38, fat: 1 },
  { name: 'Ketchup', category: 'Condiments', calories: 101, protein: 1, carbs: 23, fat: 0.1 },
  { name: 'Mustard', category: 'Condiments', calories: 66, protein: 4, carbs: 6, fat: 3 },
  { name: 'Mayonnaise', category: 'Condiments', calories: 700, protein: 1, carbs: 0.6, fat: 78 },
  { name: 'Salsa', category: 'Condiments', calories: 36, protein: 1.5, carbs: 7, fat: 0.2, fiber: 2 },
  { name: 'Pesto', category: 'Condiments', calories: 490, protein: 5, carbs: 8, fat: 48 },
  { name: 'Tomato Sauce', category: 'Condiments', calories: 42, protein: 1.5, carbs: 7, fat: 0.5, fiber: 2 },
  { name: 'Fish Sauce', category: 'Condiments', calories: 10, protein: 2, carbs: 0, fat: 0 },
  { name: 'Miso Paste', category: 'Condiments', calories: 200, protein: 12, carbs: 26, fat: 6, fiber: 5 },
  { name: 'Vinegar (balsamic)', category: 'Condiments', calories: 88, protein: 0.5, carbs: 17, fat: 0 },
  { name: 'Vinegar (apple cider)', category: 'Condiments', calories: 22, protein: 0, carbs: 1, fat: 0 },
  { name: 'Worcestershire Sauce', category: 'Condiments', calories: 78, protein: 0, carbs: 19, fat: 0 },

  // Snacks
  { name: 'Dark Chocolate (70%)', category: 'Snacks', calories: 598, protein: 7.8, carbs: 46, fat: 43, fiber: 11 },
  { name: 'Granola', category: 'Snacks', calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 6 },
  { name: 'Rice Cakes', category: 'Snacks', calories: 392, protein: 8, carbs: 82, fat: 3, fiber: 3 },
  { name: 'Hummus', category: 'Snacks', calories: 166, protein: 8, carbs: 14, fat: 10, fiber: 6 },
  { name: 'Trail Mix', category: 'Snacks', calories: 462, protein: 12, carbs: 44, fat: 29, fiber: 6 },
  { name: 'Protein Bar', category: 'Snacks', calories: 350, protein: 30, carbs: 35, fat: 12, fiber: 5 },
  { name: 'Beef Jerky', category: 'Snacks', calories: 350, protein: 44, carbs: 11, fat: 15 },
  { name: 'Popcorn (air-popped)', category: 'Snacks', calories: 387, protein: 13, carbs: 78, fat: 4, fiber: 15 },
  { name: 'Tortilla Chips', category: 'Snacks', calories: 497, protein: 7, carbs: 66, fat: 24, fiber: 5 },
  { name: 'Pretzels', category: 'Snacks', calories: 380, protein: 9, carbs: 80, fat: 3, fiber: 3 },
  { name: 'Crackers (whole wheat)', category: 'Snacks', calories: 450, protein: 8, carbs: 68, fat: 16, fiber: 5 },
  { name: 'Dried Apricots', category: 'Snacks', calories: 241, protein: 3.4, carbs: 63, fat: 0.5, fiber: 7 },
  { name: 'Dried Dates', category: 'Snacks', calories: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8 },
  { name: 'Dried Figs', category: 'Snacks', calories: 249, protein: 3.3, carbs: 64, fat: 1, fiber: 10 },
  { name: 'Protein Balls', category: 'Snacks', calories: 420, protein: 20, carbs: 40, fat: 18, fiber: 6 },

  // Meat extras
  { name: 'Turkey Mince', category: 'Meat', calories: 149, protein: 27, carbs: 0, fat: 4 },
  { name: 'Chicken Liver', category: 'Meat', calories: 119, protein: 17, carbs: 1, fat: 5 },
  { name: 'Beef Liver', category: 'Meat', calories: 135, protein: 20, carbs: 5, fat: 4 },
  { name: 'Pork Sausage', category: 'Meat', calories: 298, protein: 17, carbs: 1, fat: 25 },
  { name: 'Chicken Sausage', category: 'Meat', calories: 196, protein: 19, carbs: 3, fat: 12 },
  { name: 'Pepperoni', category: 'Meat', calories: 494, protein: 23, carbs: 1, fat: 44 },
  { name: 'Prosciutto', category: 'Meat', calories: 269, protein: 27, carbs: 0, fat: 17 },
  { name: 'Pastrami', category: 'Meat', calories: 147, protein: 21, carbs: 1, fat: 6 },
  { name: 'Corned Beef', category: 'Meat', calories: 251, protein: 20, carbs: 1, fat: 19 },
  { name: 'Bison', category: 'Meat', calories: 143, protein: 28, carbs: 0, fat: 3 },
  { name: 'Goat', category: 'Meat', calories: 109, protein: 20, carbs: 0, fat: 3 },
  { name: 'Rabbit', category: 'Meat', calories: 136, protein: 20, carbs: 0, fat: 6 },
  { name: 'Pork Ribs', category: 'Meat', calories: 298, protein: 22, carbs: 0, fat: 23 },
  { name: 'Beef Ribs', category: 'Meat', calories: 298, protein: 19, carbs: 0, fat: 24 },

  // Fish extras
  { name: 'Scallops', category: 'Fish', calories: 88, protein: 17, carbs: 5, fat: 1 },
  { name: 'Oysters', category: 'Fish', calories: 68, protein: 7, carbs: 4, fat: 2 },
  { name: 'Squid', category: 'Fish', calories: 92, protein: 16, carbs: 3, fat: 1 },
  { name: 'Halibut', category: 'Fish', calories: 91, protein: 19, carbs: 0, fat: 1 },
  { name: 'Sea Bass', category: 'Fish', calories: 97, protein: 18, carbs: 0, fat: 2 },
  { name: 'Snapper', category: 'Fish', calories: 100, protein: 20, carbs: 0, fat: 2 },
  { name: 'Pollock', category: 'Fish', calories: 82, protein: 19, carbs: 0, fat: 1 },
  { name: 'Catfish', category: 'Fish', calories: 95, protein: 16, carbs: 0, fat: 3 },
  { name: 'Herring', category: 'Fish', calories: 158, protein: 18, carbs: 0, fat: 9 },
  { name: 'Eel', category: 'Fish', calories: 184, protein: 18, carbs: 0, fat: 12 },
  { name: 'Caviar', category: 'Fish', calories: 264, protein: 25, carbs: 4, fat: 18 },

  // Dairy extras
  { name: 'Skyr (Icelandic)', category: 'Dairy', calories: 59, protein: 11, carbs: 4, fat: 0.3 },
  { name: 'Kefir', category: 'Dairy', calories: 41, protein: 3.5, carbs: 5, fat: 1 },
  { name: 'Goat Cheese', category: 'Dairy', calories: 264, protein: 18, carbs: 1, fat: 21 },
  { name: 'Blue Cheese', category: 'Dairy', calories: 353, protein: 21, carbs: 2, fat: 29 },
  { name: 'Brie Cheese', category: 'Dairy', calories: 334, protein: 21, carbs: 0, fat: 28 },
  { name: 'Gouda Cheese', category: 'Dairy', calories: 356, protein: 25, carbs: 2, fat: 27 },
  { name: 'Swiss Cheese', category: 'Dairy', calories: 380, protein: 27, carbs: 1, fat: 28 },
  { name: 'Mascarpone', category: 'Dairy', calories: 435, protein: 4, carbs: 5, fat: 44 },
  { name: 'Buttermilk', category: 'Dairy', calories: 40, protein: 3.3, carbs: 5, fat: 0.9 },
  { name: 'Ice Cream (vanilla)', category: 'Dairy', calories: 207, protein: 4, carbs: 24, fat: 11 },

  // Grains extras
  { name: 'Rye Bread', category: 'Grains', calories: 259, protein: 9, carbs: 48, fat: 3, fiber: 6 },
  { name: 'Bagel (plain)', category: 'Grains', calories: 250, protein: 10, carbs: 48, fat: 2 },
  { name: 'Croissant', category: 'Grains', calories: 406, protein: 8, carbs: 46, fat: 21 },
  { name: 'English Muffin', category: 'Grains', calories: 235, protein: 8, carbs: 46, fat: 2 },
  { name: 'Pancake', category: 'Grains', calories: 227, protein: 6, carbs: 28, fat: 10 },
  { name: 'Waffle', category: 'Grains', calories: 291, protein: 8, carbs: 33, fat: 14 },
  { name: 'Granola Bar', category: 'Grains', calories: 420, protein: 7, carbs: 72, fat: 12, fiber: 4 },
  { name: 'Polenta (cooked)', category: 'Grains', calories: 70, protein: 1.6, carbs: 15, fat: 0.4, fiber: 1 },
  { name: 'Millet (cooked)', category: 'Grains', calories: 119, protein: 3.5, carbs: 24, fat: 1, fiber: 1.3 },
  { name: 'Amaranth (cooked)', category: 'Grains', calories: 102, protein: 3.8, carbs: 19, fat: 1.6, fiber: 2 },
  { name: 'Cream of Wheat', category: 'Grains', calories: 44, protein: 1.4, carbs: 9, fat: 0.1 },

  // Veggies extras
  { name: 'Artichoke', category: 'Veggies', calories: 47, protein: 3.3, carbs: 10, fat: 0.2, fiber: 5 },
  { name: 'Arugula', category: 'Veggies', calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6 },
  { name: 'Bok Choy', category: 'Veggies', calories: 13, protein: 1.5, carbs: 2.2, fat: 0.2, fiber: 1 },
  { name: 'Collard Greens', category: 'Veggies', calories: 32, protein: 3, carbs: 5, fat: 0.6, fiber: 4 },
  { name: 'Swiss Chard', category: 'Veggies', calories: 19, protein: 1.8, carbs: 3.7, fat: 0.2, fiber: 1.6 },
  { name: 'Fennel', category: 'Veggies', calories: 31, protein: 1.2, carbs: 7, fat: 0.2, fiber: 3.1 },
  { name: 'Jicama', category: 'Veggies', calories: 38, protein: 0.7, carbs: 9, fat: 0.1, fiber: 4.9 },
  { name: 'Leek', category: 'Veggies', calories: 61, protein: 1.5, carbs: 14, fat: 0.3, fiber: 1.8 },
  { name: 'Okra', category: 'Veggies', calories: 33, protein: 1.9, carbs: 7, fat: 0.2, fiber: 3.2 },
  { name: 'Parsnip', category: 'Veggies', calories: 75, protein: 1.2, carbs: 18, fat: 0.3, fiber: 4.9 },
  { name: 'Rutabaga', category: 'Veggies', calories: 37, protein: 1.1, carbs: 8, fat: 0.2, fiber: 2.5 },
  { name: 'Shallot', category: 'Veggies', calories: 72, protein: 2.5, carbs: 17, fat: 0.1, fiber: 3.2 },
  { name: 'Snow Peas', category: 'Veggies', calories: 42, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { name: 'Watercress', category: 'Veggies', calories: 11, protein: 2.3, carbs: 1.3, fat: 0.1, fiber: 0.5 },
  { name: 'Turnip', category: 'Veggies', calories: 28, protein: 0.9, carbs: 6, fat: 0.1, fiber: 1.8 },
  { name: 'Bamboo Shoots', category: 'Veggies', calories: 27, protein: 2.6, carbs: 5, fat: 0.3, fiber: 2.2 },

  // Fruit extras
  { name: 'Apricot', category: 'Fruit', calories: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2 },
  { name: 'Nectarine', category: 'Fruit', calories: 44, protein: 1.1, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: 'Plum', category: 'Fruit', calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4 },
  { name: 'Cantaloupe', category: 'Fruit', calories: 34, protein: 0.8, carbs: 8, fat: 0.2, fiber: 0.9 },
  { name: 'Honeydew', category: 'Fruit', calories: 36, protein: 0.5, carbs: 9, fat: 0.1, fiber: 0.8 },
  { name: 'Pomegranate', category: 'Fruit', calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { name: 'Passion Fruit', category: 'Fruit', calories: 97, protein: 2.2, carbs: 23, fat: 0.7, fiber: 10 },
  { name: 'Guava', category: 'Fruit', calories: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4 },
  { name: 'Lychee', category: 'Fruit', calories: 66, protein: 0.8, carbs: 17, fat: 0.4, fiber: 1.3 },
  { name: 'Dragon Fruit', category: 'Fruit', calories: 60, protein: 1.2, carbs: 13, fat: 0, fiber: 1 },
  { name: 'Persimmon', category: 'Fruit', calories: 127, protein: 1, carbs: 34, fat: 0.4, fiber: 6 },
  { name: 'Grapefruit', category: 'Fruit', calories: 42, protein: 0.8, carbs: 11, fat: 0.1, fiber: 1.6 },
  { name: 'Lemon', category: 'Fruit', calories: 29, protein: 1.1, carbs: 9, fat: 0.3, fiber: 2.8 },
  { name: 'Lime', category: 'Fruit', calories: 30, protein: 0.7, carbs: 11, fat: 0.2, fiber: 2.8 },
  { name: 'Cranberries', category: 'Fruit', calories: 46, protein: 0.4, carbs: 12, fat: 0.1, fiber: 4.6 },
  { name: 'Raisins', category: 'Fruit', calories: 299, protein: 3.1, carbs: 79, fat: 0.5, fiber: 3.7 },
  { name: 'Prunes', category: 'Fruit', calories: 240, protein: 2.2, carbs: 64, fat: 0.4, fiber: 7 },

  // Legumes extras
  { name: 'Adzuki Beans (cooked)', category: 'Legumes', calories: 128, protein: 7.5, carbs: 24, fat: 0.1, fiber: 7.5 },
  { name: 'Fava Beans (cooked)', category: 'Legumes', calories: 106, protein: 7.6, carbs: 19, fat: 0.4, fiber: 5.4 },
  { name: 'White Beans (cooked)', category: 'Legumes', calories: 139, protein: 9, carbs: 25, fat: 0.4, fiber: 6.3 },
  { name: 'Split Peas (cooked)', category: 'Legumes', calories: 116, protein: 8.3, carbs: 20, fat: 0.4, fiber: 8.3 },
  { name: 'Black-eyed Peas (cooked)', category: 'Legumes', calories: 116, protein: 8, carbs: 21, fat: 0.5, fiber: 5 },

  // Nuts extras
  { name: 'Hazelnuts', category: 'Nuts', calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 10 },
  { name: 'Pine Nuts', category: 'Nuts', calories: 673, protein: 14, carbs: 13, fat: 68, fiber: 4 },
  { name: 'Chestnuts (roasted)', category: 'Nuts', calories: 245, protein: 3.2, carbs: 53, fat: 2.2, fiber: 5 },
  { name: 'Coconut Milk (canned)', category: 'Nuts', calories: 230, protein: 2.3, carbs: 6, fat: 24, fiber: 0 },
  { name: 'Almond Butter', category: 'Nuts', calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 11 },
  { name: 'Cashew Butter', category: 'Nuts', calories: 587, protein: 18, carbs: 28, fat: 49, fiber: 2 },

  // Fats extras
  { name: 'Canola Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Vegetable Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Peanut Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Flaxseed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Shortening', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Cocoa Butter', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Beef Tallow', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },

  // Condiments extras
  { name: 'Olives (green)', category: 'Condiments', calories: 145, protein: 1, carbs: 4, fat: 15, fiber: 3 },
  { name: 'Olives (black)', category: 'Condiments', calories: 115, protein: 0.8, carbs: 6, fat: 11, fiber: 3 },
  { name: 'Pickles (dill)', category: 'Condiments', calories: 11, protein: 0.4, carbs: 2.4, fat: 0.1, fiber: 1 },
  { name: 'Kimchi', category: 'Condiments', calories: 24, protein: 1.1, carbs: 4, fat: 0, fiber: 1.6 },
  { name: 'Sauerkraut', category: 'Condiments', calories: 19, protein: 0.9, carbs: 4, fat: 0.1, fiber: 2.9 },
  { name: 'Sriracha', category: 'Condiments', calories: 93, protein: 2, carbs: 23, fat: 0 },
  { name: 'Gochujang', category: 'Condiments', calories: 230, protein: 5, carbs: 44, fat: 4 },
  { name: 'Curry Paste (red)', category: 'Condiments', calories: 113, protein: 3, carbs: 11, fat: 7 },
  { name: 'Harissa', category: 'Condiments', calories: 170, protein: 3, carbs: 16, fat: 11 },
  { name: 'Tzatziki', category: 'Condiments', calories: 78, protein: 5, carbs: 5, fat: 5 },
  { name: 'Teriyaki Sauce', category: 'Condiments', calories: 133, protein: 3, carbs: 26, fat: 0 },
  { name: 'Hoisin Sauce', category: 'Condiments', calories: 220, protein: 3, carbs: 44, fat: 3 },
  { name: 'Oyster Sauce', category: 'Condiments', calories: 75, protein: 1, carbs: 16, fat: 0 },
  { name: 'Sweet Chili Sauce', category: 'Condiments', calories: 200, protein: 1, carbs: 50, fat: 0 },
  { name: 'Coconut Aminos', category: 'Condiments', calories: 15, protein: 1, carbs: 2, fat: 0 },
  { name: 'Guacamole', category: 'Condiments', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },

  // Snacks extras
  { name: 'Potato Chips', category: 'Snacks', calories: 536, protein: 7, carbs: 49, fat: 35, fiber: 4 },
  { name: 'Pita Chips', category: 'Snacks', calories: 457, protein: 10, carbs: 69, fat: 17, fiber: 5 },
  { name: 'Graham Crackers', category: 'Snacks', calories: 430, protein: 7, carbs: 79, fat: 10, fiber: 3 },
  { name: 'Brownie', category: 'Snacks', calories: 405, protein: 5, carbs: 51, fat: 22, fiber: 2 },
  { name: 'Muffin (blueberry)', category: 'Snacks', calories: 377, protein: 5, carbs: 52, fat: 17, fiber: 2 },
  { name: 'Chocolate Chip Cookie', category: 'Snacks', calories: 488, protein: 6, carbs: 62, fat: 25, fiber: 2 },
  { name: 'Rice Krispie Treat', category: 'Snacks', calories: 400, protein: 3, carbs: 76, fat: 10 },
  { name: 'Pudding (chocolate)', category: 'Snacks', calories: 140, protein: 3, carbs: 23, fat: 4 },
  { name: 'Jello', category: 'Snacks', calories: 64, protein: 1.5, carbs: 14, fat: 0 },
  { name: 'Apple Sauce', category: 'Snacks', calories: 68, protein: 0.2, carbs: 17, fat: 0.1, fiber: 1.5 },
  { name: 'Fruit Leather', category: 'Snacks', calories: 300, protein: 2, carbs: 70, fat: 0, fiber: 2 },
  { name: 'Coconut Water', category: 'Snacks', calories: 19, protein: 0.7, carbs: 4, fat: 0.2 },
  { name: 'Almond Milk (unsweetened)', category: 'Snacks', calories: 17, protein: 0.6, carbs: 0.4, fat: 1.5 },
  { name: 'Oat Milk', category: 'Snacks', calories: 47, protein: 1, carbs: 7, fat: 1.5 },
  { name: 'Soy Milk', category: 'Snacks', calories: 44, protein: 3.6, carbs: 2, fat: 2 },
  { name: 'Rice Milk', category: 'Snacks', calories: 47, protein: 0.3, carbs: 9, fat: 1 },

  // --- MEAT: Extra cuts & game ---
  { name: 'Chicken Drumstick', category: 'Meat', calories: 172, protein: 24, carbs: 0, fat: 8 },
  { name: 'Chicken Gizzard', category: 'Meat', calories: 94, protein: 18, carbs: 0, fat: 2 },
  { name: 'Chicken Heart', category: 'Meat', calories: 153, protein: 26, carbs: 0, fat: 5 },
  { name: 'Beef Tenderloin', category: 'Meat', calories: 230, protein: 23, carbs: 0, fat: 15 },
  { name: 'Beef Brisket', category: 'Meat', calories: 280, protein: 22, carbs: 0, fat: 21 },
  { name: 'Beef Flank Steak', category: 'Meat', calories: 192, protein: 28, carbs: 0, fat: 8 },
  { name: 'Beef Shank', category: 'Meat', calories: 190, protein: 25, carbs: 0, fat: 9 },
  { name: 'Beef Tongue', category: 'Meat', calories: 224, protein: 16, carbs: 0, fat: 17 },
  { name: 'Beef Tripe', category: 'Meat', calories: 85, protein: 12, carbs: 0, fat: 4 },
  { name: 'Oxtail', category: 'Meat', calories: 230, protein: 24, carbs: 0, fat: 14 },
  { name: 'Pork Tenderloin', category: 'Meat', calories: 143, protein: 26, carbs: 0, fat: 4 },
  { name: 'Pork Shoulder', category: 'Meat', calories: 242, protein: 22, carbs: 0, fat: 17 },
  { name: 'Pork Loin', category: 'Meat', calories: 198, protein: 25, carbs: 0, fat: 10 },
  { name: 'Lamb Shoulder', category: 'Meat', calories: 280, protein: 22, carbs: 0, fat: 21 },
  { name: 'Lamb Leg', category: 'Meat', calories: 234, protein: 24, carbs: 0, fat: 15 },
  { name: 'Lamb Rack', category: 'Meat', calories: 295, protein: 20, carbs: 0, fat: 23 },
  { name: 'Duck Confit', category: 'Meat', calories: 330, protein: 23, carbs: 0, fat: 26 },
  { name: 'Goose', category: 'Meat', calories: 305, protein: 25, carbs: 0, fat: 22 },
  { name: 'Pheasant', category: 'Meat', calories: 180, protein: 26, carbs: 0, fat: 8 },
  { name: 'Quail', category: 'Meat', calories: 192, protein: 22, carbs: 0, fat: 11 },
  { name: 'Rabbit', category: 'Meat', calories: 136, protein: 20, carbs: 0, fat: 6 },
  { name: 'Wild Boar', category: 'Meat', calories: 160, protein: 26, carbs: 0, fat: 6 },
  { name: 'Bison', category: 'Meat', calories: 143, protein: 28, carbs: 0, fat: 3 },
  { name: 'Kangaroo', category: 'Meat', calories: 125, protein: 27, carbs: 0, fat: 2 },
  { name: 'Frog Legs', category: 'Meat', calories: 73, protein: 16, carbs: 0, fat: 0.3 },
  { name: 'Snails (escargot)', category: 'Meat', calories: 90, protein: 16, carbs: 2, fat: 1 },
  { name: 'Alligator', category: 'Meat', calories: 143, protein: 28, carbs: 0, fat: 3 },
  { name: 'Ostrich', category: 'Meat', calories: 145, protein: 28, carbs: 0, fat: 3 },
  { name: 'Bratwurst', category: 'Meat', calories: 294, protein: 14, carbs: 2, fat: 26 },
  { name: 'Italian Sausage', category: 'Meat', calories: 344, protein: 16, carbs: 2, fat: 30 },
  { name: 'Kielbasa', category: 'Meat', calories: 326, protein: 15, carbs: 2, fat: 29 },
  { name: 'Merguez', category: 'Meat', calories: 320, protein: 16, carbs: 1, fat: 28 },
  { name: 'Mortadella', category: 'Meat', calories: 311, protein: 16, carbs: 1, fat: 27 },
  { name: 'Parma Ham', category: 'Meat', calories: 210, protein: 28, carbs: 0, fat: 11 },
  { name: 'Serrano Ham', category: 'Meat', calories: 190, protein: 26, carbs: 0, fat: 9 },
  { name: 'Speck', category: 'Meat', calories: 240, protein: 26, carbs: 0, fat: 15 },
  { name: 'Biltong', category: 'Meat', calories: 280, protein: 40, carbs: 2, fat: 12 },
  { name: 'Sucuk (Turkish sausage)', category: 'Meat', calories: 360, protein: 18, carbs: 2, fat: 31 },

  // --- FISH: Global seafood ---
  { name: 'Anchovy (canned)', category: 'Fish', calories: 131, protein: 20, carbs: 0, fat: 5 },
  { name: 'Barramundi', category: 'Fish', calories: 92, protein: 20, carbs: 0, fat: 1 },
  { name: 'Branzino', category: 'Fish', calories: 97, protein: 18, carbs: 0, fat: 2 },
  { name: 'Butterfish', category: 'Fish', calories: 146, protein: 17, carbs: 0, fat: 8 },
  { name: 'Carp', category: 'Fish', calories: 127, protein: 18, carbs: 0, fat: 6 },
  { name: 'Chilean Sea Bass', category: 'Fish', calories: 166, protein: 17, carbs: 0, fat: 11 },
  { name: 'Cobia', category: 'Fish', calories: 140, protein: 19, carbs: 0, fat: 7 },
  { name: 'Flounder', category: 'Fish', calories: 70, protein: 15, carbs: 0, fat: 1 },
  { name: 'Grouper', category: 'Fish', calories: 92, protein: 20, carbs: 0, fat: 1 },
  { name: 'Hake', category: 'Fish', calories: 82, protein: 18, carbs: 0, fat: 1 },
  { name: 'Kingfish', category: 'Fish', calories: 154, protein: 21, carbs: 0, fat: 7 },
  { name: 'Mahi Mahi', category: 'Fish', calories: 85, protein: 19, carbs: 0, fat: 0.7 },
  { name: 'Monkfish', category: 'Fish', calories: 82, protein: 15, carbs: 0, fat: 2 },
  { name: 'Perch', category: 'Fish', calories: 91, protein: 19, carbs: 0, fat: 1 },
  { name: 'Pike', category: 'Fish', calories: 84, protein: 19, carbs: 0, fat: 1 },
  { name: 'Pompano', category: 'Fish', calories: 164, protein: 19, carbs: 0, fat: 9 },
  { name: 'Rockfish', category: 'Fish', calories: 94, protein: 19, carbs: 0, fat: 2 },
  { name: 'Sablefish (black cod)', category: 'Fish', calories: 214, protein: 16, carbs: 0, fat: 16 },
  { name: 'Sardine (fresh)', category: 'Fish', calories: 185, protein: 20, carbs: 0, fat: 11 },
  { name: 'Skate Wing', category: 'Fish', calories: 95, protein: 21, carbs: 0, fat: 1 },
  { name: 'Smelt', category: 'Fish', calories: 97, protein: 17, carbs: 0, fat: 3 },
  { name: 'Sole', category: 'Fish', calories: 70, protein: 15, carbs: 0, fat: 1 },
  { name: 'Swordfish', category: 'Fish', calories: 139, protein: 21, carbs: 0, fat: 6 },
  { name: 'Tilefish', category: 'Fish', calories: 100, protein: 20, carbs: 0, fat: 2 },
  { name: 'Turbot', category: 'Fish', calories: 95, protein: 16, carbs: 0, fat: 3 },
  { name: 'Wahoo', category: 'Fish', calories: 115, protein: 22, carbs: 0, fat: 2 },
  { name: 'Whitefish', category: 'Fish', calories: 134, protein: 19, carbs: 0, fat: 6 },
  { name: 'Yellowtail', category: 'Fish', calories: 146, protein: 23, carbs: 0, fat: 5 },
  { name: 'Abalone', category: 'Fish', calories: 105, protein: 17, carbs: 6, fat: 1 },
  { name: 'Cockles', category: 'Fish', calories: 74, protein: 14, carbs: 3, fat: 1 },
  { name: 'Conch', category: 'Fish', calories: 130, protein: 26, carbs: 2, fat: 1 },
  { name: 'Crayfish', category: 'Fish', calories: 87, protein: 18, carbs: 0, fat: 1 },
  { name: 'Geoduck', category: 'Fish', calories: 80, protein: 15, carbs: 4, fat: 0.5 },
  { name: 'Langoustine', category: 'Fish', calories: 90, protein: 19, carbs: 0, fat: 1 },
  { name: 'Whelks', category: 'Fish', calories: 137, protein: 24, carbs: 8, fat: 1 },
  { name: 'Nori (dried seaweed)', category: 'Fish', calories: 35, protein: 5.8, carbs: 5, fat: 0.3, fiber: 0.3 },
  { name: 'Wakame', category: 'Fish', calories: 45, protein: 3, carbs: 9, fat: 0.6, fiber: 0.5 },
  { name: 'Kombu', category: 'Fish', calories: 43, protein: 2, carbs: 8, fat: 0.3, fiber: 2 },
  { name: 'Spirulina (dried)', category: 'Fish', calories: 290, protein: 57, carbs: 24, fat: 8, fiber: 4 },

  // --- DAIRY: Global cheeses & dairy ---
  { name: 'Aged Cheddar', category: 'Dairy', calories: 410, protein: 25, carbs: 1, fat: 34 },
  { name: 'Asiago', category: 'Dairy', calories: 392, protein: 24, carbs: 1, fat: 31 },
  { name: 'Burrata', category: 'Dairy', calories: 316, protein: 15, carbs: 1, fat: 28 },
  { name: 'Camembert', category: 'Dairy', calories: 300, protein: 20, carbs: 0, fat: 24 },
  { name: 'Colby', category: 'Dairy', calories: 394, protein: 23, carbs: 2, fat: 32 },
  { name: 'Edam', category: 'Dairy', calories: 357, protein: 25, carbs: 1, fat: 28 },
  { name: 'Emmental', category: 'Dairy', calories: 380, protein: 28, carbs: 1, fat: 29 },
  { name: 'Fontina', category: 'Dairy', calories: 389, protein: 25, carbs: 1, fat: 31 },
  { name: 'Gorgonzola', category: 'Dairy', calories: 376, protein: 19, carbs: 2, fat: 32 },
  { name: 'Gruyère', category: 'Dairy', calories: 413, protein: 29, carbs: 0, fat: 32 },
  { name: 'Halloumi', category: 'Dairy', calories: 321, protein: 22, carbs: 2, fat: 25 },
  { name: 'Havarti', category: 'Dairy', calories: 368, protein: 21, carbs: 1, fat: 31 },
  { name: 'Jarlsberg', category: 'Dairy', calories: 373, protein: 27, carbs: 1, fat: 28 },
  { name: 'Manchego', category: 'Dairy', calories: 400, protein: 25, carbs: 1, fat: 33 },
  { name: 'Monterey Jack', category: 'Dairy', calories: 373, protein: 24, carbs: 0, fat: 30 },
  { name: 'Muenster', category: 'Dairy', calories: 368, protein: 23, carbs: 1, fat: 30 },
  { name: 'Neufchâtel', category: 'Dairy', calories: 253, protein: 8, carbs: 2, fat: 23 },
  { name: 'Pepper Jack', category: 'Dairy', calories: 370, protein: 24, carbs: 1, fat: 30 },
  { name: 'Provolone', category: 'Dairy', calories: 352, protein: 26, carbs: 2, fat: 27 },
  { name: 'Raclette', category: 'Dairy', calories: 380, protein: 25, carbs: 0, fat: 31 },
  { name: 'Red Leicester', category: 'Dairy', calories: 410, protein: 24, carbs: 0, fat: 35 },
  { name: 'Romano', category: 'Dairy', calories: 431, protein: 32, carbs: 4, fat: 31 },
  { name: 'Roquefort', category: 'Dairy', calories: 369, protein: 22, carbs: 2, fat: 30 },
  { name: 'Stilton', category: 'Dairy', calories: 410, protein: 24, carbs: 0, fat: 35 },
  { name: 'Taleggio', category: 'Dairy', calories: 350, protein: 22, carbs: 0, fat: 29 },
  { name: 'Clotted Cream', category: 'Dairy', calories: 586, protein: 2, carbs: 3, fat: 63 },
  { name: 'Condensed Milk', category: 'Dairy', calories: 321, protein: 8, carbs: 55, fat: 9 },
  { name: 'Evaporated Milk', category: 'Dairy', calories: 134, protein: 7, carbs: 10, fat: 8 },
  { name: 'Eggnog', category: 'Dairy', calories: 200, protein: 5, carbs: 20, fat: 11 },
  { name: 'Frozen Yogurt', category: 'Dairy', calories: 159, protein: 4, carbs: 24, fat: 6 },
  { name: 'Half & Half', category: 'Dairy', calories: 130, protein: 3, carbs: 5, fat: 11 },
  { name: 'Whipped Cream', category: 'Dairy', calories: 257, protein: 3, carbs: 4, fat: 26 },
  { name: 'Goat Milk', category: 'Dairy', calories: 69, protein: 3.6, carbs: 4.5, fat: 4 },
  { name: 'Sheep Milk', category: 'Dairy', calories: 108, protein: 6, carbs: 5, fat: 7 },
  { name: 'Buffalo Milk', category: 'Dairy', calories: 97, protein: 4, carbs: 5, fat: 7 },
  { name: 'Lassi (sweet)', category: 'Dairy', calories: 90, protein: 3, carbs: 15, fat: 2 },

  // --- GRAINS: Global breads, pasta & cereals ---
  { name: 'Baguette', category: 'Grains', calories: 290, protein: 9, carbs: 56, fat: 2 },
  { name: 'Brioche', category: 'Grains', calories: 360, protein: 8, carbs: 39, fat: 20 },
  { name: 'Challah', category: 'Grains', calories: 280, protein: 8, carbs: 46, fat: 7 },
  { name: 'Ciabatta', category: 'Grains', calories: 270, protein: 8, carbs: 52, fat: 3 },
  { name: 'Cornbread', category: 'Grains', calories: 265, protein: 5, carbs: 43, fat: 8 },
  { name: 'Focaccia', category: 'Grains', calories: 270, protein: 7, carbs: 44, fat: 8 },
  { name: 'Lavash', category: 'Grains', calories: 260, protein: 8, carbs: 50, fat: 2 },
  { name: 'Chapati', category: 'Grains', calories: 297, protein: 8, carbs: 48, fat: 8 },
  { name: 'Roti (whole wheat)', category: 'Grains', calories: 300, protein: 9, carbs: 46, fat: 9 },
  { name: 'Paratha', category: 'Grains', calories: 320, protein: 6, carbs: 35, fat: 18 },
  { name: 'Dosa', category: 'Grains', calories: 130, protein: 3, carbs: 25, fat: 2 },
  { name: 'Spaghetti (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Penne (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Fettuccine (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Lasagna Sheets (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Ravioli (cheese, cooked)', category: 'Grains', calories: 165, protein: 7, carbs: 30, fat: 2 },
  { name: 'Orzo (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Ramen Noodles (cooked)', category: 'Grains', calories: 138, protein: 5, carbs: 27, fat: 2 },
  { name: 'Soba Noodles (cooked)', category: 'Grains', calories: 99, protein: 5, carbs: 21, fat: 0.1 },
  { name: 'Udon Noodles (cooked)', category: 'Grains', calories: 140, protein: 4, carbs: 30, fat: 0.5 },
  { name: 'Rice Noodles (cooked)', category: 'Grains', calories: 108, protein: 2, carbs: 24, fat: 0.2 },
  { name: 'Glass Noodles (cooked)', category: 'Grains', calories: 80, protein: 0.5, carbs: 19, fat: 0 },
  { name: 'Egg Noodles (cooked)', category: 'Grains', calories: 138, protein: 5, carbs: 25, fat: 2 },
  { name: 'Corn Flakes', category: 'Grains', calories: 357, protein: 8, carbs: 84, fat: 0.4, fiber: 3 },
  { name: 'Cheerios', category: 'Grains', calories: 375, protein: 12, carbs: 73, fat: 6.5, fiber: 10 },
  { name: 'Special K', category: 'Grains', calories: 371, protein: 13, carbs: 83, fat: 1, fiber: 2 },
  { name: 'Frosted Flakes', category: 'Grains', calories: 370, protein: 5, carbs: 90, fat: 0, fiber: 2 },
  { name: 'Weetabix', category: 'Grains', calories: 340, protein: 11, carbs: 68, fat: 2, fiber: 10 },
  { name: 'Grits (cooked)', category: 'Grains', calories: 57, protein: 1.4, carbs: 12, fat: 0.2 },
  { name: 'Tapioca (cooked)', category: 'Grains', calories: 56, protein: 0.2, carbs: 14, fat: 0 },
  { name: 'Cassava (cooked)', category: 'Grains', calories: 112, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.5 },
  { name: 'Plantain (green, boiled)', category: 'Grains', calories: 116, protein: 1.1, carbs: 31, fat: 0.2, fiber: 2 },
  { name: 'Plantain (ripe, fried)', category: 'Grains', calories: 250, protein: 1.5, carbs: 42, fat: 10 },
  { name: 'Matzo', category: 'Grains', calories: 353, protein: 10, carbs: 78, fat: 1, fiber: 3 },
  { name: 'Teff (cooked)', category: 'Grains', calories: 101, protein: 3.9, carbs: 20, fat: 0.7, fiber: 3 },
  { name: 'Freekeh (cooked)', category: 'Grains', calories: 106, protein: 4, carbs: 22, fat: 0.4, fiber: 5 },

  // --- VEGGIES: Global vegetables ---
  { name: 'Broccolini', category: 'Veggies', calories: 35, protein: 2.8, carbs: 6, fat: 0.4, fiber: 2.5 },
  { name: 'Broccoli Rabe', category: 'Veggies', calories: 22, protein: 3.2, carbs: 2.9, fat: 0.5, fiber: 2.8 },
  { name: 'Cabbage (red)', category: 'Veggies', calories: 31, protein: 1.4, carbs: 7, fat: 0.2, fiber: 2.1 },
  { name: 'Cabbage (savoy)', category: 'Veggies', calories: 27, protein: 2, carbs: 6, fat: 0.1, fiber: 3 },
  { name: 'Napa Cabbage', category: 'Veggies', calories: 16, protein: 1.5, carbs: 3, fat: 0.2, fiber: 1 },
  { name: 'Kohlrabi', category: 'Veggies', calories: 27, protein: 1.7, carbs: 6, fat: 0.1, fiber: 3.6 },
  { name: 'Daikon Radish', category: 'Veggies', calories: 18, protein: 0.6, carbs: 4, fat: 0.1, fiber: 1.6 },
  { name: 'Celery Root (celeriac)', category: 'Veggies', calories: 42, protein: 1.5, carbs: 9, fat: 0.3, fiber: 1.8 },
  { name: 'Horseradish (root)', category: 'Veggies', calories: 48, protein: 1.2, carbs: 11, fat: 0.7, fiber: 3 },
  { name: 'Salsify', category: 'Veggies', calories: 82, protein: 3.3, carbs: 19, fat: 0.2, fiber: 3.3 },
  { name: 'Taro (cooked)', category: 'Veggies', calories: 142, protein: 0.5, carbs: 35, fat: 0.1, fiber: 5 },
  { name: 'Yam (cooked)', category: 'Veggies', calories: 118, protein: 1.5, carbs: 28, fat: 0.1, fiber: 4 },
  { name: 'Lotus Root (cooked)', category: 'Veggies', calories: 66, protein: 2, carbs: 16, fat: 0.1, fiber: 4 },
  { name: 'Burdock Root (cooked)', category: 'Veggies', calories: 72, protein: 1.8, carbs: 17, fat: 0.1, fiber: 3 },
  { name: 'Acorn Squash', category: 'Veggies', calories: 40, protein: 0.8, carbs: 10, fat: 0.1, fiber: 1.5 },
  { name: 'Butternut Squash', category: 'Veggies', calories: 45, protein: 1, carbs: 12, fat: 0.1, fiber: 2 },
  { name: 'Spaghetti Squash', category: 'Veggies', calories: 31, protein: 0.6, carbs: 7, fat: 0.6, fiber: 1.5 },
  { name: 'Pumpkin (cooked)', category: 'Veggies', calories: 20, protein: 0.7, carbs: 5, fat: 0.1, fiber: 1 },
  { name: 'Kabocha Squash', category: 'Veggies', calories: 49, protein: 1, carbs: 12, fat: 0.1, fiber: 3 },
  { name: 'Zucchini Blossoms', category: 'Veggies', calories: 15, protein: 1.5, carbs: 2, fat: 0.2 },
  { name: 'Garlic', category: 'Veggies', calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2 },
  { name: 'Scallion (green onion)', category: 'Veggies', calories: 32, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.6 },
  { name: 'Chives', category: 'Veggies', calories: 30, protein: 3.3, carbs: 4, fat: 0.7, fiber: 2.5 },
  { name: 'Ramps (wild leek)', category: 'Veggies', calories: 38, protein: 1.5, carbs: 6, fat: 0.3, fiber: 2 },
  { name: 'Tomatillo', category: 'Veggies', calories: 32, protein: 0.9, carbs: 6, fat: 1, fiber: 2 },
  { name: 'Jalapeño Pepper', category: 'Veggies', calories: 29, protein: 0.9, carbs: 7, fat: 0.4, fiber: 2.8 },
  { name: 'Poblano Pepper', category: 'Veggies', calories: 20, protein: 0.8, carbs: 4, fat: 0.2, fiber: 1.8 },
  { name: 'Serrano Pepper', category: 'Veggies', calories: 32, protein: 1.7, carbs: 7, fat: 0.4, fiber: 3 },
  { name: 'Habanero Pepper', category: 'Veggies', calories: 40, protein: 1.9, carbs: 9, fat: 0.4, fiber: 2 },
  { name: 'Rhubarb', category: 'Veggies', calories: 21, protein: 0.9, carbs: 4.5, fat: 0.2, fiber: 1.8 },
  { name: 'Hearts of Palm', category: 'Veggies', calories: 28, protein: 2, carbs: 4, fat: 0.6, fiber: 2 },
  { name: 'Mushroom (portobello)', category: 'Veggies', calories: 22, protein: 2.5, carbs: 4, fat: 0.3, fiber: 1.5 },
  { name: 'Mushroom (shiitake)', category: 'Veggies', calories: 34, protein: 2.2, carbs: 7, fat: 0.5, fiber: 2.5 },
  { name: 'Mushroom (oyster)', category: 'Veggies', calories: 33, protein: 3.3, carbs: 6, fat: 0.4, fiber: 2.3 },
  { name: 'Mushroom (enoki)', category: 'Veggies', calories: 37, protein: 2.7, carbs: 8, fat: 0.3, fiber: 2.7 },
  { name: 'Mushroom (maitake)', category: 'Veggies', calories: 31, protein: 1.9, carbs: 7, fat: 0.2, fiber: 2.7 },
  { name: 'Mushroom (chanterelle)', category: 'Veggies', calories: 32, protein: 1.5, carbs: 7, fat: 0.5, fiber: 3 },
  { name: 'Truffle (black)', category: 'Veggies', calories: 41, protein: 2, carbs: 5, fat: 0.5, fiber: 5 },
  { name: 'Nopal (cactus pad)', category: 'Veggies', calories: 16, protein: 1.3, carbs: 3, fat: 0.1, fiber: 2 },
  { name: 'Butter Lettuce', category: 'Veggies', calories: 13, protein: 1.4, carbs: 2, fat: 0.2, fiber: 1 },
  { name: 'Romaine Lettuce', category: 'Veggies', calories: 17, protein: 1.2, carbs: 3, fat: 0.3, fiber: 2 },
  { name: 'Iceberg Lettuce', category: 'Veggies', calories: 14, protein: 0.9, carbs: 3, fat: 0.1, fiber: 1.2 },

  // --- FRUIT: Exotic & global ---
  { name: 'Açaí Berry (puree)', category: 'Fruit', calories: 70, protein: 1, carbs: 4, fat: 5, fiber: 3 },
  { name: 'Breadfruit', category: 'Fruit', calories: 103, protein: 1.1, carbs: 27, fat: 0.2, fiber: 4.9 },
  { name: 'Cherimoya', category: 'Fruit', calories: 74, protein: 1.6, carbs: 18, fat: 0.7, fiber: 3 },
  { name: 'Durian', category: 'Fruit', calories: 147, protein: 1.5, carbs: 27, fat: 5, fiber: 3.8 },
  { name: 'Feijoa', category: 'Fruit', calories: 55, protein: 0.7, carbs: 13, fat: 0.6, fiber: 2.8 },
  { name: 'Jackfruit (raw)', category: 'Fruit', calories: 95, protein: 1.7, carbs: 23, fat: 0.6, fiber: 1.5 },
  { name: 'Longan', category: 'Fruit', calories: 60, protein: 1.3, carbs: 15, fat: 0.1, fiber: 1.1 },
  { name: 'Mangosteen', category: 'Fruit', calories: 73, protein: 0.4, carbs: 18, fat: 0.6, fiber: 1.8 },
  { name: 'Prickly Pear', category: 'Fruit', calories: 41, protein: 0.7, carbs: 10, fat: 0.5, fiber: 3.7 },
  { name: 'Rambutan', category: 'Fruit', calories: 68, protein: 0.9, carbs: 16, fat: 0.3, fiber: 0.9 },
  { name: 'Soursop', category: 'Fruit', calories: 66, protein: 1, carbs: 16, fat: 0.3, fiber: 3.3 },
  { name: 'Starfruit (carambola)', category: 'Fruit', calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.8 },
  { name: 'Tamarind', category: 'Fruit', calories: 239, protein: 2.8, carbs: 63, fat: 0.6, fiber: 5 },
  { name: 'Sapodilla', category: 'Fruit', calories: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3 },
  { name: 'Kumquat', category: 'Fruit', calories: 71, protein: 1.9, carbs: 16, fat: 0.9, fiber: 6.5 },
  { name: 'Clementine', category: 'Fruit', calories: 47, protein: 0.9, carbs: 12, fat: 0.2, fiber: 1.7 },
  { name: 'Tangerine', category: 'Fruit', calories: 53, protein: 0.8, carbs: 13, fat: 0.3, fiber: 1.8 },
  { name: 'Pomelo', category: 'Fruit', calories: 38, protein: 0.8, carbs: 10, fat: 0, fiber: 1 },
  { name: 'Yuzu', category: 'Fruit', calories: 30, protein: 0.5, carbs: 9, fat: 0.1, fiber: 1 },
  { name: 'Boysenberries', category: 'Fruit', calories: 50, protein: 1.5, carbs: 12, fat: 0.5, fiber: 5 },
  { name: 'Elderberries', category: 'Fruit', calories: 73, protein: 0.7, carbs: 18, fat: 0.5, fiber: 7 },
  { name: 'Gooseberries', category: 'Fruit', calories: 44, protein: 0.9, carbs: 10, fat: 0.6, fiber: 4.3 },
  { name: 'Mulberries', category: 'Fruit', calories: 43, protein: 1.4, carbs: 10, fat: 0.4, fiber: 1.7 },
  { name: 'Lingonberries', category: 'Fruit', calories: 50, protein: 0.7, carbs: 11, fat: 0.5, fiber: 3.5 },
  { name: 'Huckleberries', category: 'Fruit', calories: 37, protein: 0.4, carbs: 8, fat: 0.1, fiber: 3 },
  { name: 'Quince', category: 'Fruit', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 1.9 },
  { name: 'Asian Pear', category: 'Fruit', calories: 42, protein: 0.5, carbs: 11, fat: 0.2, fiber: 3.6 },
  { name: 'Figs (fresh)', category: 'Fruit', calories: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 3 },
  { name: 'Goji Berries (dried)', category: 'Fruit', calories: 350, protein: 14, carbs: 77, fat: 1.5, fiber: 13 },

  // --- LEGUMES: Global beans & pulses ---
  { name: 'Cannellini Beans (cooked)', category: 'Legumes', calories: 140, protein: 8, carbs: 25, fat: 0.5, fiber: 6 },
  { name: 'Great Northern Beans (cooked)', category: 'Legumes', calories: 140, protein: 8, carbs: 25, fat: 0.5, fiber: 6 },
  { name: 'Navy Beans (cooked)', category: 'Legumes', calories: 140, protein: 8, carbs: 26, fat: 0.6, fiber: 7 },
  { name: 'Lima Beans (cooked)', category: 'Legumes', calories: 115, protein: 7, carbs: 21, fat: 0.4, fiber: 7 },
  { name: 'Cranberry Beans (cooked)', category: 'Legumes', calories: 136, protein: 9, carbs: 24, fat: 0.5, fiber: 6 },
  { name: 'Flageolet Beans (cooked)', category: 'Legumes', calories: 139, protein: 8, carbs: 25, fat: 0.4, fiber: 6 },
  { name: 'Pigeon Peas (cooked)', category: 'Legumes', calories: 121, protein: 6, carbs: 23, fat: 0.4, fiber: 6 },
  { name: 'Lentils (brown, cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
  { name: 'Lentils (red, cooked)', category: 'Legumes', calories: 106, protein: 9, carbs: 18, fat: 0.4, fiber: 5 },
  { name: 'Lentils (green, cooked)', category: 'Legumes', calories: 116, protein: 10, carbs: 20, fat: 0.4, fiber: 8 },
  { name: 'Lentils (black beluga, cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
  { name: 'Chickpea Flour (besan)', category: 'Legumes', calories: 387, protein: 22, carbs: 58, fat: 7, fiber: 11 },
  { name: 'TVP (textured veg protein)', category: 'Legumes', calories: 280, protein: 50, carbs: 30, fat: 1, fiber: 16 },
  { name: 'Natto', category: 'Legumes', calories: 212, protein: 18, carbs: 14, fat: 11, fiber: 5 },
  { name: 'Lupin Beans (cooked)', category: 'Legumes', calories: 119, protein: 16, carbs: 10, fat: 3, fiber: 5 },
  { name: 'Mung Bean Sprouts', category: 'Legumes', calories: 30, protein: 3, carbs: 6, fat: 0.2, fiber: 1.9 },
  { name: 'Soy Flour', category: 'Legumes', calories: 445, protein: 38, carbs: 33, fat: 20, fiber: 23 },

  // --- NUTS: Global nuts, seeds & butters ---
  { name: 'Hazelnuts', category: 'Nuts', calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 10 },
  { name: 'Pine Nuts', category: 'Nuts', calories: 673, protein: 14, carbs: 13, fat: 68, fiber: 4 },
  { name: 'Chestnuts (roasted)', category: 'Nuts', calories: 245, protein: 3.2, carbs: 53, fat: 2.2, fiber: 5 },
  { name: 'Almond Butter', category: 'Nuts', calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 11 },
  { name: 'Cashew Butter', category: 'Nuts', calories: 587, protein: 18, carbs: 28, fat: 49, fiber: 2 },
  { name: 'Poppy Seeds', category: 'Nuts', calories: 525, protein: 18, carbs: 28, fat: 42, fiber: 20 },
  { name: 'Caraway Seeds', category: 'Nuts', calories: 333, protein: 20, carbs: 12, fat: 15, fiber: 38 },
  { name: 'Sesame Seeds (whole)', category: 'Nuts', calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },
  { name: 'Pumpkin Seeds (shelled)', category: 'Nuts', calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6 },
  { name: 'Sunflower Seeds (shelled)', category: 'Nuts', calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 9 },
  { name: 'Hemp Seeds (shelled)', category: 'Nuts', calories: 553, protein: 32, carbs: 9, fat: 49, fiber: 4 },
  { name: 'Coconut (shredded, unsweetened)', category: 'Nuts', calories: 467, protein: 3.3, carbs: 18, fat: 44, fiber: 16 },
  { name: 'Coconut Cream (canned)', category: 'Nuts', calories: 330, protein: 3.5, carbs: 7, fat: 34, fiber: 2 },
  { name: 'Cacao Nibs', category: 'Nuts', calories: 460, protein: 14, carbs: 36, fat: 40, fiber: 33 },
  { name: 'Psyllium Husk', category: 'Nuts', calories: 200, protein: 2, carbs: 6, fat: 0.5, fiber: 80 },
  { name: 'Tiger Nuts (flour)', category: 'Nuts', calories: 400, protein: 5, carbs: 64, fat: 20, fiber: 30 },

  // --- FATS: Global cooking fats ---
  { name: 'Almond Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Grapeseed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Rice Bran Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Safflower Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Soybean Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Sunflower Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Walnut Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Sesame Oil (toasted)', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Mustard Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Palm Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Bacon Fat', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Chicken Fat (schmaltz)', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Goose Fat', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Suet (beef fat)', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Coconut Butter', category: 'Fats', calories: 700, protein: 2, carbs: 10, fat: 70, fiber: 8 },

  // --- CONDIMENTS: Global sauces & pastes ---
  { name: 'Harissa', category: 'Condiments', calories: 170, protein: 3, carbs: 16, fat: 11 },
  { name: 'Chili Crisp (lao gan ma)', category: 'Condiments', calories: 500, protein: 2, carbs: 8, fat: 52 },
  { name: 'Doubanjiang (fermented bean paste)', category: 'Condiments', calories: 175, protein: 8, carbs: 16, fat: 9 },
  { name: 'Gochugaru (Korean chili flakes)', category: 'Condiments', calories: 280, protein: 8, carbs: 44, fat: 15, fiber: 19 },
  { name: 'Miso (white/shiro)', category: 'Condiments', calories: 200, protein: 12, carbs: 26, fat: 6, fiber: 5 },
  { name: 'Miso (red/aka)', category: 'Condiments', calories: 200, protein: 16, carbs: 22, fat: 6, fiber: 5 },
  { name: 'Ponzu', category: 'Condiments', calories: 60, protein: 1, carbs: 12, fat: 0 },
  { name: 'Sake (cooking)', category: 'Condiments', calories: 134, protein: 0.5, carbs: 5, fat: 0 },
  { name: 'Mirin', category: 'Condiments', calories: 240, protein: 0.2, carbs: 45, fat: 0 },
  { name: 'Wasabi (paste)', category: 'Condiments', calories: 120, protein: 4, carbs: 18, fat: 4, fiber: 2 },
  { name: 'Yuzu Kosho', category: 'Condiments', calories: 80, protein: 2, carbs: 15, fat: 1 },
  { name: 'Tahini', category: 'Condiments', calories: 595, protein: 17, carbs: 21, fat: 53, fiber: 9 },
  { name: 'Pomegranate Molasses', category: 'Condiments', calories: 220, protein: 1, carbs: 54, fat: 0 },
  { name: 'Za\'atar', category: 'Condiments', calories: 280, protein: 10, carbs: 25, fat: 18, fiber: 17 },
  { name: 'Sumac', category: 'Condiments', calories: 260, protein: 6, carbs: 50, fat: 15, fiber: 17 },
  { name: 'Adobo Sauce', category: 'Condiments', calories: 35, protein: 1, carbs: 6, fat: 1 },
  { name: 'Chipotle in Adobo', category: 'Condiments', calories: 28, protein: 1, carbs: 5, fat: 0.5 },
  { name: 'Chimichurri', category: 'Condiments', calories: 180, protein: 1, carbs: 4, fat: 18 },
  { name: 'Salsa Verde', category: 'Condiments', calories: 25, protein: 1, carbs: 5, fat: 0.5, fiber: 1 },
  { name: 'Curry Paste (green)', category: 'Condiments', calories: 130, protein: 3, carbs: 9, fat: 9 },
  { name: 'Curry Paste (yellow)', category: 'Condiments', calories: 120, protein: 3, carbs: 14, fat: 7 },
  { name: 'Curry Paste (madras)', category: 'Condiments', calories: 140, protein: 3, carbs: 12, fat: 9 },
  { name: 'Mango Chutney', category: 'Condiments', calories: 180, protein: 1, carbs: 45, fat: 0.3 },
  { name: 'Tamarind Chutney', category: 'Condiments', calories: 150, protein: 1, carbs: 40, fat: 0.1 },
  { name: 'Mint Chutney', category: 'Condiments', calories: 35, protein: 1, carbs: 6, fat: 1 },
  { name: 'Berbere Paste', category: 'Condiments', calories: 200, protein: 6, carbs: 20, fat: 12 },
  { name: 'Chermoula', category: 'Condiments', calories: 180, protein: 2, carbs: 6, fat: 16 },
  { name: 'Dukkah', category: 'Condiments', calories: 500, protein: 18, carbs: 14, fat: 44, fiber: 12 },
  { name: 'Shito (Ghanaian pepper sauce)', category: 'Condiments', calories: 380, protein: 8, carbs: 12, fat: 34 },
  { name: 'Buffalo Sauce', category: 'Condiments', calories: 250, protein: 1, carbs: 3, fat: 26 },
  { name: 'Cocktail Sauce', category: 'Condiments', calories: 70, protein: 1, carbs: 16, fat: 0.5 },
  { name: 'Steak Sauce (A1)', category: 'Condiments', calories: 80, protein: 0, carbs: 19, fat: 0 },
  { name: 'Molasses (blackstrap)', category: 'Condiments', calories: 290, protein: 0, carbs: 75, fat: 0 },
  { name: 'Tomato Paste', category: 'Condiments', calories: 82, protein: 4, carbs: 18, fat: 0.5, fiber: 4 },
  { name: 'Vegetable Bouillon', category: 'Condiments', calories: 5, protein: 0.2, carbs: 1, fat: 0 },
  { name: 'Chicken Bouillon', category: 'Condiments', calories: 5, protein: 0.3, carbs: 0.5, fat: 0.2 },
  { name: 'Beef Bouillon', category: 'Condiments', calories: 7, protein: 0.5, carbs: 0.5, fat: 0.3 },
  { name: 'Rose Water', category: 'Condiments', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Orange Blossom Water', category: 'Condiments', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Vinegar (sherry)', category: 'Condiments', calories: 25, protein: 0, carbs: 5, fat: 0 },
  { name: 'Vinegar (champagne)', category: 'Condiments', calories: 12, protein: 0, carbs: 1, fat: 0 },
  { name: 'Vinegar (red wine)', category: 'Condiments', calories: 14, protein: 0, carbs: 2, fat: 0 },
  { name: 'Vinegar (white wine)', category: 'Condiments', calories: 10, protein: 0, carbs: 1, fat: 0 },
  { name: 'Vinegar (rice, unseasoned)', category: 'Condiments', calories: 12, protein: 0, carbs: 0, fat: 0 },
  { name: 'Vinegar (rice, seasoned)', category: 'Condiments', calories: 30, protein: 0, carbs: 7, fat: 0 },

  // --- SNACKS: Global treats & beverages (milk alternatives) ---
  { name: 'Plantain Chips', category: 'Snacks', calories: 530, protein: 2, carbs: 65, fat: 30, fiber: 4 },
  { name: 'Kale Chips', category: 'Snacks', calories: 420, protein: 14, carbs: 48, fat: 22, fiber: 12 },
  { name: 'Beet Chips', category: 'Snacks', calories: 450, protein: 5, carbs: 55, fat: 24, fiber: 6 },
  { name: 'Banana Chips', category: 'Snacks', calories: 519, protein: 2, carbs: 58, fat: 34, fiber: 8 },
  { name: 'Cassava Chips', category: 'Snacks', calories: 505, protein: 2, carbs: 54, fat: 30, fiber: 4 },
  { name: 'Saltine Crackers', category: 'Snacks', calories: 418, protein: 9, carbs: 74, fat: 9, fiber: 3 },
  { name: 'Ritz Crackers', category: 'Snacks', calories: 493, protein: 7, carbs: 60, fat: 26, fiber: 2 },
  { name: 'Wheat Thins', category: 'Snacks', calories: 460, protein: 8, carbs: 69, fat: 17, fiber: 4 },
  { name: 'Cheez-Its', category: 'Snacks', calories: 507, protein: 11, carbs: 59, fat: 26, fiber: 2 },
  { name: 'Goldfish Crackers', category: 'Snacks', calories: 467, protein: 10, carbs: 61, fat: 20, fiber: 2 },
  { name: 'Rice Crackers (senbei)', category: 'Snacks', calories: 400, protein: 6, carbs: 80, fat: 5, fiber: 2 },
  { name: 'Marshmallows', category: 'Snacks', calories: 318, protein: 2, carbs: 81, fat: 0 },
  { name: 'Halva', category: 'Snacks', calories: 470, protein: 12, carbs: 52, fat: 26, fiber: 4 },
  { name: 'Cheesecake', category: 'Snacks', calories: 321, protein: 6, carbs: 26, fat: 22 },
  { name: 'Cinnamon Roll (with icing)', category: 'Snacks', calories: 370, protein: 6, carbs: 50, fat: 17 },
  { name: 'Baklava', category: 'Snacks', calories: 440, protein: 6, carbs: 38, fat: 30 },
  { name: 'Cannoli', category: 'Snacks', calories: 315, protein: 7, carbs: 30, fat: 19 },
  { name: 'Tiramisu', category: 'Snacks', calories: 340, protein: 6, carbs: 33, fat: 21 },
  { name: 'Macaron', category: 'Snacks', calories: 350, protein: 4, carbs: 42, fat: 19 },
  { name: 'Madeleine', category: 'Snacks', calories: 350, protein: 5, carbs: 45, fat: 17 },
  { name: 'Éclair', category: 'Snacks', calories: 260, protein: 5, carbs: 28, fat: 15 },
  { name: 'Cream Puff', category: 'Snacks', calories: 250, protein: 4, carbs: 20, fat: 17 },
  { name: 'Gelato (vanilla)', category: 'Snacks', calories: 200, protein: 4, carbs: 23, fat: 11 },
  { name: 'Sorbet (fruit)', category: 'Snacks', calories: 130, protein: 0.5, carbs: 33, fat: 0 },
  { name: 'Frozen Yogurt (vanilla)', category: 'Snacks', calories: 159, protein: 4, carbs: 24, fat: 6 },
  { name: 'Popsicle (fruit)', category: 'Snacks', calories: 80, protein: 1, carbs: 18, fat: 0 },
  { name: 'Milkshake (vanilla)', category: 'Snacks', calories: 280, protein: 7, carbs: 38, fat: 12 },
  { name: 'Roasted Chickpeas', category: 'Snacks', calories: 378, protein: 16, carbs: 51, fat: 13, fiber: 12 },
  { name: 'Edamame (dry roasted)', category: 'Snacks', calories: 450, protein: 38, carbs: 30, fat: 20, fiber: 16 },
  { name: 'Seaweed Snacks (roasted)', category: 'Snacks', calories: 250, protein: 15, carbs: 20, fat: 15, fiber: 10 },
  { name: 'Turkey Jerky', category: 'Snacks', calories: 300, protein: 40, carbs: 10, fat: 10 },
  { name: 'Salmon Jerky', category: 'Snacks', calories: 320, protein: 40, carbs: 12, fat: 12 },
  { name: 'Meat Stick (beef)', category: 'Snacks', calories: 280, protein: 28, carbs: 6, fat: 16 },
  { name: 'Veggie Straws', category: 'Snacks', calories: 480, protein: 3, carbs: 60, fat: 26, fiber: 3 },
  { name: 'Hemp Milk', category: 'Snacks', calories: 60, protein: 3, carbs: 1, fat: 4.5 },
  { name: 'Pea Milk', category: 'Snacks', calories: 70, protein: 3, carbs: 1, fat: 4.5 },
  { name: 'Flax Milk', category: 'Snacks', calories: 30, protein: 0.5, carbs: 2, fat: 2.5 },
  { name: 'Macadamia Milk', category: 'Snacks', calories: 50, protein: 0.5, carbs: 1, fat: 5 },
  { name: 'Banana Milk', category: 'Snacks', calories: 60, protein: 0.5, carbs: 10, fat: 2 },
  { name: 'Hot Chocolate (made with milk)', category: 'Snacks', calories: 190, protein: 6, carbs: 28, fat: 7 },
  { name: 'Kombucha', category: 'Snacks', calories: 30, protein: 0, carbs: 7, fat: 0 },
  { name: 'Kvass', category: 'Snacks', calories: 30, protein: 0.5, carbs: 6, fat: 0 },
  { name: 'Horchata', category: 'Snacks', calories: 90, protein: 1, carbs: 17, fat: 2 },

  // --- BEVERAGES: Drinks & refreshments ---
  { name: 'Coffee (black)', category: 'Beverages', calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Coffee (with milk)', category: 'Beverages', calories: 30, protein: 1.5, carbs: 3, fat: 1.5 },
  { name: 'Espresso', category: 'Beverages', calories: 9, protein: 0.3, carbs: 1.5, fat: 0.2 },
  { name: 'Latte', category: 'Beverages', calories: 120, protein: 8, carbs: 10, fat: 6 },
  { name: 'Cappuccino', category: 'Beverages', calories: 80, protein: 5, carbs: 7, fat: 4 },
  { name: 'Americano', category: 'Beverages', calories: 5, protein: 0.3, carbs: 1, fat: 0 },
  { name: 'Mocha', category: 'Beverages', calories: 200, protein: 9, carbs: 25, fat: 10 },
  { name: 'Macchiato', category: 'Beverages', calories: 100, protein: 6, carbs: 8, fat: 5 },
  { name: 'Flat White', category: 'Beverages', calories: 130, protein: 9, carbs: 10, fat: 7 },
  { name: 'Iced Coffee', category: 'Beverages', calories: 5, protein: 0.3, carbs: 1, fat: 0 },
  { name: 'Cold Brew', category: 'Beverages', calories: 5, protein: 0.3, carbs: 1, fat: 0 },
  { name: 'Iced Latte', category: 'Beverages', calories: 90, protein: 6, carbs: 8, fat: 4 },
  { name: 'Tea (black)', category: 'Beverages', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Tea (green)', category: 'Beverages', calories: 2, protein: 0.2, carbs: 0.5, fat: 0 },
  { name: 'Tea (herbal)', category: 'Beverages', calories: 1, protein: 0, carbs: 0.3, fat: 0 },
  { name: 'Matcha Latte', category: 'Beverages', calories: 120, protein: 6, carbs: 15, fat: 5 },
  { name: 'Chai Latte', category: 'Beverages', calories: 150, protein: 6, carbs: 22, fat: 5 },
  { name: 'Orange Juice', category: 'Beverages', calories: 45, protein: 0.7, carbs: 10, fat: 0.2 },
  { name: 'Apple Juice', category: 'Beverages', calories: 46, protein: 0.1, carbs: 11, fat: 0.1 },
  { name: 'Cranberry Juice', category: 'Beverages', calories: 46, protein: 0.4, carbs: 12, fat: 0.1 },
  { name: 'Grape Juice', category: 'Beverages', calories: 60, protein: 0.4, carbs: 15, fat: 0.1 },
  { name: 'Pineapple Juice', category: 'Beverages', calories: 53, protein: 0.4, carbs: 13, fat: 0.1 },
  { name: 'Tomato Juice', category: 'Beverages', calories: 17, protein: 0.9, carbs: 4, fat: 0.1 },
  { name: 'Lemonade', category: 'Beverages', calories: 40, protein: 0.1, carbs: 10, fat: 0 },
  { name: 'Sports Drink', category: 'Beverages', calories: 25, protein: 0, carbs: 6, fat: 0 },
  { name: 'Energy Drink', category: 'Beverages', calories: 45, protein: 0, carbs: 11, fat: 0 },
  { name: 'Cola', category: 'Beverages', calories: 41, protein: 0, carbs: 11, fat: 0 },
  { name: 'Diet Cola', category: 'Beverages', calories: 1, protein: 0, carbs: 0, fat: 0 },
  { name: 'Ginger Ale', category: 'Beverages', calories: 35, protein: 0, carbs: 9, fat: 0 },
  { name: 'Club Soda', category: 'Beverages', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Tonic Water', category: 'Beverages', calories: 35, protein: 0, carbs: 9, fat: 0 },
  { name: 'Sparkling Water', category: 'Beverages', calories: 2, protein: 0, carbs: 0, fat: 0 },
  { name: 'Mineral Water', category: 'Beverages', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Protein Shake (RTD)', category: 'Beverages', calories: 140, protein: 25, carbs: 5, fat: 3 },
  { name: 'Meal Replacement Shake', category: 'Beverages', calories: 200, protein: 15, carbs: 28, fat: 5 },
  { name: 'Smoothie (fruit)', category: 'Beverages', calories: 120, protein: 2, carbs: 28, fat: 1 },
  { name: 'Smoothie (green)', category: 'Beverages', calories: 100, protein: 3, carbs: 22, fat: 1 },
  { name: 'Beer (lager)', category: 'Beverages', calories: 43, protein: 0.5, carbs: 3.6, fat: 0 },
  { name: 'Beer (IPA)', category: 'Beverages', calories: 55, protein: 0.7, carbs: 4, fat: 0 },
  { name: 'Beer (stout)', category: 'Beverages', calories: 50, protein: 0.5, carbs: 5, fat: 0 },
  { name: 'Wine (red)', category: 'Beverages', calories: 85, protein: 0.1, carbs: 2.6, fat: 0 },
  { name: 'Wine (white)', category: 'Beverages', calories: 80, protein: 0.1, carbs: 2.4, fat: 0 },
  { name: 'Champagne', category: 'Beverages', calories: 80, protein: 0.1, carbs: 2, fat: 0 },
  { name: 'Sake (drinking)', category: 'Beverages', calories: 40, protein: 0.3, carbs: 1.5, fat: 0 },

  // --- HERBS & SPICES: Seasonings & aromatics ---
  { name: 'Basil (fresh)', category: 'Herbs & Spices', calories: 44, protein: 3.2, carbs: 5, fat: 0.6, fiber: 1.6 },
  { name: 'Cilantro (fresh)', category: 'Herbs & Spices', calories: 23, protein: 2.1, carbs: 4, fat: 0.5, fiber: 2.8 },
  { name: 'Parsley (fresh)', category: 'Herbs & Spices', calories: 36, protein: 3, carbs: 6, fat: 0.8, fiber: 3.3 },
  { name: 'Mint (fresh)', category: 'Herbs & Spices', calories: 44, protein: 3.3, carbs: 9, fat: 0.7, fiber: 3.8 },
  { name: 'Rosemary (fresh)', category: 'Herbs & Spices', calories: 131, protein: 3.3, carbs: 21, fat: 5.9, fiber: 14 },
  { name: 'Thyme (fresh)', category: 'Herbs & Spices', calories: 101, protein: 5.6, carbs: 24, fat: 1.7, fiber: 14 },
  { name: 'Sage (fresh)', category: 'Herbs & Spices', calories: 49, protein: 1.7, carbs: 10, fat: 0.7, fiber: 6 },
  { name: 'Dill (fresh)', category: 'Herbs & Spices', calories: 43, protein: 3.5, carbs: 7, fat: 1.1, fiber: 2.1 },
  { name: 'Oregano (fresh)', category: 'Herbs & Spices', calories: 50, protein: 1.7, carbs: 11, fat: 0.8, fiber: 2.6 },
  { name: 'Tarragon (fresh)', category: 'Herbs & Spices', calories: 50, protein: 1.6, carbs: 9, fat: 1, fiber: 1.5 },
  { name: 'Cinnamon (ground)', category: 'Herbs & Spices', calories: 247, protein: 4, carbs: 53, fat: 1.3, fiber: 53 },
  { name: 'Cumin (ground)', category: 'Herbs & Spices', calories: 375, protein: 18, carbs: 44, fat: 22, fiber: 11 },
  { name: 'Paprika', category: 'Herbs & Spices', calories: 282, protein: 14, carbs: 54, fat: 13, fiber: 38 },
  { name: 'Smoked Paprika', category: 'Herbs & Spices', calories: 282, protein: 14, carbs: 54, fat: 13, fiber: 38 },
  { name: 'Turmeric (ground)', category: 'Herbs & Spices', calories: 354, protein: 8, carbs: 65, fat: 10, fiber: 21 },
  { name: 'Ginger (fresh)', category: 'Herbs & Spices', calories: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2 },
  { name: 'Chili Powder', category: 'Herbs & Spices', calories: 282, protein: 13, carbs: 50, fat: 13, fiber: 28 },
  { name: 'Cayenne Pepper', category: 'Herbs & Spices', calories: 318, protein: 12, carbs: 57, fat: 17, fiber: 27 },
  { name: 'Black Pepper (ground)', category: 'Herbs & Spices', calories: 251, protein: 10, carbs: 64, fat: 3.3, fiber: 26 },
  { name: 'Nutmeg (ground)', category: 'Herbs & Spices', calories: 525, protein: 6, carbs: 49, fat: 36, fiber: 21 },
  { name: 'Cloves (ground)', category: 'Herbs & Spices', calories: 274, protein: 6, carbs: 65, fat: 13, fiber: 34 },
  { name: 'Allspice (ground)', category: 'Herbs & Spices', calories: 263, protein: 6, carbs: 56, fat: 9, fiber: 21 },
  { name: 'Cardamom (ground)', category: 'Herbs & Spices', calories: 311, protein: 11, carbs: 68, fat: 7, fiber: 28 },
  { name: 'Curry Powder', category: 'Herbs & Spices', calories: 325, protein: 14, carbs: 55, fat: 14, fiber: 23 },
  { name: 'Garam Masala', category: 'Herbs & Spices', calories: 350, protein: 12, carbs: 50, fat: 15, fiber: 20 },
  { name: 'Italian Seasoning', category: 'Herbs & Spices', calories: 270, protein: 10, carbs: 50, fat: 8, fiber: 32 },
  { name: 'Vanilla Extract', category: 'Herbs & Spices', calories: 288, protein: 0, carbs: 12, fat: 0 },
  { name: 'Salt (table)', category: 'Herbs & Spices', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'MSG', category: 'Herbs & Spices', calories: 0, protein: 0, carbs: 0, fat: 0 },

  // --- BAKING: Flours, sugars & baking ingredients ---
  { name: 'All-Purpose Flour', category: 'Baking', calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7 },
  { name: 'Whole Wheat Flour', category: 'Baking', calories: 340, protein: 13, carbs: 72, fat: 2, fiber: 12 },
  { name: 'Bread Flour', category: 'Baking', calories: 361, protein: 12, carbs: 73, fat: 1, fiber: 2.4 },
  { name: 'Almond Flour', category: 'Baking', calories: 600, protein: 21, carbs: 20, fat: 56, fiber: 11 },
  { name: 'Coconut Flour', category: 'Baking', calories: 400, protein: 16, carbs: 60, fat: 15, fiber: 38 },
  { name: 'Granulated Sugar', category: 'Baking', calories: 387, protein: 0, carbs: 100, fat: 0 },
  { name: 'Brown Sugar', category: 'Baking', calories: 380, protein: 0, carbs: 98, fat: 0 },
  { name: 'Powdered Sugar', category: 'Baking', calories: 389, protein: 0, carbs: 100, fat: 0 },
  { name: 'Baking Soda', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Baking Powder', category: 'Baking', calories: 5, protein: 0, carbs: 1, fat: 0 },
  { name: 'Cocoa Powder (unsweetened)', category: 'Baking', calories: 228, protein: 20, carbs: 58, fat: 14, fiber: 37 },
  { name: 'Cornstarch', category: 'Baking', calories: 357, protein: 0.3, carbs: 87, fat: 0, fiber: 0.9 },
  { name: 'Chocolate Chips (semi-sweet)', category: 'Baking', calories: 480, protein: 5, carbs: 63, fat: 28, fiber: 7 },
  { name: 'White Chocolate Chips', category: 'Baking', calories: 540, protein: 6, carbs: 60, fat: 32, fiber: 0 },
  { name: 'Caramel Sauce', category: 'Baking', calories: 382, protein: 4, carbs: 80, fat: 8 },
  { name: 'Chocolate Syrup', category: 'Baking', calories: 280, protein: 1.5, carbs: 65, fat: 1.5 },
  { name: 'Sprinkles', category: 'Baking', calories: 400, protein: 1, carbs: 95, fat: 2 },
  { name: 'Chocolate Frosting', category: 'Baking', calories: 400, protein: 1, carbs: 63, fat: 18 },
  { name: 'Vanilla Frosting', category: 'Baking', calories: 400, protein: 0.5, carbs: 65, fat: 16 },
  { name: 'Pie Crust (baked)', category: 'Baking', calories: 500, protein: 6, carbs: 54, fat: 30, fiber: 2 },
  { name: 'Pie Filling (apple)', category: 'Baking', calories: 100, protein: 0.3, carbs: 25, fat: 0.1, fiber: 1 },
  { name: 'Pie Filling (pumpkin)', category: 'Baking', calories: 80, protein: 1.5, carbs: 18, fat: 0.5, fiber: 3.5 },
  { name: 'Yeast (active dry)', category: 'Baking', calories: 325, protein: 40, carbs: 42, fat: 6, fiber: 21 },
  { name: 'Gelatin (unsweetened)', category: 'Baking', calories: 335, protein: 84, carbs: 0, fat: 0 },
  { name: 'Honey (baking)', category: 'Baking', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: 'Agave Nectar', category: 'Baking', calories: 310, protein: 0, carbs: 76, fat: 0 },
  { name: 'Molasses (baking)', category: 'Baking', calories: 290, protein: 0, carbs: 75, fat: 0 },
  { name: 'Pork Hock', category: 'Meat', calories: 220, protein: 22, carbs: 0, fat: 14 },
  { name: 'Capicola', category: 'Meat', calories: 320, protein: 24, carbs: 0, fat: 25 },
  { name: 'Pancetta', category: 'Meat', calories: 450, protein: 12, carbs: 0, fat: 45 },
  { name: 'Guanciale', category: 'Meat', calories: 500, protein: 10, carbs: 0, fat: 52 },
  { name: 'Andouille Sausage', category: 'Meat', calories: 280, protein: 16, carbs: 2, fat: 23 },
  { name: 'Weisswurst', category: 'Meat', calories: 240, protein: 14, carbs: 1, fat: 20 },
  { name: 'Frankfurter', category: 'Meat', calories: 290, protein: 12, carbs: 2, fat: 26 },
  { name: 'Liverwurst', category: 'Meat', calories: 310, protein: 14, carbs: 3, fat: 27 },
  { name: 'Spam', category: 'Meat', calories: 320, protein: 13, carbs: 2, fat: 29 },
  { name: 'Beef Heart', category: 'Meat', calories: 112, protein: 17, carbs: 0, fat: 4 },
  { name: 'Beef Kidney', category: 'Meat', calories: 99, protein: 17, carbs: 0, fat: 3 },
  { name: 'Black Pudding', category: 'Meat', calories: 310, protein: 15, carbs: 10, fat: 23 },
  { name: 'Haggis', category: 'Meat', calories: 280, protein: 14, carbs: 12, fat: 20 },
  { name: 'Elk', category: 'Meat', calories: 146, protein: 27, carbs: 0, fat: 3 },
  { name: 'Moose', category: 'Meat', calories: 128, protein: 24, carbs: 0, fat: 3 },
  { name: 'Veal Chop', category: 'Meat', calories: 210, protein: 24, carbs: 0, fat: 12 },
  { name: 'Veal Scallopini', category: 'Meat', calories: 150, protein: 22, carbs: 0, fat: 6 },
  { name: 'Veal Mince', category: 'Meat', calories: 168, protein: 20, carbs: 0, fat: 9 },
  { name: 'Suckling Pig', category: 'Meat', calories: 280, protein: 22, carbs: 0, fat: 21 },
  { name: 'Chicharron', category: 'Meat', calories: 545, protein: 48, carbs: 0, fat: 38 },
  { name: 'Carne Asada', category: 'Meat', calories: 190, protein: 26, carbs: 0, fat: 9 },
  { name: 'Al Pastor', category: 'Meat', calories: 230, protein: 22, carbs: 5, fat: 13 },
  { name: 'Carnitas', category: 'Meat', calories: 260, protein: 23, carbs: 0, fat: 18 },
  { name: 'Barbacoa', category: 'Meat', calories: 210, protein: 24, carbs: 0, fat: 12 },
  { name: 'Turkey Thigh', category: 'Meat', calories: 170, protein: 24, carbs: 0, fat: 8 },
  { name: 'Turkey Wing', category: 'Meat', calories: 190, protein: 23, carbs: 0, fat: 10 },
  { name: 'Turkey Drumstick', category: 'Meat', calories: 178, protein: 25, carbs: 0, fat: 8 },
  { name: 'Chicken Feet', category: 'Meat', calories: 215, protein: 19, carbs: 0, fat: 15 },
  { name: 'Beef Cheek', category: 'Meat', calories: 200, protein: 24, carbs: 0, fat: 11 },
  { name: 'Beef Marrow', category: 'Meat', calories: 780, protein: 0, carbs: 0, fat: 84 },
  { name: 'Lamb Breast', category: 'Meat', calories: 280, protein: 20, carbs: 0, fat: 22 },
  { name: 'Pork Cheek', category: 'Meat', calories: 230, protein: 22, carbs: 0, fat: 15 },
  { name: 'Beef Hanger Steak', category: 'Meat', calories: 205, protein: 26, carbs: 0, fat: 10 },
  { name: 'Beef Skirt Steak', category: 'Meat', calories: 200, protein: 27, carbs: 0, fat: 9 },
  { name: 'Veal Liver', category: 'Meat', calories: 140, protein: 20, carbs: 4, fat: 5 },
  { name: 'Foie Gras', category: 'Meat', calories: 462, protein: 12, carbs: 5, fat: 44 },
  { name: 'Pork Pate', category: 'Meat', calories: 320, protein: 14, carbs: 2, fat: 28 },
  { name: 'Chicken Pate', category: 'Meat', calories: 200, protein: 15, carbs: 2, fat: 16 },
  { name: 'Beef Jerky (homestyle)', category: 'Meat', calories: 280, protein: 40, carbs: 8, fat: 10 },
  { name: 'Canned Chicken', category: 'Meat', calories: 140, protein: 23, carbs: 0, fat: 5 },
  { name: 'Canned Turkey', category: 'Meat', calories: 130, protein: 22, carbs: 0, fat: 4 },
  { name: 'Lamb Tongue', category: 'Meat', calories: 200, protein: 14, carbs: 0, fat: 16 },
  { name: 'Pork Tongue', category: 'Meat', calories: 186, protein: 15, carbs: 0, fat: 14 },
  { name: 'Beef Sweetbreads', category: 'Meat', calories: 280, protein: 22, carbs: 0, fat: 21 },

  // --- FISH (35 new items) ---
  { name: 'Amberjack', category: 'Fish', calories: 146, protein: 22, carbs: 0, fat: 6 },
  { name: 'Bluefish', category: 'Fish', calories: 124, protein: 20, carbs: 0, fat: 5 },
  { name: 'Bonito', category: 'Fish', calories: 145, protein: 24, carbs: 0, fat: 5 },
  { name: 'Cuttlefish', category: 'Fish', calories: 79, protein: 16, carbs: 1, fat: 1 },
  { name: 'Escolar', category: 'Fish', calories: 180, protein: 19, carbs: 0, fat: 11 },
  { name: 'John Dory', category: 'Fish', calories: 87, protein: 18, carbs: 0, fat: 2 },
  { name: 'Lingcod', category: 'Fish', calories: 80, protein: 18, carbs: 0, fat: 1 },
  { name: 'Mackerel (Atlantic)', category: 'Fish', calories: 205, protein: 19, carbs: 0, fat: 14 },
  { name: 'Mackerel (Spanish)', category: 'Fish', calories: 158, protein: 21, carbs: 0, fat: 8 },
  { name: 'Mullet', category: 'Fish', calories: 117, protein: 19, carbs: 0, fat: 4 },
  { name: 'Opah (moonfish)', category: 'Fish', calories: 112, protein: 20, carbs: 0, fat: 3 },
  { name: 'Orange Roughy', category: 'Fish', calories: 75, protein: 16, carbs: 0, fat: 1 },
  { name: 'Redfish', category: 'Fish', calories: 90, protein: 19, carbs: 0, fat: 1 },
  { name: 'Sea Urchin (uni)', category: 'Fish', calories: 120, protein: 12, carbs: 3, fat: 7 },
  { name: 'Shark', category: 'Fish', calories: 130, protein: 21, carbs: 0, fat: 5 },
  { name: 'Sturgeon', category: 'Fish', calories: 105, protein: 18, carbs: 0, fat: 4 },
  { name: 'Surimi (imitation crab)', category: 'Fish', calories: 99, protein: 15, carbs: 7, fat: 1 },
  { name: 'Tuna (bluefin)', category: 'Fish', calories: 144, protein: 23, carbs: 0, fat: 5 },
  { name: 'Tuna (yellowfin)', category: 'Fish', calories: 130, protein: 26, carbs: 0, fat: 2 },
  { name: 'Tuna (albacore)', category: 'Fish', calories: 158, protein: 26, carbs: 0, fat: 5 },
  { name: 'Sea Bream', category: 'Fish', calories: 100, protein: 19, carbs: 0, fat: 2 },
  { name: 'Croaker', category: 'Fish', calories: 90, protein: 18, carbs: 0, fat: 2 },
  { name: 'Red Drum', category: 'Fish', calories: 94, protein: 19, carbs: 0, fat: 2 },
  { name: 'Smoked Salmon', category: 'Fish', calories: 117, protein: 18, carbs: 0, fat: 5 },
  { name: 'Pickled Herring', category: 'Fish', calories: 220, protein: 14, carbs: 8, fat: 15 },
  { name: 'Kippers', category: 'Fish', calories: 155, protein: 20, carbs: 0, fat: 8 },
  { name: 'Bottarga', category: 'Fish', calories: 380, protein: 40, carbs: 5, fat: 22 },
  { name: 'Lumpfish Roe', category: 'Fish', calories: 120, protein: 15, carbs: 1, fat: 6 },
  { name: 'Salmon Roe (ikura)', category: 'Fish', calories: 200, protein: 27, carbs: 2, fat: 10 },
  { name: 'Trout Roe', category: 'Fish', calories: 190, protein: 25, carbs: 1, fat: 9 },
  { name: 'Dulse (seaweed)', category: 'Fish', calories: 40, protein: 4, carbs: 8, fat: 0.5, fiber: 2 },
  { name: 'Arame (seaweed)', category: 'Fish', calories: 38, protein: 3, carbs: 7, fat: 0.3, fiber: 3 },
  { name: 'Hijiki (seaweed)', category: 'Fish', calories: 40, protein: 2, carbs: 8, fat: 0.4, fiber: 3 },
  { name: 'Irish Moss', category: 'Fish', calories: 49, protein: 1, carbs: 12, fat: 0.2, fiber: 1 },
  { name: 'Unagi (freshwater eel)', category: 'Fish', calories: 184, protein: 18, carbs: 0, fat: 12 },

  // --- DAIRY (45 new items) ---
  { name: 'Labneh', category: 'Dairy', calories: 120, protein: 5, carbs: 4, fat: 10 },
  { name: 'Quark', category: 'Dairy', calories: 73, protein: 12, carbs: 4, fat: 0.2 },
  { name: 'Creme Fraiche', category: 'Dairy', calories: 380, protein: 2, carbs: 3, fat: 40 },
  { name: 'Fromage Blanc', category: 'Dairy', calories: 80, protein: 10, carbs: 4, fat: 2 },
  { name: 'Clabber', category: 'Dairy', calories: 65, protein: 3.5, carbs: 5, fat: 3.5 },
  { name: 'Paneer', category: 'Dairy', calories: 321, protein: 25, carbs: 4, fat: 23 },
  { name: 'Queso Fresco', category: 'Dairy', calories: 290, protein: 20, carbs: 3, fat: 23 },
  { name: 'Queso Blanco', category: 'Dairy', calories: 280, protein: 19, carbs: 3, fat: 22 },
  { name: 'Oaxaca Cheese', category: 'Dairy', calories: 300, protein: 23, carbs: 2, fat: 23 },
  { name: 'Cotija Cheese', category: 'Dairy', calories: 366, protein: 20, carbs: 4, fat: 30 },
  { name: 'Chechil (string cheese)', category: 'Dairy', calories: 280, protein: 22, carbs: 2, fat: 21 },
  { name: 'Sirene (Bulgarian cheese)', category: 'Dairy', calories: 260, protein: 18, carbs: 2, fat: 20 },
  { name: 'Kashkaval', category: 'Dairy', calories: 390, protein: 24, carbs: 1, fat: 32 },
  { name: 'Kasseri', category: 'Dairy', calories: 376, protein: 25, carbs: 1, fat: 30 },
  { name: 'Graviera', category: 'Dairy', calories: 380, protein: 26, carbs: 2, fat: 30 },
  { name: 'Kefalotyri', category: 'Dairy', calories: 400, protein: 26, carbs: 2, fat: 33 },
  { name: 'Limburger', category: 'Dairy', calories: 327, protein: 20, carbs: 1, fat: 27 },
  { name: 'Tilsit', category: 'Dairy', calories: 350, protein: 24, carbs: 1, fat: 28 },
  { name: 'Appenzeller', category: 'Dairy', calories: 395, protein: 25, carbs: 1, fat: 32 },
  { name: 'Beaufort', category: 'Dairy', calories: 400, protein: 26, carbs: 0, fat: 33 },
  { name: 'Comte', category: 'Dairy', calories: 410, protein: 27, carbs: 0, fat: 34 },
  { name: 'Reblochon', category: 'Dairy', calories: 340, protein: 20, carbs: 0, fat: 28 },
  { name: 'Vacherin', category: 'Dairy', calories: 360, protein: 20, carbs: 0, fat: 30 },
  { name: 'Epoisses', category: 'Dairy', calories: 350, protein: 18, carbs: 0, fat: 30 },
  { name: 'Chaource', category: 'Dairy', calories: 320, protein: 18, carbs: 1, fat: 27 },
  { name: 'Saint-Nectaire', category: 'Dairy', calories: 330, protein: 21, carbs: 1, fat: 27 },
  { name: 'Mimolette', category: 'Dairy', calories: 400, protein: 25, carbs: 1, fat: 33 },
  { name: 'Cheddar (aged white)', category: 'Dairy', calories: 410, protein: 25, carbs: 1, fat: 34 },
  { name: 'Caciocavallo', category: 'Dairy', calories: 370, protein: 24, carbs: 2, fat: 30 },
  { name: 'Scamorza', category: 'Dairy', calories: 290, protein: 22, carbs: 2, fat: 22 },
  { name: 'Dulce de Leche', category: 'Dairy', calories: 330, protein: 7, carbs: 57, fat: 9 },
  { name: 'Yogurt (plain, whole milk)', category: 'Dairy', calories: 63, protein: 5, carbs: 5, fat: 3.3 },
  { name: 'Yogurt (plain, low-fat)', category: 'Dairy', calories: 47, protein: 5, carbs: 5, fat: 1 },
  { name: 'Yogurt (Greek, 2%)', category: 'Dairy', calories: 73, protein: 9, carbs: 5, fat: 2 },
  { name: 'Yogurt (Greek, 0%)', category: 'Dairy', calories: 59, protein: 10, carbs: 4, fat: 0.3 },
  { name: 'Yogurt Drink (plain)', category: 'Dairy', calories: 65, protein: 4, carbs: 6, fat: 2.5 },
  { name: 'A2 Milk', category: 'Dairy', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: 'Lactose-Free Milk', category: 'Dairy', calories: 52, protein: 3.3, carbs: 5, fat: 2 },
  { name: 'Powdered Milk (whole)', category: 'Dairy', calories: 496, protein: 26, carbs: 39, fat: 27 },
  { name: 'Powdered Milk (skim)', category: 'Dairy', calories: 362, protein: 36, carbs: 52, fat: 1 },
  { name: 'Coconut Yogurt', category: 'Dairy', calories: 140, protein: 1, carbs: 8, fat: 12 },
  { name: 'Soy Yogurt', category: 'Dairy', calories: 86, protein: 5, carbs: 7, fat: 4.5 },
  { name: 'Almond Yogurt', category: 'Dairy', calories: 60, protein: 1, carbs: 6, fat: 4 },
  { name: 'Oat Yogurt', category: 'Dairy', calories: 80, protein: 1.5, carbs: 12, fat: 3 },
  { name: 'Pudding (butterscotch)', category: 'Dairy', calories: 130, protein: 2.5, carbs: 22, fat: 3.5 },

  // --- GRAINS (45 new items) ---
  { name: 'Kamut (cooked)', category: 'Grains', calories: 135, protein: 5, carbs: 28, fat: 0.7, fiber: 3 },
  { name: 'Spelt (cooked)', category: 'Grains', calories: 127, protein: 5, carbs: 26, fat: 0.9, fiber: 4 },
  { name: 'Einkorn (cooked)', category: 'Grains', calories: 130, protein: 5, carbs: 27, fat: 0.5, fiber: 3 },
  { name: 'Farro (cooked)', category: 'Grains', calories: 130, protein: 5, carbs: 26, fat: 0.5, fiber: 4 },
  { name: 'Sorghum (cooked)', category: 'Grains', calories: 113, protein: 4, carbs: 24, fat: 0.5, fiber: 3 },
  { name: 'Triticale (cooked)', category: 'Grains', calories: 120, protein: 4, carbs: 25, fat: 0.5, fiber: 3 },
  { name: 'Fonio (cooked)', category: 'Grains', calories: 100, protein: 3, carbs: 22, fat: 0.2, fiber: 1 },
  { name: 'Rye Berries (cooked)', category: 'Grains', calories: 128, protein: 4, carbs: 28, fat: 0.4, fiber: 6 },
  { name: 'Wheat Berries (cooked)', category: 'Grains', calories: 130, protein: 5, carbs: 28, fat: 0.4, fiber: 4 },
  { name: 'Black Rice (cooked)', category: 'Grains', calories: 130, protein: 3, carbs: 27, fat: 0.4, fiber: 3 },
  { name: 'Red Rice (cooked)', category: 'Grains', calories: 125, protein: 3, carbs: 26, fat: 0.3, fiber: 2 },
  { name: 'Jasmine Rice (cooked)', category: 'Grains', calories: 129, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Basmati Rice (cooked)', category: 'Grains', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Arborio Rice (cooked)', category: 'Grains', calories: 130, protein: 2.5, carbs: 29, fat: 0.3 },
  { name: 'Glutinous Rice (cooked)', category: 'Grains', calories: 130, protein: 2.5, carbs: 29, fat: 0.2 },
  { name: 'Wild Rice (cooked)', category: 'Grains', calories: 101, protein: 4, carbs: 21, fat: 0.3, fiber: 2 },
  { name: 'Macaroni (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Fusilli (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Farfalle (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Rigatoni (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Angel Hair (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Linguine (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fat: 1 },
  { name: 'Tortellini (cheese, cooked)', category: 'Grains', calories: 170, protein: 7, carbs: 30, fat: 3 },
  { name: 'Gnocchi (potato, cooked)', category: 'Grains', calories: 180, protein: 4, carbs: 34, fat: 3 },
  { name: 'Pita (whole wheat)', category: 'Grains', calories: 266, protein: 9, carbs: 53, fat: 2, fiber: 6 },
  { name: 'Bagel (everything)', category: 'Grains', calories: 260, protein: 10, carbs: 50, fat: 2 },
  { name: 'Bagel (sesame)', category: 'Grains', calories: 260, protein: 10, carbs: 50, fat: 2 },
  { name: 'Bagel (cinnamon raisin)', category: 'Grains', calories: 270, protein: 9, carbs: 54, fat: 2 },
  { name: 'Crumpet', category: 'Grains', calories: 140, protein: 4, carbs: 27, fat: 2 },
  { name: 'Scone (plain)', category: 'Grains', calories: 350, protein: 8, carbs: 44, fat: 16 },
  { name: 'Biscuit (buttermilk)', category: 'Grains', calories: 320, protein: 6, carbs: 38, fat: 17 },
  { name: 'Hushpuppy', category: 'Grains', calories: 280, protein: 6, carbs: 33, fat: 14 },
  { name: 'Arepa', category: 'Grains', calories: 210, protein: 4, carbs: 40, fat: 4, fiber: 3 },
  { name: 'Pupusa', category: 'Grains', calories: 230, protein: 6, carbs: 32, fat: 9 },
  { name: 'Empanada Dough', category: 'Grains', calories: 280, protein: 6, carbs: 38, fat: 12 },
  { name: 'Pierogi Dough', category: 'Grains', calories: 260, protein: 7, carbs: 42, fat: 7 },
  { name: 'Dumpling Wrapper', category: 'Grains', calories: 240, protein: 7, carbs: 44, fat: 3 },
  { name: 'Spring Roll Wrapper', category: 'Grains', calories: 260, protein: 6, carbs: 52, fat: 3 },
  { name: 'Egg Roll Wrapper', category: 'Grains', calories: 280, protein: 8, carbs: 50, fat: 4 },
  { name: 'Rice Paper', category: 'Grains', calories: 310, protein: 4, carbs: 72, fat: 0.5 },
  { name: 'Bun (bao dough, steamed)', category: 'Grains', calories: 180, protein: 5, carbs: 34, fat: 2 },
  { name: 'Congee (rice porridge)', category: 'Grains', calories: 50, protein: 1.2, carbs: 10, fat: 0.1 },
  { name: 'Seitan (wheat gluten)', category: 'Grains', calories: 120, protein: 24, carbs: 5, fat: 2, fiber: 1 },
  { name: 'Oat Bran (cooked)', category: 'Grains', calories: 40, protein: 3.2, carbs: 7, fat: 0.9, fiber: 2 },
  { name: 'Wheat Bran (raw)', category: 'Grains', calories: 216, protein: 15, carbs: 65, fat: 4, fiber: 42 },

  // --- VEGGIES (45 new items) ---
  { name: 'Amaranth Leaves', category: 'Veggies', calories: 23, protein: 2.5, carbs: 4, fat: 0.3, fiber: 2 },
  { name: 'Malabar Spinach', category: 'Veggies', calories: 19, protein: 2, carbs: 3, fat: 0.3, fiber: 1.5 },
  { name: 'Moringa Leaves', category: 'Veggies', calories: 27, protein: 2.5, carbs: 4, fat: 0.4, fiber: 2 },
  { name: 'Dandelion Greens', category: 'Veggies', calories: 45, protein: 2.7, carbs: 9, fat: 0.7, fiber: 3.5 },
  { name: 'Mustard Greens', category: 'Veggies', calories: 27, protein: 2.9, carbs: 5, fat: 0.4, fiber: 3.2 },
  { name: 'Beet Greens', category: 'Veggies', calories: 22, protein: 2.2, carbs: 4, fat: 0.1, fiber: 3.7 },
  { name: 'Turnip Greens', category: 'Veggies', calories: 20, protein: 1.5, carbs: 4, fat: 0.2, fiber: 3.5 },
  { name: 'Chicory Greens', category: 'Veggies', calories: 23, protein: 1.7, carbs: 5, fat: 0.3, fiber: 4 },
  { name: 'Radicchio', category: 'Veggies', calories: 23, protein: 1.4, carbs: 4, fat: 0.1, fiber: 0.9 },
  { name: 'Endive', category: 'Veggies', calories: 17, protein: 1.3, carbs: 3, fat: 0.1, fiber: 3.1 },
  { name: 'Escarole', category: 'Veggies', calories: 20, protein: 1.4, carbs: 4, fat: 0.2, fiber: 3 },
  { name: 'Mizuna', category: 'Veggies', calories: 15, protein: 1.5, carbs: 2, fat: 0.2, fiber: 1 },
  { name: 'Tatsoi', category: 'Veggies', calories: 16, protein: 1.5, carbs: 2.5, fat: 0.2, fiber: 1.5 },
  { name: 'Mache (lamb lettuce)', category: 'Veggies', calories: 16, protein: 1.5, carbs: 2, fat: 0.2, fiber: 1.5 },
  { name: 'Frisee', category: 'Veggies', calories: 15, protein: 1.2, carbs: 3, fat: 0.2, fiber: 2 },
  { name: 'Cherry Tomato', category: 'Veggies', calories: 18, protein: 0.9, carbs: 4, fat: 0.2, fiber: 1.2 },
  { name: 'Grape Tomato', category: 'Veggies', calories: 18, protein: 0.9, carbs: 4, fat: 0.2, fiber: 1.2 },
  { name: 'Sun-Dried Tomato', category: 'Veggies', calories: 258, protein: 14, carbs: 56, fat: 3, fiber: 12 },
  { name: 'Roasted Red Pepper', category: 'Veggies', calories: 40, protein: 1, carbs: 9, fat: 0.4, fiber: 2 },
  { name: 'Banana Pepper', category: 'Veggies', calories: 27, protein: 1, carbs: 5, fat: 0.5, fiber: 2 },
  { name: 'Anaheim Pepper', category: 'Veggies', calories: 20, protein: 0.8, carbs: 4, fat: 0.2, fiber: 1.5 },
  { name: 'Cubanelle Pepper', category: 'Veggies', calories: 20, protein: 0.8, carbs: 4, fat: 0.2, fiber: 1.5 },
  { name: 'Thai Chili Pepper', category: 'Veggies', calories: 40, protein: 1.6, carbs: 9, fat: 0.5, fiber: 3 },
  { name: 'Cayenne Pepper (fresh)', category: 'Veggies', calories: 50, protein: 2, carbs: 10, fat: 0.5, fiber: 3 },
  { name: 'Sweet Potato Leaves', category: 'Veggies', calories: 28, protein: 2.5, carbs: 4, fat: 0.4, fiber: 2 },
  { name: 'Cassava Leaves', category: 'Veggies', calories: 75, protein: 7, carbs: 14, fat: 1, fiber: 4 },
  { name: 'Pumpkin Leaves', category: 'Veggies', calories: 25, protein: 2, carbs: 4, fat: 0.3, fiber: 2 },
  { name: 'Squash Blossoms', category: 'Veggies', calories: 15, protein: 1.5, carbs: 2, fat: 0.2 },
  { name: 'Bitter Melon (karela)', category: 'Veggies', calories: 17, protein: 1, carbs: 4, fat: 0.2, fiber: 2.8 },
  { name: 'Ridge Gourd (luffa)', category: 'Veggies', calories: 18, protein: 0.5, carbs: 4, fat: 0.2, fiber: 1 },
  { name: 'Bottle Gourd (lauki)', category: 'Veggies', calories: 14, protein: 0.6, carbs: 3, fat: 0, fiber: 0.5 },
  { name: 'Drumstick (moringa pod)', category: 'Veggies', calories: 37, protein: 2.1, carbs: 8, fat: 0.2, fiber: 3 },
  { name: 'Malanga (cooked)', category: 'Veggies', calories: 98, protein: 1.5, carbs: 23, fat: 0.1, fiber: 3 },
  { name: 'Yuca (cassava root, cooked)', category: 'Veggies', calories: 112, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.5 },
  { name: 'Oca (New Zealand yam)', category: 'Veggies', calories: 55, protein: 1, carbs: 12, fat: 0.1, fiber: 2 },
  { name: 'Sunchoke (Jerusalem artichoke)', category: 'Veggies', calories: 73, protein: 2, carbs: 17, fat: 0, fiber: 1.6 },
  { name: 'Sea Kale', category: 'Veggies', calories: 18, protein: 1.5, carbs: 3, fat: 0.2, fiber: 2 },
  { name: 'Samphire (sea beans)', category: 'Veggies', calories: 20, protein: 1.8, carbs: 3, fat: 0.1, fiber: 1.5 },
  { name: 'Water Chestnut (canned)', category: 'Veggies', calories: 50, protein: 1, carbs: 12, fat: 0.1, fiber: 3 },
  { name: 'Cardoon', category: 'Veggies', calories: 20, protein: 0.7, carbs: 4, fat: 0.1, fiber: 1.6 },
  { name: 'Lovage', category: 'Veggies', calories: 20, protein: 1.5, carbs: 4, fat: 0.3, fiber: 2 },
  { name: 'Sassafras Leaves', category: 'Veggies', calories: 25, protein: 1.5, carbs: 5, fat: 0.4, fiber: 2 },
  { name: 'Chayote Squash', category: 'Veggies', calories: 19, protein: 0.8, carbs: 4, fat: 0.1, fiber: 1.7 },
  { name: 'Calabash (opo squash, cooked)', category: 'Veggies', calories: 14, protein: 0.6, carbs: 3, fat: 0, fiber: 0.5 },
  { name: 'Fiddlehead Ferns', category: 'Veggies', calories: 34, protein: 4.6, carbs: 6, fat: 0.4, fiber: 2 },

  // --- FRUIT (50 new items) ---
  { name: 'Akee', category: 'Fruit', calories: 151, protein: 2.9, carbs: 8, fat: 14, fiber: 3 },
  { name: 'Acerola (Barbados cherry)', category: 'Fruit', calories: 32, protein: 0.4, carbs: 8, fat: 0.3, fiber: 1.1 },
  { name: 'Bilberries', category: 'Fruit', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { name: 'Calamansi', category: 'Fruit', calories: 35, protein: 0.6, carbs: 9, fat: 0.2, fiber: 1.5 },
  { name: 'Canistel (egg fruit)', category: 'Fruit', calories: 138, protein: 1.7, carbs: 32, fat: 0.8, fiber: 5 },
  { name: 'Cloudberries', category: 'Fruit', calories: 51, protein: 1, carbs: 12, fat: 0.8, fiber: 3.5 },
  { name: 'Cranberry (dried)', category: 'Fruit', calories: 325, protein: 0.2, carbs: 82, fat: 0.7, fiber: 5 },
  { name: 'Currants (dried)', category: 'Fruit', calories: 283, protein: 3.4, carbs: 71, fat: 0.5, fiber: 7 },
  { name: 'Currants (fresh)', category: 'Fruit', calories: 56, protein: 1.4, carbs: 14, fat: 0.4, fiber: 4.5 },
  { name: 'Date (Medjool)', category: 'Fruit', calories: 277, protein: 2, carbs: 75, fat: 0.2, fiber: 7 },
  { name: 'Date (Deglet Noor)', category: 'Fruit', calories: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8 },
  { name: 'Dewberry', category: 'Fruit', calories: 43, protein: 1.2, carbs: 10, fat: 0.5, fiber: 5 },
  { name: 'Finger Lime', category: 'Fruit', calories: 30, protein: 1, carbs: 6, fat: 0.5, fiber: 2.5 },
  { name: 'Gac Fruit', category: 'Fruit', calories: 40, protein: 1.5, carbs: 8, fat: 0.5, fiber: 2 },
  { name: 'Genip (mamoncillo)', category: 'Fruit', calories: 73, protein: 1, carbs: 17, fat: 0.2, fiber: 1.5 },
  { name: 'Guanabana', category: 'Fruit', calories: 66, protein: 1, carbs: 16, fat: 0.3, fiber: 3 },
  { name: 'Horned Melon (kiwano)', category: 'Fruit', calories: 44, protein: 1.8, carbs: 8, fat: 1, fiber: 2 },
  { name: 'Ilama', category: 'Fruit', calories: 60, protein: 1, carbs: 14, fat: 0.4, fiber: 2 },
  { name: 'Jabuticaba', category: 'Fruit', calories: 58, protein: 0.6, carbs: 15, fat: 0.1, fiber: 2.5 },
  { name: 'Jujube (Chinese date)', category: 'Fruit', calories: 79, protein: 1.2, carbs: 20, fat: 0.2, fiber: 4.5 },
  { name: 'Juneberry', category: 'Fruit', calories: 55, protein: 0.8, carbs: 13, fat: 0.4, fiber: 3 },
  { name: 'Langsat', category: 'Fruit', calories: 60, protein: 0.5, carbs: 15, fat: 0.2, fiber: 2 },
  { name: 'Loganberries', category: 'Fruit', calories: 55, protein: 1.4, carbs: 13, fat: 0.3, fiber: 5.5 },
  { name: 'Loquat', category: 'Fruit', calories: 47, protein: 0.4, carbs: 12, fat: 0.2, fiber: 1.7 },
  { name: 'Lucuma (powder)', category: 'Fruit', calories: 335, protein: 2.5, carbs: 80, fat: 1, fiber: 4 },
  { name: 'Mamey Sapote', category: 'Fruit', calories: 124, protein: 1.5, carbs: 26, fat: 2, fiber: 5 },
  { name: 'Marionberries', category: 'Fruit', calories: 50, protein: 1.4, carbs: 12, fat: 0.5, fiber: 5 },
  { name: 'Miracle Fruit', category: 'Fruit', calories: 30, protein: 0.4, carbs: 7, fat: 0.3, fiber: 1.5 },
  { name: 'Monstera Deliciosa', category: 'Fruit', calories: 74, protein: 1.2, carbs: 18, fat: 0.5, fiber: 3 },
  { name: 'Mountain Apple', category: 'Fruit', calories: 56, protein: 0.6, carbs: 14, fat: 0.2, fiber: 2 },
  { name: 'Nance', category: 'Fruit', calories: 82, protein: 0.6, carbs: 17, fat: 1.5, fiber: 5 },
  { name: 'Noni Fruit', category: 'Fruit', calories: 45, protein: 0.5, carbs: 10, fat: 0.2, fiber: 2 },
  { name: 'Olive (fresh, raw)', category: 'Fruit', calories: 115, protein: 0.8, carbs: 6, fat: 11, fiber: 3 },
  { name: 'Peach (dried)', category: 'Fruit', calories: 239, protein: 3.6, carbs: 61, fat: 0.8, fiber: 8 },
  { name: 'Pepino Melon', category: 'Fruit', calories: 30, protein: 0.6, carbs: 7, fat: 0.1, fiber: 1 },
  { name: 'Salak (snake fruit)', category: 'Fruit', calories: 82, protein: 0.4, carbs: 20, fat: 0.2, fiber: 3 },
  { name: 'Santol', category: 'Fruit', calories: 75, protein: 0.5, carbs: 18, fat: 0.3, fiber: 3 },
  { name: 'Sugar Apple (sweetsop)', category: 'Fruit', calories: 94, protein: 1.6, carbs: 24, fat: 0.3, fiber: 4 },
  { name: 'Surinam Cherry', category: 'Fruit', calories: 33, protein: 0.5, carbs: 8, fat: 0.2, fiber: 1.5 },
  { name: 'Tayberries', category: 'Fruit', calories: 45, protein: 1.2, carbs: 10, fat: 0.4, fiber: 4 },
  { name: 'White Mulberry', category: 'Fruit', calories: 43, protein: 1.4, carbs: 10, fat: 0.4, fiber: 1.7 },
  { name: 'Wild Blueberry', category: 'Fruit', calories: 48, protein: 0.6, carbs: 12, fat: 0.3, fiber: 3 },
  { name: 'Wineberry', category: 'Fruit', calories: 50, protein: 1, carbs: 12, fat: 0.5, fiber: 4 },
  { name: 'Yumberry (yangmei)', category: 'Fruit', calories: 45, protein: 0.6, carbs: 11, fat: 0.2, fiber: 2 },
  { name: 'Babaco', category: 'Fruit', calories: 25, protein: 0.6, carbs: 5, fat: 0.1, fiber: 1.5 },
  { name: 'Rollinia', category: 'Fruit', calories: 70, protein: 1, carbs: 17, fat: 0.3, fiber: 3 },
  { name: 'Elephant Apple', category: 'Fruit', calories: 42, protein: 0.7, carbs: 10, fat: 0.2, fiber: 2 },
  { name: 'Burdekin Plum', category: 'Fruit', calories: 60, protein: 0.5, carbs: 15, fat: 0.1, fiber: 3 },
  { name: 'Cupuacu', category: 'Fruit', calories: 65, protein: 1.2, carbs: 12, fat: 2, fiber: 3 },
  { name: 'Pulasan', category: 'Fruit', calories: 65, protein: 0.8, carbs: 16, fat: 0.2, fiber: 1 },

  // --- LEGUMES (40 new items) ---
  { name: 'Anasazi Beans (cooked)', category: 'Legumes', calories: 132, protein: 8, carbs: 24, fat: 0.5, fiber: 7 },
  { name: 'Appaloosa Beans (cooked)', category: 'Legumes', calories: 132, protein: 8, carbs: 24, fat: 0.5, fiber: 7 },
  { name: 'Borlotti Beans (cooked)', category: 'Legumes', calories: 136, protein: 9, carbs: 24, fat: 0.5, fiber: 6 },
  { name: 'Butter Beans (cooked)', category: 'Legumes', calories: 115, protein: 7, carbs: 21, fat: 0.4, fiber: 7 },
  { name: 'Calypso Beans (cooked)', category: 'Legumes', calories: 132, protein: 8, carbs: 24, fat: 0.5, fiber: 7 },
  { name: 'Chickpeas (canned)', category: 'Legumes', calories: 139, protein: 7, carbs: 22, fat: 2.5, fiber: 6 },
  { name: 'Chickpeas (roasted)', category: 'Legumes', calories: 378, protein: 16, carbs: 52, fat: 13, fiber: 12 },
  { name: 'Chinese Long Beans (cooked)', category: 'Legumes', calories: 47, protein: 2.8, carbs: 9, fat: 0.4, fiber: 2 },
  { name: 'Fava Beans (fresh, cooked)', category: 'Legumes', calories: 88, protein: 8, carbs: 12, fat: 0.4, fiber: 5 },
  { name: 'Green Beans (canned)', category: 'Legumes', calories: 20, protein: 1.2, carbs: 4, fat: 0.1, fiber: 1.5 },
  { name: 'Kidney Beans (canned)', category: 'Legumes', calories: 127, protein: 8, carbs: 22, fat: 0.5, fiber: 6 },
  { name: 'Lablab Beans (cooked)', category: 'Legumes', calories: 118, protein: 8, carbs: 21, fat: 0.4, fiber: 6 },
  { name: 'Lentils (canned)', category: 'Legumes', calories: 114, protein: 9, carbs: 19, fat: 0.4, fiber: 5 },
  { name: 'Lentils (French green, cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
  { name: 'Lentils (yellow, cooked)', category: 'Legumes', calories: 106, protein: 9, carbs: 18, fat: 0.4, fiber: 5 },
  { name: 'Marrow Beans (cooked)', category: 'Legumes', calories: 140, protein: 8, carbs: 25, fat: 0.5, fiber: 6 },
  { name: 'Moth Beans (cooked)', category: 'Legumes', calories: 117, protein: 7, carbs: 21, fat: 0.4, fiber: 6 },
  { name: 'Mung Beans (sprouted)', category: 'Legumes', calories: 30, protein: 3, carbs: 6, fat: 0.2, fiber: 1.9 },
  { name: 'Peanuts (boiled)', category: 'Legumes', calories: 200, protein: 13, carbs: 15, fat: 13, fiber: 5 },
  { name: 'Peas (canned)', category: 'Legumes', calories: 69, protein: 4.5, carbs: 12, fat: 0.4, fiber: 4 },
  { name: 'Pigeon Peas (canned)', category: 'Legumes', calories: 120, protein: 6, carbs: 22, fat: 0.4, fiber: 5 },
  { name: 'Pinto Beans (canned)', category: 'Legumes', calories: 140, protein: 8, carbs: 25, fat: 0.5, fiber: 6 },
  { name: 'Refried Beans (canned)', category: 'Legumes', calories: 120, protein: 6, carbs: 18, fat: 2, fiber: 5 },
  { name: 'Rice Beans (cooked)', category: 'Legumes', calories: 130, protein: 7, carbs: 24, fat: 0.4, fiber: 6 },
  { name: 'Runner Beans (cooked)', category: 'Legumes', calories: 30, protein: 2, carbs: 6, fat: 0.2, fiber: 2.5 },
  { name: 'Soybean Sprouts', category: 'Legumes', calories: 42, protein: 5, carbs: 5, fat: 2, fiber: 1.5 },
  { name: 'Tofu (silken)', category: 'Legumes', calories: 55, protein: 5, carbs: 3, fat: 3, fiber: 0.2 },
  { name: 'Tofu (extra firm)', category: 'Legumes', calories: 80, protein: 9, carbs: 2, fat: 5, fiber: 0.3 },
  { name: 'Tofu (smoked)', category: 'Legumes', calories: 120, protein: 14, carbs: 3, fat: 6, fiber: 0.5 },
  { name: 'Velvet Beans (cooked)', category: 'Legumes', calories: 130, protein: 7, carbs: 24, fat: 0.5, fiber: 6 },
  { name: 'Winged Beans (cooked)', category: 'Legumes', calories: 85, protein: 7, carbs: 10, fat: 2.5, fiber: 4 },
  { name: 'Yardlong Beans (cooked)', category: 'Legumes', calories: 47, protein: 2.8, carbs: 9, fat: 0.4, fiber: 2 },
  { name: 'Hominy (canned)', category: 'Legumes', calories: 72, protein: 1.5, carbs: 16, fat: 1, fiber: 2 },
  { name: 'Tempeh (smoked)', category: 'Legumes', calories: 200, protein: 20, carbs: 9, fat: 11, fiber: 1 },
  { name: 'Tofu Skin (yuba)', category: 'Legumes', calories: 300, protein: 27, carbs: 10, fat: 16, fiber: 1 },
  { name: 'Fermented Black Beans', category: 'Legumes', calories: 160, protein: 11, carbs: 26, fat: 1, fiber: 7 },
  { name: 'Chickpea Flour (besan, raw)', category: 'Legumes', calories: 387, protein: 22, carbs: 58, fat: 7, fiber: 11 },
  { name: 'Green Peas (frozen)', category: 'Legumes', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.7 },
  { name: 'Snow Peas (fresh)', category: 'Legumes', calories: 42, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { name: 'Sugar Snap Peas', category: 'Legumes', calories: 42, protein: 2.8, carbs: 8, fat: 0.2, fiber: 2.6 },

  // --- NUTS (35 new items) ---
  { name: 'Acorns (dried)', category: 'Nuts', calories: 387, protein: 6, carbs: 40, fat: 24, fiber: 0 },
  { name: 'Beechnuts', category: 'Nuts', calories: 576, protein: 6, carbs: 33, fat: 50, fiber: 13 },
  { name: 'Breadnut', category: 'Nuts', calories: 367, protein: 8, carbs: 40, fat: 22, fiber: 11 },
  { name: 'Bunya Nuts', category: 'Nuts', calories: 500, protein: 15, carbs: 20, fat: 45, fiber: 6 },
  { name: 'Candlenuts', category: 'Nuts', calories: 640, protein: 12, carbs: 10, fat: 62, fiber: 5 },
  { name: 'Chestnuts (raw)', category: 'Nuts', calories: 213, protein: 2.4, carbs: 46, fat: 1.3, fiber: 5 },
  { name: 'Chestnuts (canned)', category: 'Nuts', calories: 130, protein: 1.5, carbs: 30, fat: 1, fiber: 3 },
  { name: 'Coconut Milk (light)', category: 'Nuts', calories: 140, protein: 1, carbs: 3, fat: 14, fiber: 0 },
  { name: 'Ginkgo Nuts', category: 'Nuts', calories: 182, protein: 4, carbs: 38, fat: 2, fiber: 1.5 },
  { name: 'Hazelnut Butter', category: 'Nuts', calories: 630, protein: 15, carbs: 18, fat: 60, fiber: 10 },
  { name: 'Hickory Nuts', category: 'Nuts', calories: 657, protein: 13, carbs: 13, fat: 67, fiber: 7 },
  { name: 'Kola Nuts', category: 'Nuts', calories: 250, protein: 6, carbs: 50, fat: 3, fiber: 10 },
  { name: 'Macadamia Butter', category: 'Nuts', calories: 700, protein: 7, carbs: 12, fat: 74, fiber: 8 },
  { name: 'Marula Nuts', category: 'Nuts', calories: 650, protein: 16, carbs: 12, fat: 64, fiber: 8 },
  { name: 'Mongongo Nuts', category: 'Nuts', calories: 640, protein: 18, carbs: 10, fat: 62, fiber: 5 },
  { name: 'Palm Nuts', category: 'Nuts', calories: 540, protein: 8, carbs: 20, fat: 52, fiber: 8 },
  { name: 'Peanut Flour', category: 'Nuts', calories: 428, protein: 38, carbs: 30, fat: 16, fiber: 8 },
  { name: 'Pecan Butter', category: 'Nuts', calories: 690, protein: 9, carbs: 14, fat: 71, fiber: 10 },
  { name: 'Pili Nuts', category: 'Nuts', calories: 720, protein: 11, carbs: 4, fat: 74, fiber: 8 },
  { name: 'Pistachio Butter', category: 'Nuts', calories: 560, protein: 20, carbs: 28, fat: 46, fiber: 10 },
  { name: 'Sacha Inchi Seeds', category: 'Nuts', calories: 550, protein: 27, carbs: 14, fat: 44, fiber: 15 },
  { name: 'Sunflower Seed Butter', category: 'Nuts', calories: 600, protein: 18, carbs: 22, fat: 53, fiber: 9 },
  { name: 'Walnut Butter', category: 'Nuts', calories: 650, protein: 15, carbs: 14, fat: 64, fiber: 7 },
  { name: 'Watermelon Seeds (roasted)', category: 'Nuts', calories: 557, protein: 28, carbs: 15, fat: 47, fiber: 5 },
  { name: 'White Sesame Seeds', category: 'Nuts', calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },
  { name: 'Black Sesame Seeds', category: 'Nuts', calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },
  { name: 'Nigella Seeds (black cumin)', category: 'Nuts', calories: 345, protein: 20, carbs: 15, fat: 25, fiber: 20 },
  { name: 'Fenugreek Seeds', category: 'Nuts', calories: 323, protein: 23, carbs: 58, fat: 6.5, fiber: 25 },
  { name: 'Hemp Protein Powder', category: 'Nuts', calories: 440, protein: 50, carbs: 10, fat: 18, fiber: 6 },
  { name: 'Pumpkin Seed Protein', category: 'Nuts', calories: 420, protein: 55, carbs: 8, fat: 15, fiber: 5 },
  { name: 'Sunflower Seed Protein', category: 'Nuts', calories: 400, protein: 50, carbs: 12, fat: 12, fiber: 8 },
  { name: 'Walnut Oil (cold pressed)', category: 'Nuts', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Butternut Squash Seeds', category: 'Nuts', calories: 520, protein: 28, carbs: 15, fat: 43, fiber: 5 },
  { name: 'Chia Seed Gel (prepared)', category: 'Nuts', calories: 35, protein: 1.2, carbs: 4, fat: 2, fiber: 3.5 },
  { name: 'Flaxseed Meal (ground)', category: 'Nuts', calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },

  // --- FATS (35 new items) ---
  { name: 'Apricot Kernel Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Black Seed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Camelina Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Cod Liver Oil', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Corn Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Cottonseed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Evening Primrose Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Hazelnut Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Hemp Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Macadamia Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'MCT Oil', category: 'Fats', calories: 860, protein: 0, carbs: 0, fat: 100 },
  { name: 'Palm Kernel Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Pistachio Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Pumpkin Seed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Red Palm Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Sacha Inchi Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Sesame Oil (light)', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Shea Butter', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Tea Seed Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Truffle Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Wheat Germ Oil', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Avocado Mayonnaise', category: 'Fats', calories: 700, protein: 1, carbs: 1, fat: 78 },
  { name: 'Vegan Butter', category: 'Fats', calories: 700, protein: 0, carbs: 0, fat: 78 },
  { name: 'Margarine', category: 'Fats', calories: 717, protein: 0, carbs: 0, fat: 81 },
  { name: 'Light Butter', category: 'Fats', calories: 500, protein: 1, carbs: 0, fat: 55 },
  { name: 'Ghee (clarified butter)', category: 'Fats', calories: 900, protein: 0, carbs: 0, fat: 100 },
  { name: 'Schmaltz', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Tallow (beef)', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Tallow (mutton)', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Fish Oil (salmon)', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Krill Oil', category: 'Fats', calories: 902, protein: 0, carbs: 0, fat: 100 },
  { name: 'Avocado Oil (extra virgin)', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Olive Oil (extra virgin)', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Olive Oil (light)', category: 'Fats', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Coconut Oil (refined)', category: 'Fats', calories: 862, protein: 0, carbs: 0, fat: 100 },

  // --- CONDIMENTS (55 new items) ---
  { name: 'Aji Amarillo Paste', category: 'Condiments', calories: 60, protein: 2, carbs: 10, fat: 1 },
  { name: 'Aji Verde (green sauce)', category: 'Condiments', calories: 120, protein: 1, carbs: 5, fat: 11 },
  { name: 'Alfredo Sauce', category: 'Condiments', calories: 180, protein: 5, carbs: 4, fat: 16 },
  { name: 'Balsamic Glaze', category: 'Condiments', calories: 200, protein: 0.5, carbs: 48, fat: 0 },
  { name: 'Bearnaise Sauce', category: 'Condiments', calories: 350, protein: 2, carbs: 2, fat: 37 },
  { name: 'Bechamel Sauce', category: 'Condiments', calories: 140, protein: 4, carbs: 11, fat: 9 },
  { name: 'Black Bean Sauce', category: 'Condiments', calories: 120, protein: 4, carbs: 18, fat: 3 },
  { name: 'Bulgogi Sauce', category: 'Condiments', calories: 150, protein: 2, carbs: 32, fat: 1 },
  { name: 'Caper Berries', category: 'Condiments', calories: 15, protein: 1, carbs: 3, fat: 0.4 },
  { name: 'Capers', category: 'Condiments', calories: 23, protein: 2.4, carbs: 4, fat: 0.9, fiber: 3 },
  { name: 'Carbonara Sauce', category: 'Condiments', calories: 280, protein: 8, carbs: 4, fat: 26 },
  { name: 'Carrot Ginger Dressing', category: 'Condiments', calories: 90, protein: 0.5, carbs: 12, fat: 5 },
  { name: 'Cheddar Cheese Sauce', category: 'Condiments', calories: 200, protein: 10, carbs: 6, fat: 15 },
  { name: 'Cherry Preserves', category: 'Condiments', calories: 250, protein: 0.5, carbs: 65, fat: 0 },
  { name: 'Chili Oil', category: 'Condiments', calories: 500, protein: 0, carbs: 0, fat: 55 },
  { name: 'Chili Paste (sambal)', category: 'Condiments', calories: 80, protein: 2, carbs: 12, fat: 3 },
  { name: 'Chimichurri (red)', category: 'Condiments', calories: 180, protein: 1, carbs: 5, fat: 18 },
  { name: 'Cranberry Sauce (whole berry)', category: 'Condiments', calories: 160, protein: 0.5, carbs: 40, fat: 0.1 },
  { name: 'Crema (Mexican sour cream)', category: 'Condiments', calories: 220, protein: 2, carbs: 4, fat: 22 },
  { name: 'Demi-Glace', category: 'Condiments', calories: 30, protein: 3, carbs: 3, fat: 0.5 },
  { name: 'Dijon Mustard', category: 'Condiments', calories: 70, protein: 4, carbs: 6, fat: 3 },
  { name: 'Dill Pickle Relish', category: 'Condiments', calories: 15, protein: 0.5, carbs: 4, fat: 0.1 },
  { name: 'Enchilada Sauce', category: 'Condiments', calories: 30, protein: 1, carbs: 4, fat: 1.5 },
  { name: 'Furikake', category: 'Condiments', calories: 350, protein: 15, carbs: 30, fat: 20, fiber: 5 },
  { name: 'Garlic Aioli', category: 'Condiments', calories: 500, protein: 1, carbs: 2, fat: 54 },
  { name: 'Garlic Butter', category: 'Condiments', calories: 680, protein: 1, carbs: 2, fat: 74 },
  { name: 'Green Goddess Dressing', category: 'Condiments', calories: 200, protein: 1, carbs: 4, fat: 20 },
  { name: 'Honey Mustard', category: 'Condiments', calories: 180, protein: 1, carbs: 30, fat: 6 },
  { name: 'Horseradish (prepared)', category: 'Condiments', calories: 48, protein: 1.2, carbs: 11, fat: 0.7, fiber: 3 },
  { name: 'Jalapeno Slices (pickled)', category: 'Condiments', calories: 15, protein: 0.5, carbs: 3, fat: 0.2 },
  { name: 'Japanese BBQ Sauce', category: 'Condiments', calories: 120, protein: 2, carbs: 24, fat: 1 },
  { name: 'Lemon Curd', category: 'Condiments', calories: 280, protein: 2, carbs: 50, fat: 9 },
  { name: 'Mango Salsa', category: 'Condiments', calories: 45, protein: 0.5, carbs: 10, fat: 0.2, fiber: 1 },
  { name: 'Marinara Sauce', category: 'Condiments', calories: 42, protein: 1.5, carbs: 7, fat: 0.5, fiber: 2 },
  { name: 'Mushroom Sauce', category: 'Condiments', calories: 60, protein: 2, carbs: 6, fat: 3 },
  { name: 'Nam Prik Pao (Thai chili paste)', category: 'Condiments', calories: 200, protein: 3, carbs: 20, fat: 13 },
  { name: 'Peanut Sauce', category: 'Condiments', calories: 200, protein: 8, carbs: 14, fat: 14 },
  { name: 'Pickled Ginger (gari)', category: 'Condiments', calories: 20, protein: 0.2, carbs: 5, fat: 0 },
  { name: 'Ranch Dressing', category: 'Condiments', calories: 450, protein: 2, carbs: 4, fat: 48 },
  { name: 'Sesame Dressing', category: 'Condiments', calories: 350, protein: 3, carbs: 10, fat: 35 },
  { name: 'Sichuan Chili Oil', category: 'Condiments', calories: 500, protein: 1, carbs: 2, fat: 54 },
  { name: 'Soy Sauce (dark)', category: 'Condiments', calories: 53, protein: 8, carbs: 5, fat: 0 },
  { name: 'Soy Sauce (light)', category: 'Condiments', calories: 50, protein: 7, carbs: 4, fat: 0 },
  { name: 'Soy Sauce (tamari)', category: 'Condiments', calories: 60, protein: 8, carbs: 5, fat: 0 },
  { name: 'Spicy Mayo', category: 'Condiments', calories: 600, protein: 1, carbs: 2, fat: 65 },
  { name: 'Strawberry Jam', category: 'Condiments', calories: 250, protein: 0.3, carbs: 65, fat: 0 },
  { name: 'Togarashi (Japanese 7-spice)', category: 'Condiments', calories: 300, protein: 12, carbs: 50, fat: 12, fiber: 20 },
  { name: 'Truffle Aioli', category: 'Condiments', calories: 500, protein: 1, carbs: 2, fat: 54 },
  { name: 'Vegemite', category: 'Condiments', calories: 180, protein: 16, carbs: 21, fat: 1, fiber: 7 },
  { name: 'Xanthan Gum', category: 'Condiments', calories: 320, protein: 0, carbs: 78, fat: 0, fiber: 75 },
  { name: 'Yeast Extract (marmite)', category: 'Condiments', calories: 180, protein: 20, carbs: 16, fat: 1, fiber: 6 },
  { name: 'Yuzu Ponzu', category: 'Condiments', calories: 60, protein: 1, carbs: 12, fat: 0 },
  { name: 'Red Wine Vinegar', category: 'Condiments', calories: 14, protein: 0, carbs: 2, fat: 0 },
  { name: 'White Wine Vinegar', category: 'Condiments', calories: 10, protein: 0, carbs: 1, fat: 0 },
  { name: 'Balsamic Vinegar (aged)', category: 'Condiments', calories: 88, protein: 0.5, carbs: 17, fat: 0 },

  // --- SNACKS (65 new items) ---
  { name: 'Almond Flour Crackers', category: 'Snacks', calories: 500, protein: 18, carbs: 20, fat: 40, fiber: 10 },
  { name: 'Animal Crackers', category: 'Snacks', calories: 420, protein: 6, carbs: 76, fat: 10, fiber: 2 },
  { name: 'Anzac Biscuit', category: 'Snacks', calories: 400, protein: 5, carbs: 55, fat: 18, fiber: 3 },
  { name: 'Apple Chips (dried)', category: 'Snacks', calories: 350, protein: 1, carbs: 90, fat: 0.5, fiber: 8 },
  { name: 'Bagel Chips', category: 'Snacks', calories: 450, protein: 10, carbs: 68, fat: 16, fiber: 4 },
  { name: 'Beanitos (bean chips)', category: 'Snacks', calories: 420, protein: 12, carbs: 54, fat: 18, fiber: 12 },
  { name: 'Biscotti (almond)', category: 'Snacks', calories: 390, protein: 8, carbs: 70, fat: 9, fiber: 3 },
  { name: 'Breadstick (grissini)', category: 'Snacks', calories: 380, protein: 10, carbs: 72, fat: 5, fiber: 3 },
  { name: 'Butterfinger', category: 'Snacks', calories: 470, protein: 8, carbs: 65, fat: 20, fiber: 2 },
  { name: 'Candy Corn', category: 'Snacks', calories: 375, protein: 0, carbs: 93, fat: 0 },
  { name: 'Caramel Popcorn', category: 'Snacks', calories: 430, protein: 4, carbs: 75, fat: 14, fiber: 4 },
  { name: 'Carrot Cake', category: 'Snacks', calories: 340, protein: 4, carbs: 46, fat: 17, fiber: 2 },
  { name: 'Cheese Puffs', category: 'Snacks', calories: 550, protein: 7, carbs: 53, fat: 35, fiber: 2 },
  { name: 'Chocolate (milk)', category: 'Snacks', calories: 535, protein: 8, carbs: 59, fat: 30, fiber: 3 },
  { name: 'Chocolate (white)', category: 'Snacks', calories: 558, protein: 6, carbs: 56, fat: 34 },
  { name: 'Churro', category: 'Snacks', calories: 350, protein: 5, carbs: 42, fat: 18 },
  { name: 'Coconut Macaroon', category: 'Snacks', calories: 380, protein: 3, carbs: 52, fat: 20, fiber: 5 },
  { name: 'Croutons', category: 'Snacks', calories: 430, protein: 9, carbs: 60, fat: 18, fiber: 4 },
  { name: 'Doughnut (glazed)', category: 'Snacks', calories: 390, protein: 5, carbs: 46, fat: 22 },
  { name: 'Doughnut (jelly-filled)', category: 'Snacks', calories: 360, protein: 5, carbs: 45, fat: 19 },
  { name: 'Falafel', category: 'Snacks', calories: 275, protein: 10, carbs: 28, fat: 14, fiber: 4 },
  { name: 'Fig Newton', category: 'Snacks', calories: 350, protein: 4, carbs: 72, fat: 6, fiber: 4 },
  { name: 'Fruit Cake', category: 'Snacks', calories: 320, protein: 4, carbs: 60, fat: 8, fiber: 4 },
  { name: 'Funnel Cake', category: 'Snacks', calories: 350, protein: 5, carbs: 40, fat: 20 },
  { name: 'Gingerbread Cookie', category: 'Snacks', calories: 360, protein: 5, carbs: 60, fat: 12, fiber: 2 },
  { name: 'Granola (low sugar)', category: 'Snacks', calories: 420, protein: 12, carbs: 50, fat: 18, fiber: 8 },
  { name: 'Granola (clustered)', category: 'Snacks', calories: 450, protein: 10, carbs: 55, fat: 22, fiber: 6 },
  { name: 'Gummy Bears', category: 'Snacks', calories: 330, protein: 5, carbs: 77, fat: 0 },
  { name: 'Gummy Worms', category: 'Snacks', calories: 330, protein: 5, carbs: 77, fat: 0 },
  { name: 'Honeycomb', category: 'Snacks', calories: 300, protein: 0.5, carbs: 82, fat: 0 },
  { name: 'Ice Cream (chocolate)', category: 'Snacks', calories: 216, protein: 4, carbs: 28, fat: 11 },
  { name: 'Ice Cream (strawberry)', category: 'Snacks', calories: 198, protein: 4, carbs: 25, fat: 10 },
  { name: 'Ladyfinger (savoiardi)', category: 'Snacks', calories: 360, protein: 8, carbs: 72, fat: 5 },
  { name: 'Lava Cake', category: 'Snacks', calories: 380, protein: 5, carbs: 48, fat: 20 },
  { name: 'Lemon Bar', category: 'Snacks', calories: 350, protein: 4, carbs: 52, fat: 15, fiber: 2 },
  { name: 'Mango Sticky Rice', category: 'Snacks', calories: 200, protein: 3, carbs: 40, fat: 4 },
  { name: 'Matcha Ice Cream', category: 'Snacks', calories: 200, protein: 4, carbs: 22, fat: 11 },
  { name: 'Mooncake (lotus seed)', category: 'Snacks', calories: 380, protein: 6, carbs: 55, fat: 15 },
  { name: 'Mozzarella Sticks (breaded)', category: 'Snacks', calories: 280, protein: 14, carbs: 20, fat: 17 },
  { name: 'Nougat', category: 'Snacks', calories: 400, protein: 5, carbs: 65, fat: 15 },
  { name: 'Onion Rings (breaded)', category: 'Snacks', calories: 320, protein: 5, carbs: 35, fat: 18, fiber: 2 },
  { name: 'Oreo Cookie', category: 'Snacks', calories: 478, protein: 5, carbs: 71, fat: 21, fiber: 3 },
  { name: 'Palmiers (elephant ears)', category: 'Snacks', calories: 500, protein: 5, carbs: 52, fat: 30 },
  { name: 'Pani Puri (fried shell)', category: 'Snacks', calories: 300, protein: 5, carbs: 40, fat: 14 },
  { name: 'Poffertjes (mini pancakes)', category: 'Snacks', calories: 240, protein: 6, carbs: 32, fat: 10 },
  { name: 'Pork Rinds (chicharrones)', category: 'Snacks', calories: 545, protein: 48, carbs: 0, fat: 38 },
  { name: 'Pretzel (soft)', category: 'Snacks', calories: 338, protein: 10, carbs: 69, fat: 3, fiber: 3 },
  { name: 'Pudding (rice)', category: 'Snacks', calories: 130, protein: 3, carbs: 22, fat: 3 },
  { name: 'Pudding (tapioca)', category: 'Snacks', calories: 120, protein: 2, carbs: 22, fat: 3 },
  { name: 'Samosa (baked)', category: 'Snacks', calories: 220, protein: 5, carbs: 28, fat: 10, fiber: 3 },
  { name: 'Sesame Snap', category: 'Snacks', calories: 470, protein: 10, carbs: 38, fat: 32, fiber: 6 },
  { name: 'Shortbread Cookie', category: 'Snacks', calories: 480, protein: 5, carbs: 60, fat: 26 },
  { name: 'Snickerdoodle', category: 'Snacks', calories: 420, protein: 5, carbs: 65, fat: 16 },
  { name: 'Soy Nuts (roasted)', category: 'Snacks', calories: 450, protein: 40, carbs: 28, fat: 22, fiber: 10 },
  { name: 'Strudel (apple)', category: 'Snacks', calories: 220, protein: 3, carbs: 32, fat: 9 },
  { name: 'Sugar Cookie', category: 'Snacks', calories: 460, protein: 5, carbs: 65, fat: 20 },
  { name: 'Sweet Potato Fries (baked)', category: 'Snacks', calories: 150, protein: 2, carbs: 24, fat: 5, fiber: 4 },
  { name: 'Taco Shell (hard)', category: 'Snacks', calories: 480, protein: 6, carbs: 62, fat: 24, fiber: 5 },
  { name: 'Tofu Puffs', category: 'Snacks', calories: 200, protein: 17, carbs: 5, fat: 13, fiber: 2 },
  { name: 'Turkish Delight', category: 'Snacks', calories: 310, protein: 1, carbs: 78, fat: 0 },
  { name: 'Vanilla Wafers', category: 'Snacks', calories: 480, protein: 4, carbs: 70, fat: 21, fiber: 1 },
  { name: 'Wasabi Peas', category: 'Snacks', calories: 380, protein: 14, carbs: 62, fat: 8, fiber: 5 },
  { name: 'Yogurt Covered Raisins', category: 'Snacks', calories: 380, protein: 4, carbs: 68, fat: 13, fiber: 2 },
  { name: 'Boba Pearls (tapioca, cooked)', category: 'Snacks', calories: 70, protein: 0, carbs: 18, fat: 0 },
  { name: 'Cinnamon Roll (with icing)', category: 'Snacks', calories: 370, protein: 6, carbs: 50, fat: 17 },

  // --- BEVERAGES (55 new items) ---
  { name: 'Agua Fresca (hibiscus)', category: 'Beverages', calories: 25, protein: 0, carbs: 6, fat: 0 },
  { name: 'Agua Fresca (tamarind)', category: 'Beverages', calories: 30, protein: 0, carbs: 8, fat: 0 },
  { name: 'Apple Cider (hot)', category: 'Beverages', calories: 46, protein: 0, carbs: 12, fat: 0 },
  { name: 'Apple Cider Vinegar Drink', category: 'Beverages', calories: 5, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Bubble Tea (milk)', category: 'Beverages', calories: 120, protein: 2, carbs: 20, fat: 3 },
  { name: 'Bubble Tea (fruit)', category: 'Beverages', calories: 90, protein: 0, carbs: 22, fat: 0 },
  { name: 'Butter Coffee', category: 'Beverages', calories: 150, protein: 1, carbs: 0, fat: 16 },
  { name: 'Caramel Frappuccino', category: 'Beverages', calories: 230, protein: 4, carbs: 40, fat: 7 },
  { name: 'Chai (masala, with milk)', category: 'Beverages', calories: 100, protein: 3, carbs: 12, fat: 4 },
  { name: 'Chai Concentrate', category: 'Beverages', calories: 90, protein: 1, carbs: 20, fat: 0 },
  { name: 'Chocolate Milk (whole)', category: 'Beverages', calories: 83, protein: 3.3, carbs: 12, fat: 3.5 },
  { name: 'Chocolate Milk (low-fat)', category: 'Beverages', calories: 67, protein: 3.3, carbs: 12, fat: 1.3 },
  { name: 'Cider (hard)', category: 'Beverages', calories: 56, protein: 0, carbs: 6, fat: 0 },
  { name: 'Coffee (decaf)', category: 'Beverages', calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Coffee with Cream', category: 'Beverages', calories: 30, protein: 1, carbs: 2, fat: 2 },
  { name: 'Coffee Frappe', category: 'Beverages', calories: 150, protein: 3, carbs: 25, fat: 5 },
  { name: 'Cortado', category: 'Beverages', calories: 55, protein: 3.5, carbs: 4, fat: 3 },
  { name: 'Dalgona Coffee', category: 'Beverages', calories: 100, protein: 2, carbs: 18, fat: 3 },
  { name: 'Egg Cream (soda)', category: 'Beverages', calories: 140, protein: 4, carbs: 24, fat: 3 },
  { name: 'Elderflower Cordial', category: 'Beverages', calories: 60, protein: 0, carbs: 15, fat: 0 },
  { name: 'Ginger Beer', category: 'Beverages', calories: 42, protein: 0, carbs: 10, fat: 0 },
  { name: 'Green Smoothie', category: 'Beverages', calories: 90, protein: 2, carbs: 20, fat: 1, fiber: 3 },
  { name: 'Hibiscus Tea (hot)', category: 'Beverages', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Hot Toddy', category: 'Beverages', calories: 100, protein: 0, carbs: 10, fat: 0 },
  { name: 'Iced Matcha Latte', category: 'Beverages', calories: 120, protein: 5, carbs: 16, fat: 5 },
  { name: 'Iced Tea (sweetened)', category: 'Beverages', calories: 40, protein: 0, carbs: 10, fat: 0 },
  { name: 'Iced Tea (unsweetened)', category: 'Beverages', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Iced Tea (lemon)', category: 'Beverages', calories: 25, protein: 0, carbs: 6, fat: 0 },
  { name: 'Jasmine Tea', category: 'Beverages', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Kombucha (ginger)', category: 'Beverages', calories: 30, protein: 0, carbs: 7, fat: 0 },
  { name: 'Lassi (salted)', category: 'Beverages', calories: 70, protein: 3, carbs: 8, fat: 3 },
  { name: 'Licorice Tea', category: 'Beverages', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Mango Lassi', category: 'Beverages', calories: 140, protein: 3, carbs: 24, fat: 4 },
  { name: 'Mate (yerba)', category: 'Beverages', calories: 5, protein: 0.3, carbs: 1, fat: 0 },
  { name: 'Mexican Hot Chocolate', category: 'Beverages', calories: 200, protein: 5, carbs: 26, fat: 9 },
  { name: 'Milk Tea (Hong Kong style)', category: 'Beverages', calories: 80, protein: 2, carbs: 10, fat: 4 },
  { name: 'Mocha Frappuccino', category: 'Beverages', calories: 240, protein: 4, carbs: 40, fat: 8 },
  { name: 'Peppermint Tea', category: 'Beverages', calories: 1, protein: 0, carbs: 0.3, fat: 0 },
  { name: 'Protein Smoothie', category: 'Beverages', calories: 180, protein: 25, carbs: 15, fat: 3 },
  { name: 'Rooibos Tea', category: 'Beverages', calories: 1, protein: 0, carbs: 0.3, fat: 0 },
  { name: 'Root Beer', category: 'Beverages', calories: 40, protein: 0, carbs: 10, fat: 0 },
  { name: 'Soy Latte', category: 'Beverages', calories: 90, protein: 6, carbs: 8, fat: 4 },
  { name: 'Taro Milk Tea', category: 'Beverages', calories: 150, protein: 2, carbs: 28, fat: 4 },
  { name: 'Thai Iced Tea', category: 'Beverages', calories: 120, protein: 2, carbs: 22, fat: 3 },
  { name: 'Turmeric Latte (golden milk)', category: 'Beverages', calories: 100, protein: 2, carbs: 12, fat: 5 },
  { name: 'Vietnamese Coffee', category: 'Beverages', calories: 120, protein: 3, carbs: 18, fat: 5 },
  { name: 'White Coffee', category: 'Beverages', calories: 5, protein: 0.3, carbs: 1, fat: 0 },
  { name: 'Wine (rose)', category: 'Beverages', calories: 82, protein: 0.1, carbs: 2.5, fat: 0 },
  { name: 'Wine (sparkling)', category: 'Beverages', calories: 80, protein: 0.1, carbs: 2, fat: 0 },
  { name: 'Port Wine', category: 'Beverages', calories: 140, protein: 0.1, carbs: 12, fat: 0 },
  { name: 'Sherry (dry)', category: 'Beverages', calories: 70, protein: 0.2, carbs: 2, fat: 0 },
  { name: 'Sherry (cream)', category: 'Beverages', calories: 120, protein: 0.2, carbs: 10, fat: 0 },
  { name: 'Vermouth (dry)', category: 'Beverages', calories: 75, protein: 0.1, carbs: 4, fat: 0 },
  { name: 'Vermouth (sweet)', category: 'Beverages', calories: 110, protein: 0.1, carbs: 10, fat: 0 },
  { name: 'Liqueur (coffee)', category: 'Beverages', calories: 250, protein: 0.1, carbs: 30, fat: 0 },

  // --- HERBS & SPICES (40 new items) ---
  { name: 'Allspice (whole)', category: 'Herbs & Spices', calories: 263, protein: 6, carbs: 56, fat: 9, fiber: 21 },
  { name: 'Anise Seed', category: 'Herbs & Spices', calories: 337, protein: 18, carbs: 50, fat: 16, fiber: 15 },
  { name: 'Annatto (achiote)', category: 'Herbs & Spices', calories: 320, protein: 11, carbs: 56, fat: 17, fiber: 20 },
  { name: 'Bay Leaves', category: 'Herbs & Spices', calories: 313, protein: 7.6, carbs: 75, fat: 8.4, fiber: 26 },
  { name: 'Cajun Seasoning', category: 'Herbs & Spices', calories: 250, protein: 10, carbs: 40, fat: 8, fiber: 15 },
  { name: 'Caraway Seeds', category: 'Herbs & Spices', calories: 333, protein: 20, carbs: 12, fat: 15, fiber: 38 },
  { name: 'Celery Salt', category: 'Herbs & Spices', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Celery Seed', category: 'Herbs & Spices', calories: 392, protein: 18, carbs: 41, fat: 23, fiber: 33 },
  { name: 'Chervil (dried)', category: 'Herbs & Spices', calories: 237, protein: 23, carbs: 50, fat: 4, fiber: 12 },
  { name: 'Chives (dried)', category: 'Herbs & Spices', calories: 326, protein: 16, carbs: 65, fat: 6, fiber: 28 },
  { name: 'Cilantro (dried)', category: 'Herbs & Spices', calories: 279, protein: 21, carbs: 52, fat: 5, fiber: 28 },
  { name: 'Cinnamon Stick', category: 'Herbs & Spices', calories: 247, protein: 4, carbs: 53, fat: 1.3, fiber: 53 },
  { name: 'Coriander Seed', category: 'Herbs & Spices', calories: 298, protein: 12, carbs: 55, fat: 18, fiber: 42 },
  { name: 'Cream of Tartar', category: 'Herbs & Spices', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Cumin Seed (whole)', category: 'Herbs & Spices', calories: 375, protein: 18, carbs: 44, fat: 22, fiber: 11 },
  { name: 'Curry Leaves (fresh)', category: 'Herbs & Spices', calories: 97, protein: 2.5, carbs: 18, fat: 1.3, fiber: 5 },
  { name: 'Dill Seed', category: 'Herbs & Spices', calories: 305, protein: 16, carbs: 55, fat: 15, fiber: 20 },
  { name: 'Fennel Seed', category: 'Herbs & Spices', calories: 345, protein: 16, carbs: 52, fat: 15, fiber: 40 },
  { name: 'Fenugreek (leaves)', category: 'Herbs & Spices', calories: 30, protein: 4, carbs: 2, fat: 0.5, fiber: 2 },
  { name: 'Five-Spice Powder', category: 'Herbs & Spices', calories: 250, protein: 8, carbs: 50, fat: 5, fiber: 20 },
  { name: 'Herbes de Provence', category: 'Herbs & Spices', calories: 230, protein: 8, carbs: 45, fat: 6, fiber: 28 },
  { name: 'Juniper Berries', category: 'Herbs & Spices', calories: 290, protein: 4, carbs: 60, fat: 5, fiber: 25 },
  { name: 'Lemon Balm (dried)', category: 'Herbs & Spices', calories: 240, protein: 12, carbs: 50, fat: 5, fiber: 18 },
  { name: 'Lemongrass (fresh)', category: 'Herbs & Spices', calories: 99, protein: 1.8, carbs: 25, fat: 0.5, fiber: 0 },
  { name: 'Mace (ground)', category: 'Herbs & Spices', calories: 475, protein: 6, carbs: 50, fat: 32, fiber: 18 },
  { name: 'Marjoram (dried)', category: 'Herbs & Spices', calories: 271, protein: 13, carbs: 60, fat: 7, fiber: 40 },
  { name: 'Mint (dried)', category: 'Herbs & Spices', calories: 270, protein: 10, carbs: 52, fat: 6, fiber: 30 },
  { name: 'Mustard Seed (yellow)', category: 'Herbs & Spices', calories: 508, protein: 26, carbs: 28, fat: 36, fiber: 12 },
  { name: 'Mustard Seed (brown)', category: 'Herbs & Spices', calories: 508, protein: 26, carbs: 28, fat: 36, fiber: 12 },
  { name: 'Nutritional Yeast', category: 'Herbs & Spices', calories: 350, protein: 50, carbs: 35, fat: 5, fiber: 14 },
  { name: 'Onion Powder', category: 'Herbs & Spices', calories: 341, protein: 11, carbs: 79, fat: 1, fiber: 7 },
  { name: 'Garlic Powder', category: 'Herbs & Spices', calories: 331, protein: 16, carbs: 73, fat: 0.7, fiber: 8 },
  { name: 'Oregano (dried)', category: 'Herbs & Spices', calories: 265, protein: 9, carbs: 69, fat: 4, fiber: 42 },
  { name: 'Poultry Seasoning', category: 'Herbs & Spices', calories: 250, protein: 8, carbs: 45, fat: 6, fiber: 25 },
  { name: 'Pumpkin Pie Spice', category: 'Herbs & Spices', calories: 300, protein: 6, carbs: 55, fat: 8, fiber: 25 },
  { name: 'Rosemary (dried)', category: 'Herbs & Spices', calories: 331, protein: 5, carbs: 65, fat: 15, fiber: 35 },
  { name: 'Saffron', category: 'Herbs & Spices', calories: 310, protein: 11, carbs: 65, fat: 6, fiber: 4 },
  { name: 'Savory (dried)', category: 'Herbs & Spices', calories: 240, protein: 8, carbs: 45, fat: 4, fiber: 28 },
  { name: 'Tarragon (dried)', category: 'Herbs & Spices', calories: 295, protein: 14, carbs: 50, fat: 6, fiber: 20 },
  { name: 'Turmeric (fresh)', category: 'Herbs & Spices', calories: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2 },

  // --- BAKING (40 new items) ---
  { name: 'Apple Pie Spice', category: 'Baking', calories: 270, protein: 5, carbs: 50, fat: 6, fiber: 22 },
  { name: 'Arrowroot Powder', category: 'Baking', calories: 357, protein: 0.3, carbs: 88, fat: 0, fiber: 3 },
  { name: 'Bakers Chocolate (unsweetened)', category: 'Baking', calories: 500, protein: 12, carbs: 30, fat: 52, fiber: 16 },
  { name: 'Bakers Yeast (compressed)', category: 'Baking', calories: 180, protein: 24, carbs: 20, fat: 3, fiber: 8 },
  { name: 'Baking Chocolate (bittersweet)', category: 'Baking', calories: 500, protein: 8, carbs: 45, fat: 35, fiber: 8 },
  { name: 'Buckwheat Flour', category: 'Baking', calories: 335, protein: 13, carbs: 72, fat: 3, fiber: 10 },
  { name: 'Buttermilk Powder', category: 'Baking', calories: 387, protein: 34, carbs: 49, fat: 5 },
  { name: 'Cake Flour', category: 'Baking', calories: 364, protein: 8, carbs: 79, fat: 0.5 },
  { name: 'Candy Melts (colored)', category: 'Baking', calories: 520, protein: 2, carbs: 65, fat: 28 },
  { name: 'Chocolate Chips (dark)', category: 'Baking', calories: 480, protein: 6, carbs: 58, fat: 30, fiber: 8 },
  { name: 'Chocolate Chips (milk)', category: 'Baking', calories: 500, protein: 6, carbs: 60, fat: 28 },
  { name: 'Chocolate Chips (white)', category: 'Baking', calories: 540, protein: 6, carbs: 60, fat: 32 },
  { name: 'Chocolate Extract', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Coconut Extract', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Coconut Sugar', category: 'Baking', calories: 380, protein: 0, carbs: 100, fat: 0 },
  { name: 'Corn Syrup (dark)', category: 'Baking', calories: 285, protein: 0, carbs: 77, fat: 0 },
  { name: 'Corn Syrup (light)', category: 'Baking', calories: 285, protein: 0, carbs: 77, fat: 0 },
  { name: 'Cornmeal (yellow)', category: 'Baking', calories: 370, protein: 8, carbs: 79, fat: 4, fiber: 7 },
  { name: 'Cornmeal (white)', category: 'Baking', calories: 370, protein: 8, carbs: 79, fat: 4, fiber: 7 },
  { name: 'Cream of Coconut', category: 'Baking', calories: 330, protein: 1, carbs: 58, fat: 12 },
  { name: 'Date Paste', category: 'Baking', calories: 280, protein: 2, carbs: 72, fat: 0.2, fiber: 7 },
  { name: 'Date Sugar', category: 'Baking', calories: 380, protein: 2, carbs: 90, fat: 0.5, fiber: 8 },
  { name: 'Egg Replacer (powder)', category: 'Baking', calories: 300, protein: 2, carbs: 70, fat: 0 },
  { name: 'Essence (almond)', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Essence (lemon)', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Essence (peppermint)', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Essence (rum)', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Food Coloring (liquid)', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Graham Cracker Crust', category: 'Baking', calories: 480, protein: 5, carbs: 70, fat: 20, fiber: 2 },
  { name: 'Guar Gum', category: 'Baking', calories: 200, protein: 5, carbs: 40, fat: 0, fiber: 80 },
  { name: 'Icing (buttercream)', category: 'Baking', calories: 450, protein: 0.5, carbs: 65, fat: 22 },
  { name: 'Icing (royal)', category: 'Baking', calories: 380, protein: 3, carbs: 90, fat: 0 },
  { name: 'Maple Extract', category: 'Baking', calories: 200, protein: 0, carbs: 20, fat: 0 },
  { name: 'Marzipan', category: 'Baking', calories: 450, protein: 5, carbs: 68, fat: 18 },
  { name: 'Meringue Powder', category: 'Baking', calories: 350, protein: 5, carbs: 80, fat: 0 },
  { name: 'Milk Powder (buttermilk)', category: 'Baking', calories: 387, protein: 34, carbs: 49, fat: 5 },
  { name: 'Monk Fruit Sweetener', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Oat Flour', category: 'Baking', calories: 404, protein: 15, carbs: 66, fat: 9, fiber: 10 },
  { name: 'Pastry Flour', category: 'Baking', calories: 360, protein: 9, carbs: 76, fat: 1, fiber: 2 },
  { name: 'Potato Flour', category: 'Baking', calories: 357, protein: 7, carbs: 83, fat: 0.3, fiber: 6 },
  { name: 'Rice Flour (white)', category: 'Baking', calories: 366, protein: 6, carbs: 80, fat: 1.4, fiber: 2 },
  { name: 'Rice Flour (brown)', category: 'Baking', calories: 363, protein: 7, carbs: 76, fat: 3, fiber: 4 },
  { name: 'Rye Flour', category: 'Baking', calories: 325, protein: 9, carbs: 68, fat: 1.5, fiber: 12 },
  { name: 'Self-Rising Flour', category: 'Baking', calories: 357, protein: 10, carbs: 74, fat: 1, fiber: 2 },
  { name: 'Semolina Flour', category: 'Baking', calories: 360, protein: 13, carbs: 73, fat: 1, fiber: 4 },
  { name: 'Soy Flour (full fat)', category: 'Baking', calories: 445, protein: 38, carbs: 33, fat: 20, fiber: 23 },
  { name: 'Sour Candy (citric acid)', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Sourdough Starter (fed)', category: 'Baking', calories: 130, protein: 5, carbs: 25, fat: 0.5, fiber: 1 },
  { name: 'Stevia (powder)', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Sucralose (Splenda)', category: 'Baking', calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Tapioca Flour/Starch', category: 'Baking', calories: 357, protein: 0.2, carbs: 88, fat: 0, fiber: 0 },
  { name: 'Vanilla Bean (whole)', category: 'Baking', calories: 288, protein: 0, carbs: 12, fat: 0 },
  { name: 'Vanilla Sugar', category: 'Baking', calories: 380, protein: 0, carbs: 98, fat: 0 },
  { name: 'Xylitol', category: 'Baking', calories: 240, protein: 0, carbs: 100, fat: 0 },
  { name: 'Erythritol', category: 'Baking', calories: 20, protein: 0, carbs: 100, fat: 0 },
  { name: 'Fondant (rolled)', category: 'Baking', calories: 380, protein: 0, carbs: 95, fat: 0 }
]

interface IngredientRow {
  id: string
  food: FoodItem
  grams: number
}

export function MealForm({ isOpen, onClose, onSave, meal, defaultDate }: MealFormProps) {
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<Meal['mealType']>('breakfast')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
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
    setDate(defaultDate || new Date().toISOString().split('T')[0])
    setErrors({})
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
    return result
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

  // Sync ingredient totals directly into macro fields (no separate "Apply" step)
  useEffect(() => {
    if (ingredients.length > 0) {
      setCalories(String(ingredientTotals.calories))
      setProtein(String(ingredientTotals.protein))
      setCarbs(String(ingredientTotals.carbs))
      setFat(String(ingredientTotals.fat))
      setFiber(String(Math.round(ingredientTotals.fiber * 10) / 10))
    } else {
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      setFiber('')
    }
  }, [ingredientTotals, ingredients.length])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (ingredients.length === 0) {
      newErrors.ingredients = 'Add at least one ingredient from the food list below'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const finalCal = parseFloat(ingredients.length > 0 ? String(ingredientTotals.calories) : calories)
    const finalPro = parseFloat(ingredients.length > 0 ? String(ingredientTotals.protein) : protein)
    const finalCarb = parseFloat(ingredients.length > 0 ? String(ingredientTotals.carbs) : carbs)
    const finalFat = parseFloat(ingredients.length > 0 ? String(ingredientTotals.fat) : fat)
    const finalFib = ingredients.length > 0 ? ingredientTotals.fiber : (fiber ? parseFloat(fiber) : undefined)

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
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Ingredients</p>
          {hasIngredients && (
            <span className="text-[9px] text-gray-500">{ingredients.length} items</span>
          )}
        </div>

        {/* Ingredients error */}
        {errors.ingredients && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">{errors.ingredients}</p>
        )}

        {/* Search & Add */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods..." autoComplete="off"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => { setSelectedCategory(cat); setSearch('') }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all backdrop-blur-sm ${
                selectedCategory === cat
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Portion input (single source of truth, not per-item) */}
        {(search || selectedCategory) && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Portion:</span>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg border border-white/10 px-2.5 py-1.5">
              <input type="number" value={addingGrams} onChange={(e) => setAddingGrams(e.target.value)}
                className="w-14 text-sm py-0.5 bg-transparent text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] text-gray-500">grams</span>
            </div>
          </div>
        )}

        {/* Food list */}
        {search || selectedCategory ? (
          <div className="max-h-44 overflow-y-auto space-y-1">
            {filteredFoods.map(food => (
              <button key={food.name} type="button" onClick={() => addIngredient(food)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-purple-500/[0.06] border border-white/5 hover:border-purple-500/20 transition-all group">
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{food.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{food.calories} kcal · P{food.protein} C{food.carbs} F{food.fat} /100g</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </div>
              </button>
            ))}
            {filteredFoods.length === 0 && (
              <p className="text-[11px] text-gray-500 text-center py-4">No foods found</p>
            )}
          </div>
        ) : hasIngredients ? null : (
          <p className="text-[11px] text-gray-500 text-center py-3">Search or select a category to add ingredients</p>
        )}

        {/* Added ingredients */}
        {hasIngredients && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {ingredients.map(ing => (
              <div key={ing.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.06] transition-all">
                <span className="text-sm font-medium text-white flex-1 truncate">{ing.food.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg border border-white/10 px-2 py-1">
                    <input type="number" value={ing.grams} onChange={(e) => updateGrams(ing.id, e.target.value)}
                      className="w-12 text-[11px] py-0.5 bg-transparent text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[9px] text-gray-500">g</span>
                  </div>
                  <button type="button" onClick={() => removeIngredient(ing.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Macro Fields (auto-filled from ingredients, read-only when ingredients exist) */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Calories" type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} error={errors.calories} disabled />
          <Input label="Protein (g)" type="number" step="0.1" placeholder="g" value={protein} onChange={(e) => setProtein(e.target.value)} error={errors.protein} disabled />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Carbs (g)" type="number" step="0.1" placeholder="g" value={carbs} onChange={(e) => setCarbs(e.target.value)} error={errors.carbs} disabled />
          <Input label="Fat (g)" type="number" step="0.1" placeholder="g" value={fat} onChange={(e) => setFat(e.target.value)} error={errors.fat} disabled />
          <Input label="Fiber (g)" type="number" step="0.1" placeholder="g" value={fiber} onChange={(e) => setFiber(e.target.value)} disabled />
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

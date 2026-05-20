export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'flexibility'
  | 'plyo'
  | 'calisthenics'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'traps'
  | 'lats'
  | 'core'
  | 'full_body'
  | 'hip_flexors'
  | 'rear_delts'

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'resistance_band'
  | 'smith_machine'
  | 'medicine_ball'
  | 'none'

export interface ExerciseDefinition {
  id: string
  name: string
  category: ExerciseCategory
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: EquipmentType[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  tips: string[]
  videoUrl?: string
  imageUrl?: string
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  name: string
  sets: ExerciseSet[]
  notes?: string
}

export interface ExerciseSet {
  reps?: number
  weight?: number
  duration?: number
  distance?: number
  completed?: boolean
}

export interface Workout {
  id: string
  date: string
  name: string
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility'
  exercises: WorkoutExercise[]
  duration: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TemplateExercise {
  exerciseId: string
  name: string
  targetSets: number
  targetReps?: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility'
  exercises: TemplateExercise[]
  createdAt: string
  updatedAt: string
}

export interface BodyMetric {
  id: string
  date: string
  weight?: number
  bodyFat?: number
  measurements: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface Meal {
  id: string
  date: string
  name: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  createdAt: string
  updatedAt: string
}

export interface HydrationEntry {
  id: string
  date: string
  amount: number
  timestamp: string
  createdAt: string
  updatedAt: string
}

export interface SleepEntry {
  id: string
  date: string
  duration: number
  quality: 1 | 2 | 3 | 4 | 5
  bedTime?: string
  wakeTime?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutFilter {
  type?: 'strength' | 'cardio' | 'hiit' | 'flexibility'
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface NutritionSummary {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
  mealCount: number
}

export interface HydrationSummary {
  totalAmount: number
  entryCount: number
}

export interface SleepSummary {
  averageDuration: number
  averageQuality: number
  entryCount: number
}

export interface BodyMetricSummary {
  currentWeight?: number
  weightChange?: number
  currentBodyFat?: number
  measurementCount: number
}

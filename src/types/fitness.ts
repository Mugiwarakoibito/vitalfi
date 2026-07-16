export type ExerciseCategory =
  | 'strength'
  | 'hypertrophy'
  | 'cardio'
  | 'hiit'
  | 'functional'
  | 'mobility'
  | 'flexibility'
  | 'plyo'
  | 'calisthenics'
  | 'endurance'
  | 'speed_agility'
  | 'balance_stability'
  | 'core'
  | 'yoga'
  | 'pilates'
  | 'crossfit'
  | 'martial_arts'
  | 'recovery'
  | 'isometric'
  | 'animal_flow'
  | 'breathwork'

export type TrainingGoal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'strength'
  | 'athletic_performance'
  | 'explosive_power'
  | 'flexibility'
  | 'mobility'
  | 'body_control'
  | 'endurance'
  | 'speed'
  | 'combat_skills'
  | 'longevity'
  | 'recovery'
  | 'posture'
  | 'rehabilitation'
  | 'general_health'
  | 'mental_wellness'
  | 'sports_performance'

export type PeriodizationPhase =
  | 'foundation'
  | 'hypertrophy_base'
  | 'strength'
  | 'power_peak'
  | 'deload_recovery'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'abs' | 'obliques' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'forearms' | 'traps' | 'lats' | 'core'
  | 'full_body' | 'hip_flexors' | 'rear_delts' | 'adductors'
  | 'abductors' | 'neck' | 'hip_rotators' | 'pelvic_floor'
  | 'erector_spinae' | 'multifidus' | 'soleus' | 'gastroc'

export type EquipmentType =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable'
  | 'bodyweight' | 'resistance_band' | 'smith_machine' | 'medicine_ball'
  | 'none' | 'trx' | 'sandbag' | 'sledge' | 'battle_rope'
  | 'jump_rope' | 'box' | 'bosu' | 'foam_roller' | 'yoga_mat'
  | 'pull_up_bar' | 'dip_bars' | 'punching_bag' | 'paddle'
  | 'swim_pool' | 'bike' | 'rower' | 'assault_bike'

export interface TrainingParameters {
  intensityMin: number
  intensityMax: number
  repsMin: number
  repsMax: number
  setsMin: number
  setsMax: number
  restMin: number
  restMax: number
  frequencyPerWeek: number
  primaryGoal: TrainingGoal
  secondaryGoals: TrainingGoal[]
}

export interface ExerciseDefinition {
  id: string
  name: string
  category: ExerciseCategory
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: EquipmentType[]
  difficulty: SkillLevel
  instructions: string[]
  tips: string[]
  parameters?: Partial<TrainingParameters>
  videoUrl?: string
  imageUrl?: string
}

export interface PeriodizationBlock {
  phase: PeriodizationPhase
  weeks: number
  intensity: number
  volume: 'low' | 'moderate' | 'high' | 'very_low'
  focus: string
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  name: string
  sets: ExerciseSet[]
  notes?: string
  rpe?: number
  isSupersetWith?: string
  supersetOrder?: number
}

export interface ExerciseSet {
  reps?: number
  weight?: number
  duration?: number
  distance?: number
  rpe?: number
  completed?: boolean
}

export interface Workout {
  id: string
  date: string
  name: string
  category: ExerciseCategory
  phase?: PeriodizationPhase
  week?: number
  isDeload?: boolean
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
  targetRpe?: number
  restSeconds?: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  category: ExerciseCategory
  trainingGoal?: TrainingGoal
  phase?: PeriodizationPhase
  week?: number
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
  vo2max?: number
  gripStrength?: number
  plank?: number
  verticalJump?: number
  sitAndReach?: number
  notes?: string
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
  drinkType?: 'water' | 'coffee' | 'tea' | 'juice' | 'sports' | 'other'
  thirst?: 'none' | 'slight' | 'thirsty' | 'very'
  exercise?: boolean
  hotWeather?: boolean
  caffeine?: boolean
  withMeal?: boolean
  note?: string
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
  onsetMinutes?: number
  nightWakings?: number
  morningFeel?: 'refreshed' | 'tired' | 'groggy' | 'foggy'
  screenTime?: boolean
  roomTemp?: 'cold' | 'cool' | 'neutral' | 'warm' | 'hot'
  dreamRecall?: boolean
  alcohol?: boolean
  meditation?: boolean
  heavyMeal?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PersonalRecord {
  id: string
  date: string
  exerciseName: string
  exerciseId?: string
  weight: number
  reps: number
  type: 'weight' | 'reps' | 'volume'
  goalWeight?: number
  goalReps?: number
  goalVolume?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutFilter {
  category?: ExerciseCategory
  phase?: PeriodizationPhase
  dateFrom?: string
  dateTo?: string
  search?: string
  goal?: TrainingGoal
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



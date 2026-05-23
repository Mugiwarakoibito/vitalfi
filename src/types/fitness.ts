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

export const CATEGORY_TRAINING_PARAMS: Record<ExerciseCategory, TrainingParameters> = {
  strength: {
    intensityMin: 75, intensityMax: 100, repsMin: 1, repsMax: 6,
    setsMin: 3, setsMax: 6, restMin: 120, restMax: 300,
    frequencyPerWeek: 4, primaryGoal: 'strength', secondaryGoals: ['explosive_power', 'athletic_performance'],
  },
  hypertrophy: {
    intensityMin: 60, intensityMax: 80, repsMin: 6, repsMax: 15,
    setsMin: 3, setsMax: 5, restMin: 60, restMax: 120,
    frequencyPerWeek: 5, primaryGoal: 'muscle_gain', secondaryGoals: ['strength', 'general_health'],
  },
  cardio: {
    intensityMin: 50, intensityMax: 80, repsMin: 0, repsMax: 0,
    setsMin: 1, setsMax: 1, restMin: 0, restMax: 30,
    frequencyPerWeek: 5, primaryGoal: 'endurance', secondaryGoals: ['longevity', 'fat_loss'],
  },
  hiit: {
    intensityMin: 80, intensityMax: 100, repsMin: 0, repsMax: 0,
    setsMin: 4, setsMax: 12, restMin: 10, restMax: 60,
    frequencyPerWeek: 3, primaryGoal: 'fat_loss', secondaryGoals: ['athletic_performance', 'endurance'],
  },
  functional: {
    intensityMin: 60, intensityMax: 85, repsMin: 8, repsMax: 20,
    setsMin: 3, setsMax: 5, restMin: 60, restMax: 120,
    frequencyPerWeek: 4, primaryGoal: 'general_health', secondaryGoals: ['mobility', 'body_control'],
  },
  mobility: {
    intensityMin: 30, intensityMax: 50, repsMin: 8, repsMax: 15,
    setsMin: 2, setsMax: 4, restMin: 30, restMax: 60,
    frequencyPerWeek: 6, primaryGoal: 'mobility', secondaryGoals: ['flexibility', 'posture'],
  },
  flexibility: {
    intensityMin: 20, intensityMax: 40, repsMin: 1, repsMax: 1,
    setsMin: 1, setsMax: 3, restMin: 0, restMax: 0,
    frequencyPerWeek: 7, primaryGoal: 'flexibility', secondaryGoals: ['recovery', 'mobility'],
  },
  plyo: {
    intensityMin: 70, intensityMax: 95, repsMin: 3, repsMax: 8,
    setsMin: 3, setsMax: 5, restMin: 90, restMax: 180,
    frequencyPerWeek: 2, primaryGoal: 'explosive_power', secondaryGoals: ['athletic_performance', 'speed'],
  },
  calisthenics: {
    intensityMin: 60, intensityMax: 90, repsMin: 5, repsMax: 20,
    setsMin: 3, setsMax: 5, restMin: 60, restMax: 180,
    frequencyPerWeek: 4, primaryGoal: 'body_control', secondaryGoals: ['strength', 'muscle_gain'],
  },
  endurance: {
    intensityMin: 50, intensityMax: 80, repsMin: 0, repsMax: 0,
    setsMin: 1, setsMax: 1, restMin: 0, restMax: 0,
    frequencyPerWeek: 5, primaryGoal: 'endurance', secondaryGoals: ['longevity', 'fat_loss'],
  },
  speed_agility: {
    intensityMin: 80, intensityMax: 100, repsMin: 1, repsMax: 1,
    setsMin: 3, setsMax: 6, restMin: 60, restMax: 180,
    frequencyPerWeek: 3, primaryGoal: 'speed', secondaryGoals: ['athletic_performance', 'explosive_power'],
  },
  balance_stability: {
    intensityMin: 30, intensityMax: 60, repsMin: 6, repsMax: 15,
    setsMin: 2, setsMax: 4, restMin: 30, restMax: 60,
    frequencyPerWeek: 3, primaryGoal: 'rehabilitation', secondaryGoals: ['body_control', 'posture'],
  },
  core: {
    intensityMin: 40, intensityMax: 70, repsMin: 10, repsMax: 25,
    setsMin: 3, setsMax: 4, restMin: 30, restMax: 60,
    frequencyPerWeek: 5, primaryGoal: 'posture', secondaryGoals: ['general_health', 'rehabilitation'],
  },
  yoga: {
    intensityMin: 20, intensityMax: 60, repsMin: 1, repsMax: 1,
    setsMin: 1, setsMax: 1, restMin: 0, restMax: 0,
    frequencyPerWeek: 5, primaryGoal: 'mental_wellness', secondaryGoals: ['flexibility', 'mobility'],
  },
  pilates: {
    intensityMin: 40, intensityMax: 65, repsMin: 6, repsMax: 12,
    setsMin: 2, setsMax: 4, restMin: 15, restMax: 30,
    frequencyPerWeek: 4, primaryGoal: 'posture', secondaryGoals: ['rehabilitation', 'body_control'],
  },
  crossfit: {
    intensityMin: 60, intensityMax: 95, repsMin: 1, repsMax: 30,
    setsMin: 1, setsMax: 5, restMin: 0, restMax: 180,
    frequencyPerWeek: 5, primaryGoal: 'general_health', secondaryGoals: ['athletic_performance', 'fat_loss'],
  },
  martial_arts: {
    intensityMin: 60, intensityMax: 95, repsMin: 0, repsMax: 0,
    setsMin: 3, setsMax: 8, restMin: 60, restMax: 180,
    frequencyPerWeek: 5, primaryGoal: 'combat_skills', secondaryGoals: ['athletic_performance', 'fat_loss'],
  },
  recovery: {
    intensityMin: 20, intensityMax: 50, repsMin: 5, repsMax: 15,
    setsMin: 1, setsMax: 3, restMin: 30, restMax: 60,
    frequencyPerWeek: 3, primaryGoal: 'recovery', secondaryGoals: ['flexibility', 'mobility'],
  },
  isometric: {
    intensityMin: 40, intensityMax: 80, repsMin: 1, repsMax: 1,
    setsMin: 2, setsMax: 4, restMin: 30, restMax: 120,
    frequencyPerWeek: 4, primaryGoal: 'strength', secondaryGoals: ['rehabilitation', 'body_control'],
  },
  animal_flow: {
    intensityMin: 40, intensityMax: 70, repsMin: 3, repsMax: 10,
    setsMin: 2, setsMax: 4, restMin: 30, restMax: 60,
    frequencyPerWeek: 3, primaryGoal: 'mobility', secondaryGoals: ['body_control', 'general_health'],
  },
  breathwork: {
    intensityMin: 10, intensityMax: 30, repsMin: 3, repsMax: 10,
    setsMin: 1, setsMax: 3, restMin: 10, restMax: 30,
    frequencyPerWeek: 7, primaryGoal: 'mental_wellness', secondaryGoals: ['recovery', 'general_health'],
  },
}

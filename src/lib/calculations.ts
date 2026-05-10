/**
 * LifeSync - Fitness & Health Calculations
 *
 * All internal calculations use METRIC units.
 * Formulas are documented with source references.
 */

// ============================================================
// TYPES
// ============================================================

/** Supported unit systems for display conversion */
export type UnitSystem = 'metric' | 'imperial';

/** Biological sex for formula differentiation */
export type BiologicalSex = 'male' | 'female';

/** User's primary fitness goal */
export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'endurance';

/** Activity multiplier labels */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** Macronutrient split preset names */
export type MacroSplitPreset = 'balanced' | 'low_carb' | 'high_protein' | 'keto' | 'endurance';

/** Jackson-Pollock skinfold site sets */
export type SkinfoldSiteSet = '3_site' | '7_site';

/** Progressive overload strategy */
export type OverloadStrategy = 'double_progression' | 'linear' | 'undulating';

/** Result of a macronutrient calculation */
export interface MacroSplit {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
  totalCalories: number;
}

/** Full calorie needs result */
export interface CalorieNeedsResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  deficit: number;
  projectedWeeklyChangeKg: number;
  projectedMonthlyChangeKg: number;
  goal: FitnessGoal;
}

/** Protein needs result */
export interface ProteinNeedsResult {
  minGrams: number;
  maxGrams: number;
  recommendedGrams: number;
  minPerKg: number;
  maxPerKg: number;
  caloriesFromProtein: number;
  percentOfCalories: number;
}

/** Body fat result with method info */
export interface BodyFatResult {
  bodyFatPercent: number;
  leanBodyMassKg: number;
  fatMassKg: number;
  method: string;
  classification: BodyFatClassification;
}

/** Classification of body fat level */
export interface BodyFatClassification {
  category: string;
  healthRange: 'essential' | 'athletic' | 'fitness' | 'average' | 'above_average' | 'obese';
  description: string;
}

/** Water intake recommendation */
export interface WaterIntakeResult {
  baseLiters: number;
  adjustedLiters: number;
  adjustedOz: number;
  adjustments: string[];
}

/** Sleep needs recommendation */
export interface SleepNeedsResult {
  minHours: number;
  maxHours: number;
  recommendedHours: number;
  factors: string[];
}

/** Progressive overload calculation */
export interface ProgressiveOverloadResult {
  currentWeight: number;
  currentReps: number;
  nextWeight: number;
  nextReps: number;
  weightIncrement: number;
  repIncrement: number;
  estimated1RM: number;
  nextEstimated1RM: number;
  weekNumber: number;
  strategy: OverloadStrategy;
}

/** Weight projection over time */
export interface WeightProjection {
  weeks: WeightProjectionWeek[];
  estimatedGoalDate: Date | null;
  weeksToGoal: number | null;
  isRealistic: boolean;
  warnings: string[];
}

/** Single week in a weight projection */
export interface WeightProjectionWeek {
  week: number;
  estimatedWeightKg: number;
  cumulativeChangeKg: number;
  weeklyChangeKg: number;
}

/** Unit conversion result */
export interface UnitConversion {
  value: number;
  unit: string;
  system: UnitSystem;
}

// ============================================================
// CONSTANTS
// ============================================================

const PROTEIN_PER_KG: Record<FitnessGoal, { min: number; max: number }> = {
  fat_loss: { min: 1.8, max: 2.4 },
  muscle_gain: { min: 1.6, max: 2.2 },
  maintenance: { min: 1.4, max: 1.8 },
  endurance: { min: 1.4, max: 1.8 },
};

const CALORIE_PER_KG_WEEK = 7700;

const MACRO_PRESETS: Record<MacroSplitPreset, { protein: number; carbs: number; fat: number }> = {
  balanced: { protein: 30, carbs: 40, fat: 30 },
  low_carb: { protein: 35, carbs: 25, fat: 40 },
  high_protein: { protein: 40, carbs: 30, fat: 30 },
  keto: { protein: 25, carbs: 5, fat: 70 },
  endurance: { protein: 25, carbs: 50, fat: 25 },
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_WORKOUT_MAP: Record<ActivityLevel, { min: number; max: number; recommended: number }> = {
  sedentary: { min: 2, max: 3, recommended: 3 },
  light: { min: 3, max: 4, recommended: 3 },
  moderate: { min: 4, max: 5, recommended: 4 },
  active: { min: 5, max: 6, recommended: 5 },
  very_active: { min: 6, max: 7, recommended: 6 },
};

const SLEEP_HOURS: Record<ActivityLevel, { min: number; max: number; recommended: number }> = {
  sedentary: { min: 7, max: 8, recommended: 7.5 },
  light: { min: 7, max: 8.5, recommended: 8 },
  moderate: { min: 7.5, max: 9, recommended: 8 },
  active: { min: 7.5, max: 9, recommended: 8.5 },
  very_active: { min: 8, max: 9.5, recommended: 9 },
};

const BODY_FAT_CATEGORIES_MALE: [number, BodyFatClassification['healthRange'], string][] = [
  [2, 'essential', 'Essential Fat — Minimum for survival'],
  [6, 'athletic', 'Athletic — Elite athletes'],
  [14, 'fitness', 'Fitness — Regular exercisers'],
  [18, 'average', 'Average — General population'],
  [25, 'above_average', 'Above Average — Health risk increasing'],
  [100, 'obese', 'Obese — Significant health risk'],
];

const BODY_FAT_CATEGORIES_FEMALE: [number, BodyFatClassification['healthRange'], string][] = [
  [10, 'essential', 'Essential Fat — Minimum for survival'],
  [14, 'athletic', 'Athletic — Elite athletes'],
  [21, 'fitness', 'Fitness — Regular exercisers'],
  [25, 'average', 'Average — General population'],
  [32, 'above_average', 'Above Average — Health risk increasing'],
  [100, 'obese', 'Obese — Significant health risk'],
];

// ============================================================
// UTILITY HELPERS
// ============================================================

export function round(value: number, decimals: number = 1): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator)) return fallback;
  return numerator / denominator;
}

// ============================================================
// UNIT CONVERSIONS
// ============================================================

export function kgToLbs(kg: number): number {
  return round(kg * 2.20462, 2);
}

export function lbsToKg(lbs: number): number {
  return round(lbs / 2.20462, 2);
}

export function cmToInches(cm: number): number {
  return round(cm / 2.54, 2);
}

export function inchesToCm(inches: number): number {
  return round(inches * 2.54, 2);
}

export function celsiusToFahrenheit(c: number): number {
  return round(c * 9 / 5 + 32, 1);
}

export function litersToOz(liters: number): number {
  return round(liters * 33.814, 1);
}

export function displayWeight(kg: number, system: UnitSystem): UnitConversion {
  if (system === 'imperial') {
    return { value: kgToLbs(kg), unit: 'lbs', system };
  }
  return { value: round(kg, 1), unit: 'kg', system };
}

export function displayHeight(cm: number, system: UnitSystem): UnitConversion {
  if (system === 'imperial') {
    return { value: cmToInches(cm), unit: 'in', system };
  }
  return { value: round(cm, 1), unit: 'cm', system };
}

// ============================================================
// BMI
// ============================================================

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM), 1);
}

export function classifyBMI(bmi: number): { category: string; risk: string } {
  if (bmi <= 0) return { category: 'Unknown', risk: 'Unable to determine' };
  if (bmi < 18.5) return { category: 'Underweight', risk: 'Malnutrition risk' };
  if (bmi < 25) return { category: 'Normal weight', risk: 'Low risk' };
  if (bmi < 30) return { category: 'Overweight', risk: 'Moderate risk' };
  if (bmi < 35) return { category: 'Obese Class I', risk: 'High risk' };
  if (bmi < 40) return { category: 'Obese Class II', risk: 'Very high risk' };
  return { category: 'Obese Class III', risk: 'Extremely high risk' };
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-400' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' };
  return { label: 'Obese', color: 'text-rose-400' };
}

// ============================================================
// BMR — Mifflin-St Jeor
// ============================================================

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round(sex === 'male' ? base + 5 : base - 161, 0);
}

// ============================================================
// TDEE
// ============================================================

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) return 0;
  return round(bmr * ACTIVITY_MULTIPLIERS[activityLevel], 0);
}

// ============================================================
// CALORIE NEEDS — Deficit / Surplus
// ============================================================

export function calculateCalorieNeeds(
  tdee: number,
  goal: FitnessGoal,
  customDeficitOrSurplus?: number
): CalorieNeedsResult {
  if (tdee <= 0) {
    return {
      bmr: 0,
      tdee: 0,
      targetCalories: 0,
      deficit: 0,
      projectedWeeklyChangeKg: 0,
      projectedMonthlyChangeKg: 0,
      goal,
    };
  }

  let deficit: number;
  let projectedWeeklyChangeKg: number;

  switch (goal) {
    case 'fat_loss': {
      deficit = customDeficitOrSurplus ?? 500;
      const maxDeficit = Math.min(1000, Math.floor(tdee * 0.25));
      deficit = clamp(deficit, 0, maxDeficit);
      const minCalories = 1200;
      deficit = Math.min(deficit, tdee - minCalories);
      deficit = Math.max(deficit, 0);
      projectedWeeklyChangeKg = -round(safeDivide(deficit * 7, CALORIE_PER_KG_WEEK, 0), 2);
      break;
    }
    case 'muscle_gain': {
      deficit = -(customDeficitOrSurplus ?? 300);
      const maxSurplus = 500;
      deficit = clamp(deficit, -maxSurplus, 0);
      projectedWeeklyChangeKg = -round(safeDivide(Math.abs(deficit) * 7, CALORIE_PER_KG_WEEK, 0), 2);
      break;
    }
    case 'endurance': {
      deficit = -(customDeficitOrSurplus ?? 200);
      deficit = clamp(deficit, -400, 0);
      projectedWeeklyChangeKg = -round(safeDivide(Math.abs(deficit) * 7, CALORIE_PER_KG_WEEK, 0), 2);
      break;
    }
    case 'maintenance':
    default: {
      deficit = 0;
      projectedWeeklyChangeKg = 0;
      break;
    }
  }

  const targetCalories = round(tdee - deficit, 0);
  const projectedMonthlyChangeKg = round(projectedWeeklyChangeKg * 4.35, 2);

  return {
    bmr: 0,
    tdee,
    targetCalories,
    deficit: round(deficit, 0),
    projectedWeeklyChangeKg,
    projectedMonthlyChangeKg,
    goal,
  };
}

// ============================================================
// PROTEIN NEEDS
// ============================================================

export function calculateProteinNeeds(
  weightKg: number,
  goal: FitnessGoal,
  totalCalories?: number,
  customPerKg?: number
): ProteinNeedsResult {
  if (weightKg <= 0) {
    return {
      minGrams: 0,
      maxGrams: 0,
      recommendedGrams: 0,
      minPerKg: 0,
      maxPerKg: 0,
      caloriesFromProtein: 0,
      percentOfCalories: 0,
    };
  }

  const range = PROTEIN_PER_KG[goal];
  const minPerKg = range.min;
  const maxPerKg = range.max;
  const minGrams = round(weightKg * minPerKg, 0);
  const maxGrams = round(weightKg * maxPerKg, 0);

  const recommendedPerKg = customPerKg ?? round((minPerKg + maxPerKg) / 2, 1);
  const clampedPerKg = clamp(recommendedPerKg, minPerKg, maxPerKg);
  const recommendedGrams = round(weightKg * clampedPerKg, 0);

  const caloriesFromProtein = round(recommendedGrams * 4, 0);
  const percentOfCalories = totalCalories
    ? round(safeDivide(caloriesFromProtein, totalCalories, 0) * 100, 1)
    : 0;

  return {
    minGrams,
    maxGrams,
    recommendedGrams,
    minPerKg,
    maxPerKg,
    caloriesFromProtein,
    percentOfCalories,
  };
}

// ============================================================
// MACRONUTRIENT SPLIT
// ============================================================

export function calculateMacroSplit(
  totalCalories: number,
  preset: MacroSplitPreset = 'balanced',
  customSplit?: { protein: number; carbs: number; fat: number }
): MacroSplit {
  if (totalCalories <= 0) {
    return {
      proteinGrams: 0, carbsGrams: 0, fatGrams: 0,
      proteinPercent: 0, carbsPercent: 0, fatPercent: 0,
      proteinCalories: 0, carbsCalories: 0, fatCalories: 0,
      totalCalories: 0,
    };
  }

  let split: { protein: number; carbs: number; fat: number };

  if (customSplit) {
    const sum = customSplit.protein + customSplit.carbs + customSplit.fat;
    if (Math.abs(sum - 100) > 1) {
      split = {
        protein: safeDivide(customSplit.protein, sum, 0) * 100,
        carbs: safeDivide(customSplit.carbs, sum, 0) * 100,
        fat: safeDivide(customSplit.fat, sum, 0) * 100,
      };
    } else {
      split = { ...customSplit };
    }
  } else {
    split = MACRO_PRESETS[preset];
  }

  const proteinCalories = round(totalCalories * split.protein / 100, 0);
  const carbsCalories = round(totalCalories * split.carbs / 100, 0);
  const fatCalories = round(totalCalories * split.fat / 100, 0);

  return {
    proteinGrams: round(safeDivide(proteinCalories, 4, 0), 0),
    carbsGrams: round(safeDivide(carbsCalories, 4, 0), 0),
    fatGrams: round(safeDivide(fatCalories, 9, 0), 0),
    proteinPercent: round(split.protein, 1),
    carbsPercent: round(split.carbs, 1),
    fatPercent: round(split.fat, 1),
    proteinCalories,
    carbsCalories,
    fatCalories,
    totalCalories,
  };
}

// ============================================================
// BODY FAT — Navy Method
// ============================================================

export function calculateBodyFatNavy(
  measurements: {
    height: number;
    neck: number;
    waist: number;
    hip?: number;
  },
  sex: BiologicalSex
): BodyFatResult {
  const { height, neck, waist, hip } = measurements;

  if (height <= 0 || neck <= 0 || waist <= 0) {
    return createEmptyBodyFatResult('Navy');
  }
  if (sex === 'female' && (!hip || hip <= 0)) {
    return createEmptyBodyFatResult('Navy');
  }

  let bodyFatPercent: number;

  if (sex === 'male') {
    const diff = waist - neck;
    if (diff <= 0) return createEmptyBodyFatResult('Navy');
    bodyFatPercent = 86.010 * Math.log10(diff) - 70.041 * Math.log10(height) + 36.76;
  } else {
    const diff = waist + (hip ?? 0) - neck;
    if (diff <= 0) return createEmptyBodyFatResult('Navy');
    bodyFatPercent = 163.205 * Math.log10(diff) - 97.684 * Math.log10(height) - 78.387;
  }

  bodyFatPercent = clamp(round(bodyFatPercent, 1), 2, 70);

  return buildBodyFatResult(bodyFatPercent, 'Navy (U.S. Navy Circumference)', sex);
}

// ============================================================
// BODY FAT — Jackson-Pollock 3-Site
// ============================================================

export function calculateBodyFatJacksonPollock3(
  skinfolds: {
    chest?: number;
    abdomen?: number;
    thigh?: number;
    triceps?: number;
    suprailiac?: number;
  },
  age: number,
  sex: BiologicalSex
): BodyFatResult {
  const method = 'Jackson-Pollock 3-Site';

  if (age <= 0) return createEmptyBodyFatResult(method);

  let sum3: number;

  if (sex === 'male') {
    const { chest, abdomen, thigh } = skinfolds;
    if (!chest || !abdomen || !thigh || chest <= 0 || abdomen <= 0 || thigh <= 0) {
      return createEmptyBodyFatResult(method);
    }
    sum3 = chest + abdomen + thigh;
  } else {
    const { triceps, suprailiac, thigh } = skinfolds;
    if (!triceps || !suprailiac || !thigh || triceps <= 0 || suprailiac <= 0 || thigh <= 0) {
      return createEmptyBodyFatResult(method);
    }
    sum3 = triceps + suprailiac + thigh;
  }

  let bd: number;
  if (sex === 'male') {
    bd = 1.10938 - 0.0008267 * sum3 + 0.0000016 * sum3 * sum3 - 0.0002574 * age;
  } else {
    bd = 1.0994921 - 0.0009929 * sum3 + 0.0000023 * sum3 * sum3 - 0.0001392 * age;
  }

  if (bd <= 0) return createEmptyBodyFatResult(method);

  const bodyFatPercent = clamp(round(495 / bd - 450, 1), 2, 70);

  return buildBodyFatResult(bodyFatPercent, method, sex);
}

// ============================================================
// BODY FAT — Jackson-Pollock 7-Site
// ============================================================

export function calculateBodyFatJacksonPollock7(
  skinfolds: {
    chest: number;
    midaxillary: number;
    triceps: number;
    subscapular: number;
    abdomen: number;
    suprailiac: number;
    thigh: number;
  },
  age: number,
  sex: BiologicalSex
): BodyFatResult {
  const method = 'Jackson-Pollock 7-Site';

  const values = Object.values(skinfolds);
  if (values.some(v => !v || v <= 0) || age <= 0) {
    return createEmptyBodyFatResult(method);
  }

  const sum7 = values.reduce((a, b) => a + b, 0);

  let bd: number;
  if (sex === 'male') {
    bd = 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 * sum7 - 0.00028826 * age;
  } else {
    bd = 1.0970 - 0.00046971 * sum7 + 0.00000056 * sum7 * sum7 - 0.00012828 * age;
  }

  if (bd <= 0) return createEmptyBodyFatResult(method);

  const bodyFatPercent = clamp(round(495 / bd - 450, 1), 2, 70);

  return buildBodyFatResult(bodyFatPercent, method, sex);
}

// ============================================================
// LEAN BODY MASS
// ============================================================

export function calculateLeanBodyMass(weightKg: number, bodyFatPercent: number): number {
  if (weightKg <= 0 || bodyFatPercent <= 0) return weightKg > 0 ? weightKg : 0;
  if (bodyFatPercent >= 100) return 0;
  return round(weightKg * (1 - bodyFatPercent / 100), 1);
}

export function calculateFatMass(weightKg: number, bodyFatPercent: number): number {
  if (weightKg <= 0 || bodyFatPercent <= 0) return 0;
  if (bodyFatPercent >= 100) return weightKg;
  return round(weightKg * (bodyFatPercent / 100), 1);
}

// ============================================================
// 1RM — Epley Formula
// ============================================================

export function calculate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0) return 0;
  if (reps <= 0) return 0;
  if (reps === 1) return round(weightKg, 1);
  return round(weightKg * (1 + reps / 30), 1);
}

// ============================================================
// WATER INTAKE
// ============================================================

export function calculateWaterIntake(
  weightKg: number,
  options?: {
    exerciseHoursPerDay?: number;
    hotClimate?: boolean;
    highAltitude?: boolean;
    pregnant?: boolean;
    breastfeeding?: boolean;
  }
): WaterIntakeResult {
  if (weightKg <= 0) {
    return { baseLiters: 0, adjustedLiters: 0, adjustedOz: 0, adjustments: [] };
  }

  const baseLiters = round(weightKg * 0.035, 2);
  const adjustments: string[] = [];
  let adjustedLiters = baseLiters;

  if (options?.exerciseHoursPerDay && options.exerciseHoursPerDay > 0) {
    const exerciseExtra = round(options.exerciseHoursPerDay * 0.75, 2);
    adjustedLiters += exerciseExtra;
    adjustments.push(`+${round(exerciseExtra, 1)}L for exercise (${options.exerciseHoursPerDay}h)`);
  }

  if (options?.hotClimate) {
    adjustedLiters += 0.75;
    adjustments.push('+0.75L for hot climate');
  }

  if (options?.highAltitude) {
    adjustedLiters += 0.5;
    adjustments.push('+0.5L for high altitude');
  }

  if (options?.pregnant) {
    adjustedLiters += 0.3;
    adjustments.push('+0.3L for pregnancy');
  }

  if (options?.breastfeeding) {
    adjustedLiters += 0.7;
    adjustments.push('+0.7L for breastfeeding');
  }

  return {
    baseLiters,
    adjustedLiters: round(adjustedLiters, 2),
    adjustedOz: litersToOz(adjustedLiters),
    adjustments,
  };
}

// ============================================================
// SLEEP NEEDS
// ============================================================

export function calculateSleepNeeds(
  activityLevel: ActivityLevel,
  options?: {
    age?: number;
    intenseTraining?: boolean;
    sleepDebt?: boolean;
  }
): SleepNeedsResult {
  const factors: string[] = [];
  let { min, max, recommended } = SLEEP_HOURS[activityLevel];

  if (options?.age) {
    if (options.age < 18) {
      min = 8;
      max = 10;
      recommended = 9;
      factors.push('Teens need 8-10 hours');
    } else if (options.age >= 65) {
      min = 7;
      max = 8;
      recommended = 7.5;
      factors.push('Older adults may need slightly less');
    }
  }

  if (options?.intenseTraining) {
    min += 0.5;
    max += 1;
    recommended += 0.5;
    factors.push('+0.5-1h for intense training recovery');
  }

  if (options?.sleepDebt) {
    recommended = Math.min(recommended + 0.5, max + 0.5);
    factors.push('+0.5h for sleep debt recovery');
  }

  factors.push(`Activity level "${activityLevel}" suggests ${min}-${max}h`);

  return {
    minHours: round(min, 1),
    maxHours: round(max, 1),
    recommendedHours: round(clamp(recommended, min, max + 0.5), 1),
    factors,
  };
}

// ============================================================
// PROGRESSIVE OVERLOAD
// ============================================================

export function calculateProgressiveOverload(
  currentWeight: number,
  currentReps: number,
  targetReps: number,
  weekNumber: number,
  options?: {
    strategy?: OverloadStrategy;
    minWeightIncrement?: number;
    targetRepMin?: number;
    maxReps?: number;
  }
): ProgressiveOverloadResult {
  if (currentWeight <= 0 || currentReps <= 0 || targetReps <= 0) {
    return {
      currentWeight: 0,
      currentReps: 0,
      nextWeight: 0,
      nextReps: 0,
      weightIncrement: 0,
      repIncrement: 0,
      estimated1RM: 0,
      nextEstimated1RM: 0,
      weekNumber,
      strategy: options?.strategy ?? 'double_progression',
    };
  }

  const strategy = options?.strategy ?? 'double_progression';
  const increment = options?.minWeightIncrement ?? 2.5;
  const repMin = options?.targetRepMin ?? Math.max(targetReps - 2, 1);
  const maxReps = options?.maxReps ?? 12;

  const estimated1RM = calculate1RM(currentWeight, currentReps);

  let nextWeight: number;
  let nextReps: number;
  let weightIncrement = 0;
  let repIncrement = 0;

  switch (strategy) {
    case 'linear': {
      weightIncrement = increment;
      nextWeight = currentWeight + increment;
      nextReps = Math.max(currentReps - 1, repMin);
      repIncrement = nextReps - currentReps;
      break;
    }
    case 'undulating': {
      const phase = weekNumber % 3;
      if (phase === 0) {
        nextWeight = currentWeight + increment;
        nextReps = Math.max(repMin, targetReps - 3);
      } else if (phase === 1) {
        nextWeight = currentWeight;
        nextReps = Math.min(currentReps + 2, maxReps);
      } else {
        nextWeight = currentWeight;
        nextReps = Math.min(currentReps + 1, maxReps);
      }
      weightIncrement = nextWeight - currentWeight;
      repIncrement = nextReps - currentReps;
      break;
    }
    case 'double_progression':
    default: {
      if (currentReps >= targetReps) {
        nextWeight = currentWeight + increment;
        nextReps = repMin;
        weightIncrement = increment;
        repIncrement = nextReps - currentReps;
      } else {
        nextWeight = currentWeight;
        nextReps = Math.min(currentReps + 1, targetReps);
        weightIncrement = 0;
        repIncrement = 1;
      }
      break;
    }
  }

  const nextEstimated1RM = calculate1RM(nextWeight, nextReps);

  return {
    currentWeight: round(currentWeight, 2),
    currentReps,
    nextWeight: round(nextWeight, 2),
    nextReps,
    weightIncrement: round(weightIncrement, 2),
    repIncrement,
    estimated1RM,
    nextEstimated1RM,
    weekNumber,
    strategy,
  };
}

// ============================================================
// WEIGHT PROJECTION
// ============================================================

export function projectWeightChange(
  currentWeightKg: number,
  targetWeightKg: number,
  tdee: number,
  targetCalories: number,
  maxWeeks: number = 52
): WeightProjection {
  if (currentWeightKg <= 0 || tdee <= 0 || targetCalories <= 0) {
    return { weeks: [], estimatedGoalDate: null, weeksToGoal: null, isRealistic: false, warnings: ['Invalid input parameters'] };
  }

  const warnings: string[] = [];
  const dailyDeficit = tdee - targetCalories;

  if (Math.abs(dailyDeficit) < 50) {
    warnings.push('Very small calorie adjustment — progress will be slow');
  }

  if (dailyDeficit > 1000) {
    warnings.push('Deficit exceeds 1000 kcal/day — consider a more moderate approach');
  }

  if (targetCalories < 1200) {
    warnings.push('Target calories below 1200 — consult a healthcare professional');
  }

  const weeks: WeightProjectionWeek[] = [];
  let estimatedWeight = currentWeightKg;
  const isLoss = targetWeightKg < currentWeightKg;
  let reachedGoal = false;
  let weeksToGoal: number | null = null;

  for (let week = 1; week <= maxWeeks; week++) {
    const weightChange = estimatedWeight - currentWeightKg;
    const adaptationAdjustment = weightChange * 10;
    const adjustedTdee = tdee - adaptationAdjustment;
    const effectiveDeficit = adjustedTdee - targetCalories;
    const weeklyChangeKg = safeDivide(effectiveDeficit * 7, CALORIE_PER_KG_WEEK, 0);

    estimatedWeight -= weeklyChangeKg;
    const cumulativeChange = round(estimatedWeight - currentWeightKg, 2);

    weeks.push({
      week,
      estimatedWeightKg: round(estimatedWeight, 1),
      cumulativeChangeKg: cumulativeChange,
      weeklyChangeKg: round(-weeklyChangeKg, 2),
    });

    if (!reachedGoal) {
      if (isLoss && estimatedWeight <= targetWeightKg) {
        reachedGoal = true;
        weeksToGoal = week;
      } else if (!isLoss && estimatedWeight >= targetWeightKg) {
        reachedGoal = true;
        weeksToGoal = week;
      }
    }

    if (reachedGoal) break;
  }

  const totalChangeNeeded = Math.abs(targetWeightKg - currentWeightKg);
  const isRealistic = totalChangeNeeded <= 50;

  if (!isRealistic) {
    warnings.push('Target weight change is extreme — consider setting intermediate goals');
  }

  const estimatedGoalDate = weeksToGoal
    ? new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000)
    : null;

  return {
    weeks,
    estimatedGoalDate,
    weeksToGoal,
    isRealistic,
    warnings,
  };
}

// ============================================================
// WORKOUT FREQUENCY RECOMMENDATION
// ============================================================

export function recommendWorkoutFrequency(
  goal: FitnessGoal,
  activityLevel: ActivityLevel
): { min: number; max: number; recommended: number; rationale: string } {
  const base = ACTIVITY_WORKOUT_MAP[activityLevel];

  let adjustment = 0;
  let rationale = `Based on "${activityLevel}" activity level, ${base.recommended} sessions/week is standard.`;

  switch (goal) {
    case 'fat_loss':
      adjustment = 1;
      rationale += ' Fat loss benefits from 1 additional session for increased energy expenditure.';
      break;
    case 'muscle_gain':
      adjustment = 0;
      rationale += ' Muscle gain requires adequate recovery between sessions.';
      break;
    case 'endurance':
      adjustment = 1;
      rationale += ' Endurance training benefits from higher frequency, lower intensity sessions.';
      break;
    case 'maintenance':
    default:
      break;
  }

  const recommended = clamp(base.recommended + adjustment, base.min, base.max + 1);

  return {
    min: base.min,
    max: base.max + adjustment,
    recommended,
    rationale,
  };
}

// ============================================================
// HELPER — Build Body Fat Result
// ============================================================

function classifyBodyFat(bodyFatPercent: number, sex: BiologicalSex): BodyFatClassification {
  const categories = sex === 'male' ? BODY_FAT_CATEGORIES_MALE : BODY_FAT_CATEGORIES_FEMALE;

  for (const [threshold, healthRange, description] of categories) {
    if (bodyFatPercent < threshold) {
      return { category: description.split('—')[0].trim(), healthRange, description };
    }
  }

  const last = categories[categories.length - 1];
  return { category: last[2].split('—')[0].trim(), healthRange: last[1], description: last[2] };
}

function buildBodyFatResult(bodyFatPercent: number, method: string, sex: BiologicalSex): BodyFatResult {
  const classification = classifyBodyFat(bodyFatPercent, sex);
  return {
    bodyFatPercent,
    leanBodyMassKg: 0,
    fatMassKg: 0,
    method,
    classification,
  };
}

function createEmptyBodyFatResult(method: string): BodyFatResult {
  return {
    bodyFatPercent: 0,
    leanBodyMassKg: 0,
    fatMassKg: 0,
    method,
    classification: {
      category: 'Unknown',
      healthRange: 'average',
      description: 'Insufficient data for classification',
    },
  };
}

export function buildFullBodyFatResult(weightKg: number, bodyFatPercent: number, method: string, sex: BiologicalSex): BodyFatResult {
  const result = buildBodyFatResult(bodyFatPercent, method, sex);
  result.leanBodyMassKg = calculateLeanBodyMass(weightKg, bodyFatPercent);
  result.fatMassKg = calculateFatMass(weightKg, bodyFatPercent);
  return result;
}

// ============================================================
// MOVING AVERAGE
// ============================================================

export function movingAverage(values: number[], windowSize: number = 7): number[] {
  if (values.length < windowSize || windowSize <= 0) return values;

  const result: number[] = [];

  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, v) => sum + v, 0) / windowSize;
    result.push(round(avg, 2));
  }

  return result;
}

export function rateOfChange(values: number[], intervalDays: number = 1): number[] {
  if (values.length < 2) return [];

  const rates: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    rates.push(round(safeDivide(change, intervalDays, 0), 3));
  }

  return rates;
}
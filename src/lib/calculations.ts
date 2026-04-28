export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400' }
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-400' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' }
  return { label: 'Obese', color: 'text-rose-400' }
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0
  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

export function calculateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }
  return Math.round(bmr * multipliers[activityLevel])
}

export function calculateBodyFatNavy(
  waistCm: number,
  neckCm: number,
  heightCm: number,
  gender: 'male' | 'female',
  hipCm?: number
): number {
  if (waistCm <= 0 || neckCm <= 0 || heightCm <= 0) return 0
  let bodyFat: number
  if (gender === 'male') {
    bodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450
  } else {
    if (!hipCm || hipCm <= 0) return 0
    bodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waistCm + hipCm - neckCm) +
          0.221 * Math.log10(heightCm)) -
      450
  }
  return Math.round(bodyFat * 10) / 10
}

export function calculateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  // Epley formula
  return Math.round(weight * (1 + reps / 30))
}

export function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return value
  return from === 'kg' ? Math.round(value * 2.20462 * 10) / 10 : Math.round(value * 0.453592 * 10) / 10
}

export function convertHeight(value: number, from: 'cm' | 'ft', to: 'cm' | 'ft'): number {
  if (from === to) return value
  return from === 'cm' ? Math.round((value / 30.48) * 100) / 100 : Math.round(value * 30.48)
}

export function litersToOunces(liters: number): number {
  return Math.round(liters * 33.814 * 10) / 10
}

export function ouncesToLiters(ounces: number): number {
  return Math.round(ounces * 0.0295735 * 100) / 100
}

export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}

export function formatDuration(minutes: number): string {
  const { hours, minutes: mins } = minutesToHoursMinutes(minutes)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function formatSleepDuration(hours: number): string {
  const wholeHours = Math.floor(hours)
  const mins = Math.round((hours - wholeHours) * 60)
  if (mins > 0) return `${wholeHours}h ${mins}m`
  return `${wholeHours}h`
}

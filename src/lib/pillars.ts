import type { Workout, Meal, SleepEntry } from '../types/domain';
import { calculateSleepNeeds, ActivityLevel } from './calculations';

export interface PillarStatus {
  label: string;
  status: string;
  progress: number;
  color: string;
}

export function calculatePillars(data: {
  workouts: Workout[];
  meals: Meal[];
  sleep: SleepEntry[];
  activityLevel: ActivityLevel;
  targets: {
    workoutsPerWeek: number;
    caloriesPerDay: number;
    sleepHoursPerDay: number;
  }
}): PillarStatus[] {
  const now = new Date();
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // 1. Movement
  const weeklyWorkouts = data.workouts.filter(w => new Date(w.date) >= startOfWeek).length;
  const movementProgress = Math.min(Math.round((weeklyWorkouts / data.targets.workoutsPerWeek) * 100), 100);
  const movementStatus = weeklyWorkouts >= data.targets.workoutsPerWeek ? 'Peak' : weeklyWorkouts > 0 ? 'Active' : 'Resting';

  // 2. Nutrition
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const consistentDays = last7Days.filter(d => {
    const dayMeals = data.meals.filter(m => {
      const mealDate = new Date(m.date);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === d.getTime();
    });
    return dayMeals.length >= 2;
  }).length;
  const nutritionProgress = Math.min(Math.round((consistentDays / 7) * 100), 100);
  const nutritionStatus = nutritionProgress > 80 ? 'Optimal' : nutritionProgress > 50 ? 'Steady' : 'Improving';

  // 3. Recovery
  const weeklySleep = data.sleep.filter(s => new Date(s.date) >= startOfWeek);
  const avgSleep = weeklySleep.length > 0 
    ? weeklySleep.reduce((acc, s) => acc + s.duration, 0) / weeklySleep.length 
    : 0;
  const sleepNeeds = calculateSleepNeeds(data.activityLevel);
  const recoveryProgress = Math.min(Math.round((avgSleep / sleepNeeds.recommendedHours) * 100), 100);
  const recoveryStatus = avgSleep >= sleepNeeds.recommendedHours ? 'Optimal' : avgSleep >= sleepNeeds.minHours ? 'Sufficient' : 'Recovering';

  // 4. Mindset
  const mindsetProgress = 40;
  const mindsetStatus = 'Focused';

  // 5. Social
  const socialProgress = 50;
  const socialStatus = 'Steady';

  return [
    { label: 'Movement', status: movementStatus, progress: movementProgress, color: 'pillar-movement' },
    { label: 'Nutrition', status: nutritionStatus, progress: nutritionProgress, color: 'pillar-nutrition' },
    { label: 'Recovery', status: recoveryStatus, progress: recoveryProgress, color: 'pillar-recovery' },
    { label: 'Mindset', status: mindsetStatus, progress: mindsetProgress, color: 'pillar-mindset' },
    { label: 'Social', status: socialStatus, progress: socialProgress, color: 'pillar-social' },
  ];
}

export function calculateReadinessScore(data: {
  sleep: SleepEntry[];
  workouts: Workout[];
}): number {
  const recentSleep = data.sleep.slice(-3);
  const avgSleep = recentSleep.length > 0 
    ? recentSleep.reduce((acc, s) => acc + s.duration, 0) / recentSleep.length 
    : 7;
  
  const sleepFactor = Math.min((avgSleep / 8) * 60, 60);
  
  const recentWorkouts = data.workouts.filter(w => {
    const diff = Date.now() - new Date(w.date).getTime();
    return diff < 48 * 60 * 60 * 1000;
  });
  
  const fatigueFactor = Math.max(40 - (recentWorkouts.length * 15), 0);
  
  return Math.round(sleepFactor + fatigueFactor);
}

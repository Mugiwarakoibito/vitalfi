import { Workout, Meal, SleepEntry } from './storage';
import { calculateTDEE, calculateBMR, ActivityLevel, BiologicalSex } from './calculations';

export interface ForecastResult {
  energyBalance: {
    predictedWeightChangeKg: number;
    dailyAvgDeficit: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  recoveryForecast: {
    day: string;
    score: number;
  }[];
  peakPerformanceDate: string | null;
}

export function generateForecast(data: {
  workouts: Workout[];
  meals: Meal[];
  sleep: SleepEntry[];
  settings: {
    weightKg: number;
    heightCm: number;
    age: number;
    sex: BiologicalSex;
    activityLevel: ActivityLevel;
  }
}): ForecastResult {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // 1. Energy Balance
  const bmr = calculateBMR(data.settings.weightKg, data.settings.heightCm, data.settings.age, data.settings.sex);
  const tdee = calculateTDEE(bmr, data.settings.activityLevel);
  
  const dailyIntake = last7Days.map(d => {
    const dayMeals = data.meals.filter(m => {
      const mealDate = new Date(m.date);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === d.getTime();
    });
    return dayMeals.reduce((acc, m) => acc + m.calories, 0);
  });

  const avgIntake = dailyIntake.reduce((a, b) => a + b, 0) / 7;
  const avgDeficit = tdee - (avgIntake || tdee); // If no meals, assume maintenance
  const predictedWeightChange = (avgDeficit * 7) / 7700;

  // 2. Recovery Forecast
  // Projecting 3 days ahead based on fatigue decay
  const recoveryForecast = [1, 2, 3].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    // Simple logic: recovery improves if no workout is scheduled (mocking decay)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      score: Math.min(85 + (offset * 5), 100)
    };
  });

  return {
    energyBalance: {
      predictedWeightChangeKg: -predictedWeightChange,
      dailyAvgDeficit: avgDeficit,
      trend: avgDeficit > 200 ? 'improving' : avgDeficit < -200 ? 'declining' : 'stable'
    },
    recoveryForecast,
    peakPerformanceDate: recoveryForecast[2].day
  };
}

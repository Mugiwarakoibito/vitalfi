import type { StateCreator } from 'zustand';
import { storage } from '../lib/storage';
import type { AppState, FitnessSlice } from './types';

export const createFitnessSlice: StateCreator<AppState, [], [], FitnessSlice> = (set) => ({
  workouts: [],
  meals: [],
  bodyMetrics: [],
  hydration: [],
  sleep: [],
  goals: [],

  addWorkout: async (workout) => {
    set((state) => ({ workouts: [...state.workouts, workout], dataVersion: state.dataVersion + 1 }));
    await storage.put('workouts', workout);
  },
  updateWorkout: async (workout) => {
    set((state) => ({ workouts: state.workouts.map(w => w.id === workout.id ? workout : w), dataVersion: state.dataVersion + 1 }));
    await storage.put('workouts', workout);
  },
  deleteWorkout: async (id) => {
    set((state) => ({ workouts: state.workouts.filter(w => w.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('workouts', id);
  },

  addMeal: async (meal) => {
    set((state) => ({ meals: [...state.meals, meal], dataVersion: state.dataVersion + 1 }));
    await storage.put('meals', meal);
  },
  updateMeal: async (meal) => {
    set((state) => ({ meals: state.meals.map(m => m.id === meal.id ? meal : m), dataVersion: state.dataVersion + 1 }));
    await storage.put('meals', meal);
  },
  deleteMeal: async (id) => {
    set((state) => ({ meals: state.meals.filter(m => m.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('meals', id);
  },

  addBodyMetric: async (metric) => {
    set((state) => ({ bodyMetrics: [...state.bodyMetrics, metric], dataVersion: state.dataVersion + 1 }));
    await storage.put('bodyMetrics', metric);
  },
  deleteBodyMetric: async (id) => {
    set((state) => ({ bodyMetrics: state.bodyMetrics.filter(m => m.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('bodyMetrics', id);
  },

  addHydration: async (entry) => {
    set((state) => ({ hydration: [...state.hydration, entry], dataVersion: state.dataVersion + 1 }));
    await storage.put('hydration', entry);
  },
  deleteHydration: async (id) => {
    set((state) => ({ hydration: state.hydration.filter(h => h.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('hydration', id);
  },

  addSleep: async (entry) => {
    set((state) => ({ sleep: [...state.sleep, entry], dataVersion: state.dataVersion + 1 }));
    await storage.put('sleep', entry);
  },
  deleteSleep: async (id) => {
    set((state) => ({ sleep: state.sleep.filter(s => s.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('sleep', id);
  },
  clearSleep: async () => {
    set((state) => ({ sleep: [], dataVersion: state.dataVersion + 1 }));
    await storage.clear('sleep');
  },

  addGoal: async (goal) => {
    set((state) => ({ goals: [...state.goals, goal], dataVersion: state.dataVersion + 1 }));
    await storage.put('goals', goal);
  },
  updateGoal: async (goal) => {
    set((state) => ({ goals: state.goals.map(g => g.id === goal.id ? goal : g), dataVersion: state.dataVersion + 1 }));
    await storage.put('goals', goal);
  },
  deleteGoal: async (id) => {
    set((state) => ({ goals: state.goals.filter(g => g.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('goals', id);
  },
});

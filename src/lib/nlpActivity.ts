export interface ParsedActivity {
  type: 'workout' | 'meal' | 'hydration' | 'sleep';
  name: string;
  data: any;
  confidence: number;
}

const WORKOUT_KEYWORDS = ['run', 'walk', 'cycling', 'swim', 'lift', 'gym', 'workout', 'session', 'training', 'cardio', 'strength'];
const MEAL_KEYWORDS = ['meal', 'ate', 'had', 'lunch', 'dinner', 'breakfast', 'snack', 'food', 'chicken', 'rice', 'protein'];
const HYDRATION_KEYWORDS = ['water', 'drank', 'drink', 'liquid', 'hydration', 'ml', 'oz'];
const SLEEP_KEYWORDS = ['sleep', 'slept', 'rest', 'night'];

export function parseActivityNLP(input: string): ParsedActivity {
  const lower = input.toLowerCase();
  let confidence = 0.5;
  let type: ParsedActivity['type'] = 'workout';
  let name = input;
  let data: any = {};

  // Detect Type
  if (HYDRATION_KEYWORDS.some(k => lower.includes(k))) type = 'hydration';
  else if (SLEEP_KEYWORDS.some(k => lower.includes(k))) type = 'sleep';
  else if (MEAL_KEYWORDS.some(k => lower.includes(k))) type = 'meal';
  else if (WORKOUT_KEYWORDS.some(k => lower.includes(k))) type = 'workout';

  // Specific Parsers
  if (type === 'hydration') {
    const mlMatch = lower.match(/(\d+)\s*ml/);
    const ozMatch = lower.match(/(\d+)\s*oz/);
    if (mlMatch) {
      data.amount = parseInt(mlMatch[1]);
      confidence = 0.9;
    } else if (ozMatch) {
      data.amount = parseInt(ozMatch[1]) * 29.57; // to ml
      confidence = 0.9;
    }
  } else if (type === 'sleep') {
    const hoursMatch = lower.match(/(\d+)\s*h/);
    const hoursTextMatch = lower.match(/(\d+)\s*hours/);
    if (hoursMatch) {
        data.duration = parseInt(hoursMatch[1]);
        confidence = 0.9;
    } else if (hoursTextMatch) {
        data.duration = parseInt(hoursTextMatch[1]);
        confidence = 0.9;
    }
  } else if (type === 'meal') {
    const calMatch = lower.match(/(\d+)\s*kcal/);
    const proteinMatch = lower.match(/(\d+)\s*g\s*protein/);
    if (calMatch) {
        data.calories = parseInt(calMatch[1]);
        confidence += 0.2;
    }
    if (proteinMatch) {
        data.protein = parseInt(proteinMatch[1]);
        confidence += 0.1;
    }
    name = input.replace(/(\d+)\s*kcal/g, '').replace(/(\d+)\s*g\s*protein/g, '').trim();
  } else if (type === 'workout') {
    const durationMatch = lower.match(/(\d+)\s*min/);
    const distanceMatch = lower.match(/(\d+)\s*k/);
    if (durationMatch) {
        data.duration = parseInt(durationMatch[1]);
        confidence += 0.2;
    }
    if (distanceMatch) {
        data.distance = parseInt(distanceMatch[1]);
        confidence += 0.2;
    }
    name = input.replace(/(\d+)\s*min/g, '').replace(/(\d+)\s*k/g, '').trim();
  }

  return {
    type,
    name: name || input,
    data,
    confidence: Math.min(confidence, 1)
  };
}

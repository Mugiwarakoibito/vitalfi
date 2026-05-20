import type { ExerciseCategory, MuscleGroup, EquipmentType } from '@/types/fitness'

export const ollamaUrl = 'http://localhost:11434'

export interface ParsedExercise {
  name: string
  category: ExerciseCategory
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: EquipmentType[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
}

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'obliques',
  'quads', 'hamstrings', 'glutes', 'calves', 'forearms', 'traps', 'lats', 'full_body', 'core'
]

const equipmentTypes: EquipmentType[] = [
  'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable',
  'bodyweight', 'resistance_band', 'smith_machine', 'medicine_ball', 'none'
]

const categories: ExerciseCategory[] = ['strength', 'cardio', 'hiit', 'flexibility', 'plyometrics', 'calisthenics']

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

export async function parseExerciseFromNaturalLanguage(input: string): Promise<ParsedExercise> {
  const systemPrompt = `You are a fitness expert. Parse the user's exercise description into structured JSON.

Return ONLY valid JSON with this exact structure:
{
  "name": "Exercise Name",
  "category": "strength|cardio|hiit|flexibility|plyometrics|calisthenics",
  "primaryMuscles": ["chest"|"back"|"shoulders"|"biceps"|"triceps"|"abs"|"obliques"|"quads"|"hamstrings"|"glutes"|"calves"|"forearms"|"traps"|"lats"|"full_body"|"core"],
  "secondaryMuscles": ["..."],
  "equipment": ["barbell"|"dumbbell"|"kettlebell"|"machine"|"cable"|"bodyweight"|"resistance_band"|"medicine_ball"|"none"],
  "difficulty": "beginner|intermediate|advanced",
  "instructions": ["step 1", "step 2", "step 3", "step 4"]
}

Rules:
- primaryMuscles MUST have exactly 1 muscle
- secondaryMuscles can have 0-3 muscles
- equipment can have 1-3 items
- difficulty: beginner (simple movements), intermediate (moderate complexity), advanced (complex/high skill)
- instructions: 3-5 clear steps, imperative voice, action-based
- category: choose based on exercise type (cardio for running/cycling, hiit for explosive work, flexibility for stretches)
- If bodyweight, use "bodyweight" equipment

Example input: "do sets of 15 pushups for chest"
Example output: {"name":"Push-ups","category":"strength","primaryMuscles":["chest"],"secondaryMuscles":["triceps","shoulders"],"equipment":["bodyweight"],"difficulty":"beginner","instructions":["Start in plank position with hands under shoulders.","Lower your body until chest nearly touches the floor.","Push back up to starting position."]}

Only respond with valid JSON. No markdown, no explanation.`

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: `Parse this exercise: ${input}\n\n${systemPrompt}`,
      stream: false,
      options: { temperature: 0.1 }
    }),
    signal: AbortSignal.timeout(30000)
  })

  if (!res.ok) throw new Error('Ollama request failed')

  const data = await res.json()
  const raw = data.response?.trim()

  if (!raw) throw new Error('Empty response from Ollama')

  let jsonStr = raw
  if (raw.startsWith('```json')) jsonStr = raw.replace(/```json\n?|```\n?/g, '')
  else if (raw.startsWith('```')) jsonStr = raw.replace(/```\n?/g, '')

  const parsed = JSON.parse(jsonStr.trim())

  if (!parsed.name || !parsed.category || !parsed.primaryMuscles?.length || !parsed.equipment?.length || !parsed.difficulty) {
    throw new Error('Invalid exercise structure')
  }

  return {
    name: parsed.name,
    category: categories.includes(parsed.category) ? parsed.category : 'strength',
    primaryMuscles: (parsed.primaryMuscles as string[]).filter((m: string) => muscleGroups.includes(m as MuscleGroup)).slice(0, 2) as MuscleGroup[],
    secondaryMuscles: (parsed.secondaryMuscles as string[]).filter((m: string) => muscleGroups.includes(m as MuscleGroup)).slice(0, 3) as MuscleGroup[],
    equipment: (parsed.equipment as string[]).filter((e: string) => equipmentTypes.includes(e as EquipmentType)).slice(0, 3) as EquipmentType[],
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'beginner',
    instructions: Array.isArray(parsed.instructions) ? parsed.instructions.slice(0, 5) : []
  }
}
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import type { ExerciseCategory } from '@/types/fitness'
import type { Workout } from '@/lib/storage'

interface WorkoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: Workout) => Promise<void>;
}

export function WorkoutForm({ isOpen, onClose, onSave }: WorkoutFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ExerciseCategory>('strength')
  const [duration, setDuration] = useState('60')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSave = async () => {
    if (!name) return
    const workout: Workout = {
      id: generateId(),
      name,
      category: type,
      duration: parseInt(duration) || 0,
      date,
      exercises: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await onSave(workout)
    setName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Session">
      <div className="space-y-4">
        <Input label="Session Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Lift" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="glass-input w-full">
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="cardio">Cardio</option>
              <option value="hiit">HIIT</option>
              <option value="functional">Functional</option>
              <option value="mobility">Mobility</option>
              <option value="flexibility">Flexibility</option>
              <option value="plyo">Plyo</option>
              <option value="calisthenics">Calisthenics</option>
              <option value="endurance">Endurance</option>
              <option value="speed_agility">Speed & Agility</option>
              <option value="balance_stability">Balance</option>
              <option value="core">Core</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
              <option value="crossfit">CrossFit</option>
              <option value="martial_arts">Martial Arts</option>
              <option value="recovery">Recovery</option>
              <option value="isometric">Isometric</option>
              <option value="animal_flow">Animal Flow</option>
              <option value="breathwork">Breathwork</option>
            </select>
          </div>
          <Input label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex gap-4 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!name}>Save Session</Button>
        </div>
      </div>
    </Modal>
  )
}

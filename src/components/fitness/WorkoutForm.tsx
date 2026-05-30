import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import type { ExerciseCategory } from '@/types/fitness'
import type { Workout } from '@/types/domain'
import {
  Dumbbell, TrendingUp, Wind, Flame, Settings2, Move, StretchHorizontal, Zap, PersonStanding,
  Gauge, Crosshair, Weight, Heart, Activity, Shield, Sword, Coffee, Equal, Footprints, Waves,
} from 'lucide-react'

interface WorkoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: Workout) => Promise<void>;
}

const categories: { value: ExerciseCategory; icon: React.ReactNode; label: string }[] = [
  { value: 'strength', icon: <Dumbbell size={14} />, label: 'Strength' },
  { value: 'hypertrophy', icon: <TrendingUp size={14} />, label: 'Hypertrophy' },
  { value: 'cardio', icon: <Wind size={14} />, label: 'Cardio' },
  { value: 'hiit', icon: <Flame size={14} />, label: 'HIIT' },
  { value: 'functional', icon: <Settings2 size={14} />, label: 'Functional' },
  { value: 'mobility', icon: <Move size={14} />, label: 'Mobility' },
  { value: 'flexibility', icon: <StretchHorizontal size={14} />, label: 'Flexibility' },
  { value: 'plyo', icon: <Zap size={14} />, label: 'Plyo' },
  { value: 'calisthenics', icon: <PersonStanding size={14} />, label: 'Calisthenics' },
  { value: 'endurance', icon: <Activity size={14} />, label: 'Endurance' },
  { value: 'speed_agility', icon: <Gauge size={14} />, label: 'Speed & Agility' },
  { value: 'balance_stability', icon: <Crosshair size={14} />, label: 'Balance' },
  { value: 'core', icon: <Weight size={14} />, label: 'Core' },
  { value: 'yoga', icon: <Heart size={14} />, label: 'Yoga' },
  { value: 'pilates', icon: <Activity size={14} />, label: 'Pilates' },
  { value: 'crossfit', icon: <Shield size={14} />, label: 'CrossFit' },
  { value: 'martial_arts', icon: <Sword size={14} />, label: 'Martial Arts' },
  { value: 'recovery', icon: <Coffee size={14} />, label: 'Recovery' },
  { value: 'isometric', icon: <Equal size={14} />, label: 'Isometric' },
  { value: 'animal_flow', icon: <Footprints size={14} />, label: 'Animal Flow' },
  { value: 'breathwork', icon: <Waves size={14} />, label: 'Breathwork' },
]

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
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setType(cat.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    type === cat.value
                      ? 'border-primary/40 bg-primary/10 text-primary-light shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                      : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="opacity-70">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!name}>Save Session</Button>
        </div>
      </div>
    </Modal>
  )
}

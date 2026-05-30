import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils'
import type { SleepEntry } from '@/types/domain'

interface SleepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: SleepEntry) => Promise<void>;
}

export function SleepForm({ isOpen, onClose, onSave }: SleepFormProps) {
  const [duration, setDuration] = useState('8')
  const [quality, setQuality] = useState('3')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSave = async () => {
    const entry: SleepEntry = {
      id: generateId(),
      date,
      duration: parseFloat(duration) || 0,
      quality: parseInt(quality) as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await onSave(entry)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Restoration">
      <div className="space-y-4">
        <Input label="Duration (hours)" type="number" step="0.1" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Quality (1-5)</label>
          <input type="range" min="1" max="5" step="1" value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full accent-purple-500" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
            <span>POOR</span>
            <span>GREAT</span>
          </div>
        </div>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex gap-4 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">Save Log</Button>
        </div>
      </div>
    </Modal>
  )
}

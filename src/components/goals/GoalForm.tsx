import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Goal } from '@/types/domain'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils'

interface GoalFormProps {
  initial?: Goal
  onSaved: () => void
}

export function GoalForm({ initial, onSaved }: GoalFormProps) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [type, setType] = useState<'financial' | 'fitness'>('financial')
  const [deadline, setDeadline] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setTarget(String(initial.target))
      setCurrent(String(initial.current))
      setType(initial.type)
      setDeadline(initial.deadline)
    }
  }, [initial])

  const handleSubmit = async () => {
    const targetNum = parseFloat(target)
    const currentNum = parseFloat(current)
    if (!name.trim() || isNaN(targetNum) || targetNum <= 0) return

    setIsSaving(true)

    await storage.put('goals', {
      id: initial?.id ?? generateId(),
      type,
      name: name.trim(),
      target: targetNum,
      current: isNaN(currentNum) ? 0 : currentNum,
      deadline: deadline || new Date().toISOString().split('T')[0],
    } as Goal)

    setIsSaving(false)
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('financial')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            type === 'financial'
              ? 'bg-primary/15 text-primary-light border border-primary/30'
              : 'bg-white/[0.03] text-muted border border-white/[0.06]'
          }`}
        >
          Financial
        </button>
        <button
          type="button"
          onClick={() => setType('fitness')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            type === 'fitness'
              ? 'bg-success/15 text-success-light border border-success/30'
              : 'bg-white/[0.03] text-muted border border-white/[0.06]'
          }`}
        >
          Fitness
        </button>
      </div>

      <Input
        label="Goal Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Save $5000, Run 100km"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target"
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="100"
        />
        <Input
          label="Current Progress"
          type="number"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="0"
        />
      </div>

      <Input
        label="Deadline"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />

      <Button
        variant="primary"
        className="w-full"
        onClick={handleSubmit}
        isLoading={isSaving}
      >
        {initial ? 'Update Goal' : 'Create Goal'}
      </Button>
    </div>
  )
}

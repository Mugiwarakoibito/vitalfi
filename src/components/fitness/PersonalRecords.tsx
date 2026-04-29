import { useState, useEffect } from 'react'
import { Trophy, Plus, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface PersonalRecord {
  id: string
  exerciseName: string
  weight: number
  reps: number
  date: string
  type: 'weight' | 'reps'
}

export function PersonalRecords() {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    exerciseName: '',
    weight: '',
    reps: '',
    date: new Date().toISOString().split('T')[0],
    type: 'weight' as 'weight' | 'reps',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const stored = localStorage.getItem('personalRecords')
    if (stored) setRecords(JSON.parse(stored))
  }

  const saveRecord = () => {
    const newRecord: PersonalRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      exerciseName: formData.exerciseName,
      weight: Number(formData.weight),
      reps: Number(formData.reps),
      date: formData.date,
      type: formData.type,
    }
    const updated = [...records, newRecord]
    setRecords(updated)
    localStorage.setItem('personalRecords', JSON.stringify(updated))
    setShowModal(false)
    setFormData({
      exerciseName: '',
      weight: '',
      reps: '',
      date: new Date().toISOString().split('T')[0],
      type: 'weight',
    })
  }

  const groupByExercise = records.reduce((acc, r) => {
    if (!acc[r.exerciseName]) {
      acc[r.exerciseName] = []
    }
    acc[r.exerciseName].push(r)
    return acc
  }, {} as Record<string, PersonalRecord[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Personal Records</h3>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add PR
        </Button>
      </div>

      {records.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-400">No personal records yet</p>
            <p className="text-gray-500 text-sm">Track your heaviest lifts and best performances</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupByExercise).map(([exercise, recs]) => {
            const best = recs.reduce((b, r) => r.type === 'weight' ? (r.weight > b.weight ? r : b) : (r.reps > b.reps ? r : b), recs[0])
            return (
              <Card key={exercise} className="backdrop-blur-xl bg-gradient-to-br from-yellow-900/20 to-purple-900/20 border border-yellow-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">{exercise}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Weight</span>
                      <span className="text-white font-bold">
                        {Math.max(...recs.map(r => r.weight))} lbs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Reps</span>
                      <span className="text-white font-bold">{Math.max(...recs.map(r => r.reps))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Set</span>
                      <span className="text-purple-400 text-sm">{best.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Personal Record">
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="e.g., Bench Press"
            value={formData.exerciseName}
            onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weight (lbs)"
              type="number"
              placeholder="0"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
            <Input
              label="Reps"
              type="number"
              placeholder="0"
              value={formData.reps}
              onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
            />
          </div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Record Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'weight' })}
                className={`flex-1 p-2 rounded-lg text-sm ${
                  formData.type === 'weight'
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                }`}
              >
                🏋️ Weight
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'reps' })}
                className={`flex-1 p-2 rounded-lg text-sm ${
                  formData.type === 'reps'
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                }`}
              >
                🔄 Reps
              </button>
            </div>
          </div>
          <Button variant="primary" onClick={saveRecord} className="w-full">
            Save Record
          </Button>
        </div>
      </Modal>
    </div>
  )
}
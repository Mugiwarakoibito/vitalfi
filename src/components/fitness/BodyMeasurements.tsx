import { useState, useEffect } from 'react'
import { Ruler, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface Measurement {
  id: string
  date: string
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
  shoulders?: number
  neck?: number
  forearms?: number
  calves?: number
}

const bodyParts = [
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'waist', label: 'Waist', unit: 'in' },
  { key: 'hips', label: 'Hips', unit: 'in' },
  { key: 'arms', label: 'Arms', unit: 'in' },
  { key: 'thighs', label: 'Thighs', unit: 'in' },
  { key: 'shoulders', label: 'Shoulders', unit: 'in' },
  { key: 'neck', label: 'Neck', unit: 'in' },
  { key: 'forearms', label: 'Forearms', unit: 'in' },
  { key: 'calves', label: 'Calves', unit: 'in' },
]

export function BodyMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    shoulders: '',
    neck: '',
    forearms: '',
    calves: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const stored = localStorage.getItem('bodyMeasurements')
    if (stored) setMeasurements(JSON.parse(stored))
  }

  const saveMeasurement = () => {
    const newM: Measurement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      date: formData.date,
      chest: formData.chest ? Number(formData.chest) : undefined,
      waist: formData.waist ? Number(formData.waist) : undefined,
      hips: formData.hips ? Number(formData.hips) : undefined,
      arms: formData.arms ? Number(formData.arms) : undefined,
      thighs: formData.thighs ? Number(formData.thighs) : undefined,
      shoulders: formData.shoulders ? Number(formData.shoulders) : undefined,
      neck: formData.neck ? Number(formData.neck) : undefined,
      forearms: formData.forearms ? Number(formData.forearms) : undefined,
      calves: formData.calves ? Number(formData.calves) : undefined,
    }
    const updated = [newM, ...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setMeasurements(updated)
    localStorage.setItem('bodyMeasurements', JSON.stringify(updated))
    setShowModal(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      chest: '', waist: '', hips: '', arms: '', thighs: '',
      shoulders: '', neck: '', forearms: '', calves: '',
    })
  }

  const getLatest = (key: keyof Measurement) => {
    const latest = measurements.find(m => m[key as keyof Measurement] !== undefined)
    const prev = measurements.slice(1).find(m => m[key as keyof Measurement] !== undefined)
    return { latest: latest?.[key as keyof Measurement] as number | undefined, prev: prev?.[key as keyof Measurement] as number | undefined }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Body Measurements</h3>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {measurements.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Ruler className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No measurements yet</p>
            <p className="text-gray-500 text-sm">Track your body measurements over time</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {bodyParts.map(part => {
              const { latest, prev } = getLatest(part.key as keyof Measurement)
              const change = latest && prev ? latest - prev : null
              return (
                <Card key={part.key} className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">{part.label}</div>
                    <div className="text-lg font-bold text-white">{latest || '--'}</div>
                    <div className="text-xs text-gray-500">{part.unit}</div>
                    {change !== null && (
                      <div className={`flex items-center justify-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change).toFixed(1)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-white mb-3">History</h4>
              <div className="space-y-2">
                {measurements.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                    <span className="text-gray-300">{formatDate(m.date)}</span>
                    <div className="flex gap-4 text-sm">
                      {m.chest && <span className="text-gray-400">Chest: {m.chest}"</span>}
                      {m.waist && <span className="text-gray-400">Waist: {m.waist}"</span>}
                      {m.hips && <span className="text-gray-400">Hips: {m.hips}"</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Measurements">
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            {bodyParts.slice(0, 6).map(part => (
              <Input
                key={part.key}
                label={`${part.label} (${part.unit})`}
                type="number"
                placeholder="0"
                value={formData[part.key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [part.key]: e.target.value })}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {bodyParts.slice(6).map(part => (
              <Input
                key={part.key}
                label={`${part.label} (${part.unit})`}
                type="number"
                placeholder="0"
                value={formData[part.key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [part.key]: e.target.value })}
              />
            ))}
          </div>
          <Button variant="primary" onClick={saveMeasurement} className="w-full">
            Save Measurements
          </Button>
        </div>
      </Modal>
    </div>
  )
}
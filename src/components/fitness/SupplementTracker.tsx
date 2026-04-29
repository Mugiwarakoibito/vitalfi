import { useState, useEffect } from 'react'
import { Pill, Plus, Check, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface Supplement {
  id: string
  name: string
  dosage: string
  frequency: 'daily' | 'weekly' | 'custom'
  times: string[]
  notes?: string
}

interface SupplementLog {
  id: string
  supplementId: string
  takenAt: string
  date: string
}

const commonSupplements = [
  { name: 'Vitamin D3', dosage: '5000 IU' },
  { name: 'Omega-3 Fish Oil', dosage: '2000mg' },
  { name: 'Creatine', dosage: '5g' },
  { name: 'Whey Protein', dosage: '30g' },
  { name: 'Magnesium', dosage: '400mg' },
  { name: 'Zinc', dosage: '30mg' },
  { name: 'Multivitamin', dosage: '1 tablet' },
  { name: 'Collagen', dosage: '10g' },
  { name: 'Pre-workout', dosage: '1 scoop' },
  { name: 'BCAA', dosage: '5g' },
]

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [showModal, setShowModal] = useState(false)
  const [todayFilter, setTodayFilter] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as Supplement['frequency'],
    times: 'morning',
    notes: '',
  })

  useEffect(() => {
    loadData()
    checkTodaySupplements()
  }, [])

  const loadData = async () => {
    const suppStored = localStorage.getItem('supplements')
    if (suppStored) setSupplements(JSON.parse(suppStored))
    
    const logStored = localStorage.getItem('supplementLogs')
    if (logStored) setLogs(JSON.parse(logStored))
  }

  const checkTodaySupplements = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = JSON.parse(localStorage.getItem('supplementLogs') || '[]')
      .filter((l: SupplementLog) => l.date === today)
      .map((l: SupplementLog) => l.supplementId)
    setTodayFilter(todayLogs)
  }

  const addSupplement = () => {
    const times = formData.times.split(',').map(t => t.trim())
    const newSupp: Supplement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      times,
      notes: formData.notes || undefined,
    }
    const updated = [...supplements, newSupp]
    setSupplements(updated)
    localStorage.setItem('supplements', JSON.stringify(updated))
    setShowModal(false)
    setFormData({ name: '', dosage: '', frequency: 'daily', times: 'morning', notes: '' })
  }

  const markAsTaken = (supp: Supplement) => {
    const log: SupplementLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      supplementId: supp.id,
      takenAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    }
    const updated = [...logs, log]
    setLogs(updated)
    localStorage.setItem('supplementLogs', JSON.stringify(updated))
    setTodayFilter([...todayFilter, supp.id])
  }

  const takenToday = (suppId: string) => todayFilter.includes(suppId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <Pill className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{supplements.length}</div>
            <div className="text-xs text-gray-400">Total Supplements</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-green-900/20 border border-green-700/50">
          <CardContent className="p-4 text-center">
            <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{todayFilter.length}</div>
            <div className="text-xs text-gray-400">Taken Today</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{supplements.length - todayFilter.length}</div>
            <div className="text-xs text-gray-400">Remaining</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Supplements</h3>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {supplements.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No supplements tracked</p>
            <p className="text-gray-500 text-sm">Track your daily supplements and vitamins</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supplements.map(supp => (
            <Card 
              key={supp.id} 
              className={`backdrop-blur-xl border ${
                takenToday(supp.id)
                  ? 'bg-green-900/20 border-green-700/30'
                  : 'bg-gray-900/50 border-gray-700/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">{supp.name}</h4>
                    <p className="text-sm text-gray-400">{supp.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {supp.times.join(' • ')}
                    </p>
                  </div>
                  {takenToday(supp.id) ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="text-sm">Taken</span>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => markAsTaken(supp)}>
                      Take
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Supplement">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Add</label>
            <div className="grid grid-cols-2 gap-2">
              {commonSupplements.slice(0, 6).map(s => (
                <button
                  key={s.name}
                  onClick={() => setFormData({ ...formData, name: s.name, dosage: s.dosage })}
                  className={`p-2 rounded-lg text-xs text-left transition-all ${
                    formData.name === s.name
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Supplement Name"
            placeholder="e.g., Vitamin D3"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Dosage"
            placeholder="e.g., 5000 IU"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          />
          <Input
            label="Times (comma separated)"
            placeholder="morning, night"
            value={formData.times}
            onChange={(e) => setFormData({ ...formData, times: e.target.value })}
          />
          <Input
            label="Notes (optional)"
            placeholder="Any notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <Button variant="primary" onClick={addSupplement} className="w-full">
            Add Supplement
          </Button>
        </div>
      </Modal>
    </div>
  )
}
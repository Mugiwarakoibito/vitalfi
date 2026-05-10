import { useState, useMemo } from 'react'
import { Moon, Trash2, Star, Clock, Plus, AlertTriangle } from 'lucide-react'
import { generateId, formatSleepDuration } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { SleepEntry } from '@/types/fitness'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export function SleepLogger() {
  const { sleep, addSleep, deleteSleep } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('')
  const [quality, setQuality] = useState<1|2|3|4|5>(3)
  const [bedTime, setBedTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [notes, setNotes] = useState('')
  const [deletingEntry, setDeletingEntry] = useState<SleepEntry | null>(null)

  const sorted = useMemo(() => [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sleep])
  const avgDuration = sleep.length > 0 ? sleep.reduce((sum, e) => sum + e.duration, 0) / sleep.length : 0
  const avgQuality = sleep.length > 0 ? sleep.reduce((sum, e) => sum + e.quality, 0) / sleep.length : 0

  const reset = () => { setDate(new Date().toISOString().split('T')[0]); setDuration(''); setQuality(3); setBedTime(''); setWakeTime(''); setNotes('') }

  const handleSave = () => {
    if (!duration || isNaN(parseFloat(duration))) return
    addSleep({ id: generateId(), date, duration: parseFloat(duration), quality, bedTime: bedTime || undefined, wakeTime: wakeTime || undefined, notes: notes || undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    reset()
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    deleteSleep(deletingEntry.id)
    setDeletingEntry(null)
  }

  const qualityStars = (q: number) => Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < q ? 'fill-amber-400 text-amber-400' : 'text-white/10'} />)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-2"><Clock className="w-4 h-4" /><span>Avg Duration</span></div>
            <p className="text-3xl font-bold text-white">{formatSleepDuration(avgDuration)}</p>
            <p className="text-xs text-gray-500 mt-1">{sleep.length} entries</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2"><Star className="w-4 h-4" /><span>Avg Quality</span></div>
            <div className="flex items-center gap-1 mt-1">{qualityStars(Math.round(avgQuality))}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2"><Moon className="w-4 h-4" /><span>Total Entries</span></div>
            <p className="text-3xl font-bold text-white">{sleep.length}</p>
            <p className="text-xs text-gray-500 mt-1">Tracked</p>
          </div>
        </div>
      </div>

      {sorted.length > 2 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Sleep Quality Trend</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sorted.slice(0, 14).reverse().map(s => ({ date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), quality: s.quality, duration: s.duration }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#ffffff60" fontSize={10} />
              <YAxis stroke="#ffffff60" fontSize={10} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="quality" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} name="Quality (1-5)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Sleep History</h3>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm flex items-center gap-2 hover:bg-violet-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Log Sleep
        </button>
      </div>

      {sleep.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4"><Moon className="w-8 h-8 text-violet-400/50" /></div>
          <p className="text-gray-400 mb-1">No sleep entries yet</p>
          <p className="text-gray-500 text-sm">Start tracking your sleep</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center"><Moon className="w-5 h-5 text-violet-400" /></div>
                  <div>
                    <h4 className="font-semibold text-white">{new Date(entry.date).toLocaleDateString()}</h4>
                    <p className="text-sm text-gray-400">{formatSleepDuration(entry.duration)}</p>
                  </div>
                </div>
                <button onClick={() => setDeletingEntry(entry)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">{qualityStars(entry.quality)}</div>
                {entry.bedTime && entry.wakeTime && <span className="text-xs text-gray-500">{entry.bedTime} - {entry.wakeTime}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">Log Sleep</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-2">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500/50 focus:outline-none transition-all" /></div>
                <div><label className="block text-sm text-gray-400 mb-2">Duration (hours)</label><input type="number" step="0.1" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none transition-all" placeholder="7.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-2">Bed Time</label><input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500/50 focus:outline-none transition-all" /></div>
                <div><label className="block text-sm text-gray-400 mb-2">Wake Time</label><input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500/50 focus:outline-none transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quality</label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as const).map((q) => (
                    <button key={q} onClick={() => setQuality(q)} className={`flex-1 p-3 rounded-xl text-center transition-all ${quality === q ? 'bg-violet-500/20 border border-violet-500/50' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}>
                      <div className="flex justify-center mb-1">{qualityStars(q)}</div>
                      <span className={`text-xs ${quality === q ? 'text-violet-400' : 'text-gray-500'}`}>{q === 1 ? 'Poor' : q === 2 ? 'Fair' : q === 3 ? 'Okay' : q === 4 ? 'Good' : 'Great'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-2">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Woke up once, room was cold..." className="glass-textarea w-full" /></div>
              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); reset() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={!duration} className="flex-1 px-4 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 font-medium hover:bg-violet-500/30 transition-all disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingEntry(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Sleep Entry?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Delete entry from {new Date(deletingEntry.date).toLocaleDateString()}?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingEntry(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
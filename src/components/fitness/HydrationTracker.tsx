import { useState, useMemo } from 'react'
import { Droplets, Plus, Trash2, GlassWater, Target, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import type { HydrationEntry } from '@/types/fitness'

interface HydrationTrackerProps {
  dailyGoal?: number
}

const quickAmounts = [250, 500, 750, 1000]

export function HydrationTracker({ dailyGoal = 2500 }: HydrationTrackerProps) {
  const { hydration, addHydration, deleteHydration } = useAppStore()
  const [customAmount, setCustomAmount] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = useMemo(() => hydration.filter((e) => e.date === today).sort((a, b) => a.timestamp.localeCompare(b.timestamp)), [hydration, today])
  const totalAmount = useMemo(() => todayEntries.reduce((sum, e) => sum + e.amount, 0), [todayEntries])
  const percentage = Math.min((totalAmount / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - totalAmount, 0)
  const [deletingEntry, setDeletingEntry] = useState<HydrationEntry | null>(null)

  const addEntry = (amount: number) => {
    const entry: HydrationEntry = {
      id: generateId(),
      date: today,
      amount,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addHydration(entry)
    setCustomAmount('')
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    deleteHydration(deletingEntry.id)
    setDeletingEntry(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <Droplets className="w-4 h-4" />
              <span>Daily Goal</span>
            </div>
            <p className="text-3xl font-bold text-white">{dailyGoal}ml</p>
            <p className="text-xs text-gray-500 mt-1">Target</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <GlassWater className="w-4 h-4" />
              <span>Consumed</span>
            </div>
            <p className="text-3xl font-bold text-sky-400">{totalAmount}ml</p>
            <p className="text-xs text-gray-500 mt-1">{todayEntries.length} entries</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2">
              <Target className="w-4 h-4" />
              <span>Remaining</span>
            </div>
            <p className="text-3xl font-bold text-white">{remaining}ml</p>
            <p className="text-xs text-gray-500 mt-1">To reach goal</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Progress</h3>
          <span className="text-2xl font-bold text-sky-400">{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>

        <div className="flex gap-3 flex-wrap mb-6">
          {quickAmounts.map((amount) => (
            <button key={amount} onClick={() => addEntry(amount)} className="px-5 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-medium hover:bg-sky-500/20 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {amount}ml
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount (ml)" className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-sky-500/50 focus:outline-none transition-all" />
          <button onClick={() => customAmount && addEntry(Number(customAmount))} className="px-6 py-3 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 font-medium hover:bg-sky-500/30 transition-all">
            Add
          </button>
        </div>
      </div>

      {todayEntries.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Today's Entries</h4>
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                    <GlassWater className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{entry.amount}ml</p>
                    <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button onClick={() => setDeletingEntry(entry)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {deletingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingEntry(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Delete this {deletingEntry.amount}ml entry?
            </p>
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
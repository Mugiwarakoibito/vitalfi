import { useState, useEffect } from 'react'
import { Flame, Zap, Target, Calendar } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Workout } from '@/lib/storage'

export function WorkoutStreak() {
  const { workouts } = useAppStore()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [thisMonthWorkouts, setThisMonthWorkouts] = useState(0)
  const [calendarDays, setCalendarDays] = useState<{ date: string; hasWorkout: boolean }[]>([])

  useEffect(() => {
    calculateStats(workouts)
    generateCalendar(workouts)
  }, [workouts])

  const calculateStats = (wo: Workout[]) => {
    setTotalWorkouts(wo.length)
    
    const today = new Date()
    const thisMonth = wo.filter(w => {
      const d = new Date(w.date)
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    })
    setThisMonthWorkouts(thisMonth.length)

    const workoutDates = [...new Set(wo.map(w => w.date))].sort()
    let maxStreak = 0
    let tempStreak = 0

    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (workoutDates.includes(todayStr) || workoutDates.includes(yesterdayStr)) {
      for (let i = workoutDates.length - 1; i >= 0; i--) {
        const curr = new Date(workoutDates[i])
        const prev = i > 0 ? new Date(workoutDates[i - 1]) : null
        
        if (i === workoutDates.length - 1 || (prev && Math.abs((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)) <= 1)) {
          tempStreak++
        } else {
          maxStreak = Math.max(maxStreak, tempStreak)
          tempStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak)
      setCurrentStreak(maxStreak)
    }

    let longest = 0
    let current = 0
    for (let i = 0; i < workoutDates.length; i++) {
      if (i === 0) {
        current = 1
      } else {
        const d1 = new Date(workoutDates[i - 1])
        const d2 = new Date(workoutDates[i])
        const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 1) {
          current++
        } else {
          longest = Math.max(longest, current)
          current = 1
        }
      }
    }
    setLongestStreak(Math.max(longest, current))
  }

  const generateCalendar = (wo: Workout[]) => {
    const today = new Date()
    const workoutDates = new Set(wo.map(w => w.date))
    const days: { date: string; hasWorkout: boolean }[] = []
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toISOString().split('T')[0],
        hasWorkout: workoutDates.has(d.toISOString().split('T')[0])
      })
    }
    setCalendarDays(days)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5 text-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{currentStreak}</div>
            <div className="text-xs text-gray-400">Current Streak</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 text-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{longestStreak}</div>
            <div className="text-xs text-gray-400">Best Streak</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5 text-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{totalWorkouts}</div>
            <div className="text-xs text-gray-400">Total Workouts</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5 text-center">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{thisMonthWorkouts}</div>
            <div className="text-xs text-gray-400">This Month</div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
        <h4 className="font-semibold text-white mb-4">Last 28 Days</h4>
        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-gray-500">{d}</div>
          ))}
          {calendarDays.slice(0, 28).map((day, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                  day.hasWorkout
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'
                    : 'bg-gray-800/50 text-gray-600'
                }`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}
import { useMemo } from 'react'
import { TrendingUp, Flame, Dumbbell, Timer } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function WorkoutAnalytics() {
  const { workouts } = useAppStore()
  
  const stats = useMemo(() => {
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
    const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

    const typeCount: Record<string, number> = {}
    workouts.forEach(w => {
      typeCount[w.category] = (typeCount[w.category] || 0) + 1
    })
    const mostCommon = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const thisWeek = workouts.filter(w => new Date(w.date) >= thisWeekStart).length
    const lastWeek = workouts.filter(w => {
      const d = new Date(w.date)
      return d >= lastWeekStart && d < thisWeekStart
    }).length

    return {
      totalWorkouts: workouts.length,
      totalDuration,
      avgDuration: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0,
      totalExercises,
      mostCommonType: mostCommon,
      thisWeek,
      lastWeek,
    }
  }, [workouts])

  const getWeeklyData = () => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const dayWorkouts = workouts.filter(w => w.date === dayStr)
      const duration = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), duration, count: dayWorkouts.length })
    }
    return days
  }

  const getTypeDistribution = () => {
    const types: Record<string, number> = {}
    workouts.forEach(w => {
      types[w.category] = (types[w.category] || 0) + 1
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }

  const typeLabels: Record<string, string> = {
    strength: '🏋️ Strength',
    hypertrophy: '💪 Hypertrophy',
    cardio: '🏃 Cardio',
    hiit: '⚡ HIIT',
    functional: '🏋️ Functional',
    mobility: '🤸 Mobility',
    flexibility: '🧘 Flexibility',
    plyo: '🦘 Plyo',
    calisthenics: '🧗 Calisthenics',
    endurance: '🏃 Endurance',
    speed_agility: '🏃 Speed & Agility',
    balance_stability: '⚖️ Balance',
    core: '💪 Core',
    yoga: '🧘 Yoga',
    pilates: '🤸 Pilates',
    crossfit: '⚡ CrossFit',
    martial_arts: '🥋 Martial Arts',
    recovery: '🛌 Recovery',
    isometric: '🧊 Isometric',
    animal_flow: '🐾 Animal Flow',
    breathwork: '🌬️ Breathwork',
  }

  const weekData = getWeeklyData()
  const maxDuration = Math.max(...weekData.map(d => d.duration), 1)
  const weekChange = stats.lastWeek > 0 ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2">
              <Dumbbell className="w-4 h-4" />
              <span>Total Workouts</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalWorkouts}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-2">
              <Timer className="w-4 h-4" />
              <span>Avg Duration</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgDuration} min</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-orange-400/80 text-sm mb-2">
              <Flame className="w-4 h-4" />
              <span>This Week</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.thisWeek}</p>
          </div>
        </div>
        <div className={`relative overflow-hidden rounded-2xl border ${weekChange >= 0 ? 'border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent' : 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent'} p-5`}>
          <div className={`absolute top-0 right-0 w-20 h-20 ${weekChange >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-full -mr-10 -mt-10`} />
          <div className="relative">
            <div className={`flex items-center gap-2 text-sm mb-2 ${weekChange >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
              <TrendingUp className={`w-4 h-4 ${weekChange < 0 ? 'rotate-180' : ''}`} />
              <span>vs Last Week</span>
            </div>
            <p className={`text-3xl font-bold ${weekChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
        <h4 className="font-semibold text-white mb-4">Weekly Activity</h4>
        <div className="flex items-end gap-2 h-32">
          {weekData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                style={{ height: `${(d.duration / maxDuration) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
              />
              <span className="text-xs text-gray-500 mt-2">{d.day}</span>
              <span className="text-xs text-gray-600">{d.duration}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
          <h4 className="font-semibold text-white mb-3">Workout Types</h4>
          <div className="space-y-3">
            {getTypeDistribution().map(({ type, count }) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300">{typeLabels[type] || type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(count / stats.totalWorkouts) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm w-6">{count}</span>
                </div>
              </div>
            ))}
            {stats.totalWorkouts === 0 && <p className="text-gray-500 text-sm">No workouts yet</p>}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-gray-900/50 p-5">
          <h4 className="font-semibold text-white mb-3">Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Duration</span>
              <span className="text-white">{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Exercises</span>
              <span className="text-white">{stats.totalExercises}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Favorite Type</span>
              <span className="text-purple-400">{typeLabels[stats.mostCommonType] || stats.mostCommonType}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { TrendingUp, Flame, Dumbbell, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { storage, type Workout } from '@/lib/storage'

interface WorkoutStats {
  totalWorkouts: number
  totalDuration: number
  avgDuration: number
  totalExercises: number
  mostCommonType: string
  thisWeek: number
  lastWeek: number
}

export function WorkoutAnalytics() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalDuration: 0,
    avgDuration: 0,
    totalExercises: 0,
    mostCommonType: '-',
    thisWeek: 0,
    lastWeek: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const wo = await storage.getAll('workouts')
    setWorkouts(wo)
    calculateStats(wo)
  }

  const calculateStats = (wo: Workout[]) => {
    const totalDuration = wo.reduce((sum, w) => sum + (w.duration || 0), 0)
    const totalExercises = wo.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

    const typeCount: Record<string, number> = {}
    wo.forEach(w => {
      typeCount[w.type] = (typeCount[w.type] || 0) + 1
    })
    const mostCommon = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const thisWeek = wo.filter(w => new Date(w.date) >= thisWeekStart).length
    const lastWeek = wo.filter(w => {
      const d = new Date(w.date)
      return d >= lastWeekStart && d < thisWeekStart
    }).length

    setStats({
      totalWorkouts: wo.length,
      totalDuration,
      avgDuration: wo.length > 0 ? Math.round(totalDuration / wo.length) : 0,
      totalExercises,
      mostCommonType: mostCommon,
      thisWeek,
      lastWeek,
    })
  }

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
      types[w.type] = (types[w.type] || 0) + 1
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }

  const typeLabels: Record<string, string> = {
    strength: '🏋️ Strength',
    cardio: '🏃 Cardio',
    hiit: '⚡ HIIT',
    flexibility: '🧘 Flexibility',
  }

  const weekData = getWeeklyData()
  const maxDuration = Math.max(...weekData.map(d => d.duration), 1)
  const weekChange = stats.lastWeek > 0 ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Dumbbell className="w-4 h-4" />
              Total Workouts
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Timer className="w-4 h-4" />
              Avg Duration
            </div>
            <div className="text-2xl font-bold text-white">{stats.avgDuration} min</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Flame className="w-4 h-4" />
              This Week
            </div>
            <div className="text-2xl font-bold text-white">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card className={`backdrop-blur-xl border ${weekChange >= 0 ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <TrendingUp className={`w-4 h-4 ${weekChange >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              vs Last Week
            </div>
            <div className={`text-2xl font-bold ${weekChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
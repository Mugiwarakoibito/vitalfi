import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { 
  Dumbbell, 
  TrendingUp, 
  Plus, 
  ChevronLeft, 
  Target, 
  Zap, 
  Clock, 
  Activity,
  History,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { WorkoutForm } from '@/components/fitness/WorkoutForm'

export default function MovementTracker() {
  const { workouts, addWorkout } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  
  const stats = useMemo(() => {
    const last7Days = workouts.filter(w => {
      const diff = Date.now() - new Date(w.date).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })
    
    const activeDays = new Set(last7Days.map(w => 
      new Date(w.date).toDateString()
    )).size

    const calculateVolume = (wo: any) => {
      return (wo.exercises || []).reduce((acc: number, ex: any) => {
        return acc + (ex.sets || []).reduce((setAcc: number, set: any) => {
          return setAcc + ((set.weight || 0) * (set.reps || 0))
        }, 0)
      }, 0)
    }

    return {
      weeklyCount: last7Days.length,
      totalVolume: last7Days.reduce((acc, w) => acc + calculateVolume(w), 0),
      avgDuration: last7Days.length > 0 
        ? Math.round(last7Days.reduce((acc, w) => acc + w.duration, 0) / last7Days.length)
        : 0,
      targetProgress: Math.min(Math.round((last7Days.length / 4) * 100), 100),
      consistencyScore: Math.round((activeDays / 7) * 100)
    }
  }, [workouts])

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-cyan-400 transition-colors">
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <div className="space-y-1">
             <h2 className="text-xs font-black neon-text-cyan uppercase tracking-[0.3em] flex items-center gap-2">
                <Dumbbell size={14} />
                Physical Performance
             </h2>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Movement <span className="text-cyan-500">Tracker</span></h1>
          </div>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="glass-button-neon glass-button-neon-cyan px-8 py-4 flex items-center gap-3"
        >
          <Plus size={18} />
          <span>Initialize Session</span>
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Consistency', value: `${stats.consistencyScore}%`, icon: Target, color: 'neon-text-emerald' },
            { label: 'Sessions', value: stats.weeklyCount, icon: Activity, color: 'neon-text-purple' },
            { label: 'Avg Duration', value: `${stats.avgDuration} min`, icon: Clock, color: 'neon-text-amber' },
            { label: 'System Load', value: `${stats.targetProgress}%`, icon: Zap, color: 'neon-text-rose' },
          ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="neon-card neon-border-cyan p-6 group"
           >
              <div className={cn("p-2 rounded-lg bg-white/5 w-fit mb-4 transition-transform group-hover:scale-110", stat.color)}>
                 <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
           </motion.div>
         ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="neon-card p-8 bg-slate-900/20 border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                  <BarChart3 size={240} />
               </div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp size={16} className="text-cyan-400" />
                     Performance Velocity
                  </h3>
               </div>
               <div className="h-64 flex items-end justify-between gap-2 relative z-10">
                  {workouts.slice(-14).map((w, i) => {
                    const volume = (w.exercises || []).reduce((acc: number, ex: any) => {
                      return acc + (ex.sets || []).reduce((setAcc: number, set: any) => {
                        return setAcc + ((set.weight || 0) * (set.reps || 0))
                      }, 0)
                    }, 0)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                         <div className="relative w-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(volume / 50, 100)}%` }}
                              className="w-full bg-gradient-to-t from-cyan-600/20 to-cyan-400 rounded-t-lg shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:brightness-125 transition-all"
                            />
                         </div>
                         <span className="text-[10px] text-slate-600 font-bold uppercase">{new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                      </div>
                    )
                  })}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-purple-400" />
                  Session Logs
               </h3>
               <div className="space-y-4">
                  {workouts.slice(0, 5).map(w => (
                    <div key={w.id} className="neon-card p-5 border-white/5 hover:bg-white/[0.03] flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                             <Dumbbell size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{w.name || w.type}</p>
                             <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                <span>{new Date(w.date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{w.duration} MIN</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="neon-card p-6 neon-border-amber">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target size={14} className="text-amber-400" />
                  Active Directives
               </h3>
               <div className="space-y-6">
                  {[
                    { label: 'Weekly Sessions', current: stats.weeklyCount, target: 4, color: 'bg-cyan-500' },
                    { label: 'Volume Target', current: stats.totalVolume, target: 15000, color: 'bg-purple-500' },
                  ].map((goal, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{goal.label}</p>
                          <p className="text-xs font-black text-white">{goal.current} / {goal.target}</p>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                            className={cn("h-full rounded-full", goal.color)} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <WorkoutForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSave={async (w) => { await addWorkout(w); setShowForm(false) }} 
      />
    </div>
  )
}

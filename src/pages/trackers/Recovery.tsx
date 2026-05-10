import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { 
  Moon, 
  Plus, 
  ChevronLeft, 
  CloudMoon,
  Battery,
  Heart,
  Calendar,
  Activity,
  Waves
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { SleepForm } from '@/components/fitness/SleepForm'

export default function RecoveryTracker() {
  const { sleep, addSleep } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  
  const lastEntry = sleep[0] || { duration: 0, quality: 0, date: new Date().toISOString() }
  
  const sleepStats = useMemo(() => {
    const last7Days = sleep.slice(0, 7)
    const avgDuration = last7Days.length > 0 
      ? last7Days.reduce((acc, s) => acc + s.duration, 0) / last7Days.length 
      : 0
    const avgQuality = last7Days.length > 0 
      ? last7Days.reduce((acc, s) => acc + s.quality, 0) / last7Days.length 
      : 0
      
    return {
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgQuality: Math.round(avgQuality),
      readiness: 88,
      hrv: 64,
      restingHR: 52
    }
  }, [sleep])

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-purple-400 transition-colors">
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <div className="space-y-1">
             <h2 className="text-xs font-black neon-text-purple uppercase tracking-[0.3em] flex items-center gap-2">
                <Moon size={14} />
                Physiological Restoration
             </h2>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Recovery <span className="text-purple-500">Analytics</span></h1>
          </div>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="glass-button-neon glass-button-neon-purple px-8 py-4 flex items-center gap-3 border-purple-500/30 text-purple-400 hover:border-purple-400 hover:bg-purple-500/20"
        >
          <Plus size={18} />
          <span>Log Sleep</span>
        </button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="lg:col-span-1 neon-card neon-border-purple p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-purple-500/5 blur-[80px] rounded-full" />
            <div className="relative z-10 space-y-4">
               <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                     <motion.circle 
                       cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                       strokeDasharray={553} 
                       initial={{ strokeDashoffset: 553 }}
                       animate={{ strokeDashoffset: 553 - (553 * sleepStats.readiness / 100) }}
                       className="text-purple-500"
                       strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-6xl font-black text-white">{sleepStats.readiness}</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Readiness Score</span>
                  </div>
               </div>
               <p className="text-sm text-slate-400 max-w-[200px] mx-auto italic">"Optimal restoration detected. Your central nervous system is primed for intensity."</p>
            </div>
         </motion.div>

         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neon-card p-6 flex flex-col justify-between group">
               <div className="flex items-center justify-between mb-8">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                     <Heart size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Stable</span>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Autonomic Nervous System (HRV)</p>
                  <p className="text-4xl font-black text-white">{sleepStats.hrv} <span className="text-xs text-slate-500 font-bold uppercase ml-1">ms</span></p>
                  <div className="h-10 flex items-end gap-1 mt-4">
                     {[40, 55, 48, 62, 70, 64, 68].map((v, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ height: 0 }} 
                         animate={{ height: `${v}%` }} 
                         className="flex-1 bg-indigo-500/30 rounded-t-sm group-hover:bg-indigo-500 transition-all" 
                       />
                     ))}
                  </div>
               </div>
            </div>

            <div className="neon-card p-6 flex flex-col justify-between group">
               <div className="flex items-center justify-between mb-8">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                     <CloudMoon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target 8.0h</span>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Night's Restoration</p>
                  <p className="text-4xl font-black text-white">{lastEntry.duration} <span className="text-xs text-slate-500 font-bold uppercase ml-1">hours</span></p>
                  <div className="flex gap-1 mt-4">
                     {Array.from({ length: 8 }).map((_, i) => (
                       <div key={i} className={cn("h-2 flex-1 rounded-full", i < lastEntry.duration ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-white/5")} />
                     ))}
                  </div>
               </div>
            </div>

            <div className="neon-card p-6 flex flex-col justify-between group">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resting Heart Rate</p>
                  <Activity size={16} className="text-rose-400" />
               </div>
               <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-white">{sleepStats.restingHR} <span className="text-xs text-slate-500">BPM</span></p>
                  <p className="text-xs font-bold text-emerald-400 mb-1">-2 bpm</p>
               </div>
            </div>

            <div className="neon-card p-6 flex flex-col justify-between group">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deep Sleep Phase</p>
                  <Waves size={16} className="text-cyan-400" />
               </div>
               <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-white">1h 42m</p>
                  <p className="text-xs font-bold text-slate-500 mb-1">22% of total</p>
               </div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
               <Calendar size={16} className="text-purple-400" />
               Sleep Architecture History
            </h3>
            <div className="space-y-4">
               {sleep.slice(0, 5).map(s => (
                 <div key={s.id} className="neon-card p-5 border-white/5 hover:bg-white/[0.03] flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                          <Moon size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                       </div>
                    </div>
                    <p className="text-xl font-black text-white">{s.duration} <span className="text-[10px] text-slate-500">HRS</span></p>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-8">
            <div className="neon-card p-6 neon-border-cyan bg-gradient-to-br from-slate-900 to-cyan-950/20">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Battery size={14} className="text-cyan-400" />
                  Bio-Battery Status
               </h3>
               <div className="space-y-6">
                  <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '88%' }}
                       className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <SleepForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSave={async (s: any) => { await addSleep(s); setShowForm(false) }} 
      />
    </div>
  )
}

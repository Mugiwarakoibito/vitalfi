import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Plus, 
  ChevronLeft, 
  Zap, 
  Focus,
  Lightbulb,
  Shield,
  Activity,
  Target,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function MindsetTracker() {
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  
  useEffect(() => {
    let interval: any
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-amber-400 transition-colors">
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <div className="space-y-1">
             <h2 className="text-xs font-black neon-text-amber uppercase tracking-[0.3em] flex items-center gap-2">
                <Brain size={14} />
                Cognitive Performance
             </h2>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Mindset <span className="text-amber-500">Core</span></h1>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button 
             className="glass-button-neon px-8 py-4 flex items-center gap-3 border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20"
           >
             <Plus size={18} />
             <span>Log Reflection</span>
           </button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Focus Engine */}
         <div className="lg:col-span-2 space-y-8">
            <div className="neon-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-amber-950/20">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <Focus size={400} className="absolute -top-20 -right-20" />
               </div>
               
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.4em]">Deep Work Protocol</p>
                     <p className="text-8xl font-black text-white font-mono">{formatTime(timeLeft)}</p>
                  </div>
                  
                  <div className="flex justify-center gap-6">
                     <button 
                       onClick={() => setTimerActive(!timerActive)}
                       className={cn(
                         "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                         timerActive ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                       )}
                     >
                        {timerActive ? <Zap size={24} className="animate-pulse" /> : <Activity size={24} />}
                     </button>
                     <button 
                       onClick={() => { setTimerActive(false); setTimeLeft(25 * 60) }}
                       className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-all"
                     >
                        <RefreshCcw size={20} />
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="neon-card p-6 border-white/5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Target size={14} className="text-amber-400" />
                     Primary Focus
                  </h3>
                  <div className="space-y-4">
                     <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <p className="text-sm font-bold text-white">System Overhaul</p>
                        <span className="text-[10px] font-black text-emerald-400 uppercase">Active</span>
                     </div>
                     <p className="text-xs text-slate-500 leading-relaxed">Currently allocating 65% of cognitive resources to high-velocity development.</p>
                  </div>
               </div>

               <div className="neon-card p-6 border-white/5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Activity size={14} className="text-indigo-400" />
                     Stress Load
                  </h3>
                  <div className="space-y-4">
                     <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-white">Low</p>
                        <p className="text-xs font-bold text-emerald-400 mb-1">Recovered</p>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '24%' }}
                          className="h-full bg-emerald-500" 
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar: Cognitive Analysis */}
         <div className="space-y-8">
            <div className="neon-card p-6 neon-border-amber relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                  <Sparkles size={140} />
               </div>
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                  <Lightbulb size={14} className="text-amber-400" />
                  AI Intelligence
               </h3>
               <div className="space-y-6 relative z-10">
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                     "Your focus efficiency peaks between 9:00 AM and 11:30 AM. Today's cognitive readiness is high. Recommendation: tackle your most complex Directive now."
                  </p>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                     <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Estimated Focus Duration</p>
                     <p className="text-lg font-black text-white">4h 15m remaining</p>
                  </div>
               </div>
            </div>

            <div className="neon-card p-6">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Shield size={14} className="text-indigo-400" />
                  Mental Resilience
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Consistency', value: '14 Day Streak', progress: 100, color: 'bg-emerald-500' },
                    { label: 'Attention Span', value: 'Improving', progress: 65, color: 'bg-indigo-500' },
                    { label: 'Emotional Balance', value: 'Optimal', progress: 88, color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400 uppercase">{item.label}</span>
                          <span className="text-white">{item.value}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            className={cn("h-full rounded-full", item.color)} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

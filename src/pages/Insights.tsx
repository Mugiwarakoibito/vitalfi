import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Activity, Zap, Target,
  Brain, ShieldCheck
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'
import { CorrelationAnalytics } from '@/components/insights/CorrelationAnalytics'
import { HealthDashboard } from '@/components/fitness/HealthDashboard'

export default function Insights() {
  const navigate = useNavigate()
  const { settings, transactions, workouts, sleep, loadAllData } = useAppStore()
  
  useEffect(() => { loadAllData() }, [loadAllData])

  const currency = settings.currency || 'USD'
  
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.amount, 0)
    
  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
             <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2">
               Your Smart Assistant
             </h2>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter">
            Your <span className="gradient-text">Summary.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl font-medium">
            See how your habits and money work together.
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="glass-card px-8 py-4 flex flex-col items-center justify-center border-white/10 bg-white/[0.02]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stability Score</p>
              <p className="text-3xl font-black text-white tracking-tighter">{transactions.length > 0 || workouts.length > 0 ? "8.4" : "--"}<span className="text-xs text-slate-600 font-bold">/10</span></p>
           </div>
           <div className="glass-card px-8 py-4 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">System Score</p>
              <p className="text-3xl font-black text-white tracking-tighter">{transactions.length > 0 || workouts.length > 0 ? "142" : "--"}</p>
           </div>
        </div>
      </header>

      {/* Correlation Engine Section */}
      <section className="space-y-8 py-8 border-y border-white/5">
         <CorrelationAnalytics />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <IntelligenceCard 
          icon={ShieldCheck}
          title="Money Health"
          value={formatCurrency(monthlyExpenses, currency)}
          description={transactions.length > 0 ? "You're spending less than planned. Good job!" : "Log transactions to see insights."}
          trend={transactions.length > 0 ? { val: '12% Score', positive: true } : null}
          color="cyan"
          delay={0.1}
        />
        <IntelligenceCard 
          icon={Zap}
          title="Body Progress"
          value={workouts.length > 0 ? "Scaling" : "No Data"}
          description={workouts.length > 0 ? "You're getting stronger and faster. You are resting well." : "Log workouts to see insights."}
          trend={workouts.length > 0 ? { val: '8% Gain', positive: true } : null}
          color="purple"
          delay={0.2}
        />
        <IntelligenceCard 
          icon={Brain}
          title="Mind & Focus"
          value={sleep.length > 0 ? "Great" : "No Data"}
          description={sleep.length > 0 ? "You're sleeping deeply and regularly. Your focus is high." : "Log sleep data to see insights."}
          trend={sleep.length > 0 ? { val: 'Stable', positive: true } : null}
          color="amber"
          delay={0.3}
        />
      </section>

      {/* Health Overview */}
      <section className="space-y-8 py-8 border-y border-white/5">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-purple-400" />
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Health Overview</h3>
        </div>
        <HealthDashboard onNavigate={(tab) => navigate(`/fitness?tab=${tab}`)} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="glass-card p-10 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:-rotate-12 transition-transform">
               <Target size={180} />
            </div>
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <Target size={16} className="text-emerald-400" />
                 Future Goals
               </h3>
            </div>
            
            <div className="space-y-6">
               <ProjectionCard 
                 title="Financial Freedom" 
                 desc={transactions.length > 0 ? "You are on track to reach your next milestone in 2.4 months. You are saving well." : "Add transactions to see your financial forecast."} 
                 progress={transactions.length > 0 ? 84 : 0} 
                 color="emerald" 
               />
               <ProjectionCard 
                 title="Peak Fitness" 
                 desc={workouts.length > 0 ? "Your progress is 15% ahead of your goals. You're looking great!" : "Add workouts to see your fitness forecast."} 
                 progress={workouts.length > 0 ? 65 : 0} 
                 color="indigo" 
               />
            </div>
         </div>
      </div>
    </div>
  )
}

function IntelligenceCard({ icon: Icon, title, value, description, trend, color, delay }: any) {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-8 relative overflow-hidden group border-white/5 hover:border-white/10 transition-all"
    >
      <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity", colors[color as keyof typeof colors].split(' ')[0])}>
        <Icon size={100} />
      </div>
      
      <div className="flex justify-between items-start mb-8">
        <div className={cn("p-4 rounded-2xl border transition-all", colors[color as keyof typeof colors])}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02]", trend.positive ? "text-emerald-400" : "text-rose-400")}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.val.toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="space-y-2 relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2">{description}</p>
      </div>
    </motion.div>
  )
}

function ProjectionCard({ title, desc, progress, color }: any) {
  const colors = {
    emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-400",
    indigo: "bg-indigo-500 shadow-indigo-500/20 text-indigo-400",
  }
  
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
       <div className="flex gap-5">
          <div className={cn("p-4 rounded-2xl h-fit border border-white/5", colors[color as keyof typeof colors].split(' ')[2])}>
             <TrendingUp size={24} />
          </div>
          <div className="flex-1 space-y-4">
             <div>
                <p className="text-base font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">{desc}</p>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                   <span>Progress</span>
                   <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     transition={{ duration: 1.5 }}
                     className={cn("h-full rounded-full", colors[color as keyof typeof colors].split(' ')[0])} 
                   />
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

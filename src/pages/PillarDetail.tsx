import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  Dumbbell, 
  Utensils, 
  Moon, 
  Brain, 
  Users,
  Zap,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PILLAR_CONFIG = {
  movement: { icon: Dumbbell, color: 'text-indigo-400', bg: 'bg-indigo-400/10', title: 'Movement', desc: 'Optimizing physical performance and strength.' },
  nutrition: { icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Nutrition', desc: 'Fueling your biology for maximum vitality.' },
  recovery: { icon: Moon, color: 'text-purple-400', bg: 'bg-purple-400/10', title: 'Recovery', desc: 'The science of sleep and restorative health.' },
  mindset: { icon: Brain, color: 'text-amber-400', bg: 'bg-amber-400/10', title: 'Mindset', desc: 'Cultivating focus and mental resilience.' },
  social: { icon: Users, color: 'text-rose-400', bg: 'bg-rose-400/10', title: 'Social', desc: 'Building connections and social stability.' },
}

export default function PillarDetail() {
  const { id } = useParams()
  const pillar = PILLAR_CONFIG[id as keyof typeof PILLAR_CONFIG] || PILLAR_CONFIG.movement
  const Icon = pillar.icon

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-6">
        <Link to="/" className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
          <ChevronLeft size={14} /> Back to Command Center
        </Link>
        <div className="flex items-center gap-6">
          <div className={cn("p-5 rounded-3xl", pillar.bg, pillar.color)}>
            <Icon size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">{pillar.title}</h1>
            <p className="text-lg text-slate-400">{pillar.desc}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-6 col-span-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Performance Trend</h3>
            <div className="h-64 flex items-end justify-between gap-2">
               {[40, 60, 45, 80, 90, 75, 95].map((val, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("w-full rounded-t-lg", pillar.bg.replace('/10', ''))} 
                    />
                    <span className="text-[10px] text-slate-600 font-bold uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="space-y-6">
            <div className="glass-card p-6">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pillar Health</p>
               <p className="text-3xl font-black text-white">92%</p>
               <div className="mt-4 flex items-center gap-2 text-emerald-400">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold">+8% from last week</span>
               </div>
            </div>
            
            <div className="glass-card p-6 bg-gradient-to-br from-slate-900 to-indigo-950/30">
               <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">AI Optimization</p>
               <p className="text-sm text-slate-300 leading-relaxed">
                  "Based on your {pillar.title.toLowerCase()} trends, scheduling intense sessions between 8:00 AM and 10:00 AM will maximize your physiological output."
               </p>
            </div>
         </div>
      </section>

      <section className="space-y-6">
         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Core Metrics</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Intensity', value: 'High', icon: Zap },
              { label: 'Consistency', value: '12 Day Streak', icon: Target },
              { label: 'Volume', value: '240 Units', icon: Dumbbell },
              { label: 'Recovery Time', value: '14h 20m', icon: Clock },
            ].map((metric, i) => (
              <div key={i} className="glass-card p-5 flex items-center gap-4">
                 <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                    <metric.icon size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{metric.label}</p>
                    <p className="text-sm font-bold text-white">{metric.value}</p>
                 </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { 
  Utensils, 
  Plus, 
  ChevronLeft, 
  Target, 
  Zap, 
  Clock, 
  PieChart as PieIcon,
  Coffee,
  Droplets,
  Flame,
  Scale
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MealForm } from '@/components/fitness/MealForm'

export default function NutritionTracker() {
  const { meals, addMeal } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  
  const dailyStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaysMeals = meals.filter(m => new Date(m.date) >= today)
    
    return {
      totalCalories: todaysMeals.reduce((acc, m) => acc + m.calories, 0),
      protein: todaysMeals.reduce((acc, m) => acc + (m.protein || 0), 0),
      carbs: todaysMeals.reduce((acc, m) => acc + (m.carbs || 0), 0),
      fat: todaysMeals.reduce((acc, m) => acc + (m.fat || 0), 0),
      targetCalories: 2500,
      targetProtein: 180,
      targetCarbs: 250,
      targetFat: 80
    }
  }, [meals])

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-emerald-400 transition-colors">
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <div className="space-y-1">
             <h2 className="text-xs font-black neon-text-emerald uppercase tracking-[0.3em] flex items-center gap-2">
                <Utensils size={14} />
                Biological Fueling
             </h2>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Nutrition <span className="text-emerald-500">System</span></h1>
          </div>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="glass-button-neon glass-button-neon-emerald px-8 py-4 flex items-center gap-3"
        >
          <Plus size={18} />
          <span>Log Intake</span>
        </button>
      </header>

      {/* Main Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="lg:col-span-2 neon-card neon-border-emerald p-8 flex items-center justify-between overflow-hidden relative"
         >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
               <Flame size={120} />
            </div>
            <div className="space-y-6 relative z-10">
               <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Daily Caloric Load</p>
                  <p className="text-6xl font-black text-white">{dailyStats.totalCalories} <span className="text-xl text-slate-500">KCAL</span></p>
               </div>
               <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                     <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Remaining</p>
                     <p className="text-lg font-black text-white">{Math.max(dailyStats.targetCalories - dailyStats.totalCalories, 0)}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Target</p>
                     <p className="text-lg font-black text-white">{dailyStats.targetCalories}</p>
                  </div>
               </div>
            </div>
            <div className="hidden md:block relative h-32 w-32">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <motion.circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={364} 
                    initial={{ strokeDashoffset: 364 }}
                    animate={{ strokeDashoffset: 364 - (364 * Math.min(dailyStats.totalCalories / dailyStats.targetCalories, 1)) }}
                    className="text-emerald-500"
                    strokeLinecap="round"
                  />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-black text-white">{Math.round((dailyStats.totalCalories / dailyStats.targetCalories) * 100)}%</p>
               </div>
            </div>
         </motion.div>

         <div className="neon-card neon-border-purple p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Scale size={14} className="text-purple-400" />
               Macro Balance
            </h3>
            <div className="space-y-4">
               {[
                 { label: 'Protein', current: dailyStats.protein, target: dailyStats.targetProtein, color: 'bg-indigo-500' },
                 { label: 'Carbs', current: dailyStats.carbs, target: dailyStats.targetCarbs, color: 'bg-emerald-500' },
                 { label: 'Fat', current: dailyStats.fat, target: dailyStats.targetFat, color: 'bg-amber-500' },
               ].map((m, i) => (
                 <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-slate-400 uppercase">{m.label}</span>
                       <span className="text-white">{m.current}g / {m.target}g</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((m.current / m.target) * 100, 100)}%` }}
                         className={cn("h-full rounded-full", m.color)} 
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="neon-card neon-border-cyan p-6 flex flex-col justify-between group">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hydration Level</p>
               <div className="flex items-center gap-3">
                  <Droplets className="text-cyan-400" size={24} />
                  <p className="text-3xl font-black text-white">2.4 <span className="text-xs text-slate-500">L</span></p>
               </div>
            </div>
            <div className="grid grid-cols-8 gap-1 mt-4">
               {[1,1,1,1,1,0,0,0].map((v, i) => (
                 <div key={i} className={cn("h-8 rounded-md transition-all", v ? "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "bg-white/5")} />
               ))}
            </div>
            <button className="mt-4 w-full py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all">+ 250ml</button>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Meal Log */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-emerald-400" />
                  Intake Timeline
               </h3>
            </div>
            <div className="space-y-4">
               {meals.slice(0, 5).map(m => (
                 <div key={m.id} className="neon-card p-5 border-white/5 hover:bg-white/[0.03] flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                          <Coffee size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{m.name}</p>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                             <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             <span>•</span>
                             <span>P: {m.protein}g</span>
                             <span>•</span>
                             <span>C: {m.carbs}g</span>
                             <span>•</span>
                             <span>F: {m.fat}g</span>
                          </div>
                       </div>
                    </div>
                    <p className="text-xl font-black text-white">{m.calories} <span className="text-[10px] text-slate-500">KCAL</span></p>
                 </div>
               ))}
            </div>
         </div>

         {/* Sidebar: AI Analysis */}
         <div className="space-y-8">
            <div className="neon-card p-6 neon-border-rose bg-gradient-to-br from-slate-900 to-rose-950/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                  <PieIcon size={140} />
               </div>
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                  <Zap size={14} className="text-rose-400" />
                  Metabolic Analysis
               </h3>
               <div className="space-y-4 relative z-10">
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                     "Your current macro distribution is protein-dominant (38%). This aligns with your goal of muscle preservation during fat loss."
                  </p>
               </div>
            </div>

            <div className="neon-card p-6">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target size={14} className="text-emerald-400" />
                  Optimization Targets
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Fiber Intake', value: '18g / 30g', progress: 60, color: 'bg-emerald-500' },
                    { label: 'Micronutrient Index', value: 'High', progress: 85, color: 'bg-indigo-500' },
                    { label: 'Sodium Balance', value: 'Optimal', progress: 40, color: 'bg-amber-500' },
                  ].map((target, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400 uppercase">{target.label}</span>
                          <span className="text-white">{target.value}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${target.progress}%` }}
                            className={cn("h-full rounded-full", target.color)} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <MealForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSave={async (m: any) => { await addMeal(m); setShowForm(false) }} 
      />
    </div>
  )
}

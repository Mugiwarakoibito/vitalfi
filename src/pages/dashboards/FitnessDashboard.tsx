import { motion } from 'framer-motion'
import { 
  Zap, Dumbbell, Utensils, Moon, Brain, Users,
  Activity, ChevronRight, Plus, Heart, Flame,
  Timer, Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculatePillars, calculateReadinessScore } from '@/lib/pillars'
import { generateForecast } from '@/lib/forecasting'
import { useAppStore } from '@/store/useAppStore'
import type { BiologicalSex } from '@/lib/calculations'
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { useNavigate } from 'react-router-dom'

function MetricCard({ label, value, trend, positive, icon: Icon, color, onClick }: any) {
  const colorClasses: any = {
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' },
    lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/20', text: 'text-lime-400', glow: 'shadow-[0_0_15px_rgba(132,204,22,0.1)]' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]' },
  }
  const colors = colorClasses[color] || colorClasses.purple
  
  return (
    <button onClick={onClick} className={cn("glass-card p-6 rounded-2xl text-left hover:scale-[1.02] transition-transform", colors.bg, colors.border, colors.glow)}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={20} className={colors.text} />
      </div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className={cn("h-1.5 w-1.5 rounded-full", positive ? "bg-emerald-400" : "bg-slate-600")} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{trend}</span>
      </div>
    </button>
  )
}

export function FitnessDashboard() {
  const navigate = useNavigate()
  const { settings, workouts, meals, sleep } = useAppStore()
  
  const pillars = calculatePillars({
    workouts,
    meals,
    sleep,
    activityLevel: settings.activityLevel || 'moderate',
    targets: {
      workoutsPerWeek: 4,
      caloriesPerDay: 2500,
      sleepHoursPerDay: 8
    }
  })

  const readinessScore = calculateReadinessScore({
    sleep,
    workouts
  })

  const avgPillarProgress = Math.round(pillars.reduce((a, p) => a + p.progress, 0) / pillars.length)
  const healthScore = Math.round(readinessScore * 0.5 + avgPillarProgress * 0.5)
  const hasNoFitnessData = workouts.length === 0 && meals.length === 0 && sleep.length === 0

  const forecast = generateForecast({
    workouts,
    meals,
    sleep,
    settings: {
      weightKg: settings.weightKg || 75,
      heightCm: settings.heightCm || 175,
      age: settings.age || 30,
      sex: (settings.sex === 'other' ? 'male' : settings.sex) as BiologicalSex || 'male',
      activityLevel: settings.activityLevel || 'moderate'
    }
  })

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-12">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Dumbbell size={300} className="text-purple-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <StreakStatus />
          <div className="flex items-center gap-3">
            {(() => {
            const s = hasNoFitnessData
              ? { color: 'text-slate-500', ping: 'bg-slate-400', text: 'Get Started' }
              : healthScore >= 80
              ? { color: 'text-emerald-400', ping: 'bg-emerald-400', text: 'Health Status: Peak' }
              : healthScore >= 60
              ? { color: 'text-purple-400', ping: 'bg-purple-500', text: 'Health Status: Feeling Good' }
              : healthScore >= 40
              ? { color: 'text-blue-400', ping: 'bg-blue-400', text: 'Health Status: Steady' }
              : healthScore >= 20
              ? { color: 'text-amber-400', ping: 'bg-amber-400', text: 'Health Status: Need Rest' }
              : { color: 'text-rose-400', ping: 'bg-rose-400', text: 'Health Status: Critical' }
            return <>
              <div className={cn("h-2 w-2 rounded-full animate-ping shadow-[0_0_8px_rgba(168,85,247,0.5)]", s.ping)} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]"><span className={s.color}>{s.text}</span></h2>
            </>
          })()}
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
            {workouts.length > 0 || meals.length > 0 || sleep.length > 0 ? (
              <>Ready, <span className="gradient-text">{settings.name || 'Champion'}</span>?</>
            ) : (
              <>Ignite Your <span className="gradient-text">Potential</span>.</>
            )}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl font-medium">
            {hasNoFitnessData ? (
              <>Ignite your potential. Record your first workout and watch the transformation begin.</>
            ) : healthScore >= 60 ? (
              <>Your energy levels are high! Today is a great day to get things done.</>
            ) : healthScore > 0 ? (
              <>You might be a bit tired today. We recommend taking it easy and getting some rest.</>
            ) : (
              <>Keep tracking your health metrics to see your progress.</>
            )}
          </p>
<div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/fitness?tab=workouts&action=add')} className="glass-card bg-purple-500/10 border-purple-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-500/20 transition-all group">
              <Plus size={20} className="text-purple-400 group-hover:rotate-90 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Add Workout</span>
            </button>
            <button onClick={() => navigate('/fitness?tab=streak')} className="glass-card bg-white/5 border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all">
              <Zap size={20} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Daily Check-in</span>
            </button>
          </div>
        </div>
      </section>

      {/* Primary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          onClick={() => navigate('/fitness?tab=workouts')}
          label="Total Workouts" 
          value={workouts.length.toString()} 
          trend={workouts.length > 0 ? "+this month" : "0"} 
          positive={workouts.length > 0}
          icon={Dumbbell} 
          color="purple" 
        />
        <MetricCard 
          onClick={() => navigate('/fitness?tab=body')}
          label="Body Score" 
          value={settings.weightKg ? `${settings.weightKg}kg` : '--'} 
          trend={settings.weightKg ? "tracked" : "No data"} 
          positive={!!settings.weightKg}
          icon={Activity} 
          color="lime" 
        />
        <MetricCard 
          onClick={() => navigate('/fitness?tab=sleep')}
          label="Sleep Avg" 
          value={sleep.length > 0 ? `${Math.round(sleep.reduce((acc, item) => acc + (item.duration || 0), 0) / sleep.length * 10) / 10}h` : '--'} 
          trend={sleep.length > 0 ? "this week" : "No data"} 
          positive={sleep.length >= 3}
          icon={Moon} 
          color="indigo" 
        />
        <MetricCard 
          onClick={() => navigate('/fitness?tab=nutrition')}
          label="Meals Logged" 
          value={meals.length.toString()} 
          trend={meals.length > 0 ? "+this week" : "0"} 
          positive={meals.length > 0}
          icon={Utensils} 
          color="lime" 
        />
</section>

      {/* Pillar Performance */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Daily Habits</h3>
          <button onClick={() => navigate('/insights')} className="text-[10px] text-purple-400 font-black flex items-center gap-2 hover:brightness-125 transition-all uppercase tracking-widest">
            See Details <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {pillars.map((p, i) => (
            <PillarCard 
              key={p.label} 
              onClick={() => navigate(p.label === 'Movement' ? '/pillars/movement' : p.label === 'Nutrition' ? '/pillars/nutrition' : p.label === 'Recovery' ? '/pillars/recovery' : p.label === 'Mindset' ? '/pillars/mindset' : '/pillars/social')}
              label={p.label === 'Movement' ? 'Workouts' : p.label === 'Nutrition' ? 'Food' : p.label === 'Recovery' ? 'Sleep' : p.label === 'Mindset' ? 'Focus' : 'Friends'}
              status={p.status}
              progress={p.progress}
              delay={0.1 * i} 
            />
          ))}
        </div>
      </section>

      {/* Intelligence & Biometrics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Predictive & Live Intelligence */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ForecastCard 
                onClick={() => navigate('/fitness?tab=body')}
                label="Weight Progress" 
                value={workouts.length > 0 || meals.length > 0 ? (forecast.energyBalance.predictedWeightChangeKg > 0 ? `+${forecast.energyBalance.predictedWeightChangeKg.toFixed(2)}kg` : `${forecast.energyBalance.predictedWeightChangeKg.toFixed(2)}kg`) : "--"}
                trend={workouts.length > 0 || meals.length > 0 ? (forecast.energyBalance.trend === 'improving' ? 'Good Progress' : 'Needs attention') : "No Data"}
                icon={Flame}
                color="orange"
              />
              <ForecastCard 
                onClick={() => navigate('/fitness?tab=sleep')}
                label="How you're resting" 
                value={sleep.length > 0 ? "Improving" : "--"}
                trend={sleep.length > 0 ? `Ready in ${forecast.recoveryForecast.length} days` : "No Data"}
                icon={Heart}
                color="rose"
              />
              <ForecastCard 
                onClick={() => navigate('/fitness?tab=body')}
                label="Best time to train" 
                value={workouts.length > 0 ? forecast.peakPerformanceDate : "--"}
                trend={workouts.length > 0 ? "Peak energy window" : "No Data"}
                icon={Compass}
                color="cyan"
              />
           </div>

           {/* Insights Stream */}
           <div className="glass-card p-10 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                 <Brain size={200} className="text-purple-400" />
              </div>
              <div className="space-y-8 relative z-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Your Daily Tips</h3>
                    <div className="flex gap-2">
                       <div className="h-1.5 w-12 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                       <div className="h-1.5 w-4 rounded-full bg-white/5" />
                       <div className="h-1.5 w-4 rounded-full bg-white/5" />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <InsightItem 
                      icon={Activity} 
                      title="Workout Streak" 
                      content={workouts.length > 0 ? `Your consistency is ${pillars[0].progress > 80 ? 'Great' : 'Needs work'}. You are at ${pillars[0].progress}% of your goal.` : "Log workouts to see your streak analysis."}
                      color="cyan"
                    />
                    <InsightItem 
                      icon={Timer} 
                      title="Sleep Pattern" 
                      content={sleep.length > 0 ? "We detected you might be staying up late. Try to put your phone away by 8:30 PM for better sleep." : "Log sleep data to receive personalized pattern analysis."}
                      color="purple"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Community & Social Activity */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Friends & Activity</h3>
              <Users size={14} className="text-slate-600" />
           </div>
           <div className="glass-card p-6 border-white/5 space-y-6 h-[calc(100%-3rem)]">
               <div className="space-y-4">
                  <div className="py-20 text-center space-y-4">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                        <Users size={24} />
                     </div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase">No social activity yet</p>
                  </div>
               </div>
              <button onClick={() => navigate('/pillars/social')} className="w-full py-4 glass-card bg-white/[0.02] border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                 Find New Friends
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}

function PillarCard({ label, status, progress, delay = 0, onClick }: any) {
  const PILLAR_CONFIG = {
    Workouts: { icon: Dumbbell, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/10' },
    Food: { icon: Utensils, color: 'text-lime-400', border: 'border-lime-500/20', bg: 'bg-lime-500/10' },
    Sleep: { icon: Moon, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
    Focus: { icon: Brain, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
    Friends: { icon: Users, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' }
  }
  
  const config = PILLAR_CONFIG[label as keyof typeof PILLAR_CONFIG] || PILLAR_CONFIG.Workouts
  const Icon = config.icon

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      onClick={onClick}
      className={cn("glass-card p-6 group cursor-pointer border-white/5 hover:border-white/10 transition-all", config.border)}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", config.bg, config.color)}>
          <Icon size={22} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-bold text-white">{status}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, delay: delay + 0.5 }}
            className={cn("h-full rounded-full", config.color.replace('text-', 'bg-'))} 
          />
        </div>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{progress}% Done</p>
      </div>
    </motion.div>
  )
}

function ForecastCard({ label, value, trend, icon: Icon, color, onClick }: any) {
  const colorMap = {
    orange: "text-orange-400 bg-orange-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
  }
  
  return (
    <div onClick={onClick} className="glass-card p-6 border-white/5 group relative overflow-hidden cursor-pointer">
      <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity", colorMap[color as keyof typeof colorMap].split(' ')[0])}>
        <Icon size={48} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
      <p className={cn("text-[10px] font-bold mt-2 uppercase tracking-widest", colorMap[color as keyof typeof colorMap].split(' ')[0])}>{trend}</p>
    </div>
  )
}

function InsightItem({ icon: Icon, title, content, color }: any) {
  const colorClass = color === 'cyan' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  
  return (
    <div className="flex gap-6 items-start">
      <div className={cn("p-4 rounded-2xl border flex-shrink-0", colorClass)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-base font-black text-white mb-2 uppercase tracking-tight">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {content}
        </p>
      </div>
    </div>
  )
}

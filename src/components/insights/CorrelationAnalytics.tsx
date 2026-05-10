import { motion } from 'framer-motion'
import { Brain, Zap, TrendingUp, TrendingDown, Info, Link2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function CorrelationAnalytics() {
  const { transactions, workouts } = useAppStore()

  // Mock logic for correlation insights - wait for sufficient data
  const hasData = transactions.length > 0 && workouts.length > 0

  const insights = [
    {
      id: 1,
      title: "Gym ROI Analysis",
      description: "Your gym membership ($50/mo) correlates with 15% better workout consistency compared to previous months.",
      impact: "+15%",
      type: "positive",
      icon: TrendingUp,
      color: "text-emerald-400"
    },
    {
      id: 2,
      title: "Rest Day Spending Leak",
      description: "Eating out spending increases 30% on rest days. Suggested: Meal prep on Sunday to mitigate rest-day leakage.",
      impact: "-30%",
      type: "negative",
      icon: TrendingDown,
      color: "text-rose-400"
    },
    {
      id: 3,
      title: "Fiscal-Physiological Stress",
      description: "Sleep quality drops 20% during high-spending weeks ($1,500+). Correlation detected between capital outflow and cortisol levels.",
      impact: "-20%",
      type: "warning",
      icon: Zap,
      color: "text-amber-400"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          Cross-Domain Correlation Engine
        </h3>
        <Link2 size={14} className="text-slate-700" />
      </div>

      {!hasData ? (
        <div className="glass-card p-12 border-white/5 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
             <Brain size={32} />
          </div>
          <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Gathering Intelligence</p>
          <p className="text-[10px] text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
            The cross-domain engine requires both financial and fitness data to detect hidden correlations. Log transactions and workouts to unlock these insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 border-white/5 relative overflow-hidden group"
            >
              <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity", insight.color)}>
                <insight.icon size={40} />
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-black text-white uppercase tracking-tight">{insight.title}</p>
                  <span className={cn("text-xs font-black px-2 py-0.5 rounded-md bg-white/5", insight.color)}>
                    {insight.impact}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  {insight.description}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Info size={12} className="text-slate-700" />
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">Confidence: 89%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import { 
  Users, 
  ChevronLeft, 
  MessageSquare,
  Share2,
  Heart,
  Globe,
  Target,
  Activity,
  UserPlus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function SocialTracker() {
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-rose-400 transition-colors">
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <div className="space-y-1">
             <h2 className="text-xs font-black neon-text-rose uppercase tracking-[0.3em] flex items-center gap-2">
                <Users size={14} />
                Network Intelligence
             </h2>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Social <span className="text-rose-500">Capital</span></h1>
          </div>
        </div>
        
        <button 
          className="glass-button-neon px-8 py-4 flex items-center gap-3 border-rose-500/30 text-rose-400 hover:border-rose-400 hover:bg-rose-500/20"
        >
          <UserPlus size={18} />
          <span>New Connection</span>
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="neon-card neon-border-rose p-6 group"
         >
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                  <Activity size={20} />
               </div>
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Positive</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Network Velocity</p>
            <p className="text-3xl font-black text-white">8.5 <span className="text-xs text-slate-500">/ 10</span></p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="neon-card neon-border-rose p-6 group"
         >
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Share2 size={20} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Collaboration Index</p>
            <p className="text-3xl font-black text-white">64%</p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="neon-card neon-border-rose p-6 group"
         >
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Globe size={20} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Community Reach</p>
            <p className="text-3xl font-black text-white">12.4k</p>
         </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Network Feed */}
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
               <MessageSquare size={16} className="text-rose-400" />
               Collaboration Pipeline
            </h3>
            <div className="space-y-4">
               {[
                 { user: 'Sarah Jenkins', role: 'Performance Coach', time: '2h ago', status: 'Active', message: 'Ready for the Q2 strategy session.' },
                 { user: 'Michael Chen', role: 'Lead Architect', time: '5h ago', status: 'Pending', message: 'New system architecture review requested.' },
                 { user: 'Emma Wilson', role: 'Health Strategist', time: '1d ago', status: 'Completed', message: 'Biometric integration successful.' },
               ].map((item, i) => (
                 <div key={i} className="neon-card p-5 border-white/5 hover:bg-white/[0.03] flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white font-black">
                          {item.user.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">{item.user}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{item.role}</p>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-md">{item.message}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">{item.time}</p>
                       <span className={cn(
                         "text-[10px] font-black uppercase px-2 py-1 rounded",
                         item.status === 'Active' ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 bg-white/5"
                       )}>{item.status}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Sidebar: Social Analysis */}
         <div className="space-y-8">
            <div className="neon-card p-6 neon-border-rose bg-gradient-to-br from-slate-900 to-rose-950/20">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Heart size={14} className="text-rose-400" />
                  Social Energy Status
               </h3>
               <div className="space-y-6">
                  <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '64%' }}
                       className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                     />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                     "Your social battery is currently at 64%. Collaboration velocity is high, but recommendation is to allocate 'Recovery' time before the next major networking event."
                  </p>
               </div>
            </div>

            <div className="neon-card p-6">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target size={14} className="text-rose-400" />
                  Impact Targets
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Network Growth', value: '+12%', progress: 45, color: 'bg-rose-500' },
                    { label: 'Mentorship Hours', value: '4 / 5', progress: 80, color: 'bg-indigo-500' },
                    { label: 'Engagement Rate', value: 'High', progress: 92, color: 'bg-emerald-500' },
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
    </div>
  )
}

import { Bell, Search, Menu, Settings, LogOut, Download, Wallet, Dumbbell, Columns } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  
  const { resetApp, user, appMode, isSplitView, setSplitView, toggleAppMode } = useAppStore()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await resetApp()
    setShowUserMenu(false)
    navigate('/')
  }

  const notifications = [
    { id: 1, title: 'Bill due tomorrow', subtitle: 'Electricity bill - $150', time: '1h ago', unread: true, type: 'finance' },
    { id: 2, title: 'Workout reminder', subtitle: 'No workout logged today', time: '3h ago', unread: true, type: 'fitness' },
    { id: 3, title: 'Budget alert', subtitle: 'Food budget at 80%', time: '1d ago', unread: false, type: 'finance' },
  ]
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0F1419]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <span className="text-lg font-black text-white tracking-tight">LifeSync <span className="gradient-text">Pro</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Split View Toggle (Desktop Only) */}
          <button
            onClick={() => setSplitView(!isSplitView)}
            className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 mr-2",
              isSplitView 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
            )}
            title="Toggle Split View"
          >
            <Columns size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSplitView ? 'Unified' : 'Split'}
            </span>
          </button>

{/* Quick Switcher (Header) */}
          <button
            onClick={() => {
              if (appMode === 'finance') {
                navigate('/fitness')
              } else {
                navigate('/')
              }
              toggleAppMode()
            }}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 mr-2",
              appMode === 'fitness' 
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20" 
                : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
            )}
          >
            {appMode === 'fitness' ? <Wallet size={14} /> : <Dumbbell size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {appMode === 'fitness' ? 'Finance' : 'Fitness'}
            </span>
          </button>

          <div className="relative group hidden md:flex">
            <div className="glass-card flex items-center gap-2 px-3 py-2 w-48 md:w-64 border-white/10 group-focus-within:border-cyan-500/50 transition-colors">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Global Search..."
                className="bg-transparent text-sm text-white placeholder-slate-600 outline-none w-full font-medium"
              />
              <span className="hidden md:block text-[10px] font-bold text-slate-700 uppercase">⌘K</span>
            </div>
          </div>

          <div className="relative">
            <button
              className="relative rounded-xl p-2 text-white transition-colors bg-purple-600"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-purple-400" />
              )}
            </button>

            {showNotifications && (
              <div ref={notifRef} className="absolute top-14 right-0 w-80 bg-slate-900 border border-white/10 overflow-hidden z-50 rounded-2xl shadow-2xl shadow-purple-500/20">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/80 to-purple-800/60 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Notification Center</h3>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar-none">
                  {notifications.map(n => (
                    <div key={n.id} className={cn(
                      "p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all group",
                      n.unread && (n.type === 'finance' ? "bg-cyan-500/10" : "bg-purple-500/10")
                    )}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{n.title}</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{n.subtitle}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full p-3 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-white hover:bg-purple-500/20 transition-all rounded-b-2xl">
                  Dismiss All
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button 
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden",
                appMode === 'finance' ? "border-cyan-500 bg-cyan-600" : "border-purple-500 bg-purple-600"
              )}
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
            >
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black text-white">{user?.name?.charAt(0).toUpperCase() || 'V'}</span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute top-14 right-0 w-64 bg-slate-900 border border-white/10 overflow-hidden z-50 rounded-2xl shadow-2xl shadow-cyan-500/20">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-600/60 to-cyan-800/40 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                      <span className="text-sm font-black text-white">{user?.name?.charAt(0).toUpperCase() || 'V'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user?.name || 'Commander'}</p>
                      <p className="text-[10px] text-cyan-200 font-medium">{user?.email || 'user@lifesync.pro'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent hover:text-cyan-400 transition-all text-left group"
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                  >
                    <Settings size={16} className="group-hover:rotate-90 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">System Settings</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent hover:text-cyan-400 transition-all text-left group"
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/insights')
                    }}
                  >
                    <Download size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Data Reports</span>
                  </button>
                  <div className="my-2 border-t border-white/10" />
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left group"
                  >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { ShieldCheck, Mail, ArrowRight, Loader2 } from 'lucide-react'

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const { isLicensed, setLicensed, setUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const savedEmail = localStorage.getItem('lifesync_license_email')
    if (savedEmail) {
      // Mock validation
      setLicensed(true)
      setUser({
        email: savedEmail,
        name: savedEmail.split('@')[0],
      })
    }
    setChecking(false)
  }, [setLicensed, setUser])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Please enter a valid email associated with your purchase.')
      return
    }

    setLoading(true)
    setError('')

    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For this demo, any email works, but in production this would hit a validation endpoint
    localStorage.setItem('lifesync_license_email', email)
    setLicensed(true)
    setUser({
      email: email,
      name: email.split('@')[0],
    })
    setLoading(false)
  }

  if (checking) return null

  return (
    <AnimatePresence mode="wait">
      {!isLicensed ? (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#030507] flex items-center justify-center p-6"
        >
          {/* Aurora Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px]" />
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="glass-card p-10 space-y-8 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 p-[2px]">
                  <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-white">LifeSync <span className="gradient-text">Pro</span></h1>
                  <p className="text-slate-400 text-sm font-medium">Master Your Health & Wealth</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      required
                    />
                  </div>
                  {error && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 gradient-brand rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] text-white shadow-[0_10px_30px_rgba(108,92,231,0.3)] hover:shadow-[0_15px_40px_rgba(108,92,231,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Unlock Portal
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-6 border-t border-white/5 flex flex-col items-center space-y-4">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">The Ultimate Health & Wealth System</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        children
      )}
    </AnimatePresence>
  )
}
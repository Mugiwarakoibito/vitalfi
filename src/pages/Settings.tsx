import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { User, Globe, DollarSign, Save } from 'lucide-react'

const COUNTRIES = [
  { code: 'MA', name: 'Morocco', currency: 'MAD', flag: '🇲🇦' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
]

export default function SettingsPage() {
  const { settings, updateSettings, user, setUser } = useAppStore()
  const [name, setName] = useState(settings.name || user?.name || '')
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === settings.country) || COUNTRIES[0]
  )
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    setName(settings.name || user?.name || '')
    const country = COUNTRIES.find((c) => c.code === settings.country)
    if (country) setSelectedCountry(country)
  }, [settings, user])

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const handleSave = async () => {
    setIsSaving(true)
    await updateSettings({
      name,
      country: selectedCountry.code,
      currency: selectedCountry.currency,
    })
    if (user) {
      setUser({ name, email: user.email || '', photo: user.photo })
      localStorage.setItem('lifesync_user_name', name)
    }
    setIsSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/10 p-8">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <User size={300} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 p-[2px]">
            <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{(name || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
            <p className="text-slate-400 text-sm">Manage your profile and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <section className="glass-card p-6 border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-sm font-black text-white">{(name || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Personal Info</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Display Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mt-1 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
            <input 
              value={user?.email || ''}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 text-sm mt-1 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Region & Currency Section */}
      <section className="glass-card p-6 border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Region & Currency</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Country</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => { setCountrySearch(e.target.value); setShowCountryDropdown(true) }}
                onFocus={() => setShowCountryDropdown(true)}
                placeholder={selectedCountry.name}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-colors"
              />
              {showCountryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl z-50 max-h-48 overflow-auto">
                  {filteredCountries.map(country => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country)
                        setCountrySearch('')
                        setShowCountryDropdown(false)
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left flex items-center gap-3 text-sm",
                        selectedCountry.code === country.code ? "bg-cyan-500/10 text-cyan-400" : "text-white hover:bg-white/5"
                      )}
                    >
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      <span className="ml-auto text-slate-500">{country.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Currency</label>
            <div className="flex items-center gap-2 mt-1 p-3 bg-white/5 rounded-xl border border-white/10">
              <DollarSign size={18} className="text-cyan-400" />
              <span className="text-white font-bold">{selectedCountry.currency}</span>
              <span className="text-slate-500 text-sm">({selectedCountry.name})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="sticky bottom-6 pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            showSuccess 
              ? "bg-emerald-600 text-white" 
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          )}
        >
          {showSuccess ? (
            <>✓ Saved Successfully</>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
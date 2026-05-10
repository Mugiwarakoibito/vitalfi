import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'EU', name: 'European Union', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
]

const FITNESS_GOALS = [
  { id: 'fat_loss', label: 'Fat Loss', icon: '⚖️' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'maintenance', label: 'Maintenance', icon: '🎯' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
]

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData } = useAppStore()
  const [name, setName] = useState(settings.name || '')
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === settings.country) || COUNTRIES[0]
  )
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )
  const [selectedGoals, setSelectedGoals] = useState<string[]>(settings.fitnessGoals || [])
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await updateSettings({
      name,
      country: selectedCountry.code,
      currency: selectedCountry.currency,
      fitnessGoals: selectedGoals,
    })
    setIsSaving(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      <div className="space-y-2">
        <div className="glass-card p-3 border-white/5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-sm mt-1"
          />
        </div>

        <div className="glass-card p-3 border-white/5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Region</label>
          <div className="relative mt-1">
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              onFocus={() => setShowCountryDropdown(true)}
              placeholder={selectedCountry.name}
              className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
            {showCountryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg z-50">
                {filteredCountries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country)
                      setCountrySearch('')
                      setShowCountryDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm",
                      selectedCountry.code === country.code ? "text-indigo-400 bg-indigo-500/10" : "text-white hover:bg-white/5"
                    )}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-3 border-white/5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Goals</label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {FITNESS_GOALS.map(goal => {
              const isActive = selectedGoals.includes(goal.id)
              return (
                <button
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoals(prev => 
                      prev.includes(goal.id) ? prev.filter(g => g !== goal.id) : [...prev, goal.id]
                    )
                  }}
                  className={cn(
                    "p-2 rounded-lg border text-xs",
                    isActive ? "bg-indigo-600 border-indigo-500 text-white" : "border-white/20 text-slate-500"
                  )}
                >
                  {goal.icon} {goal.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={clearAllData}
            className="py-2 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
import { Settings as SettingsIcon, User, Globe, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DataExport } from '@/components/settings/DataExport'
import { DataImport } from '@/components/settings/DataImport'
import { DeleteAccount } from '@/components/settings/DeleteAccount'
import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', currency: 'SEK' },
  { code: 'NO', name: 'Norway', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', currency: 'DKK' },
]

const FITNESS_GOALS = [
  { id: 'weight-loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'muscle-gain', label: 'Build Muscle', icon: '💪' },
  { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
  { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘' },
  { id: 'general-fitness', label: 'General Fitness', icon: '🎯' },
  { id: 'athletic-performance', label: 'Athletic Performance', icon: '🏆' },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore()
  const [name, setName] = useState(settings.name || '')
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === settings.country) || COUNTRIES[0]
  )
  const [selectedGoals, setSelectedGoals] = useState<string[]>(settings.fitnessGoals || [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings.name) setName(settings.name)
    if (settings.country) {
      const country = COUNTRIES.find((c) => c.code === settings.country)
      if (country) setSelectedCountry(country)
    }
    if (settings.fitnessGoals?.length) {
      setSelectedGoals(settings.fitnessGoals)
    }
  }, [settings])

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    )
  }

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/15">
          <SettingsIcon className="h-5 w-5 text-muted-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-muted mt-1">Manage your profile, data, and license.</p>
        </div>
      </div>

      <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
            <select
              value={selectedCountry.code}
              onChange={(e) => {
                const country = COUNTRIES.find((c) => c.code === e.target.value)
                if (country) setSelectedCountry(country)
              }}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleSaveProfile} isLoading={isSaving} className="w-full">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">Select your fitness goals</p>
          <div className="grid grid-cols-2 gap-3">
            {FITNESS_GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`p-4 rounded-lg text-left transition-all ${
                  selectedGoals.includes(goal.id)
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{goal.icon}</div>
                <div className="font-medium text-sm">{goal.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{settings.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Status</span>
            <span className="text-green-400">Active</span>
          </div>
        </CardContent>
      </Card>

      <DataExport />
      <DataImport />
      <DeleteAccount />
    </div>
  )
}

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
  { code: 'AF', name: 'Afghanistan', currency: 'AFN' },
  { code: 'AL', name: 'Albania', currency: 'ALL' },
  { code: 'DZ', name: 'Algeria', currency: 'DZD' },
  { code: 'AD', name: 'Andorra', currency: 'EUR' },
  { code: 'AO', name: 'Angola', currency: 'AOA' },
  { code: 'AG', name: 'Antigua and Barbuda', currency: 'XCD' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'AM', name: 'Armenia', currency: 'AMD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'AT', name: 'Austria', currency: 'EUR' },
  { code: 'AZ', name: 'Azerbaijan', currency: 'AZN' },
  { code: 'BS', name: 'Bahamas', currency: 'BSD' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
  { code: 'BB', name: 'Barbados', currency: 'BBD' },
  { code: 'BY', name: 'Belarus', currency: 'BYN' },
  { code: 'BE', name: 'Belgium', currency: 'EUR' },
  { code: 'BZ', name: 'Belize', currency: 'BZD' },
  { code: 'BJ', name: 'Benin', currency: 'XOF' },
  { code: 'BT', name: 'Bhutan', currency: 'BTN' },
  { code: 'BO', name: 'Bolivia', currency: 'BOB' },
  { code: 'BA', name: 'Bosnia and Herzegovina', currency: 'BAM' },
  { code: 'BW', name: 'Botswana', currency: 'BWP' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'BN', name: 'Brunei', currency: 'BND' },
  { code: 'BG', name: 'Bulgaria', currency: 'BGN' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF' },
  { code: 'BI', name: 'Burundi', currency: 'BIF' },
  { code: 'CV', name: 'Cabo Verde', currency: 'CVE' },
  { code: 'KH', name: 'Cambodia', currency: 'KHR' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF' },
  { code: 'TD', name: 'Chad', currency: 'XAF' },
  { code: 'CL', name: 'Chile', currency: 'CLP' },
  { code: 'CN', name: 'China', currency: 'CNY' },
  { code: 'CO', name: 'Colombia', currency: 'COP' },
  { code: 'KM', name: 'Comoros', currency: 'KMF' },
  { code: 'CD', name: 'Congo (Democratic Republic)', currency: 'CDF' },
  { code: 'CG', name: 'Congo (Republic)', currency: 'XAF' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF' },
  { code: 'HR', name: 'Croatia', currency: 'EUR' },
  { code: 'CU', name: 'Cuba', currency: 'CUP' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR' },
  { code: 'CZ', name: 'Czechia', currency: 'CZK' },
  { code: 'DK', name: 'Denmark', currency: 'DKK' },
  { code: 'DJ', name: 'Djibouti', currency: 'DJF' },
  { code: 'DM', name: 'Dominica', currency: 'XCD' },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP' },
  { code: 'EC', name: 'Ecuador', currency: 'USD' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'SV', name: 'El Salvador', currency: 'USD' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF' },
  { code: 'ER', name: 'Eritrea', currency: 'ERN' },
  { code: 'EE', name: 'Estonia', currency: 'EUR' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
  { code: 'FJ', name: 'Fiji', currency: 'FJD' },
  { code: 'FI', name: 'Finland', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'GA', name: 'Gabon', currency: 'XAF' },
  { code: 'GM', name: 'Gambia', currency: 'GMD' },
  { code: 'GE', name: 'Georgia', currency: 'GEL' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'GD', name: 'Grenada', currency: 'XCD' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ' },
  { code: 'GN', name: 'Guinea', currency: 'GNF' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF' },
  { code: 'GY', name: 'Guyana', currency: 'GYD' },
  { code: 'HT', name: 'Haiti', currency: 'HTG' },
  { code: 'HN', name: 'Honduras', currency: 'HNL' },
  { code: 'HU', name: 'Hungary', currency: 'HUF' },
  { code: 'IS', name: 'Iceland', currency: 'ISK' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR' },
  { code: 'IR', name: 'Iran', currency: 'IRR' },
  { code: 'IQ', name: 'Iraq', currency: 'IQD' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'IL', name: 'Israel', currency: 'ILS' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'JO', name: 'Jordan', currency: 'JOD' },
  { code: 'KZ', name: 'Kazakhstan', currency: 'KZT' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'KI', name: 'Kiribati', currency: 'AUD' },
  { code: 'KP', name: 'Korea (North)', currency: 'KPW' },
  { code: 'KR', name: 'Korea (South)', currency: 'KRW' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'KG', name: 'Kyrgyzstan', currency: 'KGS' },
  { code: 'LA', name: 'Laos', currency: 'LAK' },
  { code: 'LV', name: 'Latvia', currency: 'EUR' },
  { code: 'LB', name: 'Lebanon', currency: 'LBP' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL' },
  { code: 'LR', name: 'Liberia', currency: 'LRD' },
  { code: 'LY', name: 'Libya', currency: 'LYD' },
  { code: 'LI', name: 'Liechtenstein', currency: 'CHF' },
  { code: 'LT', name: 'Lithuania', currency: 'EUR' },
  { code: 'LU', name: 'Luxembourg', currency: 'EUR' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA' },
  { code: 'MW', name: 'Malawi', currency: 'MWK' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'MV', name: 'Maldives', currency: 'MVR' },
  { code: 'ML', name: 'Mali', currency: 'XOF' },
  { code: 'MT', name: 'Malta', currency: 'EUR' },
  { code: 'MH', name: 'Marshall Islands', currency: 'USD' },
  { code: 'MR', name: 'Mauritania', currency: 'MRU' },
  { code: 'MU', name: 'Mauritius', currency: 'MUR' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  { code: 'FM', name: 'Micronesia', currency: 'USD' },
  { code: 'MD', name: 'Moldova', currency: 'MDL' },
  { code: 'MC', name: 'Monaco', currency: 'EUR' },
  { code: 'MN', name: 'Mongolia', currency: 'MNT' },
  { code: 'ME', name: 'Montenegro', currency: 'EUR' },
  { code: 'MA', name: 'Morocco', currency: 'MAD' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN' },
  { code: 'MM', name: 'Myanmar', currency: 'MMK' },
  { code: 'NA', name: 'Namibia', currency: 'NAD' },
  { code: 'NR', name: 'Nauru', currency: 'AUD' },
  { code: 'NP', name: 'Nepal', currency: 'NPR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO' },
  { code: 'NE', name: 'Niger', currency: 'XOF' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'MK', name: 'North Macedonia', currency: 'MKD' },
  { code: 'NO', name: 'Norway', currency: 'NOK' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'PW', name: 'Palau', currency: 'USD' },
  { code: 'PS', name: 'Palestine', currency: 'ILS' },
  { code: 'PA', name: 'Panama', currency: 'PAB' },
  { code: 'PG', name: 'Papua New Guinea', currency: 'PGK' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG' },
  { code: 'PE', name: 'Peru', currency: 'PEN' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'PL', name: 'Poland', currency: 'PLN' },
  { code: 'PT', name: 'Portugal', currency: 'EUR' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'RO', name: 'Romania', currency: 'RON' },
  { code: 'RU', name: 'Russia', currency: 'RUB' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
  { code: 'KN', name: 'Saint Kitts and Nevis', currency: 'XCD' },
  { code: 'LC', name: 'Saint Lucia', currency: 'XCD' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', currency: 'XCD' },
  { code: 'WS', name: 'Samoa', currency: 'WST' },
  { code: 'SM', name: 'San Marino', currency: 'EUR' },
  { code: 'ST', name: 'Sao Tome and Principe', currency: 'STN' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'RS', name: 'Serbia', currency: 'RSD' },
  { code: 'SC', name: 'Seychelles', currency: 'SCR' },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLL' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR' },
  { code: 'SB', name: 'Solomon Islands', currency: 'SBD' },
  { code: 'SO', name: 'Somalia', currency: 'SOS' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'SS', name: 'South Sudan', currency: 'SSP' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR' },
  { code: 'SD', name: 'Sudan', currency: 'SDG' },
  { code: 'SR', name: 'Suriname', currency: 'SRD' },
  { code: 'SE', name: 'Sweden', currency: 'SEK' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF' },
  { code: 'SY', name: 'Syria', currency: 'SYP' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD' },
  { code: 'TJ', name: 'Tajikistan', currency: 'TJS' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'TH', name: 'Thailand', currency: 'THB' },
  { code: 'TL', name: 'Timor-Leste', currency: 'USD' },
  { code: 'TG', name: 'Togo', currency: 'XOF' },
  { code: 'TO', name: 'Tonga', currency: 'TOP' },
  { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD' },
  { code: 'TN', name: 'Tunisia', currency: 'TND' },
  { code: 'TR', name: 'Turkey', currency: 'TRY' },
  { code: 'TM', name: 'Turkmenistan', currency: 'TMT' },
  { code: 'TV', name: 'Tuvalu', currency: 'AUD' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU' },
  { code: 'UZ', name: 'Uzbekistan', currency: 'UZS' },
  { code: 'VU', name: 'Vanuatu', currency: 'VUV' },
  { code: 'VA', name: 'Vatican City', currency: 'EUR' },
  { code: 'VE', name: 'Venezuela', currency: 'VES' },
  { code: 'VN', name: 'Vietnam', currency: 'VND' },
  { code: 'YE', name: 'Yemen', currency: 'YER' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL' },
]

const FITNESS_GOALS = [
  { id: 'weight-loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'muscle-gain', label: 'Build Muscle', icon: '💪' },
  { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
  { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘' },
  { id: 'general-fitness', label: 'General Fitness', icon: '🎯' },
  { id: 'athletic-performance', label: 'Athletic Performance', icon: '🏆' },
]

const TRACKER_GATES = [
  { id: 'financial', label: 'Financial Tracker', icon: '💰', description: 'Track expenses, savings & investments' },
  { id: 'health', label: 'Health & Fitness', icon: '💪', description: 'Workouts, nutrition & health goals' },
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

  const handleGateChange = async (gate: 'financial' | 'health') => {
    await updateSettings({ primaryGate: gate })
  }

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
            Tracker Gate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-400">Switch between trackers</p>
          <div className="grid grid-cols-2 gap-3">
            {TRACKER_GATES.map((gate) => (
              <button
                key={gate.id}
                onClick={() => handleGateChange(gate.id as 'financial' | 'health')}
                className={`p-4 rounded-lg text-left transition-all ${
                  settings.primaryGate === gate.id
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{gate.icon}</div>
                <div className="font-medium text-sm">{gate.label}</div>
              </button>
            ))}
          </div>
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

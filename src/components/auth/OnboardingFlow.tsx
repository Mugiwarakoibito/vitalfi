import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { useAppStore } from '../../store/useAppStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TRACKER_GATES = [
  { id: 'financial', label: 'Financial', icon: '💰', description: 'Accounts • Transactions • Budgets • Investments • Bills • Subscriptions • Debts' },
  { id: 'health', label: 'Health & Fitness', icon: '💪', description: 'Workouts • Exercises • Nutrition • Hydration • Sleep • Body Metrics • Analytics' },
];

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
];

const STEPS = ['details', 'gate', 'complete'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedGate, setSelectedGate] = useState<'financial' | 'health' | undefined>(undefined);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateSettings, setOnboarded, settings } = useAppStore();

  useEffect(() => {
    if (settings.name) setName(settings.name);
    if (settings.country) {
      const country = COUNTRIES.find((c) => c.code === settings.country);
      if (country) setSelectedCountry(country);
    }
    if (settings.primaryGate) {
      setSelectedGate(settings.primaryGate);
    }
  }, [settings]);

  const currentStep = STEPS[stepIndex];

  const handleNext = async () => {
    if (stepIndex === STEPS.length - 1) {
      setIsLoading(true);
      await updateSettings({
        name,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        primaryGate: selectedGate,
        onboardingComplete: true,
      });
      setOnboarded(true);
      setIsLoading(false);
      onComplete();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return name.trim().length >= 2 && !!selectedCountry;
      case 'gate':
        return !!selectedGate;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Welcome to VitalFi</h1>
          <p className="text-gray-400">Let's set up your account</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full transition-colors ${
                index <= stepIndex ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Tell us about yourself</h2>
                  </div>

                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Where are you from?</label>
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 mb-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {COUNTRIES.filter((c) =>
                        c.name.toLowerCase().includes(countrySearch.toLowerCase())
                      ).map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => setSelectedCountry(country)}
                          className={`p-2 rounded-lg text-left text-xs transition-all ${
                            selectedCountry.code === country.code
                              ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                              : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="font-medium truncate">{country.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'gate' && (
                <motion.div
                  key="gate"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Choose your tracker</h2>
                  </div>

                  <p className="text-sm text-gray-400">Select which tracker you want to start with</p>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      💡 You can switch between trackers anytime in Settings after completing onboarding.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {TRACKER_GATES.map((gate) => (
                      <button
                        key={gate.id}
                        onClick={() => setSelectedGate(gate.id as 'financial' | 'health')}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          selectedGate === gate.id
                            ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                            : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{gate.icon}</div>
                          <div>
                            <div className="font-semibold">{gate.label}</div>
                            <div className="text-xs text-gray-400">{gate.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
                  <p className="text-gray-400">
                    {name}, your {selectedGate === 'financial' ? 'financial tracker' : 'health & fitness tracker'} is ready. You can switch between trackers anytime in settings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-6">
              {stepIndex > 0 && currentStep !== 'complete' && (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                isLoading={isLoading}
              >
                {currentStep === 'complete' ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

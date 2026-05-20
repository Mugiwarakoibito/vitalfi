import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, ChevronLeft, Sparkles, Zap, Target, ShieldCheck, Activity, ArrowRight, Loader2, Mail } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

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
  { code: 'CG', name: 'Congo', currency: 'XAF' },
  { code: 'CD', name: 'Congo (Democratic Republic)', currency: 'CDF' },
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
  { code: 'VC', name: 'Saint Vincent and Grenadines', currency: 'XCD' },
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
  { code: 'VE', name: 'Venezuela', currency: 'VES' },
  { code: 'VN', name: 'Vietnam', currency: 'VND' },
  { code: 'YE', name: 'Yemen', currency: 'YER' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL' },
];

const STEPS = ['email', 'identity', 'philosophy', 'complete'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const savedEmail = localStorage.getItem('lifesync_license_email')
  const initialStep = savedEmail ? 1 : 0
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [email, setEmail] = useState(savedEmail || '');
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const { updateSettings, setOnboarded, setUser } = useAppStore();

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleNext = async () => {
    if (stepIndex === 0 && currentStep === 'email') {
      if (!email.includes('@')) return
      localStorage.setItem('lifesync_license_email', email)
    }
    if (stepIndex === STEPS.length - 1) {
      setIsLoading(true);
      await updateSettings({
        name,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        onboardingComplete: true,
      });
      localStorage.setItem('lifesync_user_name', name)
      setUser({
        email: email || localStorage.getItem('lifesync_license_email') || 'user@lifesync.pro',
        name: name,
      });
      setOnboarded(true);
      setIsLoading(false);
      onComplete();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const currentStep = STEPS[stepIndex];

  return (
    <div className="min-h-[100dvh] bg-[#030507] flex items-center justify-center p-4 py-10 md:p-6 relative overflow-y-auto overflow-x-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10 my-auto"
      >
<div className="text-center mb-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">LifeSync Pro</h1>
            <p className="text-cyan-400/50 text-xs uppercase tracking-[0.25em] mt-2">Setup Guide</p>
          </div>
        </div>

        <div className="glass-card p-10 border border-cyan-500/20 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
             <Sparkles size={80} />
          </div>

<AnimatePresence mode="wait">
            {currentStep === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-tight">Enter Your Email</h2>
                    <p className="text-cyan-400/70 text-sm mt-2">This will be your account login</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Email address</label>
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-cyan-500/50 focus:bg-slate-900/70 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'identity' && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-tight">Personal Details</h2>
                    <p className="text-cyan-400/70 text-sm mt-2">Let's get to know you better</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Your name</label>
                    <input 
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-cyan-500/50 focus:bg-slate-900/70 transition-all"
                    />
                  </div>
                   
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Your country</label>
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-cyan-500/50 focus:bg-slate-900/70 transition-all"
                    />
<div className="space-y-1 max-h-32 overflow-y-auto pr-1 pb-2">
                      {filteredCountries.map(c => (
                       <button
                         key={c.code}
                         onClick={() => {
                           setSelectedCountry(c);
                           setCountrySearch(c.name);
                         }}
                         className={cn(
                           "w-full p-3 rounded-xl border text-left text-sm flex items-center justify-between transition-all",
                           selectedCountry.code === c.code 
                             ? "bg-cyan-500/20 border-cyan-500/40 text-white" 
                             : "bg-transparent border-white/10 text-white/60 hover:border-white/20"
                         )}
                       >
                         <span>{c.name}</span>
                         <span className="text-xs text-cyan-400">{c.currency}</span>
                       </button>
                     ))}
                   </div>
                  </div>
                </div>
              </motion.div>
            )}

{currentStep === 'philosophy' && (
              <motion.div
                key="philosophy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                      <Zap size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-tight">Why LifeSync?</h2>
                    <p className="text-cyan-400/70 text-sm mt-2">Everything you need to thrive</p>
                  </div>
                </div>

                <div className="space-y-2 pb-2">
                  {[
                    { label: 'Cross-Domain Analytics', desc: 'Track health & wealth in one unified platform', icon: Activity },
                    { label: 'Smart Predictions', desc: 'AI-powered insights for better decisions', icon: Target },
                    { label: 'Beautiful Design', desc: 'Dark mode design built for deep focus', icon: Sparkles },
                  ].map((p, i) => (
                     <div key={i} className="p-4 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                          <p.icon size={18} className="text-cyan-400" />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-white">{p.label}</p>
                           <p className="text-xs text-white/50">{p.desc}</p>
                        </div>
                     </div>
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
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white tracking-tight">You're all set!</h2>
                  <p className="text-cyan-400 text-sm">{name}, we're excited to have you</p>
                  <p className="text-white/40 text-xs mt-3">Start exploring your dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

<div className="flex gap-4 pt-6 flex-shrink-0">
            {stepIndex > 0 && currentStep !== 'complete' && (
              <button 
                onClick={() => setStepIndex(prev => prev - 1)}
                className="px-5 h-12 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white flex items-center gap-2 transition-all"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleNext}
              disabled={(currentStep === 'email' && !email.includes('@')) || (currentStep === 'identity' && name.trim().length < 2)}
              className="px-8 h-12 rounded-xl bg-cyan-500 text-white font-semibold text-sm flex items-center gap-2 hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {currentStep === 'complete' ? 'Get Started' : 'Continue'}
                  {currentStep !== 'complete' && <ArrowRight size={16} />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, ChevronLeft, Sparkles, Zap, Target, ShieldCheck, Activity, Search, ArrowRight, Loader2 } from 'lucide-react';
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

const STEPS = ['identity', 'philosophy', 'complete'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
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
    if (stepIndex === STEPS.length - 1) {
      setIsLoading(true);
      await updateSettings({
        name,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        onboardingComplete: true,
      });
      setUser({
        email: localStorage.getItem('lifesync_license_email') || 'user@lifesync.pro',
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
        className="w-full max-w-2xl relative z-10 my-auto"
      >
        <div className="text-center mb-8 md:mb-12 space-y-4">
<motion.div 
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 p-[2px] mx-auto"
          >
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <ShieldCheck size={20} className="md:text-24 text-white" />
            </div>
          </motion.div>
          <div className="space-y-2 text-center">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">LifeSync <span className="gradient-text">Pro</span></h1>
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-[10px]">Setup Guide</p>
           </div>
        </div>

        <div className="glass-card p-5 md:p-10 lg:p-14 border-white/5 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
             <Sparkles size={150} />
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 'identity' && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-2 mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <User size={24} className="text-cyan-400" />
                    Personal Details
                  </h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base">Let's get to know you better.</p>
                </div>

<div className="space-y-6 md:space-y-8 flex-1">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                         autoFocus
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 text-white outline-none focus:border-cyan-500/30 transition-all font-medium"
                      />
                   </div>
                    
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Your Country</label>
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search countries..."
                          className="w-full bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-500/30 transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="mt-3 max-h-48 md:max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-none">
                        {filteredCountries.map(c => (
                          <button
                            key={c.code}
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountrySearch(c.name);
                            }}
                            className={cn(
                              "w-full p-3 rounded-2xl border text-left transition-all group flex items-center justify-between",
                              selectedCountry.code === c.code 
                                ? "bg-cyan-500/10 border-cyan-500/30 text-white" 
                                : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10"
                            )}
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-sm opacity-50">{c.currency}</span>
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
                className="space-y-10"
              >
<div className="space-y-2 mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Zap size={24} className="text-purple-400" />
                    Why LifeSync?
                  </h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base">LifeSync integrates biological and financial performance.</p>
               </div>

               <div className="grid grid-cols-1 gap-3 md:gap-6 flex-1">
                  {[
                    { label: 'Cross-Domain Analytics', desc: 'Track your health and money in one place.', icon: Activity, color: 'text-cyan-400' },
                    { label: 'Smart Predictions', desc: 'AI-powered insights for better decisions.', icon: Target, color: 'text-purple-400' },
                    { label: 'Beautiful Design', desc: 'Beautiful dark mode design for focus.', icon: Sparkles, color: 'text-amber-400' },
                  ].map((p, i) => (
                     <div key={i} className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 flex gap-4 md:gap-6 group hover:bg-white/[0.04] transition-all">
                        <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 h-fit border border-white/5 group-hover:scale-110 transition-transform", p.color)}>
                           <p.icon size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                           <p className="text-sm md:text-base font-black text-white mb-1 uppercase tracking-tight">{p.label}</p>
                           <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
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
                className="text-center py-10 space-y-8"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                  <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10 shadow-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-3">
<h2 className="text-4xl font-black text-white tracking-tighter">You're All Set!</h2>
                    <p className="text-slate-400 max-w-sm mx-auto font-medium">
                      {name}, welcome to LifeSync. Let's start tracking your health and wealth!
                    </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 md:gap-6 mt-8 md:mt-16 pt-6 md:pt-10 border-t border-white/5 flex-shrink-0">
            {stepIndex > 0 && currentStep !== 'complete' && (
              <button 
                onClick={() => setStepIndex(prev => prev - 1)}
                className="px-6 md:px-8 h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 md:gap-3"
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleNext}
              disabled={currentStep === 'identity' && name.trim().length < 2}
              className="w-full sm:w-auto flex-1 md:flex-none px-8 h-12 md:h-14 gradient-brand rounded-xl md:rounded-2xl font-black uppercase tracking-wider text-xs text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {currentStep === 'complete' ? 'Get Started' : 'Continue'}
                  {currentStep !== 'complete' && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

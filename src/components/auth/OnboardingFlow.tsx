import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Target, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { useAppStore } from '../../store/useAppStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

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
];

const FITNESS_GOALS = [
  { id: 'weight-loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'muscle-gain', label: 'Build Muscle', icon: '💪' },
  { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
  { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘' },
  { id: 'general-fitness', label: 'General Fitness', icon: '🎯' },
  { id: 'athletic-performance', label: 'Athletic Performance', icon: '🏆' },
];

const STEPS = ['name', 'country', 'goals', 'complete'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { updateSettings, setOnboarded, settings } = useAppStore();

  useEffect(() => {
    if (settings.name) setName(settings.name);
    if (settings.country) {
      const country = COUNTRIES.find((c) => c.code === settings.country);
      if (country) setSelectedCountry(country);
    }
    if (settings.fitnessGoals?.length) {
      setSelectedGoals(settings.fitnessGoals);
    }
  }, [settings]);

  const currentStep = STEPS[stepIndex];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    if (stepIndex === STEPS.length - 1) {
      setIsLoading(true);
      await updateSettings({
        name,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        fitnessGoals: selectedGoals,
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
      case 'name':
        return name.trim().length >= 2;
      case 'country':
        return !!selectedCountry;
      case 'goals':
        return selectedGoals.length > 0;
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
              {currentStep === 'name' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">What's your name?</h2>
                  </div>

                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </motion.div>
              )}

              {currentStep === 'country' && (
                <motion.div
                  key="country"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Where are you from?</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => setSelectedCountry(country)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          selectedCountry.code === country.code
                            ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                            : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-medium">{country.name}</div>
                        <div className="text-xs text-gray-500">{country.currency}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">What are your fitness goals?</h2>
                  </div>

                  <p className="text-sm text-gray-400">Select all that apply</p>

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
                    {name}, your account is ready. Let's track your financial and fitness goals.
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

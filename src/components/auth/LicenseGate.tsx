import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { activateLicense, getStoredLicense, isLicenseEmail } from '../../lib/license';
import { useAppStore } from '../../store/useAppStore';

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { isLicensed, setLicensed, setOnboarded } = useAppStore();

  useEffect(() => {
    const checkLicense = async () => {
      const stored = await getStoredLicense();
      if (stored && stored.status === 'active') {
        setLicensed(true);
        setOnboarded(stored.email ? true : false);
      }
      setIsChecking(false);
    };
    checkLicense();
  }, [setLicensed, setOnboarded]);

  const handleActivate = () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!isLicenseEmail(email)) {
      setError('Please use a valid personal email address');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = activateLicense(email);
      if (result.success) {
        setLicenseKey(result.licenseKey || '');
        setSuccess('License activated! Your license key is shown below.');
        setLicensed(true);
      } else {
        setError(result.error || 'Activation failed');
      }
      setIsLoading(false);
    }, 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (isLicensed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">VitalFi</h1>
          <p className="text-gray-400">Financial, Fitness & Health Intelligence</p>
        </div>

        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Welcome to VitalFi</h2>

            {!licenseKey ? (
              <>
                <p className="text-sm text-gray-400 mb-4 text-center">
                  Enter your email to unlock premium access and start optimizing your financial and fitness journey.
                </p>

                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    error={error}
                  />

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleActivate}
                    isLoading={isLoading}
                  >
                    Unlock Premium Access
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{success}</span>
                  </div>
                  <div className="bg-gray-950 rounded p-3 font-mono text-sm text-green-300 break-all">
                    {licenseKey}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  Save this license key - you'll need it to restore your license on other devices.
                </p>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setOnboarded(true)}
                >
                  Continue to App
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-xs mt-4">
          Your data is stored locally. We never collect your information.
        </p>
      </motion.div>
    </div>
  );
}

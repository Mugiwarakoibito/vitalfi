import { emailToLicenseKey, verifyLicenseKey, isValidEmail, normalizeEmail } from './crypto';

const LICENSE_KEY = 'vitalfi_license';

export interface LicenseInfo {
  email: string;
  licenseKey: string;
  activatedAt: string;
  status: 'active' | 'expired' | 'invalid';
}

const ALLOWED_DOMAINS: string[] = [];

export async function getStoredLicense(): Promise<LicenseInfo | null> {
  const data = localStorage.getItem(LICENSE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as LicenseInfo;
  } catch {
    return null;
  }
}

export function activateLicense(email: string): { success: boolean; licenseKey?: string; error?: string } {
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  const normalizedEmail = normalizeEmail(email);
  const licenseKey = emailToLicenseKey(normalizedEmail);

  const licenseInfo: LicenseInfo = {
    email: normalizedEmail,
    licenseKey,
    activatedAt: new Date().toISOString(),
    status: 'active',
  };

  localStorage.setItem(LICENSE_KEY, JSON.stringify(licenseInfo));
  return { success: true, licenseKey };
}

export async function validateLicense(email?: string): Promise<boolean> {
  const stored = await getStoredLicense();

  if (!stored) return false;
  if (stored.status !== 'active') return false;

  if (email) {
    return verifyLicenseKey(email, stored.licenseKey);
  }

  return true;
}

export async function deactivateLicense(): Promise<void> {
  localStorage.removeItem(LICENSE_KEY);
}

export function generatePurchaseUrl(returnUrl?: string): string {
  const baseUrl = 'https://vitalfi.etsy.com';
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set('return', returnUrl);
  }
  return `${baseUrl}?${params.toString()}`;
}

export function isLicenseEmail(email: string): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

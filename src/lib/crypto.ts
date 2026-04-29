function hashEmail(email: string): string {
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function emailToLicenseKey(email: string): string {
  const hash = hashEmail(email);
  return `VF-${hash.slice(0, 8)}-${hash.slice(0, 8)}`;
}

export function verifyLicenseKey(email: string, licenseKey: string): boolean {
  const expected = emailToLicenseKey(email);
  return expected === licenseKey;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function emailToLicenseKey(email: string): Promise<string> {
  const hash = await hashEmail(email);
  const chunks: string[] = [];
  for (let i = 0; i < hash.length; i += 8) {
    chunks.push(hash.slice(i, i + 8).toUpperCase());
  }
  return chunks.join('-').slice(0, 29);
}

export async function verifyLicenseKey(email: string, licenseKey: string): Promise<boolean> {
  const expected = await emailToLicenseKey(email);
  return expected === licenseKey.replace(/-/g, '').toUpperCase().slice(0, 29);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

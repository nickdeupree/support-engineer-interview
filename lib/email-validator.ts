import isEmailLib from 'validator/lib/isEmail';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const commonTypoMap: Record<string, string> = {
  '.con': '.com',
  '.cpm': '.com',
  '.cm': '.com',
  '.om': '.com',
  '.ort': '.org',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
};

export function suggestEmailCorrection(email: string): string | null {
  try {
    const trimmed = email.trim();
    // If any part of the email is uppercase, suggest lowercase
    if (trimmed !== trimmed.toLowerCase()) {
      return trimmed.toLowerCase();
    }
    const lower = trimmed.toLowerCase();
    const domain = lower.split('@')[1];
    if (!domain) return null;

    for (const [typo, correction] of Object.entries(commonTypoMap)) {
      if (domain.endsWith(typo)) {
        return `${lower.split('@')[0]}@${domain.slice(0, -typo.length)}${correction}`;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function isValidEmail(email: string) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Use validator's isEmail for basic syntactic checks
  if (!isEmailLib(trimmed)) return false;
  // If a common-typo suggestion exists, mark as invalid and suggest correction
  const suggestion = suggestEmailCorrection(trimmed);
  if (suggestion) return false;

  return true;
}

export default isValidEmail;

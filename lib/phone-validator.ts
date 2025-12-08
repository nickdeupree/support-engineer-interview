import { parsePhoneNumberWithError, isValidPhoneNumber as isValidPhone } from 'libphonenumber-js';

const DEFAULT_COUNTRY = 'US';

/**
 * Validates a phone number (US or international)
 * @param phoneNumber - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  try {
    const trimmed = phoneNumber.trim();
    // libphonenumber-js will validate both US and international formats
    return isValidPhone(trimmed, DEFAULT_COUNTRY as any);
  } catch (e) {
    return false;
  }
}

/**
 * Formats a phone number to E.164 format (e.g., +14155552671)
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;
  
  try {
    const trimmed = phoneNumber.trim();
    const parsed = parsePhoneNumberWithError(trimmed, DEFAULT_COUNTRY as any);
    
    if (!parsed || !parsed.isValid()) return null;
    
    return parsed.format('E.164');
  } catch (e) {
    return null;
  }
}

/**
 * Gets the country code from a phone number
 * @param phoneNumber - The phone number to parse
 * @returns Country code (e.g., 'US') or null if invalid
 */
export function getPhoneNumberCountry(phoneNumber: string): string | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;
  
  try {
    const trimmed = phoneNumber.trim();
    const parsed = parsePhoneNumberWithError(trimmed, DEFAULT_COUNTRY as any);
    
    if (!parsed || !parsed.isValid()) return null;
    
    return parsed.country || null;
  } catch (e) {
    return null;
  }
}

export default isValidPhoneNumber;

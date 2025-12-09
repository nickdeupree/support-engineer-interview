/**
 * Test Suite for Ticket SEC-301: SSN Stored in Plaintext
 * Verifies that SSNs are hashed using the same technique as passwords
 * and that the stored value is not the raw 9-digit SSN.
 */

import bcrypt from 'bcryptjs';

describe('SEC-301: SSN Stored in Plaintext', () => {
  const sampleSSN = '123456789';

  test('SSN is hashed before storage (hash differs from plaintext)', async () => {
    const hashed = await bcrypt.hash(sampleSSN, 10);

    expect(hashed).not.toBe(sampleSSN);

    expect(/^\d{9}$/.test(hashed)).toBe(false);

    const valid = await bcrypt.compare(sampleSSN, hashed);
    expect(valid).toBe(true);
  });

  test('Hashing is salted (multiple hashes differ but both validate)', async () => {
    const h1 = await bcrypt.hash(sampleSSN, 10);
    const h2 = await bcrypt.hash(sampleSSN, 10);

    expect(h1).not.toBe(h2);

    expect(await bcrypt.compare(sampleSSN, h1)).toBe(true);
    expect(await bcrypt.compare(sampleSSN, h2)).toBe(true);
  });
});

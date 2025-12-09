/**
 * Test Suite for Ticket VAL-204: Phone Number Format
 * Tests the phone number format validation logic
 * The validation accepts:
 * - 10-digit US format (e.g., 1234567890)
 * - US format with country code (e.g., +1 (123) 456-7890)
 * - International format with country code (e.g., +44 20 7946 0958)
 */
import { isValidPhoneNumber } from '@/lib/phone-validator';

describe('VAL-204: Phone Number Format Validation', () => {
    /**
     * Helper function that replicates the phone number validation logic
     */
    const validatePhoneNumber = (number: string): boolean | string => {
        if (!isValidPhoneNumber(number)) {
            return 'Invalid phone number format';
        }
        return true;
    };

    describe('Accepted phone number formats (should pass)', () => {
        const passing = [
            '9144194671',
            '+1 (914) 419-4671',
            '+44 20 7946 0958',
            '+91 98765 43210',
            '+81-90-1234-5678'
        ];
        passing.forEach((val) => {
            test(`accepts "${val}"`, () => {
                const result = validatePhoneNumber(val);
                expect(result).toBe(true);
            });
        });
    });

    describe('Rejected phone number formats (should fail)', () => {
        const failing = [
            '123-45-6789',
            '12 3456 7890',
            'phone123456',
            '+1 (123) 45-67890',
            '++44 20 7946 0958',
            '123456789',
            '1234567890' // Not a real number
        ];
        failing.forEach((val) => {
            test(`rejects "${val}"`, () => {
                const result = validatePhoneNumber(val);
                expect(result).not.toBe(true);
                expect(typeof result).toBe('string');
            });
        });
    });
});
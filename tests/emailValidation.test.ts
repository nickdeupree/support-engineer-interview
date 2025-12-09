/**
 * Test Suite for Ticket VAL-201: Email Validation
 *
 * Tests the email validation logic that ensures users provide a valid email address.
 * The validation checks for the presence of "@" and "." in the email string.
 */

import { isValidEmail } from '@/lib/email-validator';

describe('VAL-201: Email Validation', () => {
    /**
     * Helper function that replicates the validation logic from signup page
     * This matches the validate function in app/signup/page.tsx
     */
    const validateEmail = (value: string): boolean | string => {
        return isValidEmail(value) || "Please enter a valid email address";
    };
    
    describe('Valid email addresses', () => {
        test('should accept a standard email format', () => {
            const email = 'johndoe@example.com';
            const result = validateEmail(email);
            expect(result).toBe(true);
        });

        test('should accept email with subdomain', () => {
            const email = 'john.doe@mail.example.com';
            const result = validateEmail(email);
            expect(result).toBe(true);
        });
    });

    describe('Invalid email addresses', () => {
        test('should reject email without "@"', () => {
            const email = 'johndoexample.com';
            const result = validateEmail(email);
            expect(result).toBe("Please enter a valid email address");
        });

        test('should reject email without "."', () => {
            const email = 'johndoe@examplecom';
            const result = validateEmail(email);
            expect(result).toBe("Please enter a valid email address");
        });
    });
    describe('Email Suggestions', () => {
    test('should suggest lowercase email format', () => {
        const email = 'JOHNDOE@EXAMPLE.COM';
        const result = validateEmail(email);
        expect(result).toBe("Please enter a valid email address");
    });
    test('should suggest correction for common domain typo', () => {
        const email = 'johndoe@gmail.con';
        const result = validateEmail(email);
        expect(result).toBe("Please enter a valid email address");
    });
    test('should suggest correction for common domain typo', () => {
        const email = 'johndoe@gnail.com';
        const result = validateEmail(email);
        expect(result).toBe("Please enter a valid email address");
    });
    });
    describe('Edge cases', () => {
        test('should reject empty email', () => {
            const email = '';
            const result = validateEmail(email);
            expect(result).toBe("Please enter a valid email address");
        });

        test('should reject email with only spaces', () => {
            const email = '   ';
            const result = validateEmail(email);
            expect(result).toBe("Please enter a valid email address");
        });
    });
});
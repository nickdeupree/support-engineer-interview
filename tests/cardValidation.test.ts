/**
 * Test Suite for Ticket VAL-206: Card Number Validation & Ticket VAL-210: Card Type Detection
 * Tests the credit/debit card number validation logic that uses the Luhn algorithm.
 * The register rules accept 16-digit numeric strings that pass the Luhn check.
 */

import isCreditCard from 'validator/lib/isCreditCard';


describe('VAL-206: Card Number Validation', () => {
    /**
     * Helper function that replicates the validation logic from funding page
     * This matches the validate function in `components/FundingModal.tsx`
     */
    const validateCardNumber = (value: string): boolean | string => {
        if (!/^\d{16}$/.test(value)) {
            return 'Card number must be 16 digits';
        }
        return isCreditCard(value) || 'Invalid card number';
    };
    
    describe('Valid card numbers', () => {
        test('should accept a valid Visa card number', () => {
            const cardNumber = '4956223345660736';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe(true);
        });

        test('should accept a valid MasterCard number', () => {
            const cardNumber = '5165005963809677';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe(true);
        });
        test('should accept a valid Discover card number', () => {
            const cardNumber = '6011000990139424';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe(true);
        });
    });
    describe('Invalid card numbers', () => {
        test('should reject a card number with invalid length', () => {
            const cardNumber = '123456789012345';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe('Card number must be 16 digits');
        });

        test('should reject a card number with non-numeric characters', () => {
            const cardNumber = '1234abcd5678efgh';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe('Card number must be 16 digits');
        });

        test('should reject a card number that fails the Luhn check', () => {
            const cardNumber = '1234567812345678';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe('Invalid card number');
        });
        test('should reject a card number with empty string', () => {
            const cardNumber = '';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe('Card number must be 16 digits');
        });

        test('should reject a card number with spaces', () => {
            const cardNumber = '    ';
            const result = validateCardNumber(cardNumber);
            expect(result).toBe('Card number must be 16 digits');
        });
    });
});
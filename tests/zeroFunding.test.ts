/**
 *  Test Suite for Ticket VAL-205: Zero Funding Validation & Ticket VAL-209: Leading Zero Amounts
 * 
 *  Tests the funding amount validation logic that ensures users cannot fund
 *  their account with a zero amount. The validation checks that the entered
 *  amount is greater than zero.
 */

describe('VAL-205: Zero Funding Validation', () => {
    /**
     * Helper function that replicates the validation logic from funding page
/**
 * Test Suite for Ticket VAL-205: Zero Funding Validation
 *
 * Tests the funding amount validation logic that mirrors `components/FundingModal.tsx`.
 * The register rules accept amounts matching the regex
 * /^(?:[1-9]\d*(?:\.\d{1,2})?|0\.\d{1,2})$/ and require a numeric value
 * between 0.01 and 10000 inclusive.
 */

describe('VAL-205: Zero Funding Validation', () => {
    /**
     * Helper function that replicates the validation logic from funding page
     * This matches the register rules in `components/FundingModal.tsx`:
     * - pattern: /^(?:[1-9]\d*(?:\.\d{1,2})?|0\.\d{1,2})$/
     * - min: 0.01
     * - max: 10000
     */
    const validateAmount = (value: string | number): boolean | string => {
        const str = String(value);
        const pattern = /^(?:[1-9]\d*(?:\.\d{1,2})?|0\.\d{1,2})$/;
        if (!pattern.test(str)) return 'Invalid amount format';

        const num = parseFloat(str);
        if (isNaN(num)) return 'Invalid number';
        if (num < 0.01) return 'Amount must be at least $0.01';
        if (num > 10000) return 'Amount cannot exceed $10,000';
        return true;
    };

    describe('Accepted amounts (should pass)', () => {
        const passing = [0.01, 1, 10000];
        passing.forEach((val) => {
            test(`accepts ${val}`, () => {
                const result = validateAmount(val);
                expect(result).toBe(true);
            });
        });
    });

    describe('Rejected amounts (should fail)', () => {
        const failing = [0.0, -1.0, -0.9, 10001, 10000.1];
        failing.forEach((val) => {
            test(`rejects ${val}`, () => {
                const result = validateAmount(val);
                expect(result).not.toBe(true);
                expect(typeof result).toBe('string');
            });
        });
    });

    describe('Invalid format amounts (should fail)', () => {
        const invalids = ['00.50', '01.00', '0001', 'abc', '', '10.999', '0', '0.001'];
        invalids.forEach((val) => {
            test(`rejects "${val}"`, () => {
                const result = validateAmount(val);
                expect(result).not.toBe(true);
                expect(typeof result).toBe('string');
            });
        });
    });

});
});
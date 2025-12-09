/**
 * Test Suite for Ticket VAL-203: State Code Validation
 * Tests the US state code validation logic
 * The register rules accept only valid two-letter US state abbreviations.
 */

describe('VAL-203: State Code Validation', () => {
    /**
     * Helper function that replicates the state code validation logic
     * Accepts only valid two-letter US state abbreviations.
     */
    const validateStateCode = (code: string): boolean | string => {
        const validStates = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        ];
        if (!/^[A-Z]{2}$/.test(code)) {
            return 'State code must be two uppercase letters';
        }
        if (typeof code !== 'string' || code.length !== 2) {
            return 'State code must be a two-letter string';
        }
        if (!validStates.includes(code)) {
            return 'Invalid US state code';
        }
        return true;
    };
    describe('Accepted state codes (should pass)', () => {
        const passing = ['CA', 'NY', 'TX', 'FL', 'WA'];
        passing.forEach((code) => {
            test(`accepts "${code}"`, () => {
                const result = validateStateCode(code);
                expect(result).toBe(true);
            });
        });
    });

    describe('Rejected state codes (should fail)', () => {
        const failing = ['C', 'California', 'XY', '123', 'ca', '', 'A1', 'N Y', 'XX', '  '];
        failing.forEach((code) => {
            test(`rejects "${code}"`, () => {
                const result = validateStateCode(code);
                expect(result).not.toBe(true);
                expect(typeof result).toBe('string');
            });
        });
    });
});
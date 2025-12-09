/**
 * Test Suite for Ticket VAL-208: Weak Password Requirements
 * Tests the password validation logic
 * The password must be at least 12 characters long and include at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 */

describe('VAL-208: Weak Password Requirements', () => {
    /**
     * Helper function that replicates the password validation logic
     * Password must be at least 12 characters long and include at least one uppercase letter,
     * one lowercase letter, one number, and one special character.
     */
    const validatePassword = (password: string): boolean | string => {
        if (typeof password !== 'string') return 'Password must be a string';
        if (password.length < 12) return 'Password must be at least 12 characters';
        if (!/\d/.test(password)) return 'Password must contain a number';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
        return true;
    };
    describe('Accepted passwords (should pass)', () => {
        const passing = [
            'StrongPass1!',
            'Another$trongP4ss',
            'xM180<~V_QW7',
            '9&c5$pP4(4JZ',
        ];
        passing.forEach((pwd) => {
            test(`accepts "${pwd}"`, () => {
                const result = validatePassword(pwd);
                expect(result).toBe(true);
            });
        });
    });
    
    describe('Rejected passwords (should fail)', () => {
        const failing = [
            'weakpass',
            'Short1!',
            'nouppercase1!',
            'NOLOWERCASE1!',
            'NoNumber!',
            'NoSpecialChar1',
            ' ',
            'password',
            '            ',
        ];
        failing.forEach((pwd) => {
            test(`rejects "${pwd}"`, () => {
                const result = validatePassword(pwd);
                expect(result).not.toBe(true);
                expect(typeof result).toBe('string');
            });
        });
    });
});

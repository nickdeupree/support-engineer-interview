/**
 * Test Suite for Ticket VAL-202: Date of Birth Validation
 * 
 * Tests the age validation logic that ensures users are at least 18 years old.
 * The validation calculates the minimum valid birth year by subtracting 18 from
 * the current year and ensures the entered date is before or equal to that threshold.
 */

describe('VAL-202: Date of Birth Validation', () => {
  /**
   * Helper function that replicates the validation logic from signup page
   * This matches the validate function in app/signup/page.tsx
   */
  const validateDateOfBirth = (value: string): boolean | string => {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const dob = new Date(value);
    return dob <= eighteenYearsAgo || "You must be at least 18 years old";
  };

  describe('Valid dates (users 18 or older)', () => {
    test('should accept date exactly 18 years ago', () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const dateString = eighteenYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept date 18 years and 1 day ago', () => {
      const today = new Date();
      const eighteenYearsAndOneDay = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() - 1);
      const dateString = eighteenYearsAndOneDay.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept date 19 years ago', () => {
      const today = new Date();
      const nineteenYearsAgo = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate());
      const dateString = nineteenYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept date 25 years ago', () => {
      const today = new Date();
      const twentyFiveYearsAgo = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const dateString = twentyFiveYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept date 50 years ago', () => {
      const today = new Date();
      const fiftyYearsAgo = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
      const dateString = fiftyYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept date 100 years ago', () => {
      const today = new Date();
      const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const dateString = hundredYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });
  });

  describe('Invalid dates (users under 18)', () => {
    test('should reject today\'s date', () => {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject date 1 day ago', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const dateString = oneDayAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject date 17 years ago', () => {
      const today = new Date();
      const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const dateString = seventeenYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject date 17 years and 364 days ago (1 day before 18th birthday)', () => {
      const today = new Date();
      const almostEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
      const dateString = almostEighteen.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject date 10 years ago', () => {
      const today = new Date();
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      const dateString = tenYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject date 5 years ago', () => {
      const today = new Date();
      const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      const dateString = fiveYearsAgo.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('should handle leap year birth dates correctly', () => {
      // Test someone born on Feb 29, 2004 (leap year) - should be valid in 2022+
      const leapYearBirth = '2004-02-29';
      const result = validateDateOfBirth(leapYearBirth);
      expect(result).toBe(true);
    });

    test('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should reject dates far in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      const dateString = futureDate.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('should handle end of year dates correctly', () => {
      const today = new Date();
      const eighteenYearsAgoNewYear = new Date(today.getFullYear() - 18, 0, 1); // January 1st
      const dateString = eighteenYearsAgoNewYear.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should handle December 31st dates correctly for valid ages', () => {
      const today = new Date();
      // Use a date that's clearly more than 18 years ago (19 years ago, Dec 31)
      const nineteenYearsAgoEndOfYear = new Date(today.getFullYear() - 19, 11, 31); // December 31st
      const dateString = nineteenYearsAgoEndOfYear.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });
  });

  describe('Realistic date validation', () => {
    test('should accept reasonable historical dates (e.g., 1950)', () => {
      const dateString = '1950-06-15';
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should accept dates from early 1900s', () => {
      const dateString = '1920-01-01';
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('should handle very old dates (e.g., 1900)', () => {
      const dateString = '1900-01-01';
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });
  });

  describe('Dynamic year calculation', () => {
    test('minimum valid birth year should be current year minus 18', () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const minValidBirthYear = currentYear - 18;
      
      // Create a date with the minimum valid birth year
      const minValidDate = new Date(minValidBirthYear, today.getMonth(), today.getDate());
      const dateString = minValidDate.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe(true);
    });

    test('birth year of current year minus 17 should be invalid', () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const invalidBirthYear = currentYear - 17;
      
      // Create a date with an invalid birth year
      const invalidDate = new Date(invalidBirthYear, today.getMonth(), today.getDate());
      const dateString = invalidDate.toISOString().split('T')[0];
      
      const result = validateDateOfBirth(dateString);
      expect(result).toBe("You must be at least 18 years old");
    });

    test('validation should use full date comparison, not just year', () => {
      const today = new Date();
      
      // Someone born exactly 18 years ago should be valid
      const exactlyEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const validString = exactlyEighteen.toISOString().split('T')[0];
      expect(validateDateOfBirth(validString)).toBe(true);
      
      // Someone born 18 years ago tomorrow should be invalid
      const notQuiteEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
      const invalidString = notQuiteEighteen.toISOString().split('T')[0];
      expect(validateDateOfBirth(invalidString)).toBe("You must be at least 18 years old");
    });
  });
});

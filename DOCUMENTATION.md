# Bug Documentation

Below is a summary of each investigated issue in order from first to last, its root cause, the implemented fix, and recommended preventive measures.

---

## Ticket UI-101: Dark Mode Text Visibility
**Root Cause:**  
No explicit text color was defined in global styles. When the system switched to dark mode, only the text color changed to white while the input background remained white.

**Fix:**  
Defined global CSS variables to enforce a consistent black text color across all inputs.

**Prevention:**  
Establish global design tokens for colors to ensure consistent UI behavior across all modes.

---

## Ticket VAL-202: Date of Birth Validation
**Root Cause:**  
The signup page only required the field to be present. It did not validate age or check if the date was realistic.

**Fix:**  
Added a validator that calculates the minimum valid birth year by subtracting 18 from the current year. The entered year must be less than or equal to that value.

**Prevention:**  
Use dynamic validation for age-based requirements.

**Tests**
dateOfBirth.test.ts

---

## Ticket VAL-201: Email Validation
**Root Cause:**  
A weak regex allowed invalid formats and silently lowercased user input. It also did not detect common typos.

**Fix:**  
Implemented an enhanced email validator that detects uppercase usage, enforces valid structure, and checks for common domain typos. The UI suggests corrections when issues are found.

**Prevention:**  
Use well-tested validators for email fields and provide user feedback when modifying input.

**Tests**
emailValidation.test.ts

---

## Ticket VAL-205: Zero Amount Funding
**Root Cause:**  
The frontend allowed entering zero as the funding amount, which triggered backend logic unnecessarily.

**Fix:**  
Set the minimum amount to 0.01 so the frontend blocks invalid submissions.

**Prevention:**  
Always enforce frontend minimums and maximums for numeric inputs.

**Tests**
zeroFunding.test.ts

---

## Ticket VAL-206: Card Number Validation
**Root Cause:**  
Validation only checked whether the card number started with a 4 or 5.

**Fix:**  
Used the validator package and `isCreditCard` to verify card numbers against multiple known card formats.

**Prevention:**  
Use robust validation libraries instead of simplistic custom checks.

**Tests**
cardValidation.test.ts
---

## Ticket VAL-208: Weak Password Requirements
**Root Cause:**  
Passwords were only checked for length and exclusion of three common values.

**Fix:**  
Added a stronger validator requiring at least 12 characters, one uppercase letter, one number, and one special character. Removed outdated common password checks.

**Prevention:**  
Stay current with modern password standards and update validators as needed.

**Tests**
passwordValidation.test.ts
---

## Ticket VAL-209: Leading Zero Amounts
**Root Cause:**  
The amount input allowed values like 0010, which behaved identically to 10.

**Fix:**  
Enhanced the regex to reject invalid leading zeros while still allowing a single zero for amounts under 1 dollar.

**Prevention:**  
Define strict numeric formatting rules for all financial fields.

**Tests**
zeroFunding.test.ts ( this tests for leading 0's in a few cases )

---

## Ticket VAL-210: Card Type Detection
**Root Cause:**  
Validation repeated the same overly simplistic prefix check used in VAL-206.

**Fix:**  
Applied the validator package to validate a wide range of card types.

**Prevention:**  
Centralize card validation logic to ensure consistent rules.

**Tests**
cardValidation.test.ts

---

## Ticket VAL-203: State Code Validation
**Root Cause:**  
The input only required two uppercase letters, allowing invalid combinations like XX.

**Fix:**  
Validated the input against a list of the 50 US state codes.

**Prevention:**  
Ensure address fields include semantic validation rather than pure formatting checks.

**Tests**
stateValidation.test.ts

---

## Ticket VAL-204: Phone Number Format
**Root Cause:**  
Validation only enforced that the number contained 10 digits.

**Fix:**  
Integrated libphonenumber-js to parse and validate real numbers with region awareness. Inputs are normalized to E.164 format.

**Prevention:**  
Use region-aware libraries for phone number validation.

**Tests**
phoneValidation.test.ts

---

## Ticket VAL-207: Routing Number Optional
**Root Cause:**  
The frontend required routing numbers for bank transfers, but the backend did not.

**Fix:**  
Backend now requires a routing number when the funding method is bank transfer.

**Prevention:**  
Keep backend and frontend validation rules aligned.

**Tests**
noRouting.test.ts

---

## Ticket SEC-301: SSN Stored in Plaintext
**Root Cause:**  
SSNs were stored directly in the database without any protection.

**Fix:**  
SSNs are now hashed using the same technique used for passwords.

**Prevention:**  
Treat sensitive personal data with the same protections as authentication credentials.


**Tests**
ssnStore.test.ts

---

## Ticket SEC-303: XSS Vulnerability in Transaction List
**Root Cause:**  
`dangerouslySetInnerHTML` rendered transaction descriptions as raw HTML, making XSS attacks possible.

**Fix:**  
Removed `dangerouslySetInnerHTML` and rendered descriptions as plain text.

**Prevention:**  
Avoid raw HTML injection points unless absolutely necessary and sanitize when required.

**Tests**
xssVulnerability.test.tsx

---

## Ticket SEC-302: Predictable Account Numbers
**Root Cause:**  
Account numbers were generated with Math.random, which is not secure or unpredictable.

**Fix:**  
Replaced Math.random with crypto.getRandomValues to generate secure random numbers.

**Prevention:**  
Use cryptographically secure randomness for security-sensitive identifiers.

---

## Ticket SEC-304: Session Management Gaps
**Root Cause:**  
Expired sessions were never removed, multiple sessions could remain active, and logout always appeared successful.

**Fix:**  
Expired sessions are removed at login and signup. Logout deletes the session record and clears the cookie only after successful deletion. Invalid tokens block data access.

**Prevention:**  
Implement periodic cleanup and enforce consistent session lifecycle rules.

**Tests**
sessionMgmt.test.ts

---

## Ticket PERF-401: Account Creation Error
**Root Cause:**  
When account creation failed, the system returned a placeholder account with a 100 balance.

**Fix:**  
Creation errors now throw, and the frontend shows a failure message instead of displaying fabricated data.

**Prevention:**  
Never use placeholder data in critical workflows.

---

## Ticket PERF-405: Missing Transactions
**Root Cause:**  
The transaction list did not refresh after funding an account. The query was never invalidated.

**Fix:**  
Added a refresh trigger to refetch the transaction list after funding completes.

**Prevention:**  
Use query invalidation or centralized state to keep dependent components synchronized.

---

## Ticket PERF-406: Balance Calculation Errors
**Root Cause:**  
The system added amount divided by 100 one hundred times, creating floating point errors.

**Fix:**  
Removed the loop and returned the exact value stored in the database. Updates now occur in a database transaction.

**Prevention:**  
Use integer cents or decimal-safe storage for currency fields.

---

## Ticket PERF-408: Resource Leak
**Root Cause:**  
A database connection in index.ts was opened, never used, and never closed.

**Fix:**  
Removed the unused connection and related tracking.

**Prevention:**  
Avoid opening unused connections and ensure all opened connections are closed.

---

## Ticket PERF-407: Transaction Performance Degradation
**Root Cause:**  
GetTransactions suffered from an N+1 query pattern and no pagination, causing slowdowns on large datasets.

**Fix:**  
Reused account data instead of re-querying, added pagination with limit and offset, indexed the account_id column, and removed the immediate write option that caused lock contention.

**Prevention:**  
Use indexes, pagination, and avoid N+1 query patterns for scalable database access.

---

## Ticket PERF-403: Session Expiry Timing
**Root Cause:**  
Expiration checks only failed when the current time exceeded the exact expiry timestamp. A user could log in milliseconds before expiry and still perform full operations.

**Fix:**  
Added a five second buffer that invalidates sessions slightly early.

**Prevention:**  
Consider sliding expiration or more robust session expiry rules.

---

## Ticket PERF-404: Transaction Sorting
**Root Cause:**  
The query lacked an ORDER BY clause, producing inconsistent transaction order.

**Fix:**  
Added ordering by created_at in descending order.

**Prevention:**  
Always specify ordering for user-facing data.

**Tests**
transactionSorting.test.ts
---

## Ticket PERF-402: Logout Always Reported Success
**Root Cause:**  
Logout always returned success, even if the session did not exist or deletion failed.

**Fix:**  
Now returns false when no session is found and only clears the cookie after the session is deleted.

**Prevention:**  
Return accurate status responses for authentication flows.

**Tests**
logoutFalseSuccess.test.ts

---


Ticket UI-101:
The cause for this bug was that we had no defined text color. Also, the UI does not change if using system dark mode. This causes the text to change colors while the rest of the UI does not. Turning the text white and the background white. 
Fixed by setting global css variables for text to ensure the color is always black.
To prevent this in the future, global css variables ensure every new text component's text color is black.

Ticket VAL-202:
No form validation caused this issue. In signup page.tsx we only stated that dob was required. 
Fixed by adding a validation to the register. We get the current year, subtract 18 to get the minimum age. The user's birth year should be less than or equal to that year. 
To future proof this, we are not hard coding the year, so once 2026 comes around 2008 will be a valid year. 

Ticket VAL-201:
Only a simple regex was validating emails. It did not notify the user if it lowercase'd their email or if there were typos like .con
Fixed by adding an email validator. It checks if uppercase was used, if the emails are in the correct format, or if it notices common typos like .con. If something wrong is found the page will suggest a fix to the user.
To prevent this in the future consider adding more robust checkers to input fields. 

Ticket VAL-205:
The frontend was allowing values of 0 to be the amount of a funding request. This would send the request to the backend and eventually return an error. However, the backend is still called in this case. 
To fix, we set the min to the lowest allowed number (0.01 instead of 0.0). This ensures we see a frontend error message and it will not call the backend.
For errors like this one, ensure the bounds are correct on frontend input registers.

Ticket VAL-206:
The only checks for card numbers is that they start with 4 or 5.
To fix, we have implemented the validator npm package & utilize their isCreditCard which checks the validity of a credit card number to 7 known banks & their card formats.
To prevent errors like this use more robust form validation methods & consider known packages for validation.

Ticket VAL-208:
The password validator only checks if the password is more than 8 characters & is not 3 common passcodes.
To enhance this, we have implemented a more complex validator. Passwords now must be 12 or more characters, have at least 1 uppercase letter, 1 number, and 1 special character. To clean up the code a bit we have removed the common passcodes since those will never get through our new requirements. 
In the future add a few more well known checks to the input.

Ticket VAL-209:
The funding modal accepts values with leading 0's. For example 0010 and 10 both add $10. 
To Fix this we have enhanced the regex validator to erorr if there are leading 0's for a number like 10. However, it will allow one 0 if the amount is less than $1.
In the future write more strict regex.

Ticket VAL-210:
The card validation is only checking if the first number is a 5 or a 4.
Similar to ticket VAL-206, we are using the validator package to check if the card is valid with 7 known banks.
In the future use an existing package to do the work for us instead of writing custom code.

Ticket VAL-203:
The state code input was only checking that the user inputs 2 upper case letters A-Z. This means any combination would be valid.
To fix, we check the user's 2 char value against all 50 states in the USA.
The address fields have no validators. In the future ensure each field has a validator.

Ticket VAL-204:
The previous implementation only checked if the length of the phone number was 10 digits. 
To fix, we use the libphonenumber-js package by google to validate phone numbers when provided a country code. For US numbers, users do not need to add the +1. In the db, libphonenumber converts to E.164 format which means US numbers will automatically add a +1 if not present.
In the future add more robust input checking to fields.

Ticket SEC-301:
Security vulnerabilities are present! SSNs are plaintext in the db. This means if someone accesses the db they can see user's social security numbers easily. 
To fix this vulnerability we will hash the ssn just like we do with the passwords.
In the future, we must identify key security risks before implementing to avoid issues like this ticket highlighted.

Ticket SEC-303:
DangerouslySetInnerHTML was found in the transaction list. This is dangerous because it tells react to render strings as raw html. An attacker could inject malicious code into the inner HTML.
TO fix we removed the dangerouslysetinnerhtml & just render the description as plain text.
In the future restrain from using dangerouslySetInnerHTML since its vulnerable to injections.

Ticket SEC-302:
The previous implementation used Math.random to generate account ids. Math.random is seed based and not truly random. If an attackers knows the seed they can predict random number generation and get user account ids.
Instead of math.random we are using crypto.getRandomValues. This ensures each number is truly random and independent. Attackers cannot predict user account ids.
In the future, for any database field with sensitive information, we must ensure that we are using truly random numbers &/or hiding their values in the db.

Ticket SEC-304:
The system 
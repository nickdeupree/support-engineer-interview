const isEmail = require('validator/lib/isEmail');

const testEmails = [
  'test@gmail.con',
  'test@gmail.com',
  'test@gmail.co',
  'test@example',
  'test@localhost',
  'test@192.168.0.1',
  'user+label@gmail.com',
  'user.name@example.com',
  'user@sub.example.co',
  ' user@gmail.com ',
  '',
  null,
  undefined,
];

function check(email) {
  try {
    const result = isEmail(email);
    console.log(`${String(email)} -> ${result}`);
  } catch (e) {
    console.log(`${String(email)} -> throws: ${e.message}`);
  }
}

console.log('isEmail default behavior (require_tld = true):');
for (const email of testEmails) check(email);

console.log('\nisEmail with { require_tld: false } (allows domain `localhost`):');
for (const email of testEmails) {
  try {
    const result = isEmail(email, { require_tld: false });
    console.log(`${String(email)} -> ${result}`);
  } catch (e) {
    console.log(`${String(email)} -> throws: ${e.message}`);
  }
}

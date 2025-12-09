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
  } catch (e) {
  }
}

for (const email of testEmails) check(email);

for (const email of testEmails) {
  try {
    const result = isEmail(email, { require_tld: false });
  } catch (e) {
  }
}

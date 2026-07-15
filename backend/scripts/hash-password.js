// Generates a bcrypt hash for an admin password.
// Usage:  npm run hash -- "yourPassword"
//    or:  node backend/scripts/hash-password.js "yourPassword"
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash -- "yourPassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\nAdd this line to backend/.env :\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);

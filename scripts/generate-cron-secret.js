#!/usr/bin/env node

// Generate a secure random string for CRON_SECRET
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');
console.log('Generated CRON_SECRET:', secret);
console.log('\nAdd this to your .env file:');
console.log(`CRON_SECRET=${secret}`);
const { execSync } = require('child_process');

try {
  execSync('pnpm exec tsc --noEmit', { stdio: 'inherit' });
  console.log('TypeScript check passed!');
} catch (error) {
  console.error('TypeScript check failed');
  process.exit(1);
}
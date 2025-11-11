/**
 * Script to start Next.js dev server with proper cleanup
 * This helps avoid manifest file issues on Windows/OneDrive
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '.next');

console.log('🧹 Cleaning Next.js build directory...');

// Remove .next directory if it exists
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    console.log('✅ Cleaned .next directory');
  } catch (error) {
    console.warn('⚠️  Could not fully remove .next directory:', error.message);
    console.log('   This is usually fine - Next.js will handle it');
  }
}

console.log('🚀 Starting Next.js dev server...');
console.log('   Please wait for "Ready in X.Xs" before accessing the app\n');

// Start Next.js dev server
try {
  execSync('next dev', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  // Exit code 130 is SIGINT (Ctrl+C), which is normal
  if (error.status !== 130 && error.status !== null) {
    console.error('❌ Error starting dev server:', error.message);
    process.exit(1);
  }
}


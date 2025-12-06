/**
 * Script to clear Next.js build directory
 * Useful when encountering EBUSY errors on Windows/OneDrive
 */

const fs = require('fs');
const path = require('path');

const buildDirs = ['.next-local', '.next', 'out', 'node_modules/.cache'];

function deleteDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} doesn't exist, skipping...`);
    return;
  }

  console.log(`Attempting to delete ${dirPath}...`);
  
  try {
    // Try to delete recursively
    fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    console.log(`✓ Successfully deleted ${dirPath}`);
  } catch (error) {
    console.error(`✗ Failed to delete ${dirPath}:`, error.message);
    console.log('  This might be due to OneDrive syncing or file locks.');
    console.log('  Try:');
    console.log('  1. Close the dev server (Ctrl+C)');
    console.log('  2. Pause OneDrive sync temporarily');
    console.log('  3. Run this script again');
  }
}

console.log('Clearing Next.js build directories...\n');

buildDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  deleteDirectory(fullPath);
});

console.log('\nDone! You can now restart the dev server.');


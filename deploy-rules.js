// This script helps to deploy Firestore rules
// To use this script:
// 1. Install Firebase CLI if not installed: npm install -g firebase-tools
// 2. Login to Firebase: firebase login
// 3. Run this script: node deploy-rules.js

const { execSync } = require('child_process');

console.log('Starting Firestore rules deployment...');

try {
  // Initialize Firebase if not already initialized
  try {
    execSync('firebase use --add', { stdio: 'inherit' });
  } catch (e) {
    console.log('Firebase project already set up or initialization failed. Continuing...');
  }

  // Deploy Firestore rules
  console.log('Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });

  console.log('Firestore rules deployed successfully!');
  console.log('\nIf you encounter permission issues, make sure you are logged in with:');
  console.log('firebase login');
  console.log('\nYou can now try saving your profile and safety settings again!');
} catch (error) {
  console.error('Error deploying Firestore rules:', error.message);
  process.exit(1);
} 
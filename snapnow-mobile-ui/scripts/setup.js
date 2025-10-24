#!/usr/bin/env node

/**
 * Setup Script for SnapNow
 * This script initializes the Firebase database with admin account and sample data
 */

console.log('🚀 SnapNow Setup Script\n');
console.log('This script will:');
console.log('1. Create admin account (admin@snapnow.com / admin)');
console.log('2. Seed sample users and posts');
console.log('3. Configure Firebase for first-time use\n');

const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkEnvFile() {
  const fs = require('fs');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Create a new project or select existing one');
    console.log('3. Go to Project Settings > General');
    console.log('4. Copy your Firebase config');
    console.log('5. Create .env file from .env.example');
    console.log('6. Paste your config into .env\n');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('AIzaSyDemoKey') || envContent.includes('your_api_key')) {
    console.log('⚠️  .env file contains demo values!');
    console.log('Please update .env with your actual Firebase credentials.\n');
    return false;
  }
  
  console.log('✅ .env file found and configured\n');
  return true;
}

async function runSetup() {
  console.log('Starting Firebase setup...\n');
  
  return new Promise((resolve, reject) => {
    exec('npm run seed', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error running seed script:', error.message);
        if (stderr) console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(stdout);
      console.log('✅ Setup completed successfully!\n');
      resolve();
    });
  });
}

async function main() {
  try {
    // Check .env file
    const envOk = await checkEnvFile();
    if (!envOk) {
      const answer = await question('Do you want to continue anyway? (yes/no): ');
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\nSetup cancelled. Please configure .env first.');
        rl.close();
        process.exit(0);
      }
    }
    
    // Run seed script
    const answer = await question('\nReady to seed Firebase database? (yes/no): ');
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await runSetup();
      
      console.log('\n🎉 SnapNow is ready to use!');
      console.log('\nDefault admin credentials:');
      console.log('  Email: admin@snapnow.com');
      console.log('  Password: admin');
      console.log('\nYou can now run:');
      console.log('  npm start  (or)  expo start');
      console.log('\nHappy snapping! 📸\n');
    } else {
      console.log('\nSetup cancelled.');
    }
    
    rl.close();
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * Validates that all required environment variables are present before build.
 * Run this script as part of the build process or manually via:
 *   node scripts/check-env.js
 * 
 * Exit codes:
 *   0 - All required variables present
 *   1 - Missing required variables or validation errors
 */

// Required environment variables for production build
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_MT5_SERVICE_URL',
];

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_ENABLE_REALTIME',
  'VITE_MT5_SERVICE_WS',
];

// Load environment from .env file (if exists)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env');

// Parse .env file manually (simple parser)
function parseEnvFile(path) {
  if (!existsSync(path)) {
    console.log(`ℹ️  .env file not found at: ${path}`);
    return {};
  }

  const content = readFileSync(path, 'utf-8');
  const env = {};

  content.split(/\r?\n/).forEach(line => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Parse KEY="value" or KEY=value
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (match) {
      let value = match[2].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value;
    }
  });

  return env;
}

const envVars = parseEnvFile(envPath);
console.log(`📁 Reading environment from: ${envPath}`);
console.log(`📊 Found ${Object.keys(envVars).length} variables in .env file\n`);

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('Required Variables:');
REQUIRED_VARS.forEach(varName => {
  const value = envVars[varName] || process.env[varName];
  
  if (!value) {
    console.log(`  ❌ ${varName} - MISSING`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('placeholder')) {
    console.log(`  ⚠️  ${varName} - Uses placeholder value`);
    hasWarnings = true;
  } else {
    // Mask sensitive values
    const masked = value.length > 20 
      ? `${value.substring(0, 15)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`  ✅ ${varName} - ${masked}`);
  }
});

// Check recommended variables
console.log('\nRecommended Variables:');
RECOMMENDED_VARS.forEach(varName => {
  const value = envVars[varName] || process.env[varName];
  
  if (!value) {
    console.log(`  ⚠️  ${varName} - Not set (optional)`);
  } else {
    const masked = value.length > 20 
      ? `${value.substring(0, 15)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`  ✅ ${varName} - ${masked}`);
  }
});

// Validate Supabase URL format
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
  console.log('\n⚠️  Warning: VITE_SUPABASE_URL format may be incorrect');
  console.log(`   Expected: https://[project-id].supabase.co`);
  console.log(`   Got: ${supabaseUrl}`);
  hasWarnings = true;
}

// Validate MT5 service URL format
const mt5Url = envVars.VITE_MT5_SERVICE_URL || process.env.VITE_MT5_SERVICE_URL;
if (mt5Url && !mt5Url.match(/^https?:\/\/.+/)) {
  console.log('\n⚠️  Warning: VITE_MT5_SERVICE_URL format may be incorrect');
  console.log(`   Expected: http(s)://[hostname]:[port] or http(s)://[domain]`);
  console.log(`   Got: ${mt5Url}`);
  hasWarnings = true;
}

// Print summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Validation FAILED - Missing required variables');
  console.log('\nℹ️  Copy env.example to .env and fill in your values:');
  console.log('   cp env.example .env');
  console.log('\n   See docs/LOCAL-DEVELOPMENT-GUIDE.md for setup instructions');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Validation passed with WARNINGS');
  console.log('\nℹ️  Review warnings above and update your .env file if needed');
  process.exit(0); // Don't fail build on warnings
} else {
  console.log('✅ All environment variables validated successfully!');
  process.exit(0);
}

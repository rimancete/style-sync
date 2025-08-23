#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates that all required environment variables are present and properly formatted
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT', 
  'DATABASE_URL',
  'CLIENT_ORIGIN',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'HEALTH_CHECK_ENABLED',
  'SWAGGER_ENABLED'
];

const ENV_SPECIFIC_REQUIREMENTS = {
  development: {
    optional: ['JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN']
  },
  staging: {
    required: ['NODE_ENV', 'DATABASE_URL'],
    warnings: ['JWT_SECRET should be different from development']
  },
  production: {
    required: ['DATABASE_URL'],
    critical: ['JWT_SECRET', 'JWT_REFRESH_SECRET'],
    warnings: ['SWAGGER_ENABLED should be false']
  }
};

function loadEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return vars;
  } catch (error) {
    return null;
  }
}

function validateEnvironment(envVars, envType) {
  const issues = {
    missing: [],
    warnings: [],
    critical: []
  };

  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    if (!envVars[varName]) {
      issues.missing.push(varName);
    }
  });

  // Environment-specific validations
  const envRules = ENV_SPECIFIC_REQUIREMENTS[envType];
  if (envRules) {
    // Check critical variables
    if (envRules.critical) {
      envRules.critical.forEach(varName => {
        if (!envVars[varName] || envVars[varName].includes('dev-') || envVars[varName].includes('change-in-production')) {
          issues.critical.push(`${varName} contains development placeholder`);
        }
      });
    }

    // Check warnings
    if (envType === 'production' && envVars.SWAGGER_ENABLED === 'true') {
      issues.warnings.push('SWAGGER_ENABLED should be false in production');
    }

    if (envType === 'production' && envVars.JWT_EXPIRES_IN === '1d') {
      issues.warnings.push('JWT_EXPIRES_IN should be shorter in production (e.g., 15m)');
    }
  }

  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const envType = args[0] || process.env.NODE_ENV || 'development';
  
  console.log(`🔍 Validating ${envType} environment configuration...\n`);

  // Determine env file path
  let envFile;
  switch (envType) {
    case 'development':
      envFile = '.env';
      break;
    case 'staging':
      envFile = '.env.staging';
      break;
    case 'production':
      envFile = '.env.production';
      break;
    default:
      console.error(`❌ Unknown environment type: ${envType}`);
      process.exit(1);
  }

  const envPath = path.join(__dirname, '..', envFile);
  const envVars = loadEnvFile(envPath);

  if (!envVars) {
    console.error(`❌ Could not load environment file: ${envPath}`);
    console.log(`💡 Create the file or run: cp env.template ${envFile}`);
    process.exit(1);
  }

  const issues = validateEnvironment(envVars, envType);
  
  // Report results
  if (issues.missing.length === 0 && issues.critical.length === 0) {
    console.log('✅ Environment configuration is valid!');
    
    if (issues.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      issues.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log(`\n📊 Configuration summary for ${envType}:`);
    console.log(`   - Environment: ${envVars.NODE_ENV}`);
    console.log(`   - Port: ${envVars.PORT}`);
    console.log(`   - Database: ${envVars.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   - JWT Secret: ${envVars.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Swagger: ${envVars.SWAGGER_ENABLED}`);
    
  } else {
    console.log('❌ Environment configuration has issues:\n');
    
    if (issues.critical.length > 0) {
      console.log('🚨 Critical Issues:');
      issues.critical.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }
    
    if (issues.missing.length > 0) {
      console.log('📋 Missing Variables:');
      issues.missing.forEach(varName => console.log(`   - ${varName}`));
      console.log('');
    }
    
    if (issues.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      issues.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

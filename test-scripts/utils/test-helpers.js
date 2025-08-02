// Common Testing Utility Functions
// Shared functions used across multiple test scripts

const fs = require('fs');
const path = require('path');

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Console logging utilities
function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logTest(testName) {
  log(`🧪 ${testName}`, 'cyan');
}

// Test result tracking
class TestResults {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.tests = [];
  }

  addTest(name, passed, error = null, warning = null) {
    const test = {
      name,
      passed,
      error,
      warning,
      timestamp: new Date().toISOString()
    };
    
    this.tests.push(test);
    
    if (passed) {
      this.passed++;
      logSuccess(`${name} passed`);
    } else {
      this.failed++;
      logError(`${name} failed`);
      if (error) {
        logError(`  Error: ${error}`);
      }
    }
    
    if (warning) {
      this.warnings++;
      logWarning(`  Warning: ${warning}`);
    }
  }

  getSummary() {
    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
      successRate: `${successRate}%`
    };
  }

  printSummary() {
    const summary = this.getSummary();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Success Rate: ${summary.successRate}`);
    
    if (summary.failed > 0) {
      console.log('\nFailed Tests:');
      this.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}`);
          if (test.error) console.log(`    Error: ${test.error}`);
        });
    }
    
    if (summary.warnings > 0) {
      console.log('\nWarnings:');
      this.tests
        .filter(test => test.warning)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.warning}`);
        });
    }
  }
}

// Environment validation
function validateEnvironment() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'RECALL_API_KEY'
  ];
  
  const missing = [];
  const warnings = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });
  
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  if (warnings.length > 0) {
    logWarning(`Missing optional environment variables: ${warnings.join(', ')}`);
  }
  
  logSuccess('Environment validation passed');
  return true;
}

// File utilities
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logInfo(`Created directory: ${dirPath}`);
  }
}

function saveTestResults(results, filename = 'test-results.json') {
  const filepath = path.join(__dirname, '..', filename);
  
  try {
    const data = {
      timestamp: new Date().toISOString(),
      summary: results.getSummary(),
      tests: results.tests
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    logSuccess(`Test results saved to: ${filepath}`);
    return true;
  } catch (error) {
    logError(`Failed to save test results: ${error.message}`);
    return false;
  }
}

// Data validation utilities
function validateRequiredFields(data, requiredFields, dataType) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (errors.length > 0) {
    logError(`${dataType} validation failed:`);
    errors.forEach(error => logError(`  ${error}`));
    return false;
  }
  
  return true;
}

function validateDataTypes(data, typeMap, dataType) {
  const errors = [];
  
  Object.keys(typeMap).forEach(field => {
    const expectedType = typeMap[field];
    const actualType = typeof data[field];
    
    if (data[field] !== undefined && actualType !== expectedType) {
      errors.push(`${field} should be ${expectedType}, got ${actualType}`);
    }
  });
  
  if (errors.length > 0) {
    logError(`${dataType} type validation failed:`);
    errors.forEach(error => logError(`  ${error}`));
    return false;
  }
  
  return true;
}

// Date utilities
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function formatDate(dateString) {
  return new Date(dateString).toISOString();
}

// Async utilities
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logWarning(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Performance utilities
function measurePerformance(operation, operationName = 'Operation') {
  const startTime = Date.now();
  
  return async (...args) => {
    const result = await operation(...args);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logInfo(`${operationName} completed in ${duration}ms`);
    return result;
  };
}

// Export utilities
module.exports = {
  // Console utilities
  log,
  logSuccess,
  logError,
  logWarning,
  logInfo,
  logTest,
  
  // Test tracking
  TestResults,
  
  // Environment utilities
  validateEnvironment,
  
  // File utilities
  ensureDirectoryExists,
  saveTestResults,
  
  // Data validation
  validateRequiredFields,
  validateDataTypes,
  
  // Date utilities
  isValidDate,
  formatDate,
  
  // Async utilities
  retryOperation,
  measurePerformance
}; 
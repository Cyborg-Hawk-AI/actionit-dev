#!/usr/bin/env node

// Master Test Runner
// Runs all test scripts in the correct order

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const { log, logSuccess, logError, logInfo, TestResults } = require('./utils/test-helpers');

// Test scripts to run in order
const TEST_SCRIPTS = [
  'create-test-user.js',
  'test-auth-flow.js'
];

// Optional test scripts (will run if they exist)
const OPTIONAL_SCRIPTS = [
  'test-calendar-integration.js'
];

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    
    if (!fs.existsSync(scriptPath)) {
      logError(`Script not found: ${scriptName}`);
      resolve({ success: false, error: 'Script not found' });
      return;
    }
    
    logInfo(`Running ${scriptName}...`);
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${scriptName} completed successfully`);
        resolve({ success: true, code });
      } else {
        logError(`${scriptName} failed with code ${code}`);
        resolve({ success: false, code });
      }
    });
    
    child.on('error', (error) => {
      logError(`${scriptName} failed to start: ${error.message}`);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Action.IT Test Suite\n');
  console.log('=' .repeat(60));
  
  const results = new TestResults();
  
  try {
    // Run required test scripts
    for (const script of TEST_SCRIPTS) {
      const result = await runScript(script);
      results.addTest(
        script,
        result.success,
        result.success ? null : `Exit code: ${result.code}`
      );
      
      // Add a small delay between scripts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Run optional test scripts
    for (const script of OPTIONAL_SCRIPTS) {
      const result = await runScript(script);
      if (result.success) {
        results.addTest(script, true);
      } else {
        results.addTest(script, false, `Exit code: ${result.code}`, 'Optional script failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print summary
    results.printSummary();
    
    // Save results
    const fs = require('fs');
    const resultsPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: results.getSummary(),
      tests: results.tests
    }, null, 2));
    
    console.log(`\n📊 Detailed results saved to: ${resultsPath}`);
    
    // Exit with appropriate code
    const summary = results.getSummary();
    if (summary.failed > 0) {
      console.log('\n❌ Some tests failed. Please check the output above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    logError(`Test suite failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Action.IT Test Suite Runner

Usage:
  node run-all-tests.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output

Available Tests:
  Required:
    - create-test-user.js      Creates test user in Supabase
    - test-auth-flow.js        Tests authentication flow

  Optional:
    - test-calendar-integration.js  Tests calendar integration

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_ANON_KEY        Supabase anonymous key
  SUPABASE_SERVICE_ROLE_KEY Supabase service role key (for user creation)

Examples:
  node run-all-tests.js
  SUPABASE_SERVICE_ROLE_KEY=your-key node run-all-tests.js
  `);
  process.exit(0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runScript
}; 
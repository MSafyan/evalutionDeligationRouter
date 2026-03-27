import dotenv from 'dotenv';

dotenv.config();

/**
 * Error Scenario Tests
 * Tests system behavior under error conditions
 */

const BASE_URL = 'http://localhost:3000';

interface ErrorTest {
  name: string;
  endpoint: string;
  method: string;
  body?: any;
  expectedStatus: number;
  validateError: (response: any) => boolean;
}

const errorTests: ErrorTest[] = [
  // Test 1: Missing query parameter
  {
    name: 'Missing query parameter',
    endpoint: '/api/chat/stream',
    method: 'POST',
    body: {},
    expectedStatus: 400,
    validateError: (response) => response.error && response.error.includes('required'),
  },

  // Test 2: Invalid query type
  {
    name: 'Invalid query type (number instead of string)',
    endpoint: '/api/chat/stream',
    method: 'POST',
    body: { query: 12345 },
    expectedStatus: 400,
    validateError: (response) => response.error && response.error.includes('string'),
  },

  // Test 3: Empty query string
  {
    name: 'Empty query string',
    endpoint: '/api/chat',
    method: 'POST',
    body: { query: '' },
    expectedStatus: 400,
    validateError: (response) => response.error && response.error.includes('required'),
  },

  // Test 4: Query outside knowledge base (should fallback gracefully)
  {
    name: 'Query outside knowledge base (fallback to direct answer)',
    endpoint: '/api/chat',
    method: 'POST',
    body: { query: 'What is the meaning of life?' },
    expectedStatus: 200,
    validateError: (response) =>
      response.answer && response.answer.length > 0 && response.data.length === 0,
  },
];

/**
 * Run error scenario tests
 */
async function runErrorTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 ERROR SCENARIO TESTS');
  console.log('='.repeat(80));
  console.log('\nTesting system behavior under error conditions\n');

  let passedTests = 0;
  let failedTests = 0;

  for (const test of errorTests) {
    console.log('-'.repeat(80));
    console.log(`\n📝 ${test.name}`);
    console.log(`Endpoint: ${test.method} ${test.endpoint}`);
    if (test.body) {
      console.log(`Body: ${JSON.stringify(test.body)}`);
    }
    console.log(`Expected Status: ${test.expectedStatus}\n`);

    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      console.log(`Received Status: ${response.status}`);

      const statusMatch = response.status === test.expectedStatus;
      console.log(`Status validation: ${statusMatch ? '✅ PASS' : '❌ FAIL'}`);

      if (test.expectedStatus >= 400) {
        // Error response expected
        const data = await response.json();
        console.log(`Error message: "${data.error || data.message}"`);

        const errorValid = test.validateError(data);
        console.log(`Error validation: ${errorValid ? '✅ PASS' : '❌ FAIL'}`);

        if (statusMatch && errorValid) {
          console.log('\n🎉 TEST PASSED');
          passedTests++;
        } else {
          console.log('\n❌ TEST FAILED');
          failedTests++;
        }
      } else {
        // Success response expected (but with "no data found" type message)
        const data = await response.json();
        const messageValid = test.validateError(data);
        console.log(`Response validation: ${messageValid ? '✅ PASS' : '❌ FAIL'}`);

        if (statusMatch && messageValid) {
          console.log('\n🎉 TEST PASSED');
          passedTests++;
        } else {
          console.log('\n❌ TEST FAILED');
          console.log('Response:', JSON.stringify(data, null, 2));
          failedTests++;
        }
      }
    } catch (error) {
      console.error('\n❌ TEST FAILED - Unexpected error:');
      console.error(error);
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 ERROR TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal tests: ${errorTests.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / errorTests.length) * 100).toFixed(1)}%`);

  if (passedTests === errorTests.length) {
    console.log('\n🎉 ALL ERROR TESTS PASSED! Error handling is working correctly.\n');
  } else {
    console.log('\n⚠️  Some error tests failed. Please review the output above.\n');
  }

  console.log('='.repeat(80) + '\n');

  return { passedTests, failedTests, total: errorTests.length };
}

// Run tests
runErrorTests()
  .then((result) => {
    process.exit(result.failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Error test suite failed:', error);
    process.exit(1);
  });

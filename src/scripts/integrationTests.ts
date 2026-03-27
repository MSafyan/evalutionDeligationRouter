import dotenv from 'dotenv';

dotenv.config();

/**
 * Integration Tests for Multi-Agent RAG System
 * Tests all 4 user journeys from the plan
 */

const BASE_URL = 'http://localhost:3000';

interface TestCase {
  name: string;
  query: string;
  expectedRoute: string;
  expectedDataTypes: string[];
  validateAnswer: (answer: string) => boolean;
}

/**
 * Helper function to make streaming requests
 */
async function testStreamingEndpoint(query: string): Promise<{
  answer: string;
  data: any[];
  events: any[];
}> {
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const events: any[] = [];
  let answer = '';
  let data: any[] = [];

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No reader available');
  }

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const eventData = line.slice(6);
        try {
          const event = JSON.parse(eventData);
          events.push(event);

          if (event.type === 'answer_chunk') {
            answer += event.chunk;
          } else if (event.type === 'data') {
            data = event.data;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  return { answer, data, events };
}

/**
 * Test cases from the plan
 */
const testCases: TestCase[] = [
  // Test 1: Simple RAG Query
  {
    name: 'Test 1: Simple RAG Query',
    query: 'What is photosynthesis?',
    expectedRoute: 'RAG',
    expectedDataTypes: ['rag_reference'],
    validateAnswer: (answer) => {
      return (
        answer.toLowerCase().includes('photosynthesis') &&
        answer.toLowerCase().includes('plant') &&
        answer.includes('Reference')
      );
    },
  },

  // Test 2: Chart Generation
  {
    name: 'Test 2: Chart Generation',
    query: 'Show me a bar chart of sales data',
    expectedRoute: 'Chart',
    expectedDataTypes: ['chartjs_config'],
    validateAnswer: (answer) => {
      return answer.toLowerCase().includes('chart');
    },
  },

  // Test 3: Combined Query
  {
    name: 'Test 3: Combined Query (RAG + Chart)',
    query: 'What were Q1 sales and create a chart',
    expectedRoute: 'RAG + Chart',
    expectedDataTypes: ['rag_reference', 'chartjs_config'],
    validateAnswer: (answer) => {
      return (
        answer.toLowerCase().includes('sales') ||
        answer.toLowerCase().includes('q1') ||
        answer.toLowerCase().includes('revenue')
      );
    },
  },

  // Test 4: Direct Answer
  {
    name: 'Test 4: Direct Answer',
    query: 'What is 2+2?',
    expectedRoute: 'Direct',
    expectedDataTypes: [],
    validateAnswer: (answer) => {
      return answer.includes('4');
    },
  },
];

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 INTEGRATION TESTS - Multi-Agent RAG System');
  console.log('='.repeat(80));
  console.log('\nTesting all 4 user journeys from the implementation plan\n');

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log('\n' + '-'.repeat(80));
    console.log(`\n📝 ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected Route: ${testCase.expectedRoute}`);
    console.log(`Expected Data Types: ${testCase.expectedDataTypes.join(', ') || 'None'}`);
    console.log();

    try {
      // Execute test
      const result = await testStreamingEndpoint(testCase.query);

      console.log('✅ Request completed successfully\n');

      // Validate answer
      console.log('📄 Answer Preview:');
      const preview = result.answer.substring(0, 150);
      console.log(`   ${preview}${result.answer.length > 150 ? '...' : ''}\n`);

      const answerValid = testCase.validateAnswer(result.answer);
      console.log(`   Answer validation: ${answerValid ? '✅ PASS' : '❌ FAIL'}`);

      // Validate data types
      console.log('\n📎 Data received:');
      if (result.data.length === 0) {
        console.log('   None');
      } else {
        result.data.forEach((item, index) => {
          console.log(`   ${index + 1}. Type: ${item.type}`);
          if (item.type === 'rag_reference') {
            console.log(`      FileId: ${item.fileId}, Pages: ${item.pageNumbers.join(', ')}`);
          } else if (item.type === 'chartjs_config') {
            console.log(`      Chart Type: ${item.config.type}, Description: ${item.description}`);
          }
        });
      }

      const receivedTypes = result.data.map((d: any) => d.type);
      const dataTypesMatch =
        testCase.expectedDataTypes.length === receivedTypes.length &&
        testCase.expectedDataTypes.every((type) => receivedTypes.includes(type));

      console.log(`\n   Data types validation: ${dataTypesMatch ? '✅ PASS' : '❌ FAIL'}`);
      if (!dataTypesMatch) {
        console.log(`   Expected: ${testCase.expectedDataTypes.join(', ') || 'None'}`);
        console.log(`   Received: ${receivedTypes.join(', ') || 'None'}`);
      }

      // Validate streaming
      const hasAnswerChunks = result.events.some((e) => e.type === 'answer_chunk');
      const hasDoneEvent = result.events.some((e) => e.type === 'done');

      console.log('\n🔄 Streaming validation:');
      console.log(`   Answer chunks received: ${hasAnswerChunks ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Done event received: ${hasDoneEvent ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Total events: ${result.events.length}`);

      // Overall test result
      const testPassed = answerValid && dataTypesMatch && hasAnswerChunks && hasDoneEvent;

      if (testPassed) {
        console.log('\n🎉 TEST PASSED');
        passedTests++;
      } else {
        console.log('\n❌ TEST FAILED');
        failedTests++;
      }

    } catch (error) {
      console.error('\n❌ TEST FAILED - Error occurred:');
      console.error(error);
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

  if (passedTests === testCases.length) {
    console.log('\n🎉 ALL TESTS PASSED! System is working as expected.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
  }

  console.log('='.repeat(80) + '\n');

  return { passedTests, failedTests, total: testCases.length };
}

// Run tests
runIntegrationTests()
  .then((result) => {
    process.exit(result.failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });

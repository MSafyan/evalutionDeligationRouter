import { delegatingAgent } from '../agents/delegatingAgent.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the delegating agent with various query types
 */
async function testDelegatingAgent() {
  console.log('🧪 Testing Delegating Agent (Main Router)...\n');
  console.log('='.repeat(80));
  console.log('This test verifies all routing paths:\n');
  console.log('1. Direct Answer - Simple questions');
  console.log('2. RAG Agent - Knowledge base queries');
  console.log('3. Chart Tool - Visualization requests');
  console.log('4. RAG + Chart - Combined queries');
  console.log('='.repeat(80));

  const testCases = [
    {
      category: 'Direct Answer',
      query: 'What is 2 + 2?',
      expectedRoute: 'direct',
    },
    {
      category: 'RAG Agent',
      query: 'What is photosynthesis?',
      expectedRoute: 'rag',
    },
    {
      category: 'RAG Agent',
      query: 'Tell me about our Q1 sales performance',
      expectedRoute: 'rag',
    },
    {
      category: 'Chart Tool',
      query: 'Show me a bar chart',
      expectedRoute: 'chart',
    },
    {
      category: 'Chart Tool',
      query: 'Create a visualization of product categories',
      expectedRoute: 'chart',
    },
    {
      category: 'RAG + Chart',
      query: 'What were Q1 sales and show me a chart',
      expectedRoute: 'rag_and_chart',
    },
    {
      category: 'RAG + Chart',
      query: 'Analyze sales revenue and visualize it',
      expectedRoute: 'rag_and_chart',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📝 Test Case: ${testCase.category}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected Route: ${testCase.expectedRoute}`);
    console.log('-'.repeat(80));

    try {
      const result = await delegatingAgent.execute(testCase.query);

      console.log('\n✅ RESULT:');
      console.log('\nAnswer:');
      console.log(result.answer);

      if (result.data.length > 0) {
        console.log('\n📎 Data:');
        result.data.forEach((item, index) => {
          if ('type' in item && item.type === 'rag_reference') {
            console.log(`   ${index + 1}. RAG Reference - FileId: ${item.fileId}, Pages: ${item.pageNumbers.join(', ')}`);
          } else if ('type' in item && item.type === 'chartjs_config') {
            console.log(`   ${index + 1}. Chart Config - Type: ${item.config.type}, Description: ${item.description}`);
          }
        });
      } else {
        console.log('\n📎 Data: None');
      }

    } catch (error) {
      console.error('\n❌ ERROR:', error);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✨ Delegating Agent testing complete!\n');
}

// Run tests
testDelegatingAgent()
  .then(() => {
    console.log('🎉 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  });

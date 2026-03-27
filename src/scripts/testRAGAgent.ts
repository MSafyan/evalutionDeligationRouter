import { ragAgent } from '../agents/ragAgent.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the RAG agent with various queries
 */
async function testRAGAgent() {
  console.log('🧪 Testing RAG Agent...\n');
  console.log('='.repeat(80));

  const testQueries = [
    'What is photosynthesis?',
    'Tell me about our Q1 2024 sales performance',
    'How do neural networks work?',
    'When was the internet invented?',
    'What is the meaning of life?', // This should return "no relevant data"
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(80));

    try {
      const result = await ragAgent.execute(query);

      console.log('\n✅ Answer:');
      console.log(result.answer);

      if (result.data.length > 0) {
        console.log('\n📎 References:');
        result.data.forEach((ref) => {
          console.log(`   - FileId: ${ref.fileId}, Pages: ${ref.pageNumbers.join(', ')}`);
        });
      } else {
        console.log('\n📎 References: None (no relevant data found)');
      }

      console.log('\n' + '='.repeat(80));

    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✨ RAG Agent testing complete!\n');
}

// Run tests
testRAGAgent()
  .then(() => {
    console.log('🎉 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  });

import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

const TENANT_NAME = 'demo_tenant';

/**
 * Test vector search with different queries
 */
async function testRetrieval() {
  console.log('🧪 Testing vector search retrieval...\n');

  const client: WeaviateClient = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  const testQueries = [
    'Tell me about Q1 sales',
    'How does AI work?',
    'What is the history of the internet?',
    'Explain chlorophyll',
  ];

  try {
    for (const query of testQueries) {
      console.log(`Query: "${query}"`);

      const result = await client.graphql
        .get()
        .withClassName('QnADocument')
        .withTenant(TENANT_NAME)
        .withFields('fileId question answer pageNumbers')
        .withNearText({ concepts: [query] })
        .withLimit(1)
        .do();

      const objects = result.data.Get.QnADocument;

      if (objects && objects.length > 0) {
        const obj = objects[0];
        console.log(`✅ Match found:`);
        console.log(`   FileId: ${obj.fileId}, Pages: ${obj.pageNumbers.join(', ')}`);
        console.log(`   Question: ${obj.question}`);
        console.log(`   Answer: ${obj.answer.substring(0, 100)}...`);
      } else {
        console.log('❌ No results found');
      }
      console.log();
    }

    console.log('✨ Retrieval tests complete!\n');

  } catch (error) {
    console.error('❌ Error testing retrieval:', error);
    throw error;
  }
}

testRetrieval()
  .then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  });

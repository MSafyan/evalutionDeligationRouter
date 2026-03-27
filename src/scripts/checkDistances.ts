import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

const TENANT_NAME = 'demo_tenant';

async function checkDistances() {
  console.log('🔍 Checking distance scores for photosynthesis query...\n');

  const client: WeaviateClient = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  const query = 'What is photosynthesis?';

  const result = await client.graphql
    .get()
    .withClassName('QnADocument')
    .withTenant(TENANT_NAME)
    .withFields('fileId question _additional { distance }')
    .withNearText({ concepts: [query] })
    .withLimit(5)
    .do();

  const objects = result.data.Get.QnADocument;

  console.log(`Query: "${query}"\n`);
  console.log('Results with distance scores:');
  objects.forEach((obj: any, index: number) => {
    const distance = obj._additional.distance;
    const similarity = 1 - distance;
    console.log(`\n${index + 1}. FileId: ${obj.fileId}`);
    console.log(`   Question: ${obj.question}`);
    console.log(`   Distance: ${distance.toFixed(4)}`);
    console.log(`   Similarity: ${similarity.toFixed(4)} (${(similarity * 100).toFixed(1)}%)`);
    console.log(`   Above 0.7? ${similarity >= 0.7 ? '✅ YES' : '❌ NO'}`);
  });

  console.log('\n---');
  console.log('Note: Cosine distance ranges from 0 (identical) to 2 (opposite)');
  console.log('Similarity = 1 - distance, so 0.7 threshold = 0.3 max distance');
}

checkDistances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

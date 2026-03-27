import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TENANT_NAME = 'demo_tenant';

/**
 * Fictional Q&A data covering different topics
 */
const fictionalData = [
  // Entry 1: Science topic (Photosynthesis)
  {
    fileId: '1',
    question: 'What is photosynthesis and how does it work?',
    answer: 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. It involves the green pigment chlorophyll and generates oxygen as a byproduct. The process occurs in two main stages: the light-dependent reactions and the Calvin cycle. During photosynthesis, plants convert light energy into chemical energy stored in glucose molecules.',
    pageNumbers: ['3', '5'],
  },
  {
    fileId: '1',
    question: 'Why are leaves green?',
    answer: 'Leaves are green because they contain chlorophyll, a pigment that absorbs red and blue light from the sun but reflects green light. This reflected green light is what we see, making leaves appear green. Chlorophyll is essential for photosynthesis, the process by which plants make their food.',
    pageNumbers: ['7'],
  },

  // Entry 2: Business/Sales topic (for Chart.js testing)
  {
    fileId: '2',
    question: 'What were our Q1 2024 sales figures?',
    answer: 'Our Q1 2024 sales performance was strong across all regions. January sales reached $120,000, February saw a growth to $150,000, and March peaked at $200,000. The total Q1 revenue was $470,000, representing a 15% increase compared to Q1 2023. The growth was primarily driven by our new product line and expansion into the Northeast market.',
    pageNumbers: ['12', '13'],
  },
  {
    fileId: '2',
    question: 'Which product category performed best in Q1?',
    answer: 'The Software Solutions category was our top performer in Q1 2024, accounting for 45% of total revenue. Hardware sales contributed 30%, and Professional Services made up 25%. Software Solutions showed a 22% year-over-year growth, driven by increased demand for cloud-based applications.',
    pageNumbers: ['15'],
  },

  // Entry 3: General knowledge (Technology)
  {
    fileId: '3',
    question: 'What is artificial intelligence?',
    answer: 'Artificial Intelligence (AI) is a branch of computer science focused on creating systems capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. AI systems can be categorized into narrow AI, which is designed for specific tasks, and general AI, which aims to match human cognitive abilities across a wide range of activities.',
    pageNumbers: ['22', '23', '24'],
  },
  {
    fileId: '3',
    question: 'How do neural networks work?',
    answer: 'Neural networks are computing systems inspired by biological neural networks in animal brains. They consist of interconnected nodes (neurons) organized in layers: an input layer, one or more hidden layers, and an output layer. Each connection has a weight that adjusts as learning proceeds. Neural networks learn by processing examples and adjusting weights to minimize the difference between predicted and actual outputs.',
    pageNumbers: ['26'],
  },

  // Entry 4: History topic
  {
    fileId: '4',
    question: 'When was the internet invented?',
    answer: 'The internet was developed gradually over several decades. ARPANET, the precursor to the internet, was created in 1969 by the U.S. Department of Defense. The TCP/IP protocol suite, which forms the foundation of the modern internet, was standardized in 1983. The World Wide Web, which made the internet accessible to the general public, was invented by Tim Berners-Lee in 1989 and became publicly available in 1991.',
    pageNumbers: ['31', '32'],
  },
];

/**
 * Seed Weaviate with fictional data
 */
async function seedData() {
  console.log('🌱 Starting data seeding process...\n');

  // Initialize Weaviate client
  const client: WeaviateClient = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  try {
    // Step 1: Create tenant
    console.log(`📝 Creating tenant: ${TENANT_NAME}`);

    // Check if tenant already exists
    const existingTenants = await client.schema
      .tenantsGetter('QnADocument')
      .do();

    const tenantExists = existingTenants.some(
      (t: any) => t.name === TENANT_NAME
    );

    if (tenantExists) {
      console.log(`⚠️  Tenant "${TENANT_NAME}" already exists`);

      // Delete all existing objects for this tenant
      console.log('🗑️  Clearing existing data...');
      await client.batch
        .objectsBatchDeleter()
        .withClassName('QnADocument')
        .withTenant(TENANT_NAME)
        .withWhere({
          path: ['fileId'],
          operator: 'Like',
          valueText: '*',
        })
        .do();
      console.log('✅ Existing data cleared\n');
    } else {
      await client.schema
        .tenantsCreator('QnADocument', [{ name: TENANT_NAME }])
        .do();
      console.log(`✅ Tenant "${TENANT_NAME}" created\n`);
    }

    // Step 2: Insert data using batch
    console.log(`📦 Inserting ${fictionalData.length} Q&A entries...`);

    let batcher = client.batch.objectsBatcher();

    for (const item of fictionalData) {
      batcher = batcher.withObject({
        class: 'QnADocument',
        properties: item,
        tenant: TENANT_NAME,
      });
    }

    const result = await batcher.do();

    console.log(`✅ Batch insert completed!`);
    console.log(`   Objects created: ${result.length}`);

    // Check for errors
    const errors = result.filter((r: any) => r.result?.errors);
    if (errors.length > 0) {
      console.error('⚠️  Some objects had errors:', errors);
    }
    console.log();

    // Step 3: Wait for embeddings to be generated
    console.log('⏳ Waiting for embeddings to be generated (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log();

    // Step 4: Verify data with a test query
    console.log('🔍 Testing retrieval with sample query...');

    const testQuery = 'Tell me about photosynthesis';
    console.log(`   Query: "${testQuery}"\n`);

    const searchResult = await client.graphql
      .get()
      .withClassName('QnADocument')
      .withTenant(TENANT_NAME)
      .withFields('fileId question answer pageNumbers')
      .withNearText({ concepts: [testQuery] })
      .withLimit(2)
      .do();

    const objects = searchResult.data.Get.QnADocument;

    if (objects && objects.length > 0) {
      console.log(`✅ Retrieved ${objects.length} relevant results:`);
      objects.forEach((obj: any, index: number) => {
        console.log(`\n   Result ${index + 1}:`);
        console.log(`   FileId: ${obj.fileId}`);
        console.log(`   Question: ${obj.question}`);
        console.log(`   Pages: ${obj.pageNumbers.join(', ')}`);
      });
    } else {
      console.log('⚠️  No results found');
    }
    console.log();

    // Step 5: Get total count
    const aggregation = await client.graphql
      .aggregate()
      .withClassName('QnADocument')
      .withTenant(TENANT_NAME)
      .withFields('meta { count }')
      .do();

    const totalCount = aggregation.data.Aggregate.QnADocument[0].meta.count;
    console.log(`📊 Total objects in database: ${totalCount}`);
    console.log();

    console.log('✨ Data seeding complete!\n');
    console.log('Summary:');
    console.log(`   - Tenant: ${TENANT_NAME}`);
    console.log(`   - Total entries: ${totalCount}`);
    console.log(`   - Topics covered: Science, Business, Technology, History`);
    console.log(`   - Embeddings: Auto-generated via OpenAI text-embedding-3-small`);
    console.log();

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run the seeding
seedData()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

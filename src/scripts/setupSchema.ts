import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Setup Weaviate schema with multi-tenancy enabled
 * Creates QnADocument class with OpenAI vectorizer
 */
async function setupSchema() {
  console.log('🚀 Setting up Weaviate schema...\n');

  // Initialize Weaviate client
  const client: WeaviateClient = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  try {
    // Check if schema already exists
    const existingSchema = await client.schema.getter().do();
    const classExists = existingSchema.classes?.some(
      (c: any) => c.class === 'QnADocument'
    );

    if (classExists) {
      console.log('⚠️  QnADocument class already exists. Deleting...');
      await client.schema.classDeleter().withClassName('QnADocument').do();
      console.log('✅ Old schema deleted\n');
    }

    // Define schema with multi-tenancy
    const schemaConfig = {
      class: 'QnADocument',
      description: 'Question and Answer documents with multi-tenancy support',

      // Enable multi-tenancy for tenant isolation
      multiTenancyConfig: {
        enabled: true,
      },

      // Configure OpenAI vectorizer
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'text-embedding-3-small',
          modelVersion: '3',
          type: 'text',
          vectorizeClassName: false,
        },
      },

      // Define properties
      properties: [
        {
          name: 'fileId',
          dataType: ['text'],
          description: 'Identifier for the source file',
          moduleConfig: {
            'text2vec-openai': {
              skip: true, // Don't vectorize fileId
            },
          },
          indexFilterable: true,
          indexSearchable: false,
        },
        {
          name: 'question',
          dataType: ['text'],
          description: 'The question text',
          moduleConfig: {
            'text2vec-openai': {
              skip: false, // Vectorize question
            },
          },
          indexFilterable: true,
          indexSearchable: true,
        },
        {
          name: 'answer',
          dataType: ['text'],
          description: 'The answer text',
          moduleConfig: {
            'text2vec-openai': {
              skip: false, // Vectorize answer
            },
          },
          indexFilterable: true,
          indexSearchable: true,
        },
        {
          name: 'pageNumbers',
          dataType: ['text[]'],
          description: 'Array of page numbers where this Q&A appears',
          moduleConfig: {
            'text2vec-openai': {
              skip: true, // Don't vectorize page numbers
            },
          },
          indexFilterable: false,
          indexSearchable: false,
        },
      ],
    };

    // Create schema
    console.log('📝 Creating QnADocument schema...');
    await client.schema.classCreator().withClass(schemaConfig).do();
    console.log('✅ Schema created successfully!\n');

    // Verify schema
    const newSchema = await client.schema.getter().do();
    const createdClass = newSchema.classes?.find(
      (c: any) => c.class === 'QnADocument'
    );

    console.log('📋 Schema Details:');
    console.log(`   Class: ${createdClass?.class}`);
    console.log(`   Vectorizer: ${createdClass?.vectorizer}`);
    console.log(`   Multi-tenancy: ${createdClass?.multiTenancyConfig?.enabled}`);
    console.log(`   Properties: ${createdClass?.properties?.length}`);
    console.log('\n✨ Schema setup complete!\n');

  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    throw error;
  }
}

// Run the setup
setupSchema()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

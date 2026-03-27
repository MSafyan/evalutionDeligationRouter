import { delegatingAgent } from '../agents/delegatingAgent.js';

async function quickTest() {
  const query = 'Create a visualization of product categories';
  console.log(`Testing: "${query}"\n`);

  const result = await delegatingAgent.execute(query);

  console.log('\nAnswer:', result.answer);
  console.log('\nData items:', result.data.length);
  if (result.data.length > 0) {
    result.data.forEach((item) => {
      if ('type' in item && item.type === 'chartjs_config') {
        console.log(`Chart: ${item.config.type} - ${item.description}`);
      }
    });
  }
}

quickTest().then(() => process.exit(0)).catch(console.error);

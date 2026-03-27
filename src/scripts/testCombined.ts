import { delegatingAgent } from '../agents/delegatingAgent.js';

async function test() {
  const query = 'What were Q1 sales and show me a chart';
  console.log(`Testing: "${query}"\n`);

  const result = await delegatingAgent.execute(query);

  console.log('\nData types received:');
  result.data.forEach((item, index) => {
    if ('type' in item) {
      console.log(`${index + 1}. ${item.type}`);
    }
  });
}

test().then(() => process.exit(0)).catch(console.error);

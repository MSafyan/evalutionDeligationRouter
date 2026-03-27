import { chartTool, generateChart } from '../tools/chartTool.js';

/**
 * Test the Chart.js tool with various queries
 */
async function testChartTool() {
  console.log('🧪 Testing Chart.js Tool...\n');
  console.log('='.repeat(80));

  const testQueries = [
    'Show me a bar chart of Q1 sales',
    'Create a chart showing product category distribution',
    'Generate a line chart for growth trends',
    'Visualize the data',
  ];

  // Test 1: Direct function calls (non-LangChain)
  console.log('\n📊 Test 1: Direct Function Calls\n');

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    const result = generateChart(query);

    console.log(`✅ Generated ${result.config.type} chart`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Labels: ${result.config.data.labels.join(', ')}`);
    console.log(`   Data points: ${result.config.data.datasets[0].data.join(', ')}`);
    console.log();
  }

  console.log('='.repeat(80));

  // Test 2: LangChain tool invocation
  console.log('\n🔧 Test 2: LangChain Tool Invocation\n');

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);

    const result = await chartTool.invoke({ query });
    const parsed = JSON.parse(result);

    console.log(`✅ Tool returned ${parsed.config.type} chart`);
    console.log(`   Type: ${parsed.type}`);
    console.log(`   Description: ${parsed.description}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('\n✨ Chart tool testing complete!\n');

  // Display full example configuration
  console.log('📋 Sample Chart.js Configuration (Q1 Sales):\n');
  const sampleChart = generateChart('Show me Q1 sales');
  console.log(JSON.stringify(sampleChart, null, 2));
}

// Run tests
testChartTool()
  .then(() => {
    console.log('\n🎉 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  });

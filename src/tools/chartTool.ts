import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Chart.js configuration interface
 */
export interface ChartJsConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  options: {
    responsive: boolean;
    plugins?: {
      title?: {
        display: boolean;
        text: string;
      };
      legend?: {
        display: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
      };
    };
    scales?: {
      y?: {
        beginAtZero: boolean;
      };
    };
  };
}

/**
 * Chart tool result interface
 */
export interface ChartToolResult {
  type: 'chartjs_config';
  config: ChartJsConfig;
  description: string;
}

/**
 * Generate mock Chart.js configurations based on query analysis
 * In a production system, this would analyze data and generate real charts
 * For this demo, we return predefined mock charts
 */
function generateChartConfig(query: string): ChartToolResult {
  const queryLower = query.toLowerCase();

  // Analyze query to determine chart type
  if (queryLower.includes('sales') || queryLower.includes('revenue') || queryLower.includes('q1')) {
    // Sales/Revenue Bar Chart
    return {
      type: 'chartjs_config',
      description: 'Q1 2024 Monthly Sales Performance',
      config: {
        type: 'bar',
        data: {
          labels: ['January', 'February', 'March'],
          datasets: [
            {
              label: 'Sales Revenue ($)',
              data: [120000, 150000, 200000],
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Q1 2024 Monthly Sales Performance',
            },
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      },
    };
  }

  if (queryLower.includes('product') || queryLower.includes('category')) {
    // Product Category Pie Chart
    return {
      type: 'chartjs_config',
      description: 'Q1 Product Category Revenue Distribution',
      config: {
        type: 'pie',
        data: {
          labels: ['Software Solutions', 'Hardware', 'Professional Services'],
          datasets: [
            {
              label: 'Revenue Share (%)',
              data: [45, 30, 25],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Q1 Product Category Revenue Distribution',
            },
            legend: {
              display: true,
              position: 'right',
            },
          },
        },
      },
    };
  }

  if (queryLower.includes('growth') || queryLower.includes('trend') || queryLower.includes('line')) {
    // Growth Trend Line Chart
    return {
      type: 'chartjs_config',
      description: 'Year-over-Year Growth Trend',
      config: {
        type: 'line',
        data: {
          labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
          datasets: [
            {
              label: 'Quarterly Revenue ($)',
              data: [410000, 430000, 460000, 490000, 470000],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Year-over-Year Revenue Growth Trend',
            },
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      },
    };
  }

  // Default: Generic bar chart
  return {
    type: 'chartjs_config',
    description: 'Sample Data Visualization',
    config: {
      type: 'bar',
      data: {
        labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
        datasets: [
          {
            label: 'Sample Data',
            data: [65, 59, 80, 81],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sample Data Visualization',
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    },
  };
}

/**
 * Chart.js Tool for LangGraph
 * This tool generates Chart.js configurations based on user queries
 */
export const chartTool = new DynamicStructuredTool({
  name: 'generate_chart',
  description: `Generate Chart.js visualization configurations. Use this tool when the user asks for:
- Charts, graphs, or visualizations
- Visual representation of data
- Sales charts, revenue graphs
- Product category distributions
- Growth trends
Input should be the user's query describing what kind of chart they want.`,

  schema: z.object({
    query: z.string().describe('The user query requesting a chart or visualization'),
  }),

  func: async ({ query }) => {
    console.log(`[ChartTool] Generating chart for query: "${query}"`);

    const result = generateChartConfig(query);

    console.log(`[ChartTool] Generated ${result.config.type} chart: ${result.description}`);

    // Return as JSON string for LangChain compatibility
    return JSON.stringify(result, null, 2);
  },
});

/**
 * Standalone function for direct chart generation (non-LangChain)
 */
export function generateChart(query: string): ChartToolResult {
  console.log(`\n[Chart] ━━━ Chart Generation ━━━`);
  console.log(`[Chart] Query: "${query}"`);
  console.log(`[Chart] → Analyzing query for chart type...`);
  const result = generateChartConfig(query);
  console.log(`[Chart] ✓ Generated ${result.config.type} chart`);
  console.log(`[Chart]   Title: ${result.description}`);
  return result;
}

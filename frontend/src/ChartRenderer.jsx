import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
)

/**
 * ChartRenderer component
 * Renders Chart.js visualizations from config objects
 */
export default function ChartRenderer({ chartData }) {
  if (!chartData || !chartData.config) {
    return null
  }

  const { type, data, options } = chartData.config
  const { description } = chartData

  // Select the appropriate chart component based on type
  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    radar: Radar,
  }[type]

  if (!ChartComponent) {
    return (
      <div className="chart-error">
        <p>Unsupported chart type: {type}</p>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <strong>📊 {description}</strong>
      </div>
      <div className="chart-canvas">
        <ChartComponent data={data} options={options} />
      </div>
    </div>
  )
}

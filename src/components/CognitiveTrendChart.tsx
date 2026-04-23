import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { CognitiveSessionPoint } from '../types'
import { formatDate } from '../lib/clients'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface CognitiveTrendChartProps {
  history: CognitiveSessionPoint[]
}

export function CognitiveTrendChart({ history }: CognitiveTrendChartProps) {
  const data = useMemo(
    () => ({
      labels: history.map((p) => formatDate(p.date)),
      datasets: [
        {
          label: 'Accuracy',
          data: history.map((p) => p.accuracy),
          borderColor: 'rgb(37, 99, 235)',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          yAxisID: 'y',
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Processing speed',
          data: history.map((p) => p.processingSpeed),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y',
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Reaction (ms)',
          data: history.map((p) => p.reactionTime),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          yAxisID: 'y1',
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    }),
    [history],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' as const },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 20 } },
        y1: {
          position: 'right' as const,
          grid: { drawOnChartArea: false },
        },
        x: { grid: { display: false } },
      },
    }),
    [],
  )

  return (
    <div className="h-56 relative">
      <Line data={data} options={options} />
    </div>
  )
}

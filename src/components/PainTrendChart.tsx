import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { PainHistoryPoint } from '../types'
import { formatDate } from '../lib/clients'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface PainTrendChartProps {
  history: PainHistoryPoint[]
}

export function PainTrendChart({ history }: PainTrendChartProps) {
  const data = useMemo(
    () => ({
      labels: history.map((p) => formatDate(p.date)),
      datasets: [
        {
          label: 'Pain level',
          data: history.map((p) => p.value),
          borderColor: 'rgb(37, 99, 235)',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [history],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 1, max: 10, ticks: { stepSize: 1 } },
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

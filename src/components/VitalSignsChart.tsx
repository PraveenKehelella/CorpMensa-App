import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { VitalSignsPoint } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface VitalSignsChartProps {
  history: VitalSignsPoint[]
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [history],
  )

  const formatDateTime = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const data = useMemo(
    () => ({
      labels: sortedHistory.map((p) => formatDateTime(p.date)),
      datasets: [
        {
          label: 'Systolic',
          data: sortedHistory.map((p) => p.systolic),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.35,
          spanGaps: true,
        },
        {
          label: 'Diastolic',
          data: sortedHistory.map((p) => p.diastolic),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          tension: 0.35,
          spanGaps: true,
        },
        {
          label: 'Heart rate',
          data: sortedHistory.map((p) => p.heartRate),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.35,
        },
      ],
    }),
    [sortedHistory],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' as const },
      },
      scales: {
        y: {
          min: 30,
          max: 220,
          ticks: { stepSize: 20 },
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

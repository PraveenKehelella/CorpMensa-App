import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  duration: number
  isRunning: boolean
  resetKey?: string | number
  onTimeout: () => void
}

export function Timer({ duration, isRunning, resetKey, onTimeout }: TimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const timedOut = useRef(false)

  useEffect(() => {
    setRemaining(duration)
    timedOut.current = false
  }, [duration, resetKey])

  useEffect(() => {
    if (!isRunning || remaining <= 0) return
    const id = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [isRunning, remaining])

  useEffect(() => {
    if (remaining === 0 && !timedOut.current) {
      timedOut.current = true
      onTimeout()
    }
  }, [remaining, onTimeout])

  return (
    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
      Time: {remaining}s
    </div>
  )
}

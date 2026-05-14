import { useCallback, useState, type WheelEvent } from 'react'

const MIN_SCALE = 0.3
const MAX_SCALE = 2
const STEP = 0.08

export function useWheelZoom(initialScale = 1) {
  const [scale, setScale] = useState(initialScale)

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    event.preventDefault()

    setScale((current) => {
      const delta = event.deltaY > 0 ? -STEP : STEP
      const next = current + delta
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(next.toFixed(2))))
    })
  }, [])

  return { scale, onWheel }
}

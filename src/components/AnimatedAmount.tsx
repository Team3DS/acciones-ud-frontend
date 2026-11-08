import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n/I18n'

export function AnimatedAmount({ value, paused = false }: { value: number; paused?: boolean }) {
  const { money } = useI18n()
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return }
    let frame = 0
    const started = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - started) / 650, 1)
      setDisplay(from + (value - from) * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, paused])
  return <span className="animated-amount" aria-label={money(value)}><span aria-hidden="true">{money(display)}</span></span>
}

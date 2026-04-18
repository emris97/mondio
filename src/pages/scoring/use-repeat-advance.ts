import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type Options = {
  disabled?: boolean
  /** Задержка перед началом повтора при удержании */
  holdDelayMs?: number
  /** Интервал между шагами при удержании */
  repeatIntervalMs?: number
}

/**
 * Один тап по кнопке — один шаг при отпускании; удержание — повтор после задержки.
 */
export function useRepeatAdvance(
  advance: () => void,
  { disabled = false, holdDelayMs = 450, repeatIntervalMs = 90 }: Options = {},
) {
  const advanceRef = useRef(advance)
  useLayoutEffect(() => {
    advanceRef.current = advance
  })
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null)
  const repeatActive = useRef(false)
  /** Без этого pointerleave без предшествующего pointerdown давал ложный шаг (как «клик» при ховере). */
  const pressedRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current)
    if (intervalId.current) clearInterval(intervalId.current)
    timeoutId.current = null
    intervalId.current = null
  }, [])

  const onPointerDown = useCallback(() => {
    if (disabled) return
    pressedRef.current = true
    repeatActive.current = false
    timeoutId.current = setTimeout(() => {
      repeatActive.current = true
      advanceRef.current()
      intervalId.current = setInterval(() => advanceRef.current(), repeatIntervalMs)
    }, holdDelayMs)
  }, [disabled, holdDelayMs, repeatIntervalMs])

  const onPointerUp = useCallback(() => {
    if (disabled) return
    clearTimers()
    if (pressedRef.current && !repeatActive.current) {
      advanceRef.current()
    }
    repeatActive.current = false
    pressedRef.current = false
  }, [disabled, clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  return {
    onPointerDown,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onPointerCancel: onPointerUp,
  }
}

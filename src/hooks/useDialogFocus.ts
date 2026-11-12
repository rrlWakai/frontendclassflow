import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface DialogFocusOptions {
  onClose: () => void
  initialFocusRef?: RefObject<HTMLElement | null>
  initialFocusSelector?: string
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useDialogFocus<T extends HTMLElement>({
  onClose,
  initialFocusRef,
  initialFocusSelector = '[data-autofocus]',
}: DialogFocusOptions) {
  const containerRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const container = containerRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusInitial = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
        return
      }

      const target = container?.querySelector<HTMLElement>(initialFocusSelector)
      if (target) {
        target.focus()
      } else {
        container?.focus()
      }
    }

    const focusTimer = window.setTimeout(focusInitial, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !container) return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute('hidden') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0,
      )

      if (focusable.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow

      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus()
      }
    }
  }, [initialFocusRef, initialFocusSelector])

  return containerRef
}

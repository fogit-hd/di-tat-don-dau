import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type MouseEvent } from 'react'

const editable = (target: EventTarget | null) => target instanceof HTMLElement && (target.matches('input,textarea,select') || target.isContentEditable)

/** Browser chrome is suppressed only on Duck Race surfaces; gameplay pointer events still propagate. */
export function useGameSurfaceInput() {
  const [navigation, setNavigation] = useState<'pointer' | 'keyboard'>('pointer')
  const surface = useRef<HTMLElement>(null)
  useEffect(() => {
    // The first Tab/Ctrl+A may target <body>, before a control inside the game has focus.
    const key = (event: KeyboardEvent) => {
      const active = document.activeElement
      if (active !== document.body && !surface.current?.contains(active)) return
      if (event.key === 'Tab') setNavigation('keyboard')
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !editable(active)) event.preventDefault()
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [])
  return {
    ref: surface,
    'data-navigation': navigation,
    onPointerDownCapture: (event: PointerEvent<HTMLElement>) => {
      setNavigation('pointer')
      if (!editable(event.target)) window.getSelection()?.removeAllRanges()
    },
    onKeyDownCapture: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === 'Tab') setNavigation('keyboard')
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !editable(event.target)) event.preventDefault()
    },
    onDragStartCapture: (event: DragEvent<HTMLElement>) => { if (!editable(event.target)) event.preventDefault() },
    onContextMenu: (event: MouseEvent<HTMLElement>) => { event.preventDefault() },
  }
}

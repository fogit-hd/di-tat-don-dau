/** Image dragging and image context menus are disabled; text, controls and scrolling still work. */
export function installImageDragGuard() {
  const protect = (node: Node) => {
    if (!(node instanceof Element)) return
    if (node instanceof HTMLImageElement) node.draggable = false
    node.querySelectorAll('img').forEach(image => { image.draggable = false })
  }
  protect(document.documentElement)
  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(protect)
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  document.addEventListener('dragstart', event => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('img,picture,svg[data-game-art]') || target.closest('a')?.querySelector('img,picture,svg[data-game-art]')) event.preventDefault()
  }, true)
  document.addEventListener('contextmenu', event => {
    const target = event.target
    if (target instanceof Element && target.closest('img,picture,svg[data-game-art]')) event.preventDefault()
  }, true)
}

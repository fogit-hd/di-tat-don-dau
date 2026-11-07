export type EraPainting = { id: number; name: string; file: string; road: [number, number] }

export function panoramaTiles(camera: number, width: number, height: number, zoom: number, sourceWidth: number, sourceHeight: number) {
  const tileWidth = sourceWidth * height / sourceHeight
  const period = tileWidth / zoom
  const first = Math.floor(camera / period)
  const count = Math.ceil(width / tileWidth) + 2
  return Array.from({ length: count }, (_, index) => ({
    x: (first + index) * period * zoom - camera * zoom,
    width: tileWidth,
    height,
  }))
}

/** Preserve the full painting and its aspect ratio. Feather just the periodic join. */
export function periodicPainting(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const overlap = Math.max(2, Math.round(image.width * .018))
  const period = image.width - overlap
  const feather = document.createElement('canvas')
  feather.width = image.width
  feather.height = image.height
  const layer = feather.getContext('2d')!
  layer.drawImage(image, 0, 0)
  const mask = layer.createLinearGradient(0, 0, image.width, 0)
  mask.addColorStop(0, 'rgba(0,0,0,0)')
  mask.addColorStop(overlap / image.width, '#000')
  mask.addColorStop(1 - overlap / image.width, '#000')
  mask.addColorStop(1, 'rgba(0,0,0,0)')
  layer.globalCompositeOperation = 'destination-in'
  layer.fillStyle = mask
  layer.fillRect(0, 0, image.width, image.height)
  canvas.width = period
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.globalCompositeOperation = 'lighter'
  context.drawImage(feather, -period, 0)
  context.drawImage(feather, 0, 0)
  context.globalCompositeOperation = 'source-over'
}

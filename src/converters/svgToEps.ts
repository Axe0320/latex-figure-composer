import { calcEpsBBox, rgbaToHex, buildEps } from './imageToEps'

const RASTER_SCALE = 2

function parseSvgDimensions(svgText: string): { width: number; height: number } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement

  const vb = svg.getAttribute('viewBox')
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/)
    const w = parseFloat(parts[2] ?? '0')
    const h = parseFloat(parts[3] ?? '0')
    if (w > 0 && h > 0) return { width: w, height: h }
  }

  const w = parseFloat(svg.getAttribute('width') ?? '0')
  const h = parseFloat(svg.getAttribute('height') ?? '0')
  if (w > 0 && h > 0) return { width: w, height: h }

  return { width: 800, height: 600 }
}

async function rasterizeSvgToPixels(
  svgText: string,
  svgW: number,
  svgH: number,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const canvasW = Math.round(svgW * RASTER_SCALE)
  const canvasH = Math.round(svgH * RASTER_SCALE)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasW, canvasH)
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to rasterize SVG'))
    }
    img.src = url
  })

  const { data } = ctx.getImageData(0, 0, canvasW, canvasH)
  return { width: canvasW, height: canvasH, data }
}

export async function svgToEps(file: File): Promise<Uint8Array> {
  const svgText = await file.text()
  const { width: svgW, height: svgH } = parseSvgDimensions(svgText)
  const { width, height, data } = await rasterizeSvgToPixels(svgText, svgW, svgH)
  const { ptW, ptH } = calcEpsBBox(width, height)
  const hexData = rgbaToHex(data)
  const eps = buildEps(width, height, ptW, ptH, hexData)
  return new TextEncoder().encode(eps)
}

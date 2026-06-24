import { PDFDocument } from 'pdf-lib'

const MAX_PAGE_PT = 842
const RASTER_SCALE = 2 // render SVG at 2x for sharpness

async function getSvgViewBox(svgText: string): Promise<{ width: number; height: number }> {
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

function calcPageSize(
  svgW: number,
  svgH: number,
): { pageW: number; pageH: number; drawW: number; drawH: number } {
  const scale = Math.min(1, MAX_PAGE_PT / Math.max(svgW, svgH))
  const drawW = svgW * scale
  const drawH = svgH * scale
  return { pageW: drawW, pageH: drawH, drawW, drawH }
}

function svgToBlobURL(svgText: string): string {
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  return URL.createObjectURL(blob)
}

async function rasterizeSvg(svgText: string, svgW: number, svgH: number): Promise<Blob> {
  const canvasW = Math.round(svgW * RASTER_SCALE)
  const canvasH = Math.round(svgH * RASTER_SCALE)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas 2D context')

  const url = svgToBlobURL(svgText)

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

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob returned null'))
      },
      'image/png',
    )
  })
}

export async function svgToPdf(file: File): Promise<Uint8Array> {
  const svgText = await file.text()
  const { width: svgW, height: svgH } = await getSvgViewBox(svgText)
  const { pageW, pageH, drawW, drawH } = calcPageSize(svgW, svgH)

  const pngBlob = await rasterizeSvg(svgText, svgW, svgH)
  const pngBytes = await pngBlob.arrayBuffer()

  const pdfDoc = await PDFDocument.create()
  const img = await pdfDoc.embedPng(pngBytes)
  const page = pdfDoc.addPage([pageW, pageH])
  page.drawImage(img, { x: 0, y: 0, width: drawW, height: drawH })

  return pdfDoc.save()
}

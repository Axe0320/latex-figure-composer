import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer } from '../utils/fileHelpers'
import type { InputFormat } from '../types/conversion'

const MAX_PAGE_PT = 842 // A4 height in points (297mm)
const MARGIN_PT = 0    // no margin — preserve full image

function pixelsToPt(px: number, dpi = 72): number {
  return (px / dpi) * 72
}

async function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image dimensions'))
    }
    img.src = url
  })
}

function calcPageSize(
  imgW: number,
  imgH: number,
): { pageW: number; pageH: number; drawW: number; drawH: number; x: number; y: number } {
  const wPt = pixelsToPt(imgW)
  const hPt = pixelsToPt(imgH)

  // Scale down if larger than A4, keep aspect ratio
  const scale = Math.min(1, (MAX_PAGE_PT - MARGIN_PT * 2) / Math.max(wPt, hPt))
  const drawW = wPt * scale
  const drawH = hPt * scale
  const pageW = drawW + MARGIN_PT * 2
  const pageH = drawH + MARGIN_PT * 2
  const x = MARGIN_PT
  const y = MARGIN_PT

  return { pageW, pageH, drawW, drawH, x, y }
}

export async function pngToPdf(file: File): Promise<Uint8Array> {
  const [bytes, dims] = await Promise.all([
    readFileAsArrayBuffer(file),
    loadImageDimensions(file),
  ])

  const pdfDoc = await PDFDocument.create()
  const img = await pdfDoc.embedPng(bytes)
  const { pageW, pageH, drawW, drawH, x, y } = calcPageSize(dims.width, dims.height)

  const page = pdfDoc.addPage([pageW, pageH])
  page.drawImage(img, { x, y, width: drawW, height: drawH })

  return pdfDoc.save()
}

export async function jpegToPdf(file: File): Promise<Uint8Array> {
  const [bytes, dims] = await Promise.all([
    readFileAsArrayBuffer(file),
    loadImageDimensions(file),
  ])

  const pdfDoc = await PDFDocument.create()
  const img = await pdfDoc.embedJpg(bytes)
  const { pageW, pageH, drawW, drawH, x, y } = calcPageSize(dims.width, dims.height)

  const page = pdfDoc.addPage([pageW, pageH])
  page.drawImage(img, { x, y, width: drawW, height: drawH })

  return pdfDoc.save()
}

export async function imageToPdf(file: File, format: InputFormat): Promise<Uint8Array> {
  switch (format) {
    case 'png':
      return pngToPdf(file)
    case 'jpg':
    case 'jpeg':
      return jpegToPdf(file)
    default:
      throw new Error(`Unsupported format for imageToPdf: ${format}`)
  }
}

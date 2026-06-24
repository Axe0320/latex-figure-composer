import jsPDF from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'

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

export async function svgToPdfVector(file: File): Promise<Uint8Array> {
  const svgText = await file.text()
  const { width: svgW, height: svgH } = parseSvgDimensions(svgText)

  // SVG px → PDF pt (96dpi → 72dpi: × 0.75)
  const ptW = svgW * 0.75
  const ptH = svgH * 0.75

  const pdf = new jsPDF({
    unit: 'pt',
    format: [ptW, ptH],
    orientation: ptW >= ptH ? 'landscape' : 'portrait',
  })

  // svg2pdf requires the element to be live in the DOM
  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
  const svgEl = svgDoc.querySelector('svg')
  if (!svgEl) throw new Error('Invalid SVG: <svg> element not found')

  svgEl.setAttribute('width', String(svgW))
  svgEl.setAttribute('height', String(svgH))
  svgEl.style.position = 'absolute'
  svgEl.style.top = '-9999px'
  svgEl.style.left = '-9999px'
  document.body.appendChild(svgEl)

  try {
    await svg2pdf(svgEl, pdf, { x: 0, y: 0, width: ptW, height: ptH })
  } finally {
    document.body.removeChild(svgEl)
  }

  return new Uint8Array(pdf.output('arraybuffer'))
}

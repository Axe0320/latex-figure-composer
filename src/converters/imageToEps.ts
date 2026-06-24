// PostScript Level 2 / ASCIIHex-encoded EPS for raster images

const MAX_PT = 842 // A4 height in points

const HEX_CHARS = '0123456789abcdef'

// ── Shared helpers (exported for svgToEps) ────────────────

export function calcEpsBBox(pixW: number, pixH: number): { ptW: number; ptH: number } {
  const scale = Math.min(1, MAX_PT / Math.max(pixW, pixH))
  return {
    ptW: Math.round(pixW * scale),
    ptH: Math.round(pixH * scale),
  }
}

export function rgbaToHex(data: Uint8ClampedArray): string {
  const chars = new Array<string>(Math.floor(data.length / 4) * 6)
  let ci = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    chars[ci++] = HEX_CHARS[r >> 4];  chars[ci++] = HEX_CHARS[r & 15]
    chars[ci++] = HEX_CHARS[g >> 4];  chars[ci++] = HEX_CHARS[g & 15]
    chars[ci++] = HEX_CHARS[b >> 4];  chars[ci++] = HEX_CHARS[b & 15]
  }
  const flat = chars.join('')
  // 72 hex chars = 36 pixels per line (PostScript convention)
  return flat.match(/.{1,72}/g)?.join('\n') ?? flat
}

export function buildEps(
  pixW: number,
  pixH: number,
  ptW: number,
  ptH: number,
  hexData: string,
): string {
  return [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${ptW} ${ptH}`,
    `%%HiResBoundingBox: 0.0 0.0 ${ptW}.0 ${ptH}.0`,
    '%%LanguageLevel: 2',
    '%%EndComments',
    '%%BeginProlog',
    '%%EndProlog',
    '%%Page: 1 1',
    `${ptW} ${ptH} scale`,
    `${pixW} ${pixH} 8`,
    `[${pixW} 0 0 -${pixH} 0 ${pixH}]`,
    'currentfile /ASCIIHexDecode filter',
    'false 3',
    'colorimage',
    hexData,
    '>',
    'showpage',
    '%%EOF',
  ].join('\n')
}

// ── PNG / JPEG → EPS ──────────────────────────────────────

async function loadPixels(
  file: File,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const url = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return }
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve({ width: canvas.width, height: canvas.height, data })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image'))
    }
    img.src = url
  })
}

export async function imageToEps(file: File): Promise<Uint8Array> {
  const { width, height, data } = await loadPixels(file)
  const { ptW, ptH } = calcEpsBBox(width, height)
  const hexData = rgbaToHex(data)
  const eps = buildEps(width, height, ptW, ptH, hexData)
  return new TextEncoder().encode(eps)
}

import type { InputFormat } from '../types/conversion'

const ACCEPTED_EXTENSIONS: InputFormat[] = ['png', 'jpg', 'jpeg', 'svg']

const MIME_TO_FORMAT: Record<string, InputFormat> = {
  'image/png':                'png',
  'image/jpeg':               'jpg',
  'image/svg+xml':            'svg',
}

export function detectInputFormat(file: File): InputFormat | null {
  const mimeResult = MIME_TO_FORMAT[file.type]
  if (mimeResult) return mimeResult === 'jpg' && file.name.toLowerCase().endsWith('.jpeg') ? 'jpeg' : mimeResult

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if ((ACCEPTED_EXTENSIONS as string[]).includes(ext)) return ext as InputFormat
  return null
}

export function isAcceptedFile(file: File): boolean {
  return detectInputFormat(file) !== null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function buildOutputFileName(originalName: string, outputFormat: string): string {
  const base = originalName.replace(/\.[^.]+$/, '')
  return `${base}.${outputFormat}`
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function createObjectURL(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url)
}

export type InputFormat = 'png' | 'jpg' | 'jpeg' | 'svg'

export type OutputFormat = 'pdf' | 'eps'

export type FigureItemStatus = 'pending' | 'converting' | 'done' | 'error'

export interface FigureFileItem {
  id: string
  file: File
  name: string
  size: number
  format: InputFormat
  previewUrl: string
  status: FigureItemStatus
  resultBlob: Blob | null
  resultFileName: string | null
  error: string | null
}

export interface FigureConversionState {
  items: FigureFileItem[]
  outputFormat: OutputFormat
  globalError: string | null
}

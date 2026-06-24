import { useState, useCallback, useEffect } from 'react'
import type { FigureConversionState, FigureFileItem, OutputFormat } from '../types/conversion'
import { detectInputFormat, buildOutputFileName, createObjectURL, revokeObjectURL } from '../utils/fileHelpers'
import { imageToPdf } from '../converters/imageToPdf'
import { svgToPdfVector } from '../converters/svgToPdfVector'
import { imageToEps } from '../converters/imageToEps'
import { svgToEps } from '../converters/svgToEps'

const INITIAL_STATE: FigureConversionState = {
  items: [],
  outputFormat: 'pdf',
  globalError: null,
}

function makeId(): string {
  return crypto.randomUUID()
}

function getMimeType(outputFormat: OutputFormat): string {
  return outputFormat === 'pdf' ? 'application/pdf' : 'application/postscript'
}

async function convertOne(item: FigureFileItem, outputFormat: OutputFormat): Promise<Blob> {
  const bytes =
    item.format === 'svg'
      ? outputFormat === 'pdf' ? await svgToPdfVector(item.file) : await svgToEps(item.file)
      : outputFormat === 'pdf' ? await imageToPdf(item.file, item.format) : await imageToEps(item.file)
  return new Blob([bytes.buffer as ArrayBuffer], { type: getMimeType(outputFormat) })
}

export function useConversion() {
  const [state, setState] = useState<FigureConversionState>(INITIAL_STATE)

  const addFiles = useCallback((files: File[]) => {
    const newItems: FigureFileItem[] = []
    let errorMsg: string | null = null

    for (const file of files) {
      const format = detectInputFormat(file)
      if (!format) {
        errorMsg = `"${file.name}" is not supported.\nAccepted: PNG, JPG, JPEG, SVG`
        continue
      }
      newItems.push({
        id: makeId(),
        file,
        name: file.name,
        size: file.size,
        format,
        previewUrl: createObjectURL(file),
        status: 'pending',
        resultBlob: null,
        resultFileName: null,
        error: null,
      })
    }

    setState((s) => ({
      ...s,
      items: [...s.items, ...newItems],
      globalError: errorMsg,
    }))
  }, [])

  const removeFile = useCallback((id: string) => {
    setState((s) => {
      const item = s.items.find((i) => i.id === id)
      if (item?.previewUrl) revokeObjectURL(item.previewUrl)
      return { ...s, items: s.items.filter((i) => i.id !== id), globalError: null }
    })
  }, [])

  const clearAll = useCallback(() => {
    setState((s) => {
      s.items.forEach((i) => { if (i.previewUrl) revokeObjectURL(i.previewUrl) })
      return INITIAL_STATE
    })
  }, [])

  const setOutputFormat = useCallback((fmt: OutputFormat) => {
    setState((s) => ({
      ...s,
      outputFormat: fmt,
      items: s.items.map((i) => ({ ...i, status: 'pending', resultBlob: null, resultFileName: null, error: null })),
    }))
  }, [])

  const convertAll = useCallback(async () => {
    setState((s) => ({
      ...s,
      globalError: null,
      items: s.items.map((i) =>
        i.status !== 'done' ? { ...i, status: 'converting', error: null } : i,
      ),
    }))

    // Capture snapshot for parallel execution
    const snapshot = state.items.filter((i) => i.status !== 'done')
    const outputFormat = state.outputFormat

    await Promise.all(
      snapshot.map(async (item) => {
        try {
          const blob = await convertOne(item, outputFormat)
          setState((s) => ({
            ...s,
            items: s.items.map((i) =>
              i.id === item.id
                ? { ...i, status: 'done', resultBlob: blob, resultFileName: buildOutputFileName(item.name, outputFormat) }
                : i,
            ),
          }))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Conversion failed'
          setState((s) => ({
            ...s,
            items: s.items.map((i) =>
              i.id === item.id ? { ...i, status: 'error', error: message } : i,
            ),
          }))
        }
      }),
    )
  }, [state.items, state.outputFormat])

  // Cleanup all preview URLs on unmount
  useEffect(() => {
    return () => {
      setState((s) => {
        s.items.forEach((i) => { if (i.previewUrl) revokeObjectURL(i.previewUrl) })
        return s
      })
    }
  }, [])

  const isConverting = state.items.some((i) => i.status === 'converting')
  const hasFiles = state.items.length > 0
  const doneItems = state.items.filter((i) => i.status === 'done')
  const canConvert = hasFiles && !isConverting && state.items.some((i) => i.status !== 'done')

  return {
    state,
    addFiles,
    removeFile,
    clearAll,
    setOutputFormat,
    convertAll,
    isConverting,
    hasFiles,
    doneItems,
    canConvert,
  }
}

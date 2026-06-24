import './index.css'
import { useState, useCallback } from 'react'
import { Header } from './components/Header'
import { FileUploader } from './components/FileUploader'
import { FileList } from './components/FileList'
import { FormatSelector } from './components/FormatSelector'
import { ConvertButton } from './components/ConvertButton'
import { BatchResult } from './components/BatchResult'
import { ErrorArea } from './components/ErrorArea'
import { useConversion } from './hooks/useConversion'
import type { OutputFormat } from './types/conversion'

export default function App() {
  const {
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
  } = useConversion()

  const { items, outputFormat, globalError } = state

  // Selection state for BatchResult download
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectAllDone = useCallback(() => {
    setSelectedIds(new Set(doneItems.map((i) => i.id)))
  }, [doneItems])

  const deselectAll = useCallback(() => setSelectedIds(new Set()), [])

  const handleRemove = useCallback(
    (id: string) => {
      removeFile(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [removeFile],
  )

  const handleClearAll = useCallback(() => {
    clearAll()
    setSelectedIds(new Set())
  }, [clearAll])

  const handleSetOutputFormat = useCallback(
    (fmt: OutputFormat) => {
      setOutputFormat(fmt)
      setSelectedIds(new Set())
    },
    [setOutputFormat],
  )

  // Collapsible file list
  const [listOpen, setListOpen] = useState(true)

  return (
    <div className="page">
      <div className="wrapper">
        <Header />

        <div className="card">
          {/* ── 1. Upload ── */}
          <div>
            <div className="section-header">
              <span className="section-label">
                <span className="section-num">1</span>
                Upload Images
              </span>
              {hasFiles && (
                <button
                  className="file-clear-btn"
                  onClick={handleClearAll}
                  disabled={isConverting}
                >
                  ✕ Clear All
                </button>
              )}
            </div>

            <FileUploader onFiles={addFiles} />

            {hasFiles && (
              <button
                className="list-toggle-btn-wide"
                onClick={() => setListOpen((o) => !o)}
                aria-expanded={listOpen}
              >
                {listOpen
                  ? `▲ Hide list (${items.length} files)`
                  : `▼ Show file list (${items.length} files)`}
              </button>
            )}

            {hasFiles && listOpen && (
              <div style={{ marginTop: '.5rem' }}>
                <FileList
                  items={items}
                  onRemove={handleRemove}
                  onClearAll={handleClearAll}
                  isConverting={isConverting}
                />
              </div>
            )}
          </div>

          <div className="divider" />

          {/* ── 2. Output Format ── */}
          <div>
            <div className="section-header">
              <span className="section-label">
                <span className="section-num">2</span>
                Output Format
              </span>
            </div>
            <FormatSelector value={outputFormat} onChange={handleSetOutputFormat} />
          </div>

          <div className="divider" />

          {/* ── 3. Convert ── */}
          <div>
            <div className="section-header">
              <span className="section-label">
                <span className="section-num">3</span>
                Convert
              </span>
            </div>
            <ConvertButton
              isConverting={isConverting}
              disabled={!canConvert}
              outputFormat={outputFormat}
              onClick={convertAll}
            />
          </div>

          {/* ── Results / Errors ── */}
          {doneItems.length > 0 && (
            <>
              <div className="divider" />
              <BatchResult
                doneItems={doneItems}
                totalItems={items.length}
                outputFormat={outputFormat}
                selectedIds={selectedIds}
                onSelectAll={selectAllDone}
                onDeselectAll={deselectAll}
                onToggleSelect={toggleSelect}
              />
            </>
          )}

          {globalError && (
            <>
              <div className="divider" />
              <ErrorArea message={globalError} />
            </>
          )}
        </div>

        <footer className="footer">
          LaTeX Figure Composer — part of LaTeX Research Toolkit
        </footer>
      </div>
    </div>
  )
}

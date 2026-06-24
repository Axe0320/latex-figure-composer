import { useCallback, useState } from 'react'
import JSZip from 'jszip'
import type { FigureFileItem, OutputFormat } from '../types/conversion'

interface BatchResultProps {
  doneItems: FigureFileItem[]
  totalItems: number
  outputFormat: OutputFormat
  selectedIds: Set<string>
  onSelectAll: () => void
  onDeselectAll: () => void
  onToggleSelect: (id: string) => void
}

export function BatchResult({
  doneItems,
  totalItems,
  outputFormat,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onToggleSelect,
}: BatchResultProps) {
  const [busy, setBusy] = useState(false)
  const fmt = outputFormat.toUpperCase()

  const downloadZip = useCallback(async (items: FigureFileItem[], zipName: string) => {
    setBusy(true)
    try {
      const zip = new JSZip()
      for (const item of items) {
        if (item.resultBlob && item.resultFileName) {
          zip.file(item.resultFileName, item.resultBlob)
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = zipName
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }, [])

  const downloadIndividually = useCallback(async (items: FigureFileItem[]) => {
    setBusy(true)
    try {
      for (const item of items) {
        if (!item.resultBlob || !item.resultFileName) continue
        const url = URL.createObjectURL(item.resultBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = item.resultFileName
        a.click()
        URL.revokeObjectURL(url)
        await new Promise<void>((r) => setTimeout(r, 200))
      }
    } finally {
      setBusy(false)
    }
  }, [])

  if (doneItems.length === 0) return null

  const multi = doneItems.length > 1
  const selectedDone = doneItems.filter((i) => selectedIds.has(i.id))
  const selCount = selectedDone.length
  const allSelected = selCount === doneItems.length

  return (
    <div className="result-area">
      <p className="result-success">
        <span>✓</span>
        {doneItems.length === totalItems
          ? `All ${totalItems} files converted`
          : `${doneItems.length} / ${totalItems} files converted`}
      </p>

      {/* ── Checklist (multi only) ── */}
      {multi && (
        <ul className="result-file-list">
          {doneItems.map((item) => (
            <li
              key={item.id}
              className={`result-file-item${selectedIds.has(item.id) ? ' result-file-item--selected' : ''}`}
              onClick={() => onToggleSelect(item.id)}
            >
              <input
                type="checkbox"
                className="file-item-checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${item.resultFileName ?? item.name}`}
              />
              <span className="result-file-name">{item.resultFileName ?? item.name}</span>
              <span className="file-format-badge">{outputFormat}</span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Select All ── */}
      {multi && (
        <div className="batch-select-row">
          {allSelected ? (
            <button className="deselect-btn" onClick={onDeselectAll}>
              ✕ Deselect All
            </button>
          ) : (
            <button className="select-all-btn" onClick={onSelectAll}>
              Select All
            </button>
          )}
          {selCount > 0 && !allSelected && (
            <span className="selection-count">{selCount} selected</span>
          )}
        </div>
      )}

      {/* ── Download rows ── */}
      <div className="batch-dl-group">
        {multi && selCount > 0 && (
          <div className="batch-dl-row">
            <span className="batch-dl-label">Selected ({selCount})</span>
            <div className="batch-dl-buttons">
              <button
                className="download-btn-sm"
                disabled={busy}
                onClick={() =>
                  downloadZip(selectedDone, `figures_selected_${outputFormat}.zip`)
                }
              >
                ⬇ ZIP
              </button>
              <button
                className="download-btn-sm"
                disabled={busy}
                onClick={() => downloadIndividually(selectedDone)}
              >
                ⬇ {fmt}
              </button>
            </div>
          </div>
        )}

        <div className="batch-dl-row">
          <span className="batch-dl-label">All ({doneItems.length})</span>
          <div className="batch-dl-buttons">
            {multi && (
              <button
                className="download-btn-sm"
                disabled={busy}
                onClick={() =>
                  downloadZip(doneItems, `figures_${outputFormat}.zip`)
                }
              >
                ⬇ ZIP
              </button>
            )}
            <button
              className="download-btn-sm"
              disabled={busy}
              onClick={() => downloadIndividually(doneItems)}
            >
              ⬇ {fmt}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

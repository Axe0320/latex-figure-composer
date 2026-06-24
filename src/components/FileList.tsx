import { formatFileSize } from '../utils/fileHelpers'
import type { FigureFileItem, FigureItemStatus } from '../types/conversion'

interface FileListProps {
  items: FigureFileItem[]
  onRemove: (id: string) => void
  onClearAll: () => void
  isConverting: boolean
}

const STATUS_LABEL: Record<FigureItemStatus, string> = {
  pending:    'Pending',
  converting: 'Converting…',
  done:       'Done',
  error:      'Error',
}

const STATUS_CLASS: Record<FigureItemStatus, string> = {
  pending:    'status-pending',
  converting: 'status-converting',
  done:       'status-done',
  error:      'status-error',
}

export function FileList({ items, onRemove, onClearAll, isConverting }: FileListProps) {
  return (
    <ul className="file-list">
      {items.map((item) => (
        <li key={item.id} className="file-list-item">
          <div className="file-item-preview">
            <img src={item.previewUrl} alt={item.name} draggable={false} />
          </div>

          <div className="file-item-meta">
            <span className="file-item-name" title={item.name}>{item.name}</span>
            <span className="file-item-size">{formatFileSize(item.size)}</span>
            <span className="file-format-badge">{item.format}</span>
          </div>

          <div className="file-item-status">
            <span className={`status-badge ${STATUS_CLASS[item.status]}`}>
              {item.status === 'converting' && <span className="spin">⟳</span>}
              {item.status === 'done'       && '✓ '}
              {item.status === 'error'      && '✗ '}
              {STATUS_LABEL[item.status]}
            </span>
            {item.error && (
              <span className="file-item-error" title={item.error}>⚠</span>
            )}
          </div>

          <div className="file-item-actions">
            <button
              className="file-item-remove"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.name}`}
              disabled={item.status === 'converting'}
            >
              ✕
            </button>
          </div>
        </li>
      ))}

      <li className="file-list-clear-item">
        <button
          className="file-list-clear-btn"
          onClick={onClearAll}
          disabled={isConverting}
        >
          ✕ Clear All
        </button>
      </li>
    </ul>
  )
}

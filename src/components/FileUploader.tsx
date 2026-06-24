import { useRef, useState, useCallback } from 'react'
import { isAcceptedFile } from '../utils/fileHelpers'

interface FileUploaderProps {
  onFiles: (files: File[]) => void
}

export function FileUploader({ onFiles }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const accepted = Array.from(fileList).filter(isAcceptedFile)
    if (accepted.length > 0) onFiles(accepted)
  }, [onFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleClick = useCallback(() => inputRef.current?.click(), [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }, [handleFiles])

  return (
    <div
      className={`upload-zone${isDragging ? ' drag-over' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      aria-label="Upload image files"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <span className="upload-icon">🖼</span>
      <p className="upload-text">
        Drop images here, or <strong>Browse Files</strong>
      </p>
      <p className="upload-hint-text">PNG, JPG, JPEG, SVG — multiple files OK</p>
    </div>
  )
}

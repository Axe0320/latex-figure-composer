interface ConvertButtonProps {
  isConverting: boolean
  disabled: boolean
  outputFormat: string
  onClick: () => void
}

export function ConvertButton({ isConverting, disabled, outputFormat, onClick }: ConvertButtonProps) {
  return (
    <button
      className="convert-btn"
      onClick={onClick}
      disabled={disabled || isConverting}
      aria-busy={isConverting}
    >
      {isConverting ? (
        <>
          <span className="spin">⟳</span>
          Converting…
        </>
      ) : (
        <>⬇ Convert to {outputFormat.toUpperCase()}</>
      )}
    </button>
  )
}

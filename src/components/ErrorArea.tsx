interface ErrorAreaProps {
  message: string
}

export function ErrorArea({ message }: ErrorAreaProps) {
  return (
    <div className="error-msg" role="alert">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}
